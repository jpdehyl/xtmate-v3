/**
 * Role-Permission Mapping for XtMate RBAC
 *
 * Defines which permissions each role has access to.
 * This is the source of truth for authorization decisions.
 */

import { Role, Permission, PERMISSIONS, ROLE_LEVELS } from "./types";

// ============================================================================
// ROLE-PERMISSION MAPPINGS
// ============================================================================

/**
 * Complete permission set for each role
 * Roles inherit nothing - each role's permissions are explicitly defined
 */
export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  // Admin has ALL permissions
  admin: Object.values(PERMISSIONS),

  // General Manager - all read access, team management, analytics
  general_manager: [
    // Estimates - full read, update any, approve/reject
    PERMISSIONS.ESTIMATES_READ_OWN,
    PERMISSIONS.ESTIMATES_READ_ASSIGNED,
    PERMISSIONS.ESTIMATES_READ_TEAM,
    PERMISSIONS.ESTIMATES_UPDATE_OWN,
    PERMISSIONS.ESTIMATES_UPDATE_ANY,
    PERMISSIONS.ESTIMATES_UPDATE_LIMITED,
    PERMISSIONS.ESTIMATES_APPROVE,
    PERMISSIONS.ESTIMATES_REJECT,
    PERMISSIONS.ESTIMATES_EXPORT,
    PERMISSIONS.ESTIMATES_ASSIGN_TEAM,

    // Rooms - read only
    PERMISSIONS.ROOMS_READ,

    // Line Items - read and verify
    PERMISSIONS.LINE_ITEMS_READ,
    PERMISSIONS.LINE_ITEMS_VERIFY,

    // Photos - read only
    PERMISSIONS.PHOTOS_READ,

    // Annotations - read only
    PERMISSIONS.ANNOTATIONS_READ,

    // Documents - upload and read
    PERMISSIONS.DOCUMENTS_UPLOAD,
    PERMISSIONS.DOCUMENTS_READ,

    // Analytics - full access
    PERMISSIONS.ANALYTICS_VIEW_OWN,
    PERMISSIONS.ANALYTICS_VIEW_TEAM,
    PERMISSIONS.ANALYTICS_VIEW_REVENUE,
    PERMISSIONS.ANALYTICS_EXPORT,

    // Work Orders - read all, create, assign
    PERMISSIONS.WORK_ORDERS_CREATE,
    PERMISSIONS.WORK_ORDERS_READ_OWN,
    PERMISSIONS.WORK_ORDERS_READ_TEAM,
    PERMISSIONS.WORK_ORDERS_UPDATE_OWN,
    PERMISSIONS.WORK_ORDERS_UPDATE_ANY,
    PERMISSIONS.WORK_ORDERS_ASSIGN,
    PERMISSIONS.WORK_ORDERS_CLOCK,

    // Vendors - view, create, update, invite
    PERMISSIONS.VENDORS_VIEW,
    PERMISSIONS.VENDORS_CREATE,
    PERMISSIONS.VENDORS_UPDATE,
    PERMISSIONS.VENDORS_INVITE,
    PERMISSIONS.VENDORS_REQUEST_QUOTES,

    // QA - full queue access
    PERMISSIONS.QA_VIEW_QUEUE,
    PERMISSIONS.QA_APPROVE,
    PERMISSIONS.QA_REJECT,
    PERMISSIONS.QA_VIEW_SCORECARDS,
    PERMISSIONS.QA_MANAGE_SLA,

    // Settings - limited
    PERMISSIONS.SETTINGS_VIEW,
    PERMISSIONS.SETTINGS_MANAGE_PRICE_LISTS,
    PERMISSIONS.SETTINGS_MANAGE_CARRIERS,
    PERMISSIONS.SETTINGS_MANAGE_INTEGRATIONS,

    // Preliminary Reports
    PERMISSIONS.PRELIMINARY_REPORTS_READ,
    PERMISSIONS.PRELIMINARY_REPORTS_EXPORT_PDF,
  ],

  // QA Manager - review queue, approve/reject, quality metrics
  qa_manager: [
    // Estimates - read all, approve/reject, assign
    PERMISSIONS.ESTIMATES_READ_OWN,
    PERMISSIONS.ESTIMATES_READ_ASSIGNED,
    PERMISSIONS.ESTIMATES_READ_TEAM,
    PERMISSIONS.ESTIMATES_UPDATE_LIMITED,
    PERMISSIONS.ESTIMATES_APPROVE,
    PERMISSIONS.ESTIMATES_REJECT,
    PERMISSIONS.ESTIMATES_ASSIGN_TEAM,

    // Rooms - read
    PERMISSIONS.ROOMS_READ,

    // Line Items - read, verify
    PERMISSIONS.LINE_ITEMS_READ,
    PERMISSIONS.LINE_ITEMS_VERIFY,

    // Photos - read
    PERMISSIONS.PHOTOS_READ,

    // Annotations - read
    PERMISSIONS.ANNOTATIONS_READ,

    // Documents - read
    PERMISSIONS.DOCUMENTS_READ,

    // Analytics - team level
    PERMISSIONS.ANALYTICS_VIEW_OWN,
    PERMISSIONS.ANALYTICS_VIEW_TEAM,

    // Work Orders - read all
    PERMISSIONS.WORK_ORDERS_READ_OWN,
    PERMISSIONS.WORK_ORDERS_READ_TEAM,

    // Vendors - view
    PERMISSIONS.VENDORS_VIEW,

    // QA - full access
    PERMISSIONS.QA_VIEW_QUEUE,
    PERMISSIONS.QA_APPROVE,
    PERMISSIONS.QA_REJECT,
    PERMISSIONS.QA_VIEW_SCORECARDS,

    // Settings - view only
    PERMISSIONS.SETTINGS_VIEW,

    // Preliminary Reports
    PERMISSIONS.PRELIMINARY_REPORTS_READ,
  ],

  // Estimator - create/edit estimates, line items, pricing
  estimator: [
    // Estimates - create, own/assigned CRUD, export
    PERMISSIONS.ESTIMATES_CREATE,
    PERMISSIONS.ESTIMATES_READ_OWN,
    PERMISSIONS.ESTIMATES_READ_ASSIGNED,
    PERMISSIONS.ESTIMATES_UPDATE_OWN,
    PERMISSIONS.ESTIMATES_UPDATE_LIMITED,
    PERMISSIONS.ESTIMATES_DELETE_OWN,
    PERMISSIONS.ESTIMATES_EXPORT,

    // Rooms - full CRUD
    PERMISSIONS.ROOMS_CREATE,
    PERMISSIONS.ROOMS_READ,
    PERMISSIONS.ROOMS_UPDATE,
    PERMISSIONS.ROOMS_DELETE,

    // Line Items - full CRUD, verify, AI
    PERMISSIONS.LINE_ITEMS_CREATE,
    PERMISSIONS.LINE_ITEMS_READ,
    PERMISSIONS.LINE_ITEMS_UPDATE,
    PERMISSIONS.LINE_ITEMS_DELETE,
    PERMISSIONS.LINE_ITEMS_VERIFY,
    PERMISSIONS.LINE_ITEMS_AI_GENERATE,

    // Photos - upload, read, annotate, delete
    PERMISSIONS.PHOTOS_UPLOAD,
    PERMISSIONS.PHOTOS_READ,
    PERMISSIONS.PHOTOS_ANNOTATE,
    PERMISSIONS.PHOTOS_DELETE,

    // Annotations - full CRUD
    PERMISSIONS.ANNOTATIONS_CREATE,
    PERMISSIONS.ANNOTATIONS_READ,
    PERMISSIONS.ANNOTATIONS_UPDATE,
    PERMISSIONS.ANNOTATIONS_DELETE,

    // Documents - upload, read, delete
    PERMISSIONS.DOCUMENTS_UPLOAD,
    PERMISSIONS.DOCUMENTS_READ,
    PERMISSIONS.DOCUMENTS_DELETE,

    // Analytics - own only
    PERMISSIONS.ANALYTICS_VIEW_OWN,

    // Work Orders - read own/assigned
    PERMISSIONS.WORK_ORDERS_READ_OWN,

    // Vendors - view
    PERMISSIONS.VENDORS_VIEW,

    // Settings - view, price lists
    PERMISSIONS.SETTINGS_VIEW,
    PERMISSIONS.SETTINGS_MANAGE_PRICE_LISTS,

    // Preliminary Reports - full access
    PERMISSIONS.PRELIMINARY_REPORTS_CREATE,
    PERMISSIONS.PRELIMINARY_REPORTS_READ,
    PERMISSIONS.PRELIMINARY_REPORTS_UPDATE,
    PERMISSIONS.PRELIMINARY_REPORTS_SUBMIT,
    PERMISSIONS.PRELIMINARY_REPORTS_EXPORT_PDF,
  ],

  // Project Manager - field work, capture, photos, vendors
  pm: [
    // Estimates - create, own/assigned CRUD, export
    PERMISSIONS.ESTIMATES_CREATE,
    PERMISSIONS.ESTIMATES_READ_OWN,
    PERMISSIONS.ESTIMATES_READ_ASSIGNED,
    PERMISSIONS.ESTIMATES_UPDATE_OWN,
    PERMISSIONS.ESTIMATES_UPDATE_LIMITED,
    PERMISSIONS.ESTIMATES_EXPORT,

    // Rooms - full CRUD including LiDAR
    PERMISSIONS.ROOMS_CREATE,
    PERMISSIONS.ROOMS_READ,
    PERMISSIONS.ROOMS_UPDATE,
    PERMISSIONS.ROOMS_DELETE,
    PERMISSIONS.ROOMS_CAPTURE_LIDAR,

    // Line Items - create, read, update
    PERMISSIONS.LINE_ITEMS_CREATE,
    PERMISSIONS.LINE_ITEMS_READ,
    PERMISSIONS.LINE_ITEMS_UPDATE,
    PERMISSIONS.LINE_ITEMS_AI_GENERATE,

    // Photos - full access
    PERMISSIONS.PHOTOS_UPLOAD,
    PERMISSIONS.PHOTOS_READ,
    PERMISSIONS.PHOTOS_ANNOTATE,
    PERMISSIONS.PHOTOS_DELETE,

    // Annotations - full CRUD
    PERMISSIONS.ANNOTATIONS_CREATE,
    PERMISSIONS.ANNOTATIONS_READ,
    PERMISSIONS.ANNOTATIONS_UPDATE,
    PERMISSIONS.ANNOTATIONS_DELETE,

    // Documents - upload and read
    PERMISSIONS.DOCUMENTS_UPLOAD,
    PERMISSIONS.DOCUMENTS_READ,

    // Analytics - own only
    PERMISSIONS.ANALYTICS_VIEW_OWN,

    // Work Orders - create, assign, own/team read, clock
    PERMISSIONS.WORK_ORDERS_CREATE,
    PERMISSIONS.WORK_ORDERS_READ_OWN,
    PERMISSIONS.WORK_ORDERS_READ_TEAM,
    PERMISSIONS.WORK_ORDERS_UPDATE_OWN,
    PERMISSIONS.WORK_ORDERS_ASSIGN,
    PERMISSIONS.WORK_ORDERS_CLOCK,
    PERMISSIONS.WORK_ORDERS_COMPLETE,

    // Vendors - view, create, update, invite, request quotes
    PERMISSIONS.VENDORS_VIEW,
    PERMISSIONS.VENDORS_CREATE,
    PERMISSIONS.VENDORS_UPDATE,
    PERMISSIONS.VENDORS_INVITE,
    PERMISSIONS.VENDORS_REQUEST_QUOTES,

    // Settings - view only
    PERMISSIONS.SETTINGS_VIEW,

    // Preliminary Reports - full access
    PERMISSIONS.PRELIMINARY_REPORTS_CREATE,
    PERMISSIONS.PRELIMINARY_REPORTS_READ,
    PERMISSIONS.PRELIMINARY_REPORTS_UPDATE,
    PERMISSIONS.PRELIMINARY_REPORTS_SUBMIT,
    PERMISSIONS.PRELIMINARY_REPORTS_EXPORT_PDF,
  ],

  // Project Administrator - documentation, invoicing, limited estimate edits
  project_admin: [
    // Estimates - read assigned, limited updates
    PERMISSIONS.ESTIMATES_READ_OWN,
    PERMISSIONS.ESTIMATES_READ_ASSIGNED,
    PERMISSIONS.ESTIMATES_UPDATE_LIMITED,

    // Rooms - read only
    PERMISSIONS.ROOMS_READ,

    // Line Items - read only
    PERMISSIONS.LINE_ITEMS_READ,

    // Photos - read only
    PERMISSIONS.PHOTOS_READ,

    // Annotations - read only
    PERMISSIONS.ANNOTATIONS_READ,

    // Documents - full access (primary responsibility)
    PERMISSIONS.DOCUMENTS_UPLOAD,
    PERMISSIONS.DOCUMENTS_READ,
    PERMISSIONS.DOCUMENTS_DELETE,

    // Analytics - own only
    PERMISSIONS.ANALYTICS_VIEW_OWN,

    // Work Orders - read own
    PERMISSIONS.WORK_ORDERS_READ_OWN,

    // Vendors - view only
    PERMISSIONS.VENDORS_VIEW,

    // Settings - view only
    PERMISSIONS.SETTINGS_VIEW,

    // Preliminary Reports - read and export
    PERMISSIONS.PRELIMINARY_REPORTS_READ,
    PERMISSIONS.PRELIMINARY_REPORTS_EXPORT_PDF,
  ],

  // Field Staff - assigned work orders only, time tracking
  field_staff: [
    // Estimates - read assigned only (via work order)
    PERMISSIONS.ESTIMATES_READ_ASSIGNED,

    // Rooms - read only
    PERMISSIONS.ROOMS_READ,

    // Line Items - read only
    PERMISSIONS.LINE_ITEMS_READ,

    // Photos - upload (for work completion) and read
    PERMISSIONS.PHOTOS_UPLOAD,
    PERMISSIONS.PHOTOS_READ,

    // Annotations - read only
    PERMISSIONS.ANNOTATIONS_READ,

    // Analytics - own only
    PERMISSIONS.ANALYTICS_VIEW_OWN,

    // Work Orders - own only, clock, complete
    PERMISSIONS.WORK_ORDERS_READ_OWN,
    PERMISSIONS.WORK_ORDERS_UPDATE_OWN,
    PERMISSIONS.WORK_ORDERS_CLOCK,
    PERMISSIONS.WORK_ORDERS_COMPLETE,

    // Settings - view only
    PERMISSIONS.SETTINGS_VIEW,
  ],
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Check if a role has a specific permission
 */
