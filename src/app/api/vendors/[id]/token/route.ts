import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { vendors } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import {
  generateVendorToken,
  getTokenExpiration,
  getVendorLoginUrl,
  getVendorInviteMessage,
  invalidateVendorToken,
} from "@/lib/auth/vendor";

interface RouteContext {
  params: Promise<{ id: string }>;
}

// POST - Generate a new access token for a vendor
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify ownership
    const [existingVendor] = await db
      .select()
      .from(vendors)
      .where(and(eq(vendors.id, id), eq(vendors.userId, userId)))
      .limit(1);

    if (!existingVendor) {
      return NextResponse.json({ error: "Vendor not found" }, { status: 404 });
    }

    // Generate new token
    const accessToken = generateVendorToken();
    const tokenExpiresAt = getTokenExpiration();

    await db
      .update(vendors)
      .set({
        accessToken,
        tokenExpiresAt,
        updatedAt: new Date(),
      })
      .where(eq(vendors.id, id));

    const loginUrl = getVendorLoginUrl(accessToken);
    const inviteMessage = getVendorInviteMessage(
      existingVendor.name,
      "Your Project",
      accessToken
    );

    return NextResponse.json({
      success: true,
      token: accessToken,
      expiresAt: tokenExpiresAt,
      loginUrl,
      inviteMessage,
    });
  } catch (error) {
    console.error("Generate token error:", error);
    return NextResponse.json(
      { error: "Failed to generate token" },
      { status: 500 }
    );
  }
}

// DELETE - Revoke a vendor's access token
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify ownership
    const [existingVendor] = await db
      .select()
      .from(vendors)
      .where(and(eq(vendors.id, id), eq(vendors.userId, userId)))
      .limit(1);

    if (!existingVendor) {
      return NextResponse.json({ error: "Vendor not found" }, { status: 404 });
    }

    await invalidateVendorToken(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Revoke token error:", error);
    return NextResponse.json(
      { error: "Failed to revoke token" },
      { status: 500 }
    );
  }
}
