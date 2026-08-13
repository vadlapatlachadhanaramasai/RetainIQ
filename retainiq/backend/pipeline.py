"""preprocess -> predict -> explain.

Loads the pickled XGBoost booster once (at API startup) and turns a raw
customer dataframe into the full analysis payload the frontend needs:
churn probability, risk band, top drivers (via TreeSHAP contributions),
recommended action, and economics.
"""
import pickle
from pathlib import Path

import numpy as np
import pandas as pd
import xgboost as xgb

from actions import get_action
from economics import revenue_at_risk, net_value, DEFAULT_HORIZON_MONTHS
from security import encrypt_field, decrypt_field

REQUIRED_COLUMNS = [
    "customer_id",
    "name",
    "tenure_months",
    "monthly_charges",
    "contract_type",
    "usage_units",
    "usage_change_pct",
    "complaints_3m",
    "payment_failures_6m",
    "payment_method",
]

NUMERIC_COLUMNS = [
    "tenure_months",
    "monthly_charges",
    "usage_units",
    "usage_change_pct",
    "complaints_3m",
    "payment_failures_6m",
]

FEATURE_LABELS = {
    "complaints_3m": "Support complaints increased",
    "usage_change_pct": "Usage dropped sharply",
    "monthly_charges": "Paying more than similar customers",
    "contract_type": "On a month-to-month contract",
    "payment_failures_6m": "Recent payment failures",
    "tenure_months": "Relatively new customer relationship",
    "usage_units": "Lower usage than typical customers",
    "payment_method": "Not enrolled in autopay",
}


class ValidationError(Exception):
    def __init__(self, missing_columns):
        self.missing_columns = missing_columns
        super().__init__(f"Missing required columns: {missing_columns}")


_MODEL_CACHE = None


def load_model(path: Path = None) -> dict:
    global _MODEL_CACHE
    if _MODEL_CACHE is not None:
        return _MODEL_CACHE
    if path is None:
        path = Path(__file__).resolve().parent / "model.pkl"
    with open(path, "rb") as f:
        _MODEL_CACHE = pickle.load(f)
    return _MODEL_CACHE


def validate_columns(df: pd.DataFrame) -> list:
    return [c for c in REQUIRED_COLUMNS if c not in df.columns]


def _encode(df: pd.DataFrame, model_bundle: dict) -> pd.DataFrame:
    features = model_bundle["features"]
    contract_map = model_bundle["contract_map"]
    payment_map = model_bundle["payment_map"]

    out = df.copy()
    for col in NUMERIC_COLUMNS:
        out[col] = pd.to_numeric(out[col], errors="coerce")
        out[col] = out[col].fillna(out[col].median() if out[col].notna().any() else 0)

    out["contract_type"] = out["contract_type"].map(contract_map)
    out["contract_type"] = out["contract_type"].fillna(0)

    out["payment_method"] = out["payment_method"].map(payment_map)
    out["payment_method"] = out["payment_method"].fillna(0)

    return out[features]


def risk_band(prob: float) -> str:
    if prob >= 0.7:
        return "high"
    if prob >= 0.4:
        return "medium"
    return "low"


def analyze_dataframe(df: pd.DataFrame, horizon_months: int = DEFAULT_HORIZON_MONTHS, model_bundle: dict = None) -> dict:
    missing = validate_columns(df)
    if missing:
        raise ValidationError(missing)

    model_bundle = model_bundle or load_model()
    booster: xgb.Booster = model_bundle["booster"]
    features = model_bundle["features"]

    # Encrypt PII the moment the data enters the pipeline. Everything past
    # this line — feature encoding, the DMatrix, the booster — operates on
    # this same dataframe object, so the model has no path to plaintext
    # names even if a future edit accidentally adds "name" to the feature
    # list. Decryption happens once, below, only when building the
    # human-facing response.
    df = df.copy()
    df["name"] = df["name"].map(encrypt_field)

    X = _encode(df, model_bundle)
    dmatrix = xgb.DMatrix(X, feature_names=features)

    probs = booster.predict(dmatrix)
    contribs = booster.predict(dmatrix, pred_contribs=True)  # (n, n_features + 1), last col = bias

    customers = []
    for i in range(len(df)):
        row = df.iloc[i]
        prob = float(probs[i])

        feature_contribs = list(zip(features, contribs[i][: len(features)]))
        positive = [(f, c) for f, c in feature_contribs if c > 0]
        positive.sort(key=lambda x: x[1], reverse=True)
        top_drivers = positive[:3]

        drivers = [
            {
                "feature": f,
                "label": FEATURE_LABELS.get(f, f),
                "contribution": round(float(c), 4),
            }
            for f, c in top_drivers
        ]

        top_feature = top_drivers[0][0] if top_drivers else None
        action = get_action(top_feature)

        monthly_charges = float(row["monthly_charges"])
        rar = revenue_at_risk(monthly_charges, prob, horizon_months)
        nv = net_value(rar, action["cost"])

        customers.append({
            "id": str(row["customer_id"]),
            "name": decrypt_field(row["name"]),
            "churn_probability": round(prob, 4),
            "risk_band": risk_band(prob),
            "drivers": drivers,
            "action": action,
            "monthly_charges": round(monthly_charges, 2),
            "revenue_at_risk": round(rar, 2),
            "net_value": round(nv, 2),
        })

    customers.sort(key=lambda c: c["net_value"], reverse=True)

    total_customers = len(customers)
    at_risk_count = sum(1 for c in customers if c["risk_band"] in ("high", "medium"))
    total_revenue_at_risk = sum(c["revenue_at_risk"] for c in customers)
    recoverable_net_value = sum(c["net_value"] for c in customers if c["net_value"] > 0)

    summary = {
        "total_customers": total_customers,
        "at_risk_count": at_risk_count,
        "revenue_at_risk": round(total_revenue_at_risk, 2),
        "recoverable_net_value": round(recoverable_net_value, 2),
    }

    return {"summary": summary, "customers": customers}
