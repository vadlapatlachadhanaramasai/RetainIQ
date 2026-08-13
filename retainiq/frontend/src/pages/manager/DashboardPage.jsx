import { useCases } from "../../lib/useCases";
import { LoadingState, ErrorState } from "../../components/PageStates";
import PageHeader from "../../components/PageHeader";
import MetricCard from "../../components/MetricCard";
import CaseListTable from "../../components/CaseListTable";
import { formatINR } from "../../lib/format";
import { totalRevenueAtRisk } from "../../lib/aggregates";
import { UNASSIGNED_STATUSES, TERMINAL_STATUSES } from "../../lib/workflow";

const IN_PROGRESS_STATUSES = ["IN_PROGRESS", "CUSTOMER_CONTACTED", "SUPPORT_REQUIRED", "SUPPORT_IN_PROGRESS", "SUPPORT_RESOLVED"];

export default function DashboardPage() {
  const { cases, loading, error, reload } = useCases();
  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  const assignedHighRisk = cases.filter((r) => r.customer.risk_band === "high" && r.case.assignee);
  const unassigned = cases.filter((r) => UNASSIGNED_STATUSES.includes(r.case.status));
  const pending = cases.filter((r) => ["SENT_TO_MANAGER", "ASSIGNED"].includes(r.case.status));
  const inProgress = cases.filter((r) => IN_PROGRESS_STATUSES.includes(r.case.status));
  const completed = cases.filter((r) => TERMINAL_STATUSES.includes(r.case.status));
  const needsAttention = cases
    .filter((r) => r.customer.risk_band === "high" && UNASSIGNED_STATUSES.includes(r.case.status))
    .sort((a, b) => b.customer.churn_probability - a.customer.churn_probability)
    .slice(0, 8);

  return (
    <div>
      <PageHeader title="Dashboard" subtitle="Operational retention overview" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <MetricCard label="Assigned high-risk" value={assignedHighRisk.length.toLocaleString("en-IN")} />
        <MetricCard label="Unassigned" value={unassigned.length.toLocaleString("en-IN")} accent />
        <MetricCard label="Pending actions" value={pending.length.toLocaleString("en-IN")} />
        <MetricCard label="In progress" value={inProgress.length.toLocaleString("en-IN")} />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <MetricCard label="Completed" value={completed.length.toLocaleString("en-IN")} />
        <MetricCard label="Revenue at risk (estimated)" value={formatINR(totalRevenueAtRisk(cases))} />
        <MetricCard label="Team workload" value={cases.filter((r) => r.case.assignee).length.toLocaleString("en-IN")} />
        <MetricCard label="Cases requiring attention" value={needsAttention.length.toLocaleString("en-IN")} accent />
      </div>

      <h2 className="text-slate-300 font-medium mb-3">Cases requiring attention</h2>
      <CaseListTable rows={needsAttention} columns={["risk", "reason", "action", "status", "revenue"]} />
    </div>
  );
}
