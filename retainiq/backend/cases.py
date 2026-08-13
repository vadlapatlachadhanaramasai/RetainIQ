"""Retention-case workflow API: the human layer on top of the ML predictions.

Every endpoint here does exactly one named state transition (never a
free-form "set status to X" from the frontend) so the status set stays
closed and consistent — see workflow.py for the single source of truth on
status names.
"""
from datetime import datetime, timezone
from typing import Literal, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

import db
import customer_cache
from auth import get_current_user, require_roles
from workflow import DEFAULT_STATUS

router = APIRouter()


class AssignRequest(BaseModel):
    assignee: str
    priority: str = "normal"
    deadline: Optional[str] = None
    notes: Optional[str] = None


class EscalateRequest(BaseModel):
    issue_description: str
    priority: str = "normal"


class NoteRequest(BaseModel):
    notes: str


class ContactRequest(BaseModel):
    notes: Optional[str] = None


class OutcomeRequest(BaseModel):
    outcome: Literal["RETAINED", "STILL_AT_RISK", "CHURNED"]


class PriorityRequest(BaseModel):
    priority: str


class ResolveRequest(BaseModel):
    resolution_notes: str


def _log(customer_id: str, user: dict, action: str, detail: str = None):
    db.log_activity(customer_id, user["role"], user["display_name"], action, detail)


def _get_customer_or_404(customer_id: str) -> dict:
    customer = customer_cache.get_customer(customer_id)
    if customer is None:
        raise HTTPException(status_code=404, detail="Customer not found in the currently loaded dataset")
    return customer


def _case_view(customer_id: str) -> dict:
    case = db.get_case(customer_id)
    if case is not None:
        return case
    return {
        "customer_id": customer_id,
        "status": DEFAULT_STATUS,
        "priority": "normal",
        "assignee": None,
        "deadline": None,
        "manager_notes": None,
        "outcome": None,
        "created_at": None,
        "updated_at": None,
    }


_UNASSIGNED_STATUSES = ("AI_IDENTIFIED", "NEEDS_REVIEW", "SENT_TO_MANAGER")


def _check_visibility(user: dict, case: dict, ticket: dict):
    role = user["role"]
    if role in ("business_owner", "retention_manager"):
        return
    if role == "retention_team":
        if case["status"] in _UNASSIGNED_STATUSES:
            raise HTTPException(status_code=403, detail="This case hasn't been assigned to the retention team yet")
        return
    if role == "customer_support":
        if ticket is None:
            raise HTTPException(status_code=403, detail="No support ticket exists for this customer")
        return


@router.get("/cases")
def list_cases(user: dict = Depends(get_current_user)):
    role = user["role"]
    customers = customer_cache.all_customers()

    latest_ticket_by_customer = {}
    for t in db.list_tickets():  # ordered newest-first
        latest_ticket_by_customer.setdefault(t["customer_id"], t)

    results = []
    for c in customers:
        case = _case_view(c["id"])
        ticket = latest_ticket_by_customer.get(c["id"])

        if role == "retention_team" and case["status"] in _UNASSIGNED_STATUSES:
            continue
        if role == "customer_support" and ticket is None:
            continue

        results.append({"customer": c, "case": case, "ticket": ticket})

    return {"cases": results}


@router.get("/cases/{customer_id}")
def get_case_detail(customer_id: str, user: dict = Depends(get_current_user)):
    customer = _get_customer_or_404(customer_id)
    case = _case_view(customer_id)
    ticket = db.get_latest_ticket_for_case(customer_id)
    _check_visibility(user, case, ticket)
    activities = db.get_activities(customer_id)
    return {"customer": customer, "case": case, "ticket": ticket, "activities": activities}


@router.post("/cases/{customer_id}/send-to-manager")
def send_to_manager(customer_id: str, user: dict = Depends(require_roles("business_owner"))):
    _get_customer_or_404(customer_id)
    case = db.update_case(customer_id, status="SENT_TO_MANAGER")
    _log(customer_id, user, "Sent to Retention Manager", "Escalated for manager review")
    return case


