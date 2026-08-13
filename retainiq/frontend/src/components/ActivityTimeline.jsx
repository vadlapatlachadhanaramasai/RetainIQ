import { ROLE_LABELS } from "../lib/roles";

function formatTime(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

export default function ActivityTimeline({ activities }) {
  if (!activities || activities.length === 0) {
    return <p className="text-slate-500 text-sm">No activity yet — this case hasn't been touched.</p>;
  }

  return (
    <ol className="relative border-l border-navy-700 pl-5 space-y-5">
      {activities.map((a) => (
        <li key={a.id} className="relative">
          <span className="absolute -left-[25px] top-1 w-2.5 h-2.5 rounded-full bg-accent" />
          <p className="text-white text-sm font-medium">{a.action}</p>
          {a.detail && <p className="text-slate-400 text-sm mt-0.5">{a.detail}</p>}
          <p className="text-slate-600 text-xs mt-1">
            {ROLE_LABELS[a.actor_role] || a.actor_role} · {a.actor_name} · {formatTime(a.created_at)}
          </p>
        </li>
      ))}
    </ol>
  );
}
