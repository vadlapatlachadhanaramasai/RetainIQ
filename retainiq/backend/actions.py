"""Maps the single strongest churn driver to a concrete retention action.

Deliberately a plain dict, not a model — this is the lever a business user
should be able to read and edit without touching any ML code.
"""

DEFAULT_ACTION = {"label": "Schedule support callback", "cost": 500}

ACTION_TABLE = {
    "monthly_charges": {"label": "Targeted discount offer", "cost": 1800},
    "complaints_3m": {"label": "Schedule support callback", "cost": 500},
    "usage_change_pct": {"label": "Re-engagement campaign", "cost": 100},
    "contract_type": {"label": "Contract upgrade incentive", "cost": 900},
    "payment_failures_6m": {"label": "Move to autopay", "cost": 50},
}


def get_action(top_driver_feature: str) -> dict:
    """Return the action dict for the given top driver feature name."""
    return ACTION_TABLE.get(top_driver_feature, DEFAULT_ACTION)
