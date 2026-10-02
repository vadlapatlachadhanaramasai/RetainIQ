import io
from pathlib import Path

import pandas as pd
from fastapi import Depends, FastAPI, UploadFile, File, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from pipeline import analyze_dataframe, load_model, ValidationError
from economics import DEFAULT_HORIZON_MONTHS
from auth import authenticate, create_access_token, get_current_user, require_roles
import db
import customer_cache
import gcs
from cases import router as cases_router

app = FastAPI(title="RetainIQ API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(cases_router)

DEMO_CSV_PATH = Path(__file__).resolve().parent.parent / "data" / "demo_customers.csv"


@app.on_event("startup")
def startup():
    load_model()
    db.init_db()


class LoginRequest(BaseModel):
    email: str
    password: str


class LoginResponse(BaseModel):
    access_token: str
    email: str
    role: str
    display_name: str


@app.post("/auth/login", response_model=LoginResponse)
def login(payload: LoginRequest):
    user = authenticate(payload.email, payload.password)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    token = create_access_token(payload.email, user["role"])
    return LoginResponse(
        access_token=token,
        email=payload.email,
        role=user["role"],
        display_name=user["display_name"],
    )


@app.get("/auth/me")
def me(user: dict = Depends(get_current_user)):
    return user


@app.post("/analyze")
async def analyze(
    file: UploadFile = File(...),
    horizon_months: int = Query(DEFAULT_HORIZON_MONTHS, ge=1, le=60),
    user: dict = Depends(require_roles("retention_manager")),
):
    if not file.filename.lower().endswith(".csv"):
        raise HTTPException(status_code=400, detail="Please upload a .csv file")

    raw = await file.read()
    try:
        df = pd.read_csv(io.BytesIO(raw))
    except Exception:
        raise HTTPException(status_code=400, detail="Could not parse file as CSV")

    try:
        result = analyze_dataframe(df, horizon_months=horizon_months)
    except ValidationError as e:
        raise HTTPException(
            status_code=400,
            detail=f"CSV is missing required columns: {', '.join(e.missing_columns)}",
        )

    customer_cache.set_customers(result["customers"])
    result["gcs_backup_uri"] = gcs.upload_csv(file.filename, raw)
    return result


@app.get("/analyze/demo")
def analyze_demo(
    horizon_months: int = Query(DEFAULT_HORIZON_MONTHS, ge=1, le=60),
    user: dict = Depends(get_current_user),
):
    df = pd.read_csv(DEMO_CSV_PATH)
    result = analyze_dataframe(df, horizon_months=horizon_months)
    customer_cache.set_customers(result["customers"])
    return result
