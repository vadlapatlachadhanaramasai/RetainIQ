import { useCases } from "../../lib/useCases";
import { LoadingState, ErrorState } from "../../components/PageStates";
import PageHeader from "../../components/PageHeader";
import MetricCard from "../../components/MetricCard";
import SupportTicketList from "../../components/SupportTicketList";

export default function DashboardPage() {
  const { cases, loading, error, reload } = useCases();
  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  const newRequests = cases.filter((r) => r.ticket.status === "OPEN");
  const openTickets = cases.filter((r) => ["OPEN", "IN_PROGRESS"].includes(r.ticket.status));
  const highPriority = openTickets.filter((r) => ["high", "urgent"].includes(r.ticket.priority));
  const resolved = cases.filter((r) => r.ticket.status === "RESOLVED");

  return (
    <div>
      <PageHeader title="Support Dashboard" subtitle="Tickets escalated from the retention workflow" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <MetricCard label="New requests" value={newRequests.length.toLocaleString("en-IN")} accent />
        <MetricCard label="Open tickets" value={openTickets.length.toLocaleString("en-IN")} />
        <MetricCard label="High priority" value={highPriority.length.toLocaleString("en-IN")} />
        <MetricCard label="Resolved" value={resolved.length.toLocaleString("en-IN")} />
      </div>

      <h2 className="text-slate-300 font-medium mb-3">Needs attention</h2>
      <SupportTicketList rows={highPriority.length ? highPriority : openTickets} emptyMessage="No open tickets right now." />
    </div>
  );
}
