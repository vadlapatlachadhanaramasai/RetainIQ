import { useMemo } from "react";
import { useCases } from "../../lib/useCases";
import { LoadingState, ErrorState } from "../../components/PageStates";
import PageHeader from "../../components/PageHeader";
import CaseListTable from "../../components/CaseListTable";

const SUPPORT_STATUSES = ["SUPPORT_REQUIRED", "SUPPORT_IN_PROGRESS", "SUPPORT_RESOLVED"];

export default function SupportRequestsPage() {
  const { cases, loading, error, reload } = useCases();

  const requests = useMemo(() => {
    if (!cases) return [];
    return [...cases].filter((r) => SUPPORT_STATUSES.includes(r.case.status));
  }, [cases]);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  return (
    <div>
      <PageHeader title="Support Requests" subtitle="Customers you've escalated to Customer Support" />
      <CaseListTable
        rows={requests}
        columns={["risk", "action", "status", "revenue"]}
        emptyMessage="You haven't requested Customer Support for anyone yet."
      />
    </div>
  );
}
