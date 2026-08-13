import { useCases } from "../../lib/useCases";
import { LoadingState, ErrorState } from "../../components/PageStates";
import PageHeader from "../../components/PageHeader";
import MetricCard from "../../components/MetricCard";
import { assigneeCounts } from "../../lib/aggregates";
import { UNASSIGNED_STATUSES } from "../../lib/workflow";

export default function TeamOverviewPage() {
  const { cases, loading, error, reload } = useCases();
  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  const unassigned = cases.filter((r) => UNASSIGNED_STATUSES.includes(r.case.status)).length;
  const counts = assigneeCounts(cases);

  return (
    <div>
      <PageHeader title="Team Overview" subtitle="Retention workload by assignee" />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <MetricCard label="Unassigned customers" value={unassigned.toLocaleString("en-IN")} />
        <MetricCard label="Active team members" value={counts.size.toLocaleString("en-IN")} accent />
      </div>

      <div className="rounded-2xl border border-navy-700 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-navy-900/80 text-slate-400 text-left">
              <th className="px-5 py-3 font-medium">Team member</th>
              <th className="px-5 py-3 font-medium text-right">Assigned cases</th>
              <th className="px-5 py-3 font-medium text-right">Resolved</th>
            </tr>
          </thead>
          <tbody>
            {[...counts.entries()].map(([name, stats]) => (
              <tr key={name} className="border-t border-navy-700">
                <td className="px-5 py-3.5 text-white font-medium">{name}</td>
                <td className="px-5 py-3.5 text-right text-slate-300">{stats.assigned}</td>
                <td className="px-5 py-3.5 text-right text-emerald-400">{stats.resolved}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {counts.size === 0 && <p className="text-slate-500 text-sm text-center py-8">No cases assigned yet.</p>}
      </div>
    </div>
  );
}
