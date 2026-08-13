import { STATUS_LABELS, STATUS_STYLES } from "../lib/workflow";

export default function StatusBadge({ status }) {
  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-medium border whitespace-nowrap ${STATUS_STYLES[status] || STATUS_STYLES.AI_IDENTIFIED}`}>
      {STATUS_LABELS[status] || status}
    </span>
  );
}
