import { useCases } from "../../lib/useCases";
import { LoadingState, ErrorState } from "../../components/PageStates";
import PageHeader from "../../components/PageHeader";
import SupportTicketList from "../../components/SupportTicketList";

export default function SupportHistoryPage() {
  const { cases, loading, error, reload } = useCases();
  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  return (
    <div>
      <PageHeader title="Support History" subtitle="Every ticket you've touched, open or resolved" />
      <SupportTicketList rows={cases} emptyMessage="No support tickets yet." />
    </div>
  );
}
