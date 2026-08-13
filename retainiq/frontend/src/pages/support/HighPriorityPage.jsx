import { useMemo } from "react";
import { useCases } from "../../lib/useCases";
import { LoadingState, ErrorState } from "../../components/PageStates";
import PageHeader from "../../components/PageHeader";
import SupportTicketList from "../../components/SupportTicketList";

export default function HighPriorityPage() {
  const { cases, loading, error, reload } = useCases();

  const highPriority = useMemo(
    () => (cases || []).filter((r) => ["OPEN", "IN_PROGRESS"].includes(r.ticket.status) && ["high", "urgent"].includes(r.ticket.priority)),
    [cases]
  );

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  return (
    <div>
      <PageHeader title="High Priority" subtitle="Urgent and high-priority tickets" />
      <SupportTicketList rows={highPriority} emptyMessage="No high-priority tickets right now." />
    </div>
  );
}
