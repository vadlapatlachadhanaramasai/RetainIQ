"""Generate a synthetic subscription customer dataset with realistic churn signal.

usage_units / usage_change_pct are deliberately generic: they stand in for
whatever engagement metric matters for the business (GB for broadband,
watch-hours for OTT, check-ins for a gym, active seats/logins for SaaS).

Run once: py -3.11 make_dataset.py
Writes: ../data/demo_customers.csv
"""
import numpy as np
import pandas as pd
from pathlib import Path

RNG = np.random.default_rng(42)
N = 1000

FIRST_NAMES = [
    "Aarav", "Vivaan", "Aditya", "Vihaan", "Arjun", "Sai", "Reyansh", "Krishna",
    "Ishaan", "Rohan", "Kabir", "Aryan", "Dhruv", "Karan", "Yash", "Rajat",
    "Ananya", "Diya", "Saanvi", "Aadhya", "Kavya", "Myra", "Anika", "Riya",
    "Ishita", "Priya", "Neha", "Pooja", "Sneha", "Meera", "Tanvi", "Nisha",
    "Rahul", "Amit", "Vikram", "Suresh", "Ramesh", "Manoj", "Deepak", "Sanjay",
    "Anjali", "Kiran", "Divya", "Shreya", "Pallavi", "Swati", "Nikita", "Simran",
]
LAST_NAMES = [
    "Sharma", "Verma", "Gupta", "Kumar", "Singh", "Patel", "Reddy", "Rao",
    "Iyer", "Nair", "Menon", "Chatterjee", "Mukherjee", "Banerjee", "Das",
    "Joshi", "Desai", "Shah", "Mehta", "Agarwal", "Bhatt", "Kulkarni", "Pillai",
    "Chauhan", "Malhotra", "Kapoor", "Chopra", "Bose", "Ghosh", "Pandey",
]

def gen_names(n):
    first = RNG.choice(FIRST_NAMES, size=n)
    last = RNG.choice(LAST_NAMES, size=n)
    return [f"{f} {l}" for f, l in zip(first, last)]

def main():
    tenure_months = RNG.integers(1, 73, size=N)

    contract_type = RNG.choice(
        ["month-to-month", "one-year", "two-year"],
        size=N,
        p=[0.55, 0.28, 0.17],
    )

    monthly_charges = np.round(RNG.normal(850, 350, size=N).clip(299, 3499), 2)

    usage_units = np.round(RNG.normal(320, 140, size=N).clip(10, 1200), 1)

    # usage trend: mostly mild noise around 0, with a tail of customers whose
    # usage is genuinely collapsing (an early churn signal)
    usage_change_pct = np.round(RNG.normal(-2, 18, size=N).clip(-95, 90), 1)

    complaints_3m = RNG.poisson(0.6, size=N).clip(0, 8)
    payment_failures_6m = RNG.poisson(0.35, size=N).clip(0, 6)

    payment_method = RNG.choice(["autopay", "manual"], size=N, p=[0.6, 0.4])

    contract_risk = np.select(
        [contract_type == "month-to-month", contract_type == "one-year", contract_type == "two-year"],
        [1.0, 0.35, 0.0],
    )

    charges_z = (monthly_charges - monthly_charges.mean()) / monthly_charges.std()
    tenure_z = (tenure_months - tenure_months.mean()) / tenure_months.std()

    # weighted logit combining the real drivers we want the model to learn
    logit = (
        -1.9
        + 2.6 * contract_risk
        + 0.95 * complaints_3m
        + 0.95 * payment_failures_6m
        + 0.70 * charges_z
        + 1.1 * np.clip(-usage_change_pct, 0, 95) / 30  # bigger usage drop -> higher risk
        - 0.55 * tenure_z
        + 0.45 * (payment_method == "manual")
    )

    noise = RNG.normal(0, 0.35, size=N)  # keeps AUC well short of 1.0
    logit_noisy = logit + noise

    prob = 1 / (1 + np.exp(-logit_noisy))

    # calibrate a global offset so churn rate lands ~25-30%
    target_rate = 0.27
    lo, hi = -5.0, 5.0
    for _ in range(60):
        mid = (lo + hi) / 2
        rate = (1 / (1 + np.exp(-(logit_noisy + mid)))).mean()
        if rate > target_rate:
            hi = mid
        else:
            lo = mid
    offset = (lo + hi) / 2
    prob = 1 / (1 + np.exp(-(logit_noisy + offset)))

    churned = (RNG.uniform(0, 1, size=N) < prob).astype(int)

    df = pd.DataFrame({
        "customer_id": [f"CUST{i:05d}" for i in range(1, N + 1)],
        "name": gen_names(N),
        "tenure_months": tenure_months,
        "monthly_charges": monthly_charges,
        "contract_type": contract_type,
        "usage_units": usage_units,
        "usage_change_pct": usage_change_pct,
        "complaints_3m": complaints_3m,
        "payment_failures_6m": payment_failures_6m,
        "payment_method": payment_method,
        "churned": churned,
    })

    # Fixed demo customer for the walkthrough scenario (Business Owner -> Manager
    # -> Retention Team -> Support -> Retained). Features are engineered toward
    # ~90%+ predicted risk with complaints / usage-drop / month-to-month as the
    # top drivers — the actual probability still comes from the trained model,
    # never hardcoded.
    ravi = pd.DataFrame([{
        "customer_id": "CUST00000",
        "name": "Ravi Shankar",
        "tenure_months": 30,
        "monthly_charges": 1000.0,
        "contract_type": "month-to-month",
        "usage_units": 70.0,
        "usage_change_pct": -72.0,
        "complaints_3m": 5,
        "payment_failures_6m": 1,
        "payment_method": "manual",
        "churned": 1,
    }])
    df = pd.concat([ravi, df], ignore_index=True)

    out_path = Path(__file__).resolve().parent.parent / "data" / "demo_customers.csv"
    out_path.parent.mkdir(parents=True, exist_ok=True)
    df.to_csv(out_path, index=False)

    print(f"Wrote {len(df)} rows to {out_path}")
    print(f"Churn rate: {df['churned'].mean():.3f}")
    print(df.describe(include="all").transpose())

if __name__ == "__main__":
    main()
