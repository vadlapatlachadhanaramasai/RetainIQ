"""Field-level encryption for PII.

The churn model must never learn from raw personal data. Names are
encrypted the moment a CSV is ingested, before the dataframe is touched by
any feature-encoding or model code — the ML pipeline only ever sees
ciphertext (or, in practice, doesn't see the field at all, since it isn't
in the feature list). Decryption happens exactly once, at response-build
time, gated behind a key that only the backend process holds. The
frontend/business user receives plaintext because they're the party who
actually needs to contact the customer — the model never does.

Key management here is hackathon-appropriate (a local key file, gitignored).
In production this key belongs in a proper secrets manager / KMS, rotated
independently of application deploys.
"""
import os
from pathlib import Path

from cryptography.fernet import Fernet, InvalidToken

_KEY_PATH = Path(__file__).resolve().parent / ".pii.key"


def _load_key() -> bytes:
    env_key = os.environ.get("RETAINIQ_PII_KEY")
    if env_key:
        return env_key.encode()
    if _KEY_PATH.exists():
        return _KEY_PATH.read_bytes()
    key = Fernet.generate_key()
    _KEY_PATH.write_bytes(key)
    return key


_FERNET = Fernet(_load_key())


def encrypt_field(value: str) -> str:
    return _FERNET.encrypt(str(value).encode()).decode()


def decrypt_field(token: str) -> str:
    try:
        return _FERNET.decrypt(str(token).encode()).decode()
    except InvalidToken:
        # Value was never encrypted (e.g. hit an old code path) — fail
        # visibly rather than silently trusting unencrypted input.
        raise ValueError("Expected an encrypted PII field but got plaintext/invalid token")
