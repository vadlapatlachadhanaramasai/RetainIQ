import { useMemo } from "react";
import { useCases } from "../../lib/useCases";
import { LoadingState, ErrorState } from "../../components/PageStates";
import PageHeader from "../../components/PageHeader";
import CaseListTable from "../../components/CaseListTable";

const SUPPORT_STATUSES = ["SUPPORT_REQUIRED", "SUPPORT_IN_PROGRESS", "SUPPORT_RESOLVED"];

export default function SupportEscalationsPage() {
  const { cases, loading, error, reload } = useCases();

  const escalations = useMemo(() => {
    if (!cases) return [];
    return [...cases]
      .filter((r) => SUPPORT_STATUSES.includes(r.case.status))
      .sort((a, b) => b.customer.churn_probability - a.customer.churn_probability);
  }, [cases]);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  return (
    <div>
      <PageHeader title="Support Escalations" subtitle="Cases waiting on or resolved by Customer Support" />
      <CaseListTable
        rows={escalations}
        columns={["risk", "action", "status", "assignee", "revenue"]}
        emptyMessage="No support escalations right now."
      />
    </div>
  );
}
