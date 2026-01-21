/**
 * Main RBAC exports for server-side use
 *
 * This file exports everything needed for server components and API routes.
 * For client components, use '@/lib/auth/client' instead.
 */

// Types
export type {
  Role,
  Permission,
  AuthContext,
  AuthResult,
  EstimateAccessLevel,
  LimitedUpdateField,
} from "./types";

// Constants
export {
  ROLES,
  ROLE_LEVELS,
  ROLE_LABELS,
  ROLE_DESCRIPTIONS,
  PERMISSIONS,
  LIMITED_UPDATE_FIELDS,
} from "./types";

// Permission helpers
export {
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  getPermissions,
  hasMinimumRole,
  getRoleLevel,
  canAccessResource,
  mergePermissions,
  ROLE_PERMISSIONS,
} from "./permissions";

// Authorization middleware
export {
  getAuthContext,
  requireAuth,
  requirePermission,
  requireAnyPermission,
  requireAllPermissions,
  getEstimateAccessLevel,
  canAccessEstimate,
  canPerformLimitedUpdate,
  orgScope,
  buildEstimateQueryConditions,
  withPermission,
  withAnyPermission,
} from "./authorize";
