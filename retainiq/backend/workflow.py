"""Single source of truth for retention-case workflow statuses.

Every status string used anywhere in the backend or API responses must come
from this module — no component invents its own status label.
"""

STATUSES = (
    "AI_IDENTIFIED",
    "NEEDS_REVIEW",
    "SENT_TO_MANAGER",
    "ASSIGNED",
    "IN_PROGRESS",
    "SUPPORT_REQUIRED",
    "SUPPORT_IN_PROGRESS",
    "SUPPORT_RESOLVED",
    "CUSTOMER_CONTACTED",
    "RETAINED",
    "STILL_AT_RISK",
    "CHURNED",
)

TERMINAL_STATUSES = ("RETAINED", "STILL_AT_RISK", "CHURNED")

# Status a customer implicitly has when the ML pipeline has scored them but
# no human has touched the case yet (no row exists in retention_cases).
DEFAULT_STATUS = "AI_IDENTIFIED"

TICKET_STATUSES = ("OPEN", "IN_PROGRESS", "RESOLVED")

STATUS_LABELS = {
    "AI_IDENTIFIED": "AI identified",
    "NEEDS_REVIEW": "Needs review",
    "SENT_TO_MANAGER": "Sent to manager",
    "ASSIGNED": "Assigned",
    "IN_PROGRESS": "In progress",
    "SUPPORT_REQUIRED": "Support required",
    "SUPPORT_IN_PROGRESS": "Support in progress",
    "SUPPORT_RESOLVED": "Support resolved",
    "CUSTOMER_CONTACTED": "Customer contacted",
    "RETAINED": "Retained",
    "STILL_AT_RISK": "Still at risk",
    "CHURNED": "Churned",
}
