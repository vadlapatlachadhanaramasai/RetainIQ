import { useNavigate } from "react-router-dom";
import StatusBadge from "./StatusBadge";
import { formatINR, formatPct, RISK_BAND_STYLES } from "../lib/format";

const ALL_COLUMNS = ["risk", "reason", "action", "status", "assignee", "revenue", "netvalue"];

// Reused across every list-shaped page (Dashboard tables, Customers at Risk,
// My Team, Assignments, Retention Cases, Tickets, ...) — pages differ only
// in which rows they pass in and which columns they need.
export default function CaseListTable({ rows, columns = ["risk", "reason", "action", "status", "revenue"], emptyMessage = "No customers match this view." }) {
  const navigate = useNavigate();
  const show = (key) => columns.includes(key);

  return (
    <div className="rounded-2xl border border-navy-700 overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-navy-900/80 text-slate-400 text-left">
            <th className="px-5 py-3 font-medium">Customer</th>
            {show("risk") && <th className="px-5 py-3 font-medium">Risk</th>}
            {show("reason") && <th className="px-5 py-3 font-medium">Top reason</th>}
            {show("action") && <th className="px-5 py-3 font-medium">Recommended action</th>}
            {show("status") && <th className="px-5 py-3 font-medium">Status</th>}
            {show("assignee") && <th className="px-5 py-3 font-medium">Assignee</th>}
            {show("revenue") && <th className="px-5 py-3 font-medium text-right">Revenue at risk</th>}
            {show("netvalue") && <th className="px-5 py-3 font-medium text-right">Net value</th>}
          </tr>
        </thead>
        <tbody>
          {rows.map(({ customer, case: c }) => (
            <tr
              key={customer.id}
              onClick={() => navigate(`/customer/${customer.id}`)}
              className="border-t border-navy-700 hover:bg-navy-800/60 cursor-pointer transition-colors"
            >
              <td className="px-5 py-3.5 text-white font-medium">{customer.name}</td>
              {show("risk") && (
                <td className="px-5 py-3.5">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${RISK_BAND_STYLES[customer.risk_band]}`}>
                    {formatPct(customer.churn_probability)}
                  </span>
                </td>
              )}
              {show("reason") && <td className="px-5 py-3.5 text-slate-300">{customer.drivers[0]?.label ?? "—"}</td>}
              {show("action") && <td className="px-5 py-3.5 text-slate-300">{customer.action.label}</td>}
              {show("status") && (
                <td className="px-5 py-3.5">
                  <StatusBadge status={c.status} />
                </td>
              )}
              {show("assignee") && <td className="px-5 py-3.5 text-slate-300">{c.assignee || "—"}</td>}
              {show("revenue") && <td className="px-5 py-3.5 text-right text-slate-300">{formatINR(customer.revenue_at_risk)}</td>}
              {show("netvalue") && (
                <td className={`px-5 py-3.5 text-right font-medium ${customer.net_value >= 0 ? "text-emerald-400" : "text-slate-500"}`}>
                  {formatINR(customer.net_value)}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length === 0 && <p className="text-slate-500 text-sm text-center py-8">{emptyMessage}</p>}
    </div>
  );
}
