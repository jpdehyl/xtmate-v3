/**
 * Authorization Middleware for XtMate
 *
 * Provides functions for checking user permissions against resources.
 * All API routes should use these functions for access control.
 */

import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { organizationMembers, estimates } from "@/lib/db/schema";
import { eq, and, or } from "drizzle-orm";
import {
  AuthContext,
  Permission,
  Role,
  EstimateAccessLevel,
  LIMITED_UPDATE_FIELDS,
  LimitedUpdateField,
} from "./types";
import { getPermissions, hasPermission, mergePermissions } from "./permissions";

// ============================================================================
// AUTH CONTEXT
// ============================================================================

/**
 * Get the authenticated user's context including organization and role
 * Returns null if user is not authenticated or not in an organization
 */
export async function getAuthContext(): Promise<AuthContext | null> {
  const { userId } = await auth();

  if (!userId) {
    return null;
  }

  // Get user's organization membership and role
  const membership = await db.query.organizationMembers.findFirst({
    where: and(
      eq(organizationMembers.userId, userId),
      eq(organizationMembers.status, "active")
    ),
  });

  if (!membership) {
    // User is authenticated but not in any organization
    // This could happen for new users - return minimal context
    return null;
  }

  const role = membership.role as Role;

  // Parse custom permissions if set
  let customPermissions:
    | { add?: Permission[]; remove?: Permission[] }
    | undefined;
  if (membership.permissions) {
    try {
      customPermissions = membership.permissions as {
        add?: Permission[];
        remove?: Permission[];
      };
    } catch {
      // Invalid permissions format, ignore
    }
  }

  // Get effective permissions (role defaults + custom overrides)
  const permissions = customPermissions
    ? mergePermissions(role, customPermissions)
    : getPermissions(role);

  return {
    userId,
    organizationId: membership.organizationId,
    role,
    permissions,
    displayName: membership.displayName ?? undefined,
    email: membership.email ?? undefined,
  };
}

// ============================================================================
// PERMISSION CHECKS
// ============================================================================

/**
 * Require user to be authenticated
 * Returns error response if not authenticated
 */
export async function requireAuth(): Promise<
  { error: NextResponse } | { context: AuthContext }