@router.post("/cases/{customer_id}/assign")
def assign_case(customer_id: str, payload: AssignRequest, user: dict = Depends(require_roles("retention_manager"))):
    _get_customer_or_404(customer_id)
    existing = db.get_case(customer_id)
    reassigning = existing is not None and existing["status"] not in _UNASSIGNED_STATUSES

    case = db.update_case(
        customer_id,
        status="ASSIGNED",
        assignee=payload.assignee,
        priority=payload.priority,
        deadline=payload.deadline,
        manager_notes=payload.notes,
    )
    label = "Reassigned to Retention Team" if reassigning else "Assigned to Retention Team"
    detail = f"Assigned to {payload.assignee}" + (f" — {payload.notes}" if payload.notes else "")
    _log(customer_id, user, label, detail)
    return case


@router.post("/cases/{customer_id}/escalate-support")
def escalate_support(
    customer_id: str,
    payload: EscalateRequest,
    user: dict = Depends(require_roles("retention_manager", "retention_team")),
):
    _get_customer_or_404(customer_id)
    ticket = db.create_ticket(customer_id, payload.issue_description, payload.priority, user["role"], user["display_name"])
    case = db.update_case(customer_id, status="SUPPORT_REQUIRED")
    label = "Escalated to Customer Support" if user["role"] == "retention_manager" else "Requested Customer Support"
    _log(customer_id, user, label, payload.issue_description)
    return {"case": case, "ticket": ticket}


@router.post("/cases/{customer_id}/contact")
def contact_customer(customer_id: str, payload: ContactRequest, user: dict = Depends(require_roles("retention_team"))):
    _get_customer_or_404(customer_id)
    case = db.update_case(customer_id, status="CUSTOMER_CONTACTED")
    _log(customer_id, user, "Contacted customer", payload.notes)
    return case


@router.post("/cases/{customer_id}/execute-action")
def execute_action(customer_id: str, payload: ContactRequest, user: dict = Depends(require_roles("retention_team"))):
    _get_customer_or_404(customer_id)
    case = db.update_case(customer_id, status="IN_PROGRESS")
    _log(customer_id, user, "Executed retention action", payload.notes)
    return case


@router.post("/cases/{customer_id}/outcome")
def mark_outcome(customer_id: str, payload: OutcomeRequest, user: dict = Depends(require_roles("retention_team"))):
    _get_customer_or_404(customer_id)
    case = db.update_case(customer_id, status=payload.outcome, outcome=payload.outcome)
    _log(customer_id, user, f"Marked outcome: {payload.outcome.replace('_', ' ').title()}")
    return case


@router.post("/cases/{customer_id}/notes")
def add_notes(customer_id: str, payload: NoteRequest, user: dict = Depends(require_roles("retention_manager"))):
    _get_customer_or_404(customer_id)
    case = db.update_case(customer_id, manager_notes=payload.notes)
    _log(customer_id, user, "Added note", payload.notes)
    return case


@router.post("/cases/{customer_id}/priority")
def set_priority(customer_id: str, payload: PriorityRequest, user: dict = Depends(require_roles("retention_manager"))):
    _get_customer_or_404(customer_id)
    case = db.update_case(customer_id, priority=payload.priority)
    _log(customer_id, user, f"Priority set to {payload.priority}")
    return case


@router.post("/tickets/{ticket_id}/start")
def start_ticket(ticket_id: int, user: dict = Depends(require_roles("customer_support"))):
    ticket = db.get_ticket(ticket_id)
    if ticket is None:
        raise HTTPException(status_code=404, detail="Ticket not found")
    ticket = db.update_ticket(ticket_id, status="IN_PROGRESS")
    case = db.update_case(ticket["customer_id"], status="SUPPORT_IN_PROGRESS")
    _log(ticket["customer_id"], user, "Support started working the ticket")
    return {"case": case, "ticket": ticket}


@router.post("/tickets/{ticket_id}/resolve")
def resolve_ticket(ticket_id: int, payload: ResolveRequest, user: dict = Depends(require_roles("customer_support"))):
    ticket = db.get_ticket(ticket_id)
    if ticket is None:
        raise HTTPException(status_code=404, detail="Ticket not found")
    ticket = db.update_ticket(
        ticket_id,
        status="RESOLVED",
        resolution_notes=payload.resolution_notes,
        resolved_at=datetime.now(timezone.utc).isoformat(),
    )
    case = db.update_case(ticket["customer_id"], status="SUPPORT_RESOLVED")
    _log(ticket["customer_id"], user, "Resolved support ticket", payload.resolution_notes)
    return {"case": case, "ticket": ticket}
