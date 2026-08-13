# RetainIQ

Predicts which subscription customers are likely to churn, explains why,
recommends a retention action, and prices that action in rupees — then
routes each at-risk customer through a real retention **workflow**:
Business Owner → Retention Manager → Retention Team → Customer Support (when
needed) → back to Retention Team → outcome. Every step is a persisted case
transition with a role-specific action, not a shared table with rows hidden.

## Stack

- Backend: Python 3.11, FastAPI, pandas, scikit-learn, XGBoost (TreeSHAP via
  `pred_contribs`, no `shap` dependency), SQLite (workflow/case state only —
  see [Architecture note](#architecture-note-why-sqlite))
- Frontend: React + Vite + Tailwind CSS + React Router + Recharts
- No Docker, no paid services. Auth is JWT-based with a hardcoded demo user
  list (see [Authentication & roles](#authentication--roles)).

## Repo structure

```
retainiq/
├── backend/
│   ├── main.py             FastAPI app, CORS, /auth, /analyze
│   ├── pipeline.py         preprocess -> predict -> explain
│   ├── actions.py          driver -> action lookup table
│   ├── economics.py        revenue at risk, action cost, net value
│   ├── make_dataset.py     generates data/demo_customers.csv (run once)
│   ├── train.py            trains and saves model.pkl (run once, offline)
│   ├── model.pkl           committed artifact
│   ├── auth.py             JWT login, demo users, get_current_user/require_roles
│   ├── security.py         PII (name) field-level encryption
│   ├── workflow.py         the one status-name vocabulary, used everywhere
│   ├── db.py                SQLite persistence: retention_cases, support_tickets, activities
│   ├── customer_cache.py   in-memory cache of the last analyzed dataset
│   ├── cases.py            case-workflow API (assign/escalate/contact/resolve/...)
│   └── requirements.txt
├── frontend/src/
│   ├── lib/                api client, AppContext (auth/dataset state), workflow.js, roles.js, aggregates.js
│   ├── components/         Sidebar, AppShell, ProtectedRoute, CaseListTable, StatusBadge,
│   │                       ActivityTimeline, SupportTicketList, LoginScreen, UploadScreen
│   └── pages/
│       ├── CustomerDetailPage.jsx   shared across all 4 roles, role-specific action buttons
│       ├── owner/           Dashboard, Customers at Risk, Revenue Impact, Retention
│       │                    Analytics, Team Overview, Reports
│       ├── manager/         Dashboard, At-Risk Customers, My Team, Assignments,
│       │                    Retention Cases, Support Escalations, Analytics
│       ├── team/            My Dashboard, My Customers, My Tasks, Support Requests,
│       │                    Activity History
│       └── support/         Support Dashboard, My Tickets, High Priority, Resolved
│                            Cases, Support History
└── data/demo_customers.csv
```

## Backend — setup and run

Requires Python 3.11 (on Windows, `py -3.11` if you have multiple versions
installed via the `py` launcher).

```bash
cd backend
py -3.11 -m venv .venv
./.venv/Scripts/pip install -r requirements.txt   # Windows
# source .venv/bin/activate && pip install -r requirements.txt   # macOS/Linux

# one-time: generate data + train the model (skip if model.pkl already committed)
./.venv/Scripts/python make_dataset.py
./.venv/Scripts/python train.py

# run the API
./.venv/Scripts/python -m uvicorn main:app --reload --port 8000
```

The API is now at `http://localhost:8000`. Every endpoint below except
`/auth/login` requires an `Authorization: Bearer <token>` header — see
[Authentication & roles](#authentication--roles) for how to get one.

**Data ingestion**
- `POST /auth/login` — `{ "email": ..., "password": ... }` → `access_token` + role
- `GET  /analyze/demo?horizon_months=12` — analyze the bundled demo dataset (any role)
- `POST /analyze?horizon_months=12` — analyze an uploaded CSV — **retention_manager only**

Both populate an in-memory cache of the full customer list, which is what
every case-workflow endpoint below reads from.

**Case workflow** (see [`workflow.py`](backend/workflow.py) for the full status list)
- `GET  /cases` — role-scoped list (Owner/Manager: everyone; Team: only assigned cases; Support: only cases with a ticket)
- `GET  /cases/{id}` — customer + case + ticket + activity timeline
- `POST /cases/{id}/send-to-manager` — **Business Owner**
- `POST /cases/{id}/assign`, `/notes`, `/priority` — **Retention Manager**
- `POST /cases/{id}/escalate-support` — **Manager or Team**
- `POST /cases/{id}/contact`, `/execute-action`, `/outcome` — **Retention Team**
- `POST /tickets/{id}/start`, `/resolve` — **Customer Support**

Quick check:

```bash
TOKEN=$(curl -s -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"manager@retainiq.demo","password":"Manager@123"}' \
  | python -c "import sys,json;print(json.load(sys.stdin)['access_token'])")

curl http://localhost:8000/analyze/demo -H "Authorization: Bearer $TOKEN"
curl http://localhost:8000/cases -H "Authorization: Bearer $TOKEN"
```

## Frontend — setup and run

Requires Node.js.

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`, log in, click **Load demo data** (or drop a
CSV — see column requirements in the upload screen). You land on your
role's own routed section (`/business-owner/...`, `/retention-manager/...`,
`/retention-team/...`, `/customer-support/...`) with its own sidebar. Typing
another role's URL redirects you back to your own dashboard — this is
enforced by `ProtectedRoute`, not just hidden nav links.

## Authentication & roles

Login is JWT-based (`backend/auth.py`). There's no signup flow and no user
database — four demo accounts are hardcoded, one per business role, with
bcrypt-hashed passwords. The login screen has one-click buttons for all
four, useful for demoing role differences without retyping credentials.

| Email | Password | Role |
|---|---|---|
| `manager@retainiq.demo` | `Manager@123` | Retention Manager |
| `team@retainiq.demo` | `Team@123` | Retention Team |
| `support@retainiq.demo` | `Support@123` | Customer Support |
| `owner@retainiq.demo` | `Owner@123` | Business Owner |

## The demo workflow (Ravi)

`data/demo_customers.csv` includes one deterministic customer — **Ravi
Shankar** (`CUST00000`) — engineered to land at ~88% predicted risk (close
to the illustrative 92% in the original scenario) with exactly the three
target drivers: support complaints, a sharp usage drop, and a
month-to-month contract. His probability is still 100% model output, not
hardcoded — only his input feature values (complaints, usage trend,
contract type, tenure, charges) are fixed. Click through the full loop to
demo it:

1. **Business Owner** → Customers at Risk → find Ravi → *Send to Retention Manager*
2. **Retention Manager** → open Ravi → *Assign Customer* (to "Arjun Mehta")
3. **Retention Team** → My Customers → open Ravi → *Contact Customer*, then *Request Customer Support*
4. **Customer Support** → My Tickets → open Ravi → *Update Ticket*, then *Resolve Issue*
5. **Retention Team** → open Ravi → mark outcome *Retained*
6. **Retention Manager** / **Business Owner** → open Ravi → see the complete, correctly-ordered activity timeline; Owner's Retention Analytics page reflects the new outcome

## Architecture note: why SQLite

The original build had "no database" — every response was recomputed from
the CSV per request, no state persisted. That works for a single sortable
table, but a real workflow ("Owner sends a case → a *different login*, the
Manager, must see it") is inherently cross-session, so it needs a shared
server-side store. SQLite (`backend/retainiq.db`, gitignored) holds exactly
three tables — `retention_cases`, `support_tickets`, `activities` — and
nothing else. Customer risk data itself is never persisted; it's
recomputed from the CSV + model on every `/analyze` call and cached
in-memory (`customer_cache.py`), consistent with the "ML predictions are
generated, not stored/edited" rule.

## Notes

- All churn probabilities and revenue figures are model **estimates**, never
  guarantees — reflected throughout the UI copy.
- The Retention Manager's **At-Risk Customers** page keeps the original
  build's centerpiece feature: an editable horizon (months) input and a Net
  value / Risk score / Revenue sort toggle, both instant and client-side —
  no refetch. Every other role sees a fixed 12-month horizon.
- Regenerating `data/demo_customers.csv` and retraining will change
  `model.pkl`; re-run `train.py` after `make_dataset.py` if you touch either.
  Ravi's row is appended deterministically inside `make_dataset.py`.

## PII handling

`name` is encrypted (`backend/security.py`, Fernet/AES) the instant a CSV
enters `analyze_dataframe`, before the dataframe is touched by any
feature-encoding or model code. The XGBoost model's feature matrix never
includes `name` at all — even if that changed, it would only ever see
ciphertext, since encryption happens first. Decryption happens exactly once,
when the response is built. The model never runs through a third-party AI
API, so customer data never leaves the machine RetainIQ runs on.

## Known limitations

- **Single shared login per role**, not per-employee accounts — "Assign
  Customer" takes a free-text assignee name (defaults to "Arjun Mehta") for
  realism, but only one Retention Team account actually exists, so it's the
  one that sees the case regardless of the name typed.
- **No SLA/deadline enforcement** — a deadline field exists on a case, but
  nothing alerts on it beyond the Team Dashboard's "Due today"/"Overdue"
  counts.
- **In-memory dataset cache** — if the backend process restarts, you need to
  hit "Load demo data" / re-upload again before case pages will resolve
  customer data (the case/activity history in SQLite is untouched).
