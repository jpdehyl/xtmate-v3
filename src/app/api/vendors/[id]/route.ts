import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { vendors, VENDOR_SPECIALTIES } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { generateVendorToken, getTokenExpiration, getVendorLoginUrl } from "@/lib/auth/vendor";

const updateVendorSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  phone: z.string().nullable().optional(),
  company: z.string().nullable().optional(),
  specialty: z.enum(VENDOR_SPECIALTIES as unknown as [string, ...string[]]).nullable().optional(),
  notes: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
});

interface RouteContext {
  params: Promise<{ id: string }>;
}

// GET - Get a single vendor
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [vendor] = await db
      .select()
      .from(vendors)
      .where(and(eq(vendors.id, id), eq(vendors.userId, userId)))
      .limit(1);

    if (!vendor) {
      return NextResponse.json({ error: "Vendor not found" }, { status: 404 });
    }

    // Don't expose access token
    const { accessToken, ...safeVendor } = vendor;

    return NextResponse.json({
      success: true,
      vendor: safeVendor,
    });
  } catch (error) {
    console.error("Get vendor error:", error);
    return NextResponse.json(
      { error: "Failed to fetch vendor" },
      { status: 500 }
    );
  }
}

// PATCH - Update a vendor
export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const data = updateVendorSchema.parse(body);

    // Verify ownership
    const [existingVendor] = await db
      .select()
      .from(vendors)
      .where(and(eq(vendors.id, id), eq(vendors.userId, userId)))
      .limit(1);

    if (!existingVendor) {
      return NextResponse.json({ error: "Vendor not found" }, { status: 404 });
    }

    const [updatedVendor] = await db
      .update(vendors)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(vendors.id, id))
      .returning();

    const { accessToken, ...safeVendor } = updatedVendor;

    return NextResponse.json({
      success: true,
      vendor: safeVendor,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }

    console.error("Update vendor error:", error);
    return NextResponse.json(
      { error: "Failed to update vendor" },
      { status: 500 }
    );
  }
}

// DELETE - Delete a vendor
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

    await db.delete(vendors).where(eq(vendors.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete vendor error:", error);
    return NextResponse.json(
      { error: "Failed to delete vendor" },
      { status: 500 }
    );
  }
}
