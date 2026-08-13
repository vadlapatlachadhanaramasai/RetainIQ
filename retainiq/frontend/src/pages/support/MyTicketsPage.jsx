import { useMemo } from "react";
import { useCases } from "../../lib/useCases";
import { LoadingState, ErrorState } from "../../components/PageStates";
import PageHeader from "../../components/PageHeader";
import SupportTicketList from "../../components/SupportTicketList";

export default function MyTicketsPage() {
  const { cases, loading, error, reload } = useCases();

  const open = useMemo(() => (cases || []).filter((r) => ["OPEN", "IN_PROGRESS"].includes(r.ticket.status)), [cases]);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  return (
    <div>
      <PageHeader title="My Tickets" subtitle="Open and in-progress support tickets" />
      <SupportTicketList rows={open} emptyMessage="No open tickets." />
    </div>
  );
}
