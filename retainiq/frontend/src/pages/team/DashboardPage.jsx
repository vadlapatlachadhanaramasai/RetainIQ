import { useCases } from "../../lib/useCases";
import { LoadingState, ErrorState } from "../../components/PageStates";
import PageHeader from "../../components/PageHeader";
import MetricCard from "../../components/MetricCard";
import CaseListTable from "../../components/CaseListTable";
import { TERMINAL_STATUSES } from "../../lib/workflow";

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export default function DashboardPage() {
  const { cases, loading, error, reload } = useCases();
  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  const today = todayStr();
  const highPriority = cases.filter((r) => ["high", "urgent"].includes(r.case.priority));
  const dueToday = cases.filter((r) => r.case.deadline === today);
  const overdue = cases.filter((r) => r.case.deadline && r.case.deadline < today && !TERMINAL_STATUSES.includes(r.case.status));
  const inProgress = cases.filter((r) => !TERMINAL_STATUSES.includes(r.case.status));
  const completed = cases.filter((r) => TERMINAL_STATUSES.includes(r.case.status));

  return (
    <div>
      <PageHeader title="My Dashboard" subtitle="Your assigned retention work" />

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
        <MetricCard label="My assigned customers" value={cases.length.toLocaleString("en-IN")} />
        <MetricCard label="High-priority tasks" value={highPriority.length.toLocaleString("en-IN")} accent />
        <MetricCard label="Due today" value={dueToday.length.toLocaleString("en-IN")} />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <MetricCard label="Overdue" value={overdue.length.toLocaleString("en-IN")} accent />
        <MetricCard label="In-progress cases" value={inProgress.length.toLocaleString("en-IN")} />
        <MetricCard label="Completed cases" value={completed.length.toLocaleString("en-IN")} />
      </div>

      <h2 className="text-slate-300 font-medium mb-3">Needs action</h2>
      <CaseListTable
        rows={inProgress.sort((a, b) => b.customer.churn_probability - a.customer.churn_probability).slice(0, 10)}
        columns={["risk", "reason", "action", "status", "revenue"]}
        emptyMessage="Nothing in progress — check My Customers for your full queue."
      />
    </div>
  );
}
