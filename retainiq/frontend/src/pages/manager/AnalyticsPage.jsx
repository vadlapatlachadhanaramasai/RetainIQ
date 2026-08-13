import { useCases } from "../../lib/useCases";
import { LoadingState, ErrorState } from "../../components/PageStates";
import PageHeader from "../../components/PageHeader";
import MetricCard from "../../components/MetricCard";
import { outcomeCounts, assigneeCounts } from "../../lib/aggregates";

export default function AnalyticsPage() {
  const { cases, loading, error, reload } = useCases();
  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  const outcomes = outcomeCounts(cases);
  const resolved = outcomes.RETAINED + outcomes.STILL_AT_RISK + outcomes.CHURNED;
  const retentionRate = resolved > 0 ? outcomes.RETAINED / resolved : 0;
  const counts = assigneeCounts(cases);
  const avgLoad = counts.size > 0 ? [...counts.values()].reduce((s, c) => s + c.assigned, 0) / counts.size : 0;

  return (
    <div>
      <PageHeader title="Analytics" subtitle="Retention team performance" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard label="Cases resolved" value={resolved.toLocaleString("en-IN")} />
        <MetricCard label="Retention rate" value={`${Math.round(retentionRate * 100)}%`} accent />
        <MetricCard label="Retained" value={outcomes.RETAINED.toLocaleString("en-IN")} />
        <MetricCard label="Avg cases / team member" value={avgLoad.toFixed(1)} />
      </div>
    </div>
  );
}
