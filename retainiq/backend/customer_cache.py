"""In-memory cache of the most recently analyzed dataset's full, unmasked
customer records, keyed by customer_id.

This is a single-tenant hackathon demo — there is exactly one "active
dataset" at a time, shared across every logged-in role, mirroring how the
UI already works (everyone hits the same /analyze/demo). Case workflow
endpoints need to look up an individual customer's risk data without
re-uploading a CSV, so main.py populates this cache on every /analyze and
/analyze/demo call, before any per-role masking/filtering is applied to
the HTTP response.
"""

_CACHE: dict = {}


def set_customers(customers: list):
    global _CACHE
    _CACHE = {c["id"]: c for c in customers}


def get_customer(customer_id: str):
    return _CACHE.get(customer_id)


def all_customers() -> list:
    return list(_CACHE.values())