> {
  const context = await getAuthContext();

  if (!context) {
    return {
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  return { context };
}

/**
 * Require user to have a specific permission
 * Returns error response if permission is missing
 */
export async function requirePermission(
  permission: Permission
): Promise<{ error: NextResponse } | { context: AuthContext }> {
  const context = await getAuthContext();

  if (!context) {
    return {
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  if (!context.permissions.includes(permission)) {
    return {
      error: NextResponse.json(
        {
          error: "Forbidden",
          message: `Missing permission: ${permission}`,
        },
        { status: 403 }
      ),
    };
  }

  return { context };
}

/**
 * Require user to have at least one of the specified permissions
 */
export async function requireAnyPermission(
  permissions: Permission[]
): Promise<{ error: NextResponse } | { context: AuthContext }> {
  const context = await getAuthContext();

  if (!context) {
    return {
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  const hasAny = permissions.some((p) => context.permissions.includes(p));

  if (!hasAny) {
    return {
      error: NextResponse.json(
        {
          error: "Forbidden",
          message: `Missing one of permissions: ${permissions.join(", ")}`,
        },
        { status: 403 }
      ),
    };
  }

  return { context };
}

/**
 * Require user to have all of the specified permissions
 */
export async function requireAllPermissions(
  permissions: Permission[]
): Promise<{ error: NextResponse } | { context: AuthContext }> {
  const context = await getAuthContext();

  if (!context) {
    return {
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  const missingPermissions = permissions.filter(
    (p) => !context.permissions.includes(p)
  );

  if (missingPermissions.length > 0) {
    return {
      error: NextResponse.json(
        {
          error: "Forbidden",
          message: `Missing permissions: ${missingPermissions.join(", ")}`,
        },
        { status: 403 }
      ),
    };
  }

  return { context };
}

// ============================================================================
// RESOURCE ACCESS CHECKS
// ============================================================================

/**
 * Determine user's access level to a specific estimate
 */
export async function getEstimateAccessLevel(
  estimateId: string,
  context: AuthContext
): Promise<EstimateAccessLevel> {
  const estimate = await db.query.estimates.findFirst({
    where: eq(estimates.id, estimateId),
  });

  if (!estimate) {
    return "none";
  }

  // Must be in same organization
  if (estimate.organizationId !== context.organizationId) {
    return "none";
  }

  // Check if user is owner
  if (estimate.userId === context.userId) {
    return "owner";
  }

  // User is in same org but not owner
  return "team";
}

/**
 * Check if user can access a specific estimate with required permission level
 */
export async function canAccessEstimate(
  estimateId: string,
  context: AuthContext,
  accessType: "read" | "update" | "delete"
): Promise<boolean> {
  const accessLevel = await getEstimateAccessLevel(estimateId, context);

  if (accessLevel === "none") {
    return false;
  }

  switch (accessType) {
    case "read":
      // Can read if has team permission, or own with appropriate permission
      if (hasPermission(context.role, "estimates.read_team" as Permission)) {
        return true;
      }
      if (
        accessLevel === "owner" &&
        hasPermission(context.role, "estimates.read_own" as Permission)
      ) {
        return true;
      }
      return false;

    case "update":
      if (hasPermission(context.role, "estimates.update_any" as Permission)) {
        return true;
      }
      if (
        accessLevel === "owner" &&
        hasPermission(context.role, "estimates.update_own" as Permission)
      ) {
        return true;
      }
      return false;

    case "delete":
      if (hasPermission(context.role, "estimates.delete_any" as Permission)) {
        return true;
      }
      if (
        accessLevel === "owner" &&
        hasPermission(context.role, "estimates.delete_own" as Permission)
      ) {
        return true;
      }
      return false;
  }
}

/**
 * Check if user can perform limited updates on an estimate
 * Used for project_admin and similar roles with restricted editing
 */
export async function canPerformLimitedUpdate(
  estimateId: string,
  context: AuthContext,
  fieldsToUpdate: string[]
): Promise<{ allowed: boolean; disallowedFields?: string[] }> {
  // First check if they have full update permission
  const canFullUpdate = await canAccessEstimate(estimateId, context, "update");
  if (canFullUpdate) {
    return { allowed: true };
  }

  // Check for limited update permission
  if (!hasPermission(context.role, "estimates.update_limited" as Permission)) {
    return { allowed: false, disallowedFields: fieldsToUpdate };
  }

  // Verify access level
  const accessLevel = await getEstimateAccessLevel(estimateId, context);
  if (accessLevel === "none") {
    return { allowed: false, disallowedFields: fieldsToUpdate };
  }

  // Check which fields are allowed
  const disallowedFields = fieldsToUpdate.filter(
    (field) => !LIMITED_UPDATE_FIELDS.includes(field as LimitedUpdateField)
  );

  if (disallowedFields.length > 0) {
    return { allowed: false, disallowedFields };
  }

  return { allowed: true };
}

// ============================================================================
// ORGANIZATION SCOPING HELPERS
// ============================================================================

/**
 * Add organization scope to database queries
 * ALWAYS use this when querying data to ensure tenant isolation
 */
export function orgScope(context: AuthContext) {
  return eq(estimates.organizationId, context.organizationId);
}

/**
 * Build estimate query conditions based on user's permissions
 */
export function buildEstimateQueryConditions(context: AuthContext) {
  const conditions = [];

  // ALWAYS scope by organization
  conditions.push(eq(estimates.organizationId, context.organizationId));

  // If user can read all team estimates, no additional filter needed
  if (hasPermission(context.role, "estimates.read_team" as Permission)) {
    return and(...conditions);
  }

  // Otherwise, filter by ownership
  const accessConditions = [];

  if (hasPermission(context.role, "estimates.read_own" as Permission)) {
    accessConditions.push(eq(estimates.userId, context.userId));
  }

  if (accessConditions.length > 0) {
    conditions.push(or(...accessConditions));
  } else {
    // User has no read permissions - return impossible condition
    // This ensures no data is returned
    conditions.push(eq(estimates.id, "00000000-0000-0000-0000-000000000000"));
  }

  return and(...conditions);
}

// ============================================================================
// HIGHER-ORDER FUNCTIONS
// ============================================================================

/**
 * Higher-order function to wrap route handlers with permission check
 *
 * @example
 * export const GET = withPermission(
 *   PERMISSIONS.ESTIMATES_READ_TEAM,
 *   async (request, context) => {
 *     // Handler code with access to authenticated context
 *   }
 * );
 */
export function withPermission(
  permission: Permission,
  handler: (request: Request, context: AuthContext) => Promise<NextResponse>
) {
  return async (request: Request) => {
    const result = await requirePermission(permission);

    if ("error" in result) {
      return result.error;
    }

    return handler(request, result.context);
  };
}

/**
 * Higher-order function requiring any of multiple permissions
 */
export function withAnyPermission(
  permissions: Permission[],
  handler: (request: Request, context: AuthContext) => Promise<NextResponse>
) {
  return async (request: Request) => {
    const result = await requireAnyPermission(permissions);

    if ("error" in result) {
      return result.error;
    }

    return handler(request, result.context);
  };
}
