import { useCases } from "../../lib/useCases";
import { LoadingState, ErrorState } from "../../components/PageStates";
import PageHeader from "../../components/PageHeader";
import CaseListTable from "../../components/CaseListTable";
import MetricCard from "../../components/MetricCard";
import { formatINR } from "../../lib/format";
import { totalRevenueAtRisk, recoverableNetValue, outcomeCounts } from "../../lib/aggregates";

export default function ReportsPage() {
  const { cases, loading, error, reload } = useCases();
  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  const top10 = [...cases].sort((a, b) => b.customer.net_value - a.customer.net_value).slice(0, 10);
  const outcomes = outcomeCounts(cases);

  return (
    <div>
      <PageHeader title="Reports" subtitle="Summary export view" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <MetricCard label="Customers analysed" value={cases.length.toLocaleString("en-IN")} />
        <MetricCard label="Revenue at risk (estimated)" value={formatINR(totalRevenueAtRisk(cases))} />
        <MetricCard label="Recoverable net value (estimated)" value={formatINR(recoverableNetValue(cases))} accent />
        <MetricCard label="Retained to date" value={outcomes.RETAINED.toLocaleString("en-IN")} accent />
      </div>

      <h2 className="text-slate-300 font-medium mb-3">Top 10 by net value</h2>
      <CaseListTable rows={top10} columns={["risk", "action", "status", "netvalue"]} />

      <p className="text-slate-600 text-xs mt-4">
        Churn probabilities and revenue figures are model estimates, not guarantees.
      </p>
    </div>
  );
}
