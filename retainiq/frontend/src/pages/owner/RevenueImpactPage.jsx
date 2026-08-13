import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  LabelList,
} from "recharts";
import { useCases } from "../../lib/useCases";
import { LoadingState, ErrorState } from "../../components/PageStates";
import PageHeader from "../../components/PageHeader";
import MetricCard from "../../components/MetricCard";
import { formatINR } from "../../lib/format";
import { riskCounts, totalRevenueAtRisk, recoverableNetValue, netValueByAction } from "../../lib/aggregates";

// Status colors validated against the navy dark surface (lightness band,
// chroma floor, CVD separation, contrast — see dataviz palette validation).
const RISK_COLORS = { high: "#e11d48", medium: "#d97706", low: "#059669" };
const ACTION_COLORS = ["#3987e5", "#199e70", "#c98500", "#008300", "#9085e9"];
const AXIS_STYLE = { fill: "#94a3b8", fontSize: 12 };
const TOOLTIP_STYLE = { background: "#141b2e", border: "1px solid #1c2540", borderRadius: 8, color: "#e5e7eb", fontSize: 13 };

export default function RevenueImpactPage() {
  const { cases, loading, error, reload } = useCases();
  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  const risk = riskCounts(cases);
  const riskData = [
    { key: "high", label: "High risk", value: risk.high },
    { key: "medium", label: "Medium risk", value: risk.medium },
    { key: "low", label: "Low risk", value: risk.low },
  ];
  const actionData = netValueByAction(cases).map((d, i) => ({ ...d, fill: ACTION_COLORS[i % ACTION_COLORS.length] }));

  return (
    <div>
      <PageHeader title="Revenue Impact" subtitle="Where churn risk actually costs money" />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <MetricCard label="Total revenue at risk (estimated)" value={formatINR(totalRevenueAtRisk(cases))} />
        <MetricCard label="Recoverable net value (estimated)" value={formatINR(recoverableNetValue(cases))} accent />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-navy-700 bg-navy-900/70 p-5">
          <h3 className="text-slate-300 font-medium mb-4">Customers by risk band</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={riskData} margin={{ top: 16, right: 8, left: 8, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke="#1c2540" />
              <XAxis dataKey="label" tick={AXIS_STYLE} axisLine={{ stroke: "#1c2540" }} tickLine={false} />
              <YAxis tick={AXIS_STYLE} axisLine={false} tickLine={false} width={32} />
              <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: "#1c254040" }} formatter={(v) => [v.toLocaleString("en-IN"), "Customers"]} />
              <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={64}>
                {riskData.map((d) => (
                  <Cell key={d.key} fill={RISK_COLORS[d.key]} />
                ))}
                <LabelList dataKey="value" position="top" fill="#e5e7eb" fontSize={13} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-2xl border border-navy-700 bg-navy-900/70 p-5">
          <h3 className="text-slate-300 font-medium mb-4">Recoverable net value by action</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={actionData} layout="vertical" margin={{ top: 8, right: 72, left: 8, bottom: 0 }}>
              <CartesianGrid horizontal={false} stroke="#1c2540" />
              <XAxis type="number" hide />
              <YAxis type="category" dataKey="label" tick={AXIS_STYLE} axisLine={false} tickLine={false} width={150} />
              <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: "#1c254040" }} formatter={(v) => formatINR(v)} />
              <Bar dataKey="value" radius={[0, 4, 4, 0]} maxBarSize={28}>
                {actionData.map((d) => (
                  <Cell key={d.label} fill={d.fill} />
                ))}
                <LabelList dataKey="value" position="right" formatter={formatINR} fill="#e5e7eb" fontSize={12} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
