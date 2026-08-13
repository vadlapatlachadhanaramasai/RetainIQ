import { useMemo } from "react";
import { useCases } from "../../lib/useCases";
import { LoadingState, ErrorState } from "../../components/PageStates";
import PageHeader from "../../components/PageHeader";
import CaseListTable from "../../components/CaseListTable";
import { UNASSIGNED_STATUSES } from "../../lib/workflow";

// The manager's inbox: customers ready to be assigned to the retention
// team. Clicking through to the customer opens the Assign Customer action.
export default function AssignmentsPage() {
  const { cases, loading, error, reload } = useCases();

  const inbox = useMemo(() => {
    if (!cases) return [];
    return [...cases]
      .filter((r) => UNASSIGNED_STATUSES.includes(r.case.status))
      .sort((a, b) => b.customer.churn_probability - a.customer.churn_probability);
  }, [cases]);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  return (
    <div>
      <PageHeader title="Assignments" subtitle="Waiting to be assigned to a retention team member" />
      <CaseListTable
        rows={inbox}
        columns={["risk", "reason", "action", "status", "revenue"]}
        emptyMessage="Nothing waiting on assignment right now."
      />
    </div>
  );
}
