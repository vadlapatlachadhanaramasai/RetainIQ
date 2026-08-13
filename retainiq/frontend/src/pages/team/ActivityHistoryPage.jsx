import { useMemo } from "react";
import { useCases } from "../../lib/useCases";
import { LoadingState, ErrorState } from "../../components/PageStates";
import PageHeader from "../../components/PageHeader";
import CaseListTable from "../../components/CaseListTable";
import { TERMINAL_STATUSES } from "../../lib/workflow";

export default function ActivityHistoryPage() {
  const { cases, loading, error, reload } = useCases();

  const resolved = useMemo(() => {
    if (!cases) return [];
    return [...cases].filter((r) => TERMINAL_STATUSES.includes(r.case.status));
  }, [cases]);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  return (
    <div>
      <PageHeader title="Activity History" subtitle="Customers you've already resolved — open one to see the full timeline" />
      <CaseListTable
        rows={resolved}
        columns={["risk", "action", "status", "revenue"]}
        emptyMessage="No resolved cases yet."
      />
    </div>
  );
}
