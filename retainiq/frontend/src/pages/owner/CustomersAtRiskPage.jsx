import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCases } from "../../lib/useCases";
import { useApp } from "../../lib/AppContext";
import { sendToManager } from "../../lib/api";
import { LoadingState, ErrorState } from "../../components/PageStates";
import PageHeader from "../../components/PageHeader";
import StatusBadge from "../../components/StatusBadge";
import Toast from "../../components/Toast";
import { formatINR, formatPct, RISK_BAND_STYLES } from "../../lib/format";
import { PRE_MANAGER_STATUSES } from "../../lib/workflow";

const RISK_FILTERS = [
  { key: "all", label: "All" },
  { key: "high", label: "High" },
  { key: "medium", label: "Medium" },
  { key: "low", label: "Low" },
];

export default function CustomersAtRiskPage() {
  const { auth } = useApp();
  const navigate = useNavigate();
  const { cases, loading, error, reload } = useCases();
  const [riskFilter, setRiskFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [busyId, setBusyId] = useState(null);
  const [toast, setToast] = useState(null);

  const filtered = useMemo(() => {
    if (!cases) return [];
    const q = search.trim().toLowerCase();
    return cases
      .filter((r) => riskFilter === "all" || r.customer.risk_band === riskFilter)
      .filter((r) => !q || r.customer.name.toLowerCase().includes(q) || r.customer.id.toLowerCase().includes(q))
      .sort((a, b) => b.customer.churn_probability - a.customer.churn_probability);
  }, [cases, riskFilter, search]);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  const handleSend = async (e, customerId, name) => {
    e.stopPropagation();
    setBusyId(customerId);
    try {
      await sendToManager(auth.token, customerId);
      setToast(`${name} sent to Retention Manager`);
      setTimeout(() => setToast(null), 2500);
      reload();
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div>
      <PageHeader title="Customers at Risk" subtitle="Every customer, sorted by predicted churn risk" />

      <div className="flex flex-wrap items-center gap-3 mb-4">
        {RISK_FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setRiskFilter(f.key)}
            className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              riskFilter === f.key ? "bg-accent text-white" : "bg-navy-800 text-slate-400 hover:text-white border border-navy-700"
            }`}
          >
            {f.label}
          </button>
        ))}
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search name or ID…"
          className="ml-auto bg-navy-800 border border-navy-700 rounded-lg px-3 py-1.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-accent w-56"
        />
      </div>

      <div className="rounded-2xl border border-navy-700 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-navy-900/80 text-slate-400 text-left">
              <th className="px-5 py-3 font-medium">Customer</th>
              <th className="px-5 py-3 font-medium">Risk</th>
              <th className="px-5 py-3 font-medium">Main reason</th>
              <th className="px-5 py-3 font-medium">Revenue at risk</th>
              <th className="px-5 py-3 font-medium">Recommended action</th>
              <th className="px-5 py-3 font-medium">Case status</th>
              <th className="px-5 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(({ customer, case: c }) => {
              const eligible = PRE_MANAGER_STATUSES.includes(c.status);
              return (
                <tr
                  key={customer.id}
                  onClick={() => navigate(`/customer/${customer.id}`)}
                  className="border-t border-navy-700 hover:bg-navy-800/60 cursor-pointer transition-colors"
                >
                  <td className="px-5 py-3.5 text-white font-medium">
                    {customer.name}
                    <span className="text-slate-600 font-normal ml-1.5">{customer.id}</span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${RISK_BAND_STYLES[customer.risk_band]}`}>
                      {formatPct(customer.churn_probability)}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-slate-300">{customer.drivers[0]?.label ?? "—"}</td>
                  <td className="px-5 py-3.5 text-slate-300">{formatINR(customer.revenue_at_risk)}</td>
                  <td className="px-5 py-3.5 text-slate-300">{customer.action.label}</td>
                  <td className="px-5 py-3.5">
                    <StatusBadge status={c.status} />
                  </td>
                  <td className="px-5 py-3.5">
                    {eligible ? (
                      <button
                        onClick={(e) => handleSend(e, customer.id, customer.name)}
                        disabled={busyId === customer.id}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium bg-accent hover:bg-accent-dark text-white transition-colors disabled:opacity-50"
                      >
                        Send to Manager
                      </button>
                    ) : (
                      <span className="text-slate-600 text-xs">In workflow</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && <p className="text-slate-500 text-sm text-center py-8">No customers match this filter.</p>}
      </div>

      <Toast message={toast} />
    </div>
  );
}
