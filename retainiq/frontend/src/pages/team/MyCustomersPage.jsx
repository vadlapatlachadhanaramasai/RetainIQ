import { useMemo, useState } from "react";
import { useCases } from "../../lib/useCases";
import { LoadingState, ErrorState } from "../../components/PageStates";
import PageHeader from "../../components/PageHeader";
import CaseListTable from "../../components/CaseListTable";

const RISK_FILTERS = [
  { key: "all", label: "All" },
  { key: "high", label: "High risk" },
  { key: "medium", label: "Medium risk" },
  { key: "low", label: "Low risk" },
];

export default function MyCustomersPage() {
  const { cases, loading, error, reload } = useCases();
  const [riskFilter, setRiskFilter] = useState("all");

  const filtered = useMemo(() => {
    if (!cases) return [];
    return [...cases]
      .filter((r) => riskFilter === "all" || r.customer.risk_band === riskFilter)
      .sort((a, b) => b.customer.net_value - a.customer.net_value);
  }, [cases, riskFilter]);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  return (
    <div>
      <PageHeader title="My Customers" subtitle="Every customer assigned to you, prioritized by net value" />

      <div className="flex items-center gap-2 mb-4">
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
      </div>

      <CaseListTable rows={filtered} columns={["risk", "reason", "action", "status", "netvalue"]} emptyMessage="No customers assigned to you yet." />
    </div>
  );
}
