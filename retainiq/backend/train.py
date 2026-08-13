"""Train the churn model offline and pickle it for the API to load.

Run once: py -3.11 train.py
Writes: model.pkl (dict with 'booster', 'features', 'dmatrix_feature_types')
"""
import pickle
from pathlib import Path

import numpy as np
import pandas as pd
import xgboost as xgb
from sklearn.metrics import roc_auc_score, precision_score, recall_score, confusion_matrix
from sklearn.model_selection import train_test_split

FEATURES = [
    "tenure_months",
    "monthly_charges",
    "contract_type",
    "usage_units",
    "usage_change_pct",
    "complaints_3m",
    "payment_failures_6m",
    "payment_method",
]

CONTRACT_MAP = {"month-to-month": 0, "one-year": 1, "two-year": 2}
PAYMENT_MAP = {"manual": 0, "autopay": 1}


def encode(df: pd.DataFrame) -> pd.DataFrame:
    out = df.copy()
    out["contract_type"] = out["contract_type"].map(CONTRACT_MAP)
    out["payment_method"] = out["payment_method"].map(PAYMENT_MAP)
    return out[FEATURES]


def main():
    data_path = Path(__file__).resolve().parent.parent / "data" / "demo_customers.csv"
    df = pd.read_csv(data_path)

    X = encode(df)
    y = df["churned"]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    dtrain = xgb.DMatrix(X_train, label=y_train, feature_names=FEATURES)
    dtest = xgb.DMatrix(X_test, label=y_test, feature_names=FEATURES)

    params = {
        "objective": "binary:logistic",
        "eval_metric": "auc",
        "max_depth": 4,
        "eta": 0.1,
        "subsample": 0.8,
        "colsample_bytree": 0.8,
        "seed": 42,
    }

    booster = xgb.train(
        params,
        dtrain,
        num_boost_round=150,
        evals=[(dtest, "test")],
        early_stopping_rounds=15,
        verbose_eval=False,
    )

    preds = booster.predict(dtest)
    pred_labels = (preds >= 0.5).astype(int)

    auc = roc_auc_score(y_test, preds)
    precision = precision_score(y_test, pred_labels)
    recall = recall_score(y_test, pred_labels)
    cm = confusion_matrix(y_test, pred_labels)

    print(f"AUC:       {auc:.4f}")
    print(f"Precision: {precision:.4f}")
    print(f"Recall:    {recall:.4f}")
    print("Confusion matrix ([[TN, FP], [FN, TP]]):")
    print(cm)

    model_path = Path(__file__).resolve().parent / "model.pkl"
    with open(model_path, "wb") as f:
        pickle.dump(
            {
                "booster": booster,
                "features": FEATURES,
                "contract_map": CONTRACT_MAP,
                "payment_map": PAYMENT_MAP,
            },
            f,
        )
    print(f"Saved model to {model_path}")


if __name__ == "__main__":
    main()