export function hasPermission(role: Role, permission: Permission): boolean {
  const rolePerms = ROLE_PERMISSIONS[role];
  return rolePerms?.includes(permission) ?? false;
}

/**
 * Check if a role has any of the specified permissions
 */
export function hasAnyPermission(
  role: Role,
  permissions: Permission[]
): boolean {
  return permissions.some((p) => hasPermission(role, p));
}

/**
 * Check if a role has all of the specified permissions
 */
export function hasAllPermissions(
  role: Role,
  permissions: Permission[]
): boolean {
  return permissions.every((p) => hasPermission(role, p));
}

/**
 * Get all permissions for a role
 */
export function getPermissions(role: Role): Permission[] {
  return ROLE_PERMISSIONS[role] ?? [];
}

/**
 * Check if roleA has higher or equal authority than roleB
 */
export function hasMinimumRole(userRole: Role, requiredRole: Role): boolean {
  return ROLE_LEVELS[userRole] >= ROLE_LEVELS[requiredRole];
}

/**
 * Get the role level for comparison
 */
export function getRoleLevel(role: Role): number {
  return ROLE_LEVELS[role] ?? 0;
}

/**
 * Check if user can access a resource based on ownership
 */
export function canAccessResource(
  userRole: Role,
  resourceOwnerId: string,
  userId: string,
  permissionOwn: Permission,
  permissionAny: Permission
): boolean {
  // If user has "any" permission, they can access
  if (hasPermission(userRole, permissionAny)) {
    return true;
  }

  // If user owns the resource and has "own" permission
  if (resourceOwnerId === userId && hasPermission(userRole, permissionOwn)) {
    return true;
  }

  return false;
}

/**
 * Merge custom permissions with role defaults
 */
export function mergePermissions(
  role: Role,
  customPermissions?: {
    add?: Permission[];
    remove?: Permission[];
  }
): Permission[] {
  let permissions = [...getPermissions(role)];

  if (customPermissions?.remove) {
    permissions = permissions.filter(
      (p) => !customPermissions.remove!.includes(p)
    );
  }

  if (customPermissions?.add) {
    for (const p of customPermissions.add) {
      if (!permissions.includes(p)) {
        permissions.push(p);
      }
    }
  }

  return permissions;
}
