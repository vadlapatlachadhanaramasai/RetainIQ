export default function MetricCard({ label, value, accent }) {
  return (
    <div className="rounded-2xl bg-navy-900/70 border border-navy-700 px-6 py-5">
      <p className="text-slate-400 text-sm mb-2">{label}</p>
      <p className={`text-2xl font-semibold ${accent ? "text-accent-light" : "text-white"}`}>
        {value}
      </p>
    </div>
  );
}
