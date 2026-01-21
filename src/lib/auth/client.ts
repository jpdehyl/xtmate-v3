/**
 * Client-safe RBAC exports
 *
 * This file exports only the types and constants that are safe to use
 * in client components. It does NOT include server-only code like
 * authorization middleware.
 *
 * Use this import in client components:
 * import { PERMISSIONS, ROLES } from '@/lib/auth/client';
 *
 * Use the main import in server components/API routes:
 * import { requirePermission, PERMISSIONS } from '@/lib/auth';
 */

// Types (safe for client)
export type {
  Role,
  Permission,
  AuthContext,
  AuthResult,
  EstimateAccessLevel,
  LimitedUpdateField,
} from "./types";

// Constants (safe for client)
export {
  ROLES,
  ROLE_LEVELS,
  ROLE_LABELS,
  ROLE_DESCRIPTIONS,
  PERMISSIONS,
  LIMITED_UPDATE_FIELDS,
} from "./types";

// Permission helpers (safe for client - no server imports)
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
