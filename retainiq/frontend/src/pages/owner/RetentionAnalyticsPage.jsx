import { useCases } from "../../lib/useCases";
import { LoadingState, ErrorState } from "../../components/PageStates";
import PageHeader from "../../components/PageHeader";
import MetricCard from "../../components/MetricCard";
import StatusBadge from "../../components/StatusBadge";
import { outcomeCounts, statusCounts } from "../../lib/aggregates";
import { STATUS_LABELS } from "../../lib/workflow";

export default function RetentionAnalyticsPage() {
  const { cases, loading, error, reload } = useCases();
  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  const outcomes = outcomeCounts(cases);
  const resolved = outcomes.RETAINED + outcomes.STILL_AT_RISK + outcomes.CHURNED;
  const retentionRate = resolved > 0 ? outcomes.RETAINED / resolved : 0;
  const statuses = statusCounts(cases);
  const pipelineOrder = [
    "AI_IDENTIFIED",
    "NEEDS_REVIEW",
    "SENT_TO_MANAGER",
    "ASSIGNED",
    "IN_PROGRESS",
    "CUSTOMER_CONTACTED",
    "SUPPORT_REQUIRED",
    "SUPPORT_IN_PROGRESS",
    "SUPPORT_RESOLVED",
  ];

  return (
    <div>
      <PageHeader title="Retention Analytics" subtitle="How retention cases resolve, end to end" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <MetricCard label="Cases resolved" value={resolved.toLocaleString("en-IN")} />
        <MetricCard label="Retained" value={outcomes.RETAINED.toLocaleString("en-IN")} accent />
        <MetricCard label="Still at risk" value={outcomes.STILL_AT_RISK.toLocaleString("en-IN")} />
        <MetricCard label="Churned" value={outcomes.CHURNED.toLocaleString("en-IN")} />
      </div>

      <div className="rounded-2xl border border-navy-700 bg-navy-900/70 p-6 mb-8">
        <p className="text-slate-400 text-sm mb-2">Retention rate (of resolved cases)</p>
        <p className="text-4xl font-semibold text-emerald-400">{Math.round(retentionRate * 100)}%</p>
      </div>

      <h2 className="text-slate-300 font-medium mb-3">Active pipeline</h2>
      <div className="rounded-2xl border border-navy-700 divide-y divide-navy-700">
        {pipelineOrder.map((status) => (
          <div key={status} className="flex items-center justify-between px-5 py-3">
            <StatusBadge status={status} />
            <span className="text-white font-medium">{(statuses[status] || 0).toLocaleString("en-IN")}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
