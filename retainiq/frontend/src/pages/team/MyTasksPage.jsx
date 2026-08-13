import { useMemo } from "react";
import { useCases } from "../../lib/useCases";
import { LoadingState, ErrorState } from "../../components/PageStates";
import PageHeader from "../../components/PageHeader";
import CaseListTable from "../../components/CaseListTable";
import { TERMINAL_STATUSES } from "../../lib/workflow";

const PRIORITY_WEIGHT = { urgent: 0, high: 1, normal: 2 };

export default function MyTasksPage() {
  const { cases, loading, error, reload } = useCases();

  const tasks = useMemo(() => {
    if (!cases) return [];
    return [...cases]
      .filter((r) => !TERMINAL_STATUSES.includes(r.case.status))
      .sort((a, b) => {
        const pa = PRIORITY_WEIGHT[a.case.priority] ?? 2;
        const pb = PRIORITY_WEIGHT[b.case.priority] ?? 2;
        if (pa !== pb) return pa - pb;
        return b.customer.churn_probability - a.customer.churn_probability;
      });
  }, [cases]);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  return (
    <div>
      <PageHeader title="My Tasks" subtitle="Open work, sorted by priority" />
      <CaseListTable
        rows={tasks}
        columns={["risk", "action", "status", "revenue"]}
        emptyMessage="No open tasks — everything assigned to you is resolved."
      />
    </div>
  );
}
