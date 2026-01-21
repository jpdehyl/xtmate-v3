import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { vendors, VENDOR_SPECIALTIES } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { generateVendorToken, getTokenExpiration, getVendorInviteMessage } from "@/lib/auth/vendor";

const createVendorSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email"),
  phone: z.string().optional(),
  company: z.string().optional(),
  specialty: z.enum(VENDOR_SPECIALTIES as unknown as [string, ...string[]]).optional(),
  notes: z.string().optional(),
  organizationId: z.string().uuid().optional(),
  generateToken: z.boolean().default(false),
});

// GET - List vendors for the current user/organization
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const specialty = searchParams.get("specialty");
    const organizationId = searchParams.get("organizationId");

    const conditions = [eq(vendors.userId, userId)];

    if (specialty) {
      conditions.push(eq(vendors.specialty, specialty));
    }

    if (organizationId) {
      conditions.push(eq(vendors.organizationId, organizationId));
    }

    const vendorList = await db
      .select()
      .from(vendors)
      .where(and(...conditions))
      .orderBy(desc(vendors.createdAt));

    // Don't expose access tokens in the response
    const safeVendors = vendorList.map(({ accessToken, ...vendor }) => vendor);

    return NextResponse.json({
      success: true,
      vendors: safeVendors,
    });
  } catch (error) {
    console.error("List vendors error:", error);
    return NextResponse.json(
      { error: "Failed to fetch vendors" },
      { status: 500 }
    );
  }
}

// POST - Create a new vendor
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const data = createVendorSchema.parse(body);

    // Check if vendor with same email already exists for this user
    const [existingVendor] = await db
      .select()
      .from(vendors)
      .where(and(eq(vendors.userId, userId), eq(vendors.email, data.email)))
      .limit(1);

    if (existingVendor) {
      return NextResponse.json(
        { error: "A vendor with this email already exists" },
        { status: 400 }
      );
    }

    // Generate access token if requested
    let accessToken: string | null = null;
    let tokenExpiresAt: Date | null = null;

    if (data.generateToken) {
      accessToken = generateVendorToken();
      tokenExpiresAt = getTokenExpiration();
    }

    const [newVendor] = await db
      .insert(vendors)
      .values({
        userId,
        name: data.name,
        email: data.email,
        phone: data.phone || null,
        company: data.company || null,
        specialty: data.specialty || null,
        notes: data.notes || null,
        organizationId: data.organizationId || null,
        accessToken,
        tokenExpiresAt,
      })
      .returning();

    // Generate invite message if token was created
    let inviteMessage = null;
    if (accessToken) {
      inviteMessage = getVendorInviteMessage(data.name, "New Project", accessToken);
    }

    return NextResponse.json({
      success: true,
      vendor: {
        ...newVendor,
        accessToken: undefined, // Don't include token in response
      },
      inviteMessage,
      // Include token only once for the initial invite
      accessToken: accessToken,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }

    console.error("Create vendor error:", error);
    return NextResponse.json(
      { error: "Failed to create vendor" },
      { status: 500 }
    );
  }
}
