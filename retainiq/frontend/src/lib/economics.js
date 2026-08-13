// Mirrors backend/economics.py so the horizon can be recomputed client-side
// without a refetch. customer here is the `customer` half of a /cases row.
export function withHorizon(customer, horizonMonths) {
  const revenueAtRisk = customer.monthly_charges * horizonMonths * customer.churn_probability;
  const netValue = revenueAtRisk - customer.action.cost;
  return {
    ...customer,
    revenue_at_risk: revenueAtRisk,
    net_value: netValue,
  };
}

export function summarize(customers) {
  const totalCustomers = customers.length;
  const atRiskCount = customers.filter((c) => c.risk_band === "high" || c.risk_band === "medium").length;
  const revenueAtRisk = customers.reduce((sum, c) => sum + c.revenue_at_risk, 0);
  const recoverableNetValue = customers
    .filter((c) => c.net_value > 0)
    .reduce((sum, c) => sum + c.net_value, 0);
  return {
    total_customers: totalCustomers,
    at_risk_count: atRiskCount,
    revenue_at_risk: revenueAtRisk,
    recoverable_net_value: recoverableNetValue,
  };
}
