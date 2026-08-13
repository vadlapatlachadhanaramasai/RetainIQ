export const ROLE_LABELS = {
  business_owner: "Business Owner",
  retention_manager: "Retention Manager",
  retention_team: "Retention Team",
  customer_support: "Customer Support",
};

export const QUICK_LOGINS = [
  { email: "manager@retainiq.demo", password: "Manager@123", role: "retention_manager" },
  { email: "team@retainiq.demo", password: "Team@123", role: "retention_team" },
  { email: "support@retainiq.demo", password: "Support@123", role: "customer_support" },
  { email: "owner@retainiq.demo", password: "Owner@123", role: "business_owner" },
];

export const ROLE_BASE_PATH = {
  business_owner: "/business-owner",
  retention_manager: "/retention-manager",
  retention_team: "/retention-team",
  customer_support: "/customer-support",
};

export function roleHomePath(role) {
  return `${ROLE_BASE_PATH[role]}/dashboard`;
}

// Sidebar nav per role: [path segment (relative to the role's base path), label]
export const NAV_ITEMS = {
  business_owner: [
    ["dashboard", "Dashboard"],
    ["customers-at-risk", "Customers at Risk"],
    ["revenue-impact", "Revenue Impact"],
    ["retention-analytics", "Retention Analytics"],
    ["team-overview", "Team Overview"],
    ["reports", "Reports"],
  ],
  retention_manager: [
    ["dashboard", "Dashboard"],
    ["at-risk", "At-Risk Customers"],
    ["my-team", "My Team"],
    ["assignments", "Assignments"],
    ["cases", "Retention Cases"],
    ["support-escalations", "Support Escalations"],
    ["analytics", "Analytics"],
  ],
  retention_team: [
    ["dashboard", "My Dashboard"],
    ["my-customers", "My Customers"],
    ["my-tasks", "My Tasks"],
    ["support-requests", "Support Requests"],
    ["activity", "Activity History"],
  ],
  customer_support: [
    ["dashboard", "Support Dashboard"],
    ["tickets", "My Tickets"],
    ["high-priority", "High Priority"],
    ["resolved", "Resolved Cases"],
    ["history", "Support History"],
  ],
};

export function canUpload(role) {
  return role === "retention_manager";
}

export function canSetHorizon(role) {
  return role === "retention_manager";
}
