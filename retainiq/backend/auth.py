"""Authentication (JWT) for RetainIQ.

Hackathon-appropriate: a small hardcoded set of demo accounts, one per
business role, instead of a user database (the project intentionally has
no DB). Passwords are still bcrypt-hashed so the pattern matches what a
real user store would do — swap DEMO_USERS for a real lookup later and
nothing else here changes.
"""
import os
import time
from pathlib import Path

import bcrypt
import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

ROLES = ("business_owner", "retention_manager", "retention_team", "customer_support")

_SECRET_PATH = Path(__file__).resolve().parent / ".jwt.secret"


def _load_secret() -> str:
    env_secret = os.environ.get("RETAINIQ_JWT_SECRET")
    if env_secret:
        return env_secret
    if _SECRET_PATH.exists():
        return _SECRET_PATH.read_text()
    secret = os.urandom(32).hex()
    _SECRET_PATH.write_text(secret)
    return secret


JWT_SECRET = _load_secret()
JWT_ALGORITHM = "HS256"
TOKEN_TTL_SECONDS = 8 * 60 * 60  # one working shift


def _hash(password: str) -> bytes:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt())


# One demo account per role. In production DEMO_USERS becomes a users table
# lookup; everything below (tokens, dependencies) stays the same.
DEMO_USERS = {
    "manager@retainiq.demo": {
        "password_hash": _hash("Manager@123"),
        "role": "retention_manager",
        "display_name": "Ritu Kapoor",
    },
    "team@retainiq.demo": {
        "password_hash": _hash("Team@123"),
        "role": "retention_team",
        "display_name": "Arjun Mehta",
    },
    "support@retainiq.demo": {
        "password_hash": _hash("Support@123"),
        "role": "customer_support",
        "display_name": "Sneha Iyer",
    },
    "owner@retainiq.demo": {
        "password_hash": _hash("Owner@123"),
        "role": "business_owner",
        "display_name": "Vikram Rao",
    },
}


def authenticate(email: str, password: str):
    user = DEMO_USERS.get(email)
    if not user:
        return None
    if not bcrypt.checkpw(password.encode(), user["password_hash"]):
        return None
    return user


def create_access_token(email: str, role: str) -> str:
    now = int(time.time())
    payload = {"sub": email, "role": role, "iat": now, "exp": now + TOKEN_TTL_SECONDS}
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def decode_access_token(token: str) -> dict:
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Session expired, please log in again")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid authentication token")


_bearer = HTTPBearer(auto_error=False)


def get_current_user(creds: HTTPAuthorizationCredentials = Depends(_bearer)) -> dict:
    if creds is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    payload = decode_access_token(creds.credentials)
    email = payload["sub"]
    user = DEMO_USERS.get(email)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Unknown user")
    return {"email": email, "role": payload["role"], "display_name": user["display_name"]}


def require_roles(*allowed_roles: str):
    def _dependency(user: dict = Depends(get_current_user)) -> dict:
        if user["role"] not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Role '{user['role']}' is not permitted to perform this action",
            )
        return user

    return _dependency
