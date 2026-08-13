// Mirrors backend/workflow.py — one status vocabulary, used everywhere a
// case status is displayed. Never invent a status label in a component.

export const STATUS_LABELS = {
  AI_IDENTIFIED: "AI identified",
  NEEDS_REVIEW: "Needs review",
  SENT_TO_MANAGER: "Sent to manager",
  ASSIGNED: "Assigned",
  IN_PROGRESS: "In progress",
  SUPPORT_REQUIRED: "Support required",
  SUPPORT_IN_PROGRESS: "Support in progress",
  SUPPORT_RESOLVED: "Support resolved",
  CUSTOMER_CONTACTED: "Customer contacted",
  RETAINED: "Retained",
  STILL_AT_RISK: "Still at risk",
  CHURNED: "Churned",
};

export const TERMINAL_STATUSES = ["RETAINED", "STILL_AT_RISK", "CHURNED"];
export const UNASSIGNED_STATUSES = ["AI_IDENTIFIED", "NEEDS_REVIEW", "SENT_TO_MANAGER"];

// Statuses where "Send to Retention Manager" is still a meaningful action —
// once a case is SENT_TO_MANAGER it's already in the manager's queue, so
// re-sending is a no-op the UI shouldn't invite. Single source of truth so
// the list-page button and the detail-page button never disagree.
export const PRE_MANAGER_STATUSES = ["AI_IDENTIFIED", "NEEDS_REVIEW"];

export const STATUS_STYLES = {
  AI_IDENTIFIED: "bg-slate-500/15 text-slate-400 border-slate-500/30",
  NEEDS_REVIEW: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  SENT_TO_MANAGER: "bg-sky-500/15 text-sky-400 border-sky-500/30",
  ASSIGNED: "bg-accent/15 text-accent-light border-accent/30",
  IN_PROGRESS: "bg-sky-500/15 text-sky-400 border-sky-500/30",
  SUPPORT_REQUIRED: "bg-orange-500/15 text-orange-400 border-orange-500/30",
  SUPPORT_IN_PROGRESS: "bg-orange-500/15 text-orange-400 border-orange-500/30",
  SUPPORT_RESOLVED: "bg-teal-500/15 text-teal-400 border-teal-500/30",
  CUSTOMER_CONTACTED: "bg-sky-500/15 text-sky-400 border-sky-500/30",
  RETAINED: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  STILL_AT_RISK: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  CHURNED: "bg-rose-500/15 text-rose-400 border-rose-500/30",
};

export const TICKET_STATUS_LABELS = {
  OPEN: "Open",
  IN_PROGRESS: "In progress",
  RESOLVED: "Resolved",
};
