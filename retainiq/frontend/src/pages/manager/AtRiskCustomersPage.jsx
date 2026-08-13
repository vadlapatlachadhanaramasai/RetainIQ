import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCases } from "../../lib/useCases";
import { LoadingState, ErrorState } from "../../components/PageStates";
import PageHeader from "../../components/PageHeader";
import MetricCard from "../../components/MetricCard";
import StatusBadge from "../../components/StatusBadge";
import { formatINR, formatPct, RISK_BAND_STYLES } from "../../lib/format";
import { withHorizon, summarize } from "../../lib/economics";

const SORT_OPTIONS = [
  { key: "net_value", label: "Net value" },
  { key: "risk", label: "Risk score" },
  { key: "revenue", label: "Revenue" },
];

// The full sortable table with an editable horizon assumption — money
// columns recompute instantly client-side, no refetch, same as the
// original single-page build. This is the one page a Retention Manager
// can move the horizon on; every other role sees it fixed at 12 months.
export default function AtRiskCustomersPage() {
  const navigate = useNavigate();
  const { cases, loading, error, reload } = useCases();
  const [horizonMonths, setHorizonMonths] = useState(12);
  const [sortBy, setSortBy] = useState("net_value");

  const customers = useMemo(
    () => (cases || []).map((r) => ({ ...r, customer: withHorizon(r.customer, horizonMonths) })),
    [cases, horizonMonths]
  );

  const summary = useMemo(() => summarize(customers.map((r) => r.customer)), [customers]);

  const sorted = useMemo(() => {
    const list = [...customers];
    if (sortBy === "net_value") list.sort((a, b) => b.customer.net_value - a.customer.net_value);
    else if (sortBy === "risk") list.sort((a, b) => b.customer.churn_probability - a.customer.churn_probability);
    else if (sortBy === "revenue") list.sort((a, b) => b.customer.revenue_at_risk - a.customer.revenue_at_risk);
    return list;
  }, [customers, sortBy]);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  return (
    <div>
      <PageHeader title="At-Risk Customers" subtitle="Sort by net value to see who's actually worth acting on" />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <MetricCard label="Customers analysed" value={summary.total_customers.toLocaleString("en-IN")} />
        <MetricCard label="At-risk customers" value={summary.at_risk_count.toLocaleString("en-IN")} />
        <MetricCard label="Total revenue at risk (estimated)" value={formatINR(summary.revenue_at_risk)} />
        <MetricCard label="Recoverable net value (estimated)" value={formatINR(summary.recoverable_net_value)} accent />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-2">
          <span className="text-slate-400 text-sm mr-1">Sort by:</span>
          {SORT_OPTIONS.map((opt) => (
            <button
              key={opt.key}
              onClick={() => setSortBy(opt.key)}
              className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                sortBy === opt.key ? "bg-accent text-white" : "bg-navy-800 text-slate-400 hover:text-white border border-navy-700"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <label className="flex items-center gap-2 text-sm text-slate-400">
          Horizon (months)
          <input
            type="number"
            min={1}
            max={60}
            value={horizonMonths}
            onChange={(e) => {
              const v = parseInt(e.target.value, 10);
              setHorizonMonths(Number.isFinite(v) && v > 0 ? v : 1);
            }}
            className="w-20 bg-navy-800 border border-navy-700 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </label>
      </div>

      <div className="rounded-2xl border border-navy-700 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-navy-900/80 text-slate-400 text-left">
              <th className="px-5 py-3 font-medium">Customer</th>
              <th className="px-5 py-3 font-medium">Risk</th>
              <th className="px-5 py-3 font-medium">Top reason</th>
              <th className="px-5 py-3 font-medium">Recommended action</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3 font-medium text-right">Revenue at risk</th>
              <th className="px-5 py-3 font-medium text-right">Net value</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map(({ customer, case: c }) => (
              <tr
                key={customer.id}
                onClick={() => navigate(`/customer/${customer.id}`)}
                className="border-t border-navy-700 hover:bg-navy-800/60 cursor-pointer transition-colors"
              >
                <td className="px-5 py-3.5 text-white font-medium">{customer.name}</td>
                <td className="px-5 py-3.5">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${RISK_BAND_STYLES[customer.risk_band]}`}>
                    {formatPct(customer.churn_probability)}
                  </span>
                </td>
                <td className="px-5 py-3.5 text-slate-300">{customer.drivers[0]?.label ?? "—"}</td>
                <td className="px-5 py-3.5 text-slate-300">{customer.action.label}</td>
                <td className="px-5 py-3.5">
                  <StatusBadge status={c.status} />
                </td>
                <td className="px-5 py-3.5 text-right text-slate-300">{formatINR(customer.revenue_at_risk)}</td>
                <td className={`px-5 py-3.5 text-right font-medium ${customer.net_value >= 0 ? "text-emerald-400" : "text-slate-500"}`}>
                  {formatINR(customer.net_value)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-slate-600 text-xs mt-4">Churn probabilities and revenue figures are model estimates, not guarantees.</p>
    </div>
  );
}
