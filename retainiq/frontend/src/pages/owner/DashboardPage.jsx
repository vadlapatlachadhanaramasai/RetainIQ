import { useCases } from "../../lib/useCases";
import { LoadingState, ErrorState } from "../../components/PageStates";
import PageHeader from "../../components/PageHeader";
import MetricCard from "../../components/MetricCard";
import CaseListTable from "../../components/CaseListTable";
import { formatINR, formatPct } from "../../lib/format";
import { riskCounts, totalRevenueAtRisk, recoverableNetValue, averageChurnRisk } from "../../lib/aggregates";
import { UNASSIGNED_STATUSES } from "../../lib/workflow";

export default function DashboardPage() {
  const { cases, loading, error, reload } = useCases();
  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  const risk = riskCounts(cases);
  const needsAttention = cases.filter(
    (r) => r.customer.risk_band === "high" && UNASSIGNED_STATUSES.includes(r.case.status)
  );
  const recentHighRisk = [...cases]
    .filter((r) => r.customer.risk_band === "high")
    .sort((a, b) => b.customer.churn_probability - a.customer.churn_probability)
    .slice(0, 8);

  return (
    <div>
      <PageHeader title="Dashboard" subtitle="Company-wide churn risk and retention performance" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <MetricCard label="Total customers" value={cases.length.toLocaleString("en-IN")} />
        <MetricCard label="High risk" value={risk.high.toLocaleString("en-IN")} />
        <MetricCard label="Medium risk" value={risk.medium.toLocaleString("en-IN")} />
        <MetricCard label="Low risk" value={risk.low.toLocaleString("en-IN")} />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <MetricCard label="Overall churn risk" value={formatPct(averageChurnRisk(cases))} />
        <MetricCard label="Revenue at risk (estimated)" value={formatINR(totalRevenueAtRisk(cases))} />
        <MetricCard label="Customers needing attention" value={needsAttention.length.toLocaleString("en-IN")} accent />
        <MetricCard label="Recoverable net value (estimated)" value={formatINR(recoverableNetValue(cases))} accent />
      </div>

      <h2 className="text-slate-300 font-medium mb-3">Recent high-risk customers</h2>
      <CaseListTable rows={recentHighRisk} columns={["risk", "reason", "action", "status", "revenue"]} />
    </div>
  );
}
