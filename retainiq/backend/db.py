"""SQLite persistence for retention cases, support tickets, and activity.

Everything else in this app (risk scores, drivers, actions) is recomputed
from the CSV + model each time — nothing about a customer's ML prediction
is stored here. This file only persists the human workflow layered on top:
who's working a case, what state it's in, and what happened when.

SQLite (not the CSV/in-memory approach used elsewhere) because case state
must survive across different role logins in the same demo session — a
Business Owner sending a case to a Manager has to still be there when the
Manager's browser loads it.
"""
import sqlite3
from contextlib import contextmanager
from datetime import datetime, timezone
from pathlib import Path

from workflow import DEFAULT_STATUS

DB_PATH = Path(__file__).resolve().parent / "retainiq.db"

SCHEMA = """
CREATE TABLE IF NOT EXISTS retention_cases (
    customer_id TEXT PRIMARY KEY,
    status TEXT NOT NULL DEFAULT 'AI_IDENTIFIED',
    priority TEXT DEFAULT 'normal',
    assignee TEXT,
    deadline TEXT,
    manager_notes TEXT,
    outcome TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS support_tickets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'OPEN',
    priority TEXT DEFAULT 'normal',
    issue_description TEXT,
    requested_by_role TEXT,
    requested_by_name TEXT,
    created_at TEXT NOT NULL,
    resolved_at TEXT,
    resolution_notes TEXT
);

CREATE TABLE IF NOT EXISTS activities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id TEXT NOT NULL,
    actor_role TEXT NOT NULL,
    actor_name TEXT NOT NULL,
    action TEXT NOT NULL,
    detail TEXT,
    created_at TEXT NOT NULL
);
"""


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


@contextmanager
def get_conn():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
        conn.commit()
    finally:
        conn.close()


def init_db():
    with get_conn() as conn:
        conn.executescript(SCHEMA)


# ---------------------------------------------------------------- cases ---

def get_case(customer_id: str) -> dict | None:
    with get_conn() as conn:
        row = conn.execute(
            "SELECT * FROM retention_cases WHERE customer_id = ?", (customer_id,)
        ).fetchone()
        return dict(row) if row else None


def ensure_case(customer_id: str) -> dict:
    existing = get_case(customer_id)
    if existing:
        return existing
    now = _now()
    with get_conn() as conn:
        conn.execute(
            "INSERT INTO retention_cases (customer_id, status, created_at, updated_at) VALUES (?, ?, ?, ?)",
            (customer_id, DEFAULT_STATUS, now, now),
        )
    return get_case(customer_id)


def update_case(customer_id: str, **fields) -> dict:
    ensure_case(customer_id)
    fields["updated_at"] = _now()
    set_clause = ", ".join(f"{k} = ?" for k in fields)
    with get_conn() as conn:
        conn.execute(
            f"UPDATE retention_cases SET {set_clause} WHERE customer_id = ?",
            (*fields.values(), customer_id),
        )
    return get_case(customer_id)


def list_cases() -> list[dict]:
    with get_conn() as conn:
        rows = conn.execute("SELECT * FROM retention_cases").fetchall()
        return [dict(r) for r in rows]


# --------------------------------------------------------------- tickets ---

def create_ticket(customer_id: str, issue_description: str, priority: str, requested_by_role: str, requested_by_name: str) -> dict:
    now = _now()
    with get_conn() as conn:
        cur = conn.execute(
            """INSERT INTO support_tickets
               (customer_id, status, priority, issue_description, requested_by_role, requested_by_name, created_at)
               VALUES (?, 'OPEN', ?, ?, ?, ?, ?)""",
            (customer_id, priority, issue_description, requested_by_role, requested_by_name, now),
        )
        ticket_id = cur.lastrowid
    return get_ticket(ticket_id)


def get_ticket(ticket_id: int) -> dict | None:
    with get_conn() as conn:
        row = conn.execute("SELECT * FROM support_tickets WHERE id = ?", (ticket_id,)).fetchone()
        return dict(row) if row else None


def get_latest_ticket_for_case(customer_id: str) -> dict | None:
    with get_conn() as conn:
        row = conn.execute(
            "SELECT * FROM support_tickets WHERE customer_id = ? ORDER BY id DESC LIMIT 1",
            (customer_id,),
        ).fetchone()
        return dict(row) if row else None


def update_ticket(ticket_id: int, **fields) -> dict:
    set_clause = ", ".join(f"{k} = ?" for k in fields)
    with get_conn() as conn:
        conn.execute(
            f"UPDATE support_tickets SET {set_clause} WHERE id = ?",
            (*fields.values(), ticket_id),
        )
    return get_ticket(ticket_id)


def list_tickets() -> list[dict]:
    with get_conn() as conn:
        rows = conn.execute("SELECT * FROM support_tickets ORDER BY id DESC").fetchall()
        return [dict(r) for r in rows]


# ------------------------------------------------------------ activities ---

def log_activity(customer_id: str, actor_role: str, actor_name: str, action: str, detail: str = None) -> dict:
    now = _now()
    with get_conn() as conn:
        cur = conn.execute(
            """INSERT INTO activities (customer_id, actor_role, actor_name, action, detail, created_at)
               VALUES (?, ?, ?, ?, ?, ?)""",
            (customer_id, actor_role, actor_name, action, detail, now),
        )
        activity_id = cur.lastrowid
        row = conn.execute("SELECT * FROM activities WHERE id = ?", (activity_id,)).fetchone()
        return dict(row)


def get_activities(customer_id: str) -> list[dict]:
    with get_conn() as conn:
        rows = conn.execute(
            "SELECT * FROM activities WHERE customer_id = ? ORDER BY id ASC", (customer_id,)
        ).fetchall()
        return [dict(r) for r in rows]
