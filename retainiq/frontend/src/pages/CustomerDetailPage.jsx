import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  getCaseDetail,
  sendToManager,
  assignCase,
  escalateSupport,
  contactCustomer,
  executeAction,
  markOutcome,
  addCaseNotes,
  setCasePriority,
  startTicket,
  resolveTicket,
} from "../lib/api";
import { useApp } from "../lib/AppContext";
import { formatINR, formatPct, RISK_BAND_STYLES } from "../lib/format";
import { PRE_MANAGER_STATUSES, TICKET_STATUS_LABELS } from "../lib/workflow";
import StatusBadge from "../components/StatusBadge";
import ActivityTimeline from "../components/ActivityTimeline";
import Toast from "../components/Toast";
import { LoadingState, ErrorState } from "../components/PageStates";

export default function CustomerDetailPage() {
  const { id } = useParams();
  const { auth } = useApp();
  const navigate = useNavigate();

  const [state, setState] = useState({ loading: true, error: null, data: null });
  const [toast, setToast] = useState(null);

  const load = useCallback(() => {
    setState((s) => ({ ...s, loading: true, error: null }));
    getCaseDetail(auth.token, id)
      .then((data) => setState({ loading: false, error: null, data }))
      .catch((e) => setState({ loading: false, error: e.message, data: null }));
  }, [auth.token, id]);

  useEffect(() => {
    load();
  }, [load]);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  if (state.loading) return <LoadingState label="Loading customer…" />;
  if (state.error) return <ErrorState message={state.error} onRetry={load} />;

  const { customer, case: kase, ticket, activities } = state.data;
  const maxContribution = Math.max(...customer.drivers.map((d) => d.contribution), 0.0001);

  return (
    <div className="max-w-4xl">
      <button onClick={() => navigate(-1)} className="text-slate-400 hover:text-white text-sm mb-6">
        ← Back
      </button>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-white">{customer.name}</h1>
          <p className="text-slate-500 text-sm">{customer.id}</p>
        </div>
        <StatusBadge status={kase.status} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-2xl border border-navy-700 bg-navy-900/70 p-6">
            <div className="flex items-end gap-4 mb-6">
              <span className="text-5xl font-bold text-white">{formatPct(customer.churn_probability)}</span>
              <span className={`mb-2 px-3 py-1 rounded-full text-xs font-medium border ${RISK_BAND_STYLES[customer.risk_band]}`}>
                {customer.risk_band} risk — predicted
              </span>
            </div>

            <h3 className="text-slate-300 font-medium mb-3">Why?</h3>
            <div className="space-y-3 mb-6">
              {customer.drivers.map((d) => (
                <div key={d.feature}>
                  <p className="text-sm text-slate-300 mb-1">{d.label}</p>
                  <div className="h-2 rounded-full bg-navy-700 overflow-hidden">
                    <div
                      className="h-full bg-accent rounded-full"
                      style={{ width: `${(d.contribution / maxContribution) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="rounded-xl bg-accent/10 border border-accent/30 px-5 py-4 mb-6">
              <p className="text-slate-400 text-xs mb-1">Recommended action</p>
              <p className="text-white font-semibold text-lg">{customer.action.label}</p>
              <p className="text-slate-400 text-sm mt-1">Estimated cost: {formatINR(customer.action.cost)}</p>
            </div>

            <div className="grid grid-cols-3 gap-4 text-sm">
              <Stat label="Revenue at risk" value={formatINR(customer.revenue_at_risk)} />
              <Stat label="Action cost" value={formatINR(customer.action.cost)} />
              <Stat label="Net value" value={formatINR(customer.net_value)} valueClass="text-emerald-400" />
            </div>
          </div>

          <div className="rounded-2xl border border-navy-700 bg-navy-900/70 p-6">
            <h3 className="text-slate-300 font-medium mb-4">Activity timeline</h3>
            <ActivityTimeline activities={activities} />
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-navy-700 bg-navy-900/70 p-5 space-y-3 text-sm">
            <Row label="Assigned to" value={kase.assignee || "Unassigned"} />
            <Row label="Priority" value={kase.priority || "normal"} />
            <Row label="Deadline" value={kase.deadline || "—"} />
            {kase.manager_notes && <Row label="Manager notes" value={kase.manager_notes} />}
            {kase.outcome && <Row label="Outcome" value={kase.outcome.replace("_", " ")} />}
            {ticket && (
              <>
                <div className="h-px bg-navy-700 my-2" />
                <Row label="Support ticket" value={`#${ticket.id} · ${TICKET_STATUS_LABELS[ticket.status]}`} />
                <Row label="Issue" value={ticket.issue_description} />
                {ticket.resolution_notes && <Row label="Resolution" value={ticket.resolution_notes} />}
              </>
            )}
          </div>

          <RoleActions
            role={auth.role}
            token={auth.token}
            customerId={customer.id}
            kase={kase}
            ticket={ticket}
            onDone={(msg) => {
              showToast(msg);
              load();
            }}
          />
        </div>
      </div>

      <Toast message={toast} />
    </div>
  );
}

function Stat({ label, value, valueClass }) {
  return (
    <div>
      <p className="text-slate-500 text-xs mb-1">{label}</p>
      <p className={`font-semibold ${valueClass || "text-white"}`}>{value}</p>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div>
      <p className="text-slate-500 text-xs">{label}</p>
      <p className="text-white">{value}</p>
    </div>
  );
}

function ActionCard({ children }) {
  return <div className="rounded-2xl border border-navy-700 bg-navy-900/70 p-5 space-y-3">{children}</div>;
}

function ActionButton({ onClick, children, disabled, variant = "primary" }) {
  const styles =
    variant === "primary"
      ? "bg-accent hover:bg-accent-dark text-white"
      : "bg-navy-800 hover:bg-navy-700 text-slate-200 border border-navy-700";
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-full py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${styles}`}
    >
      {children}
    </button>
  );
}

function TextInput(props) {
  return (
    <input
      {...props}
      className="w-full bg-navy-800 border border-navy-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-accent"
    />
  );
}

function TextArea(props) {
  return (
    <textarea
      {...props}
      rows={3}
      className="w-full bg-navy-800 border border-navy-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-accent resize-none"
    />
  );
}

function RoleActions({ role, token, customerId, kase, ticket, onDone }) {
  if (role === "business_owner") return <OwnerActions token={token} customerId={customerId} kase={kase} onDone={onDone} />;
  if (role === "retention_manager") return <ManagerActions token={token} customerId={customerId} kase={kase} onDone={onDone} />;
  if (role === "retention_team") return <TeamActions token={token} customerId={customerId} kase={kase} onDone={onDone} />;
  if (role === "customer_support") return <SupportActions token={token} customerId={customerId} ticket={ticket} onDone={onDone} />;
  return null;
}

function OwnerActions({ token, customerId, kase, onDone }) {
  const [busy, setBusy] = useState(false);
  const alreadySent = !PRE_MANAGER_STATUSES.includes(kase.status);

  const handle = async () => {
    setBusy(true);
    try {
      await sendToManager(token, customerId);
      onDone("Sent to Retention Manager");
    } finally {
      setBusy(false);
    }
  };

  return (
    <ActionCard>
      <p className="text-slate-400 text-xs uppercase tracking-wide">Business Owner actions</p>
      <ActionButton onClick={handle} disabled={busy || alreadySent}>
        {alreadySent ? "Already sent to manager" : "Send to Retention Manager"}
      </ActionButton>
      <p className="text-slate-600 text-xs">
        Read-only otherwise — assignment, execution, and resolution happen downstream.
      </p>
    </ActionCard>
  );
}

function ManagerActions({ token, customerId, kase, onDone }) {
  const [busy, setBusy] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [escalateOpen, setEscalateOpen] = useState(false);
  const [assignee, setAssignee] = useState(kase.assignee || "Arjun Mehta");
  const [priority, setPriority] = useState(kase.priority || "normal");
  const [deadline, setDeadline] = useState(kase.deadline || "");
  const [notes, setNotes] = useState("");
  const [issue, setIssue] = useState("");

  const doAssign = async () => {
    setBusy(true);
    try {
      await assignCase(token, customerId, { assignee, priority, deadline: deadline || null, notes: notes || null });
      setAssignOpen(false);
      onDone(`Assigned to ${assignee}`);
    } finally {
      setBusy(false);
    }
  };

  const doEscalate = async () => {
    if (!issue.trim()) return;
    setBusy(true);
    try {
      await escalateSupport(token, customerId, { issue_description: issue, priority: "high" });
      setEscalateOpen(false);
      setIssue("");
      onDone("Escalated to Customer Support");
    } finally {
      setBusy(false);
    }
  };

  const bumpPriority = async (p) => {
    setBusy(true);
    try {
      await setCasePriority(token, customerId, p);
      setPriority(p);
      onDone(`Priority set to ${p}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <ActionCard>
      <p className="text-slate-400 text-xs uppercase tracking-wide">Retention Manager actions</p>

      {!assignOpen ? (
        <ActionButton onClick={() => setAssignOpen(true)} disabled={busy}>
          {kase.assignee ? "Reassign Customer" : "Assign Customer"}
        </ActionButton>
      ) : (
        <div className="space-y-2">
          <TextInput value={assignee} onChange={(e) => setAssignee(e.target.value)} placeholder="Assignee name" />
          <TextInput type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
          <TextArea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Instructions for the retention team (optional)" />
          <div className="flex gap-2">
            <ActionButton onClick={doAssign} disabled={busy || !assignee.trim()}>
              Confirm assignment
            </ActionButton>
            <ActionButton onClick={() => setAssignOpen(false)} variant="secondary">
              Cancel
            </ActionButton>
          </div>
        </div>
      )}

      {!escalateOpen ? (
        <ActionButton onClick={() => setEscalateOpen(true)} disabled={busy} variant="secondary">
          Escalate to Support
        </ActionButton>
      ) : (
        <div className="space-y-2">
          <TextArea value={issue} onChange={(e) => setIssue(e.target.value)} placeholder="Describe the service issue" />
          <div className="flex gap-2">
            <ActionButton onClick={doEscalate} disabled={busy || !issue.trim()}>
              Send to Support
            </ActionButton>
            <ActionButton onClick={() => setEscalateOpen(false)} variant="secondary">
              Cancel
            </ActionButton>
          </div>
        </div>
      )}

      <div>
        <p className="text-slate-500 text-xs mb-1">Set priority</p>
        <div className="flex gap-2">
          {["normal", "high", "urgent"].map((p) => (
            <button
              key={p}
              onClick={() => bumpPriority(p)}
              disabled={busy}
              className={`flex-1 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                priority === p ? "bg-accent text-white border-accent" : "bg-navy-800 text-slate-400 border-navy-700 hover:text-white"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>
    </ActionCard>
  );
}

function TeamActions({ token, customerId, kase, onDone }) {
  const [busy, setBusy] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const [supportOpen, setSupportOpen] = useState(false);
  const [notes, setNotes] = useState("");
  const [issue, setIssue] = useState("");
  const isTerminal = ["RETAINED", "STILL_AT_RISK", "CHURNED"].includes(kase.status);

  const doContact = async () => {
    setBusy(true);
    try {
      await contactCustomer(token, customerId, notes || null);
      setContactOpen(false);
      setNotes("");
      onDone("Customer contacted");
    } finally {
      setBusy(false);
    }
  };

  const doExecute = async () => {
    setBusy(true);
    try {
      await executeAction(token, customerId, null);
      onDone("Retention action executed");
    } finally {
      setBusy(false);
    }
  };

  const doSupport = async () => {
    if (!issue.trim()) return;
    setBusy(true);
    try {
      await escalateSupport(token, customerId, { issue_description: issue, priority: "high" });
      setSupportOpen(false);
      setIssue("");
      onDone("Requested Customer Support");
    } finally {
      setBusy(false);
    }
  };

  const doOutcome = async (outcome) => {
    setBusy(true);
    try {
      await markOutcome(token, customerId, outcome);
      onDone(`Marked as ${outcome.replace("_", " ").toLowerCase()}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <ActionCard>
      <p className="text-slate-400 text-xs uppercase tracking-wide">Retention Team actions</p>

      {!contactOpen ? (
        <ActionButton onClick={() => setContactOpen(true)} disabled={busy || isTerminal}>
          Contact Customer
        </ActionButton>
      ) : (
        <div className="space-y-2">
          <TextArea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="What did the customer say?" />
          <div className="flex gap-2">
            <ActionButton onClick={doContact} disabled={busy}>
              Log contact
            </ActionButton>
            <ActionButton onClick={() => setContactOpen(false)} variant="secondary">
              Cancel
            </ActionButton>
          </div>
        </div>
      )}

      <ActionButton onClick={doExecute} disabled={busy || isTerminal} variant="secondary">
        Execute Retention Action
      </ActionButton>

      {!supportOpen ? (
        <ActionButton onClick={() => setSupportOpen(true)} disabled={busy || isTerminal} variant="secondary">
          Request Customer Support
        </ActionButton>
      ) : (
        <div className="space-y-2">
          <TextArea value={issue} onChange={(e) => setIssue(e.target.value)} placeholder="Describe the service issue" />
          <div className="flex gap-2">
            <ActionButton onClick={doSupport} disabled={busy || !issue.trim()}>
              Send request
            </ActionButton>
            <ActionButton onClick={() => setSupportOpen(false)} variant="secondary">
              Cancel
            </ActionButton>
          </div>
        </div>
      )}

      <div>
        <p className="text-slate-500 text-xs mb-2">Mark retention outcome</p>
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => doOutcome("RETAINED")}
            disabled={busy}
            className="py-2 rounded-lg text-xs font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25 disabled:opacity-40"
          >
            Retained
          </button>
          <button
            onClick={() => doOutcome("STILL_AT_RISK")}
            disabled={busy}
            className="py-2 rounded-lg text-xs font-medium bg-amber-500/15 text-amber-400 border border-amber-500/30 hover:bg-amber-500/25 disabled:opacity-40"
          >
            Still at risk
          </button>
          <button
            onClick={() => doOutcome("CHURNED")}
            disabled={busy}
            className="py-2 rounded-lg text-xs font-medium bg-rose-500/15 text-rose-400 border border-rose-500/30 hover:bg-rose-500/25 disabled:opacity-40"
          >
            Churned
          </button>
        </div>
      </div>
    </ActionCard>
  );
}

function SupportActions({ token, customerId, ticket, onDone }) {
  const [busy, setBusy] = useState(false);
  const [resolveOpen, setResolveOpen] = useState(false);
  const [resolutionNotes, setResolutionNotes] = useState("");

  if (!ticket) {
    return (
      <ActionCard>
        <p className="text-slate-400 text-xs uppercase tracking-wide">Customer Support actions</p>
        <p className="text-slate-500 text-sm">No support ticket exists for this customer yet.</p>
      </ActionCard>
    );
  }

  const doStart = async () => {
    setBusy(true);
    try {
      await startTicket(token, ticket.id);
      onDone("Ticket marked in progress");
    } finally {
      setBusy(false);
    }
  };

  const doResolve = async () => {
    if (!resolutionNotes.trim()) return;
    setBusy(true);
    try {
      await resolveTicket(token, ticket.id, resolutionNotes);
      setResolveOpen(false);
      onDone("Ticket resolved and sent back to Retention Team");
    } finally {
      setBusy(false);
    }
  };

  return (
    <ActionCard>
      <p className="text-slate-400 text-xs uppercase tracking-wide">Customer Support actions</p>

      <ActionButton onClick={doStart} disabled={busy || ticket.status !== "OPEN"}>
        {ticket.status === "OPEN" ? "Update Ticket (start work)" : `Ticket ${ticket.status.toLowerCase()}`}
      </ActionButton>

      {!resolveOpen ? (
        <ActionButton onClick={() => setResolveOpen(true)} disabled={busy || ticket.status === "RESOLVED"} variant="secondary">
          Resolve Issue
        </ActionButton>
      ) : (
        <div className="space-y-2">
          <TextArea value={resolutionNotes} onChange={(e) => setResolutionNotes(e.target.value)} placeholder="Resolution notes" />
          <div className="flex gap-2">
            <ActionButton onClick={doResolve} disabled={busy}>
              Confirm resolution
            </ActionButton>
            <ActionButton onClick={() => setResolveOpen(false)} variant="secondary">
              Cancel
            </ActionButton>
          </div>
        </div>
      )}
    </ActionCard>
  );
}
