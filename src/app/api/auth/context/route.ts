/**
 * Auth Context API Endpoint
 *
 * Returns the authenticated user's context including role and permissions.
 * Used by the client-side usePermissions hook.
 *
 * GET /api/auth/context
 */

import { NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth";

export async function GET() {
  try {
    const context = await getAuthContext();

    if (!context) {
      return NextResponse.json(
        { error: "Not authenticated or not in an organization" },
        { status: 401 }
      );
    }

    // Return the auth context (safe to expose to client)
    return NextResponse.json({
      userId: context.userId,
      organizationId: context.organizationId,
      role: context.role,
      permissions: context.permissions,
      displayName: context.displayName,
      email: context.email,
    });
  } catch (error) {
    console.error("Error getting auth context:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
