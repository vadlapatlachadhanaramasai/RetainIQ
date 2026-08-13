// Small aggregation helpers shared by every Dashboard/Analytics-shaped page.
// Each page picks which of these it needs rather than recomputing inline.

export function riskCounts(rows) {
  const counts = { high: 0, medium: 0, low: 0 };
  rows.forEach((r) => counts[r.customer.risk_band]++);
  return counts;
}

export function totalRevenueAtRisk(rows) {
  return rows.reduce((sum, r) => sum + r.customer.revenue_at_risk, 0);
}

export function recoverableNetValue(rows) {
  return rows.reduce((sum, r) => sum + Math.max(r.customer.net_value, 0), 0);
}

export function averageChurnRisk(rows) {
  if (!rows.length) return 0;
  return rows.reduce((sum, r) => sum + r.customer.churn_probability, 0) / rows.length;
}

export function statusCounts(rows) {
  const counts = {};
  rows.forEach((r) => {
    counts[r.case.status] = (counts[r.case.status] || 0) + 1;
  });
  return counts;
}

export function outcomeCounts(rows) {
  const counts = { RETAINED: 0, STILL_AT_RISK: 0, CHURNED: 0 };
  rows.forEach((r) => {
    if (r.case.outcome) counts[r.case.outcome]++;
  });
  return counts;
}

export function assigneeCounts(rows) {
  const counts = new Map();
  rows.forEach((r) => {
    if (!r.case.assignee) return;
    const entry = counts.get(r.case.assignee) || { assigned: 0, resolved: 0 };
    entry.assigned += 1;
    if (r.case.outcome) entry.resolved += 1;
    counts.set(r.case.assignee, entry);
  });
  return counts;
}

export function netValueByAction(rows) {
  const totals = new Map();
  rows.forEach((r) => {
    if (r.customer.net_value <= 0) return;
    const label = r.customer.action.label;
    totals.set(label, (totals.get(label) || 0) + r.customer.net_value);
  });
  return [...totals.entries()].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value);
}
