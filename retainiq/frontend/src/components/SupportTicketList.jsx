import { useNavigate } from "react-router-dom";
import { formatPct, RISK_BAND_STYLES } from "../lib/format";
import { TICKET_STATUS_LABELS } from "../lib/workflow";

// Ticket-shaped list, distinct from CaseListTable — support agents care
// about the issue description and ticket state, not net value / sort order.
export default function SupportTicketList({ rows, emptyMessage = "No tickets." }) {
  const navigate = useNavigate();

  return (
    <div className="space-y-3">
      {rows.map(({ customer, ticket }) => (
        <div
          key={ticket.id}
          onClick={() => navigate(`/customer/${customer.id}`)}
          className="rounded-2xl border border-navy-700 bg-navy-900/70 px-5 py-4 cursor-pointer hover:border-accent/40 transition-colors"
        >
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-white font-medium">{customer.name}</span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${RISK_BAND_STYLES[customer.risk_band]}`}>
              {formatPct(customer.churn_probability)} risk
            </span>
            <span className="px-2 py-0.5 rounded-full text-xs font-medium border border-navy-600 text-slate-400 capitalize">
              {ticket.priority}
            </span>
            <span className="ml-auto text-xs text-slate-500">
              #{ticket.id} · {TICKET_STATUS_LABELS[ticket.status]}
            </span>
          </div>
          <p className="text-slate-400 text-sm">{ticket.issue_description}</p>
        </div>
      ))}
      {rows.length === 0 && (
        <p className="text-slate-500 text-sm text-center py-8 border border-dashed border-navy-700 rounded-2xl">{emptyMessage}</p>
      )}
    </div>
  );
}
