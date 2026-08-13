import { useMemo, useState } from "react";
import { useCases } from "../../lib/useCases";
import { LoadingState, ErrorState } from "../../components/PageStates";
import PageHeader from "../../components/PageHeader";
import CaseListTable from "../../components/CaseListTable";
import { UNASSIGNED_STATUSES } from "../../lib/workflow";

const FILTERS = [
  { key: "all", label: "All" },
  { key: "active", label: "Active" },
  { key: "unassigned", label: "Unassigned" },
  { key: "resolved", label: "Resolved" },
];

const TERMINAL = ["RETAINED", "STILL_AT_RISK", "CHURNED"];

export default function RetentionCasesPage() {
  const { cases, loading, error, reload } = useCases();
  const [filter, setFilter] = useState("all");

  const filtered = useMemo(() => {
    if (!cases) return [];
    let list = cases;
    if (filter === "active") list = list.filter((r) => !UNASSIGNED_STATUSES.includes(r.case.status) && !TERMINAL.includes(r.case.status));
    if (filter === "unassigned") list = list.filter((r) => UNASSIGNED_STATUSES.includes(r.case.status));
    if (filter === "resolved") list = list.filter((r) => TERMINAL.includes(r.case.status));
    return [...list].sort((a, b) => b.customer.churn_probability - a.customer.churn_probability);
  }, [cases, filter]);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  return (
    <div>
      <PageHeader title="Retention Cases" subtitle="Every case, at every stage of the workflow" />

      <div className="flex items-center gap-2 mb-4">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filter === f.key ? "bg-accent text-white" : "bg-navy-800 text-slate-400 hover:text-white border border-navy-700"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <CaseListTable rows={filtered} columns={["risk", "action", "status", "assignee", "revenue"]} />
    </div>
  );
}
