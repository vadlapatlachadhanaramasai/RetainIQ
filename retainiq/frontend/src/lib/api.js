const API_BASE = "http://localhost:8000";

async function handle(res) {
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Request failed (${res.status})`);
  }
  return res.json();
}

function authHeaders(token) {
  return { Authorization: `Bearer ${token}` };
}

async function getJson(token, path) {
  const res = await fetch(`${API_BASE}${path}`, { headers: authHeaders(token) });
  return handle(res);
}

async function postJson(token, path, body) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { ...authHeaders(token), "Content-Type": "application/json" },
    body: JSON.stringify(body ?? {}),
  });
  return handle(res);
}

// ---- auth ----

export async function login(email, password) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  return handle(res);
}

// ---- dataset ----

export async function fetchDemo(token, horizonMonths = 12) {
  const res = await fetch(`${API_BASE}/analyze/demo?horizon_months=${horizonMonths}`, {
    headers: authHeaders(token),
  });
  return handle(res);
}

export async function uploadCsv(token, file, horizonMonths = 12) {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch(`${API_BASE}/analyze?horizon_months=${horizonMonths}`, {
    method: "POST",
    headers: authHeaders(token),
    body: formData,
  });
  return handle(res);
}

// ---- cases (workflow) ----

export const getCases = (token) => getJson(token, "/cases");
export const getCaseDetail = (token, customerId) => getJson(token, `/cases/${customerId}`);

export const sendToManager = (token, customerId) =>
  postJson(token, `/cases/${customerId}/send-to-manager`);

export const assignCase = (token, customerId, payload) =>
  postJson(token, `/cases/${customerId}/assign`, payload);

export const escalateSupport = (token, customerId, payload) =>
  postJson(token, `/cases/${customerId}/escalate-support`, payload);

export const contactCustomer = (token, customerId, notes) =>
  postJson(token, `/cases/${customerId}/contact`, { notes });

export const executeAction = (token, customerId, notes) =>
  postJson(token, `/cases/${customerId}/execute-action`, { notes });

export const markOutcome = (token, customerId, outcome) =>
  postJson(token, `/cases/${customerId}/outcome`, { outcome });

export const addCaseNotes = (token, customerId, notes) =>
  postJson(token, `/cases/${customerId}/notes`, { notes });

export const setCasePriority = (token, customerId, priority) =>
  postJson(token, `/cases/${customerId}/priority`, { priority });

export const startTicket = (token, ticketId) => postJson(token, `/tickets/${ticketId}/start`);

export const resolveTicket = (token, ticketId, resolutionNotes) =>
  postJson(token, `/tickets/${ticketId}/resolve`, { resolution_notes: resolutionNotes });
