import { useMemo } from "react";
import { useCases } from "../../lib/useCases";
import { LoadingState, ErrorState } from "../../components/PageStates";
import PageHeader from "../../components/PageHeader";
import SupportTicketList from "../../components/SupportTicketList";

export default function ResolvedCasesPage() {
  const { cases, loading, error, reload } = useCases();

  const resolved = useMemo(() => (cases || []).filter((r) => r.ticket.status === "RESOLVED"), [cases]);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  return (
    <div>
      <PageHeader title="Resolved Cases" subtitle="Tickets you've closed out" />
      <SupportTicketList rows={resolved} emptyMessage="No resolved tickets yet." />
    </div>
  );
}
