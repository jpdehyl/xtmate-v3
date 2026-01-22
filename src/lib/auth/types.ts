/**
 * RBAC Type Definitions for XtMate
 *
 * Defines 7 internal roles and comprehensive permission system
 * for property restoration claims processing.
 */

// ============================================================================
// ROLE DEFINITIONS
// ============================================================================

export const ROLES = {
  ADMIN: "admin",
  GENERAL_MANAGER: "general_manager",
  QA_MANAGER: "qa_manager",
  ESTIMATOR: "estimator",
  PM: "pm",
  PROJECT_ADMIN: "project_admin",
  FIELD_STAFF: "field_staff",
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

/**
 * Role hierarchy levels (higher number = more authority)
 * Used for comparing role levels and determining access
 */
export const ROLE_LEVELS: Record<Role, number> = {
  admin: 100,
  general_manager: 90,
  qa_manager: 80,
  estimator: 70,
  pm: 70,
  project_admin: 60,
  field_staff: 50,
};

/**
 * Human-readable role labels for UI display
 */
export const ROLE_LABELS: Record<Role, string> = {
  admin: "Admin",
  general_manager: "General Manager",
  qa_manager: "QA Manager",
  estimator: "Estimator",
  pm: "Project Manager",
  project_admin: "Project Administrator",
  field_staff: "Field Staff",
};

/**
 * Role descriptions for tooltips and help text
 */
export const ROLE_DESCRIPTIONS: Record<Role, string> = {
  admin:
    "Full organization access including billing, API keys, and user management",
  general_manager:
    "All data read access, team metrics, analytics (no backend changes)",
  qa_manager: "Review queue management, approve/reject estimates, SLA tracking",
  estimator: "Create/edit estimates, line items, price lists, export to ESX",
  pm: "Field work, LiDAR capture, photos, damage annotation, vendor dispatch",
  project_admin: "Documentation, invoicing support, limited estimate edits",
  field_staff:
    "View assigned work orders only, time tracking, task completion",
};

// ============================================================================
// PERMISSION DEFINITIONS
// ============================================================================

export const PERMISSIONS = {
  // Estimates
  ESTIMATES_CREATE: "estimates.create",
  ESTIMATES_READ_OWN: "estimates.read_own",
  ESTIMATES_READ_ASSIGNED: "estimates.read_assigned",
  ESTIMATES_READ_TEAM: "estimates.read_team",
  ESTIMATES_UPDATE_OWN: "estimates.update_own",
  ESTIMATES_UPDATE_ANY: "estimates.update_any",
  ESTIMATES_UPDATE_LIMITED: "estimates.update_limited",
  ESTIMATES_DELETE_OWN: "estimates.delete_own",
  ESTIMATES_DELETE_ANY: "estimates.delete_any",
  ESTIMATES_APPROVE: "estimates.approve",
  ESTIMATES_REJECT: "estimates.reject",
  ESTIMATES_EXPORT: "estimates.export",
  ESTIMATES_ASSIGN_TEAM: "estimates.assign_team",

  // Rooms
  ROOMS_CREATE: "rooms.create",
  ROOMS_READ: "rooms.read",
  ROOMS_UPDATE: "rooms.update",
  ROOMS_DELETE: "rooms.delete",
  ROOMS_CAPTURE_LIDAR: "rooms.capture_lidar",

  // Line Items
  LINE_ITEMS_CREATE: "line_items.create",
  LINE_ITEMS_READ: "line_items.read",
  LINE_ITEMS_UPDATE: "line_items.update",
  LINE_ITEMS_DELETE: "line_items.delete",
  LINE_ITEMS_VERIFY: "line_items.verify",
  LINE_ITEMS_AI_GENERATE: "line_items.ai_generate",

  // Photos
  PHOTOS_UPLOAD: "photos.upload",
  PHOTOS_READ: "photos.read",
  PHOTOS_ANNOTATE: "photos.annotate",
  PHOTOS_DELETE: "photos.delete",

  // Annotations
  ANNOTATIONS_CREATE: "annotations.create",
  ANNOTATIONS_READ: "annotations.read",
  ANNOTATIONS_UPDATE: "annotations.update",
  ANNOTATIONS_DELETE: "annotations.delete",

  // Documents
  DOCUMENTS_UPLOAD: "documents.upload",
  DOCUMENTS_READ: "documents.read",
  DOCUMENTS_DELETE: "documents.delete",

  // Analytics
  ANALYTICS_VIEW_OWN: "analytics.view_own",
  ANALYTICS_VIEW_TEAM: "analytics.view_team",
  ANALYTICS_VIEW_REVENUE: "analytics.view_revenue",
  ANALYTICS_EXPORT: "analytics.export",

  // Work Orders
  WORK_ORDERS_CREATE: "work_orders.create",
  WORK_ORDERS_READ_OWN: "work_orders.read_own",
  WORK_ORDERS_READ_TEAM: "work_orders.read_team",
  WORK_ORDERS_UPDATE_OWN: "work_orders.update_own",
  WORK_ORDERS_UPDATE_ANY: "work_orders.update_any",
  WORK_ORDERS_ASSIGN: "work_orders.assign",
  WORK_ORDERS_CLOCK: "work_orders.clock",
  WORK_ORDERS_COMPLETE: "work_orders.complete",

  // Vendors
  VENDORS_VIEW: "vendors.view",
  VENDORS_CREATE: "vendors.create",
  VENDORS_UPDATE: "vendors.update",
  VENDORS_DELETE: "vendors.delete",
  VENDORS_INVITE: "vendors.invite",
  VENDORS_REQUEST_QUOTES: "vendors.request_quotes",

  // QA
  QA_VIEW_QUEUE: "qa.view_queue",
  QA_APPROVE: "qa.approve",
  QA_REJECT: "qa.reject",
  QA_VIEW_SCORECARDS: "qa.view_scorecards",
  QA_MANAGE_SLA: "qa.manage_sla",

  // Settings
  SETTINGS_VIEW: "settings.view",
  SETTINGS_MANAGE_PRICE_LISTS: "settings.manage_price_lists",
  SETTINGS_MANAGE_CARRIERS: "settings.manage_carriers",
  SETTINGS_MANAGE_USERS: "settings.manage_users",
  SETTINGS_MANAGE_ROLES: "settings.manage_roles",
  SETTINGS_MANAGE_ORG: "settings.manage_org",
  SETTINGS_MANAGE_BILLING: "settings.manage_billing",
  SETTINGS_MANAGE_INTEGRATIONS: "settings.manage_integrations",

  // Preliminary Reports
  PRELIMINARY_REPORTS_CREATE: "preliminary_reports.create",
  PRELIMINARY_REPORTS_READ: "preliminary_reports.read",
  PRELIMINARY_REPORTS_UPDATE: "preliminary_reports.update",
  PRELIMINARY_REPORTS_SUBMIT: "preliminary_reports.submit",
  PRELIMINARY_REPORTS_EXPORT_PDF: "preliminary_reports.export_pdf",
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

// ============================================================================
// AUTH CONTEXT
// ============================================================================

/**
 * User context after authentication and authorization
 * Contains all information needed to make access control decisions
 */
export interface AuthContext {
  /** Clerk user ID */
  userId: string;

  /** Organization the user belongs to */
  organizationId: string;

  /** User's role within the organization */
  role: Role;

  /** Effective permissions (role defaults + any custom overrides) */
  permissions: Permission[];

  /** User's display name for UI/logging */
  displayName?: string;

  /** User's email for UI/logging */
  email?: string;
}

/**
 * Result type for authorization checks
 */
export type AuthResult =
  | { authorized: true; context: AuthContext }
  | { authorized: false; error: string; status: 401 | 403 };

/**
 * Estimate access levels for granular control
 */
export type EstimateAccessLevel = "owner" | "assigned" | "team" | "none";

/**
 * Fields that can be updated with limited permissions
 */
export const LIMITED_UPDATE_FIELDS = [
  "notes",
  "insuredName",
  "insuredPhone",
  "insuredEmail",
  "adjusterName",
  "adjusterPhone",
  "adjusterEmail",
  "status",
] as const;

export type LimitedUpdateField = (typeof LIMITED_UPDATE_FIELDS)[number];
