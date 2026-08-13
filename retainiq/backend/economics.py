"""Revenue-at-risk and net-value calculations.

horizon_months is a business assumption the caller can override per request
— it is deliberately not hardcoded as a constant.
"""

DEFAULT_HORIZON_MONTHS = 12


def revenue_at_risk(monthly_charges: float, churn_probability: float, horizon_months: int = DEFAULT_HORIZON_MONTHS) -> float:
    return monthly_charges * horizon_months * churn_probability


def net_value(revenue_at_risk_value: float, action_cost: float) -> float:
    return revenue_at_risk_value - action_cost
