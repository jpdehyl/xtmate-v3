import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import {
  quoteRequests,
  quoteRequestItems,
  vendors,
  estimates,
  vendorQuotes,
} from "@/lib/db/schema";
import { eq, and, desc, inArray } from "drizzle-orm";
import { createVendorToken, getVendorLoginUrl, getVendorInviteMessage } from "@/lib/auth/vendor";

const createQuoteRequestSchema = z.object({
  estimateId: z.string().uuid(),
  vendorId: z.string().uuid(),
  lineItemIds: z.array(z.string().uuid()).min(1, "At least one line item is required"),
  message: z.string().optional(),
  expiresInDays: z.number().min(1).max(90).default(14),
});

// GET - List quote requests for an estimate
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const estimateId = searchParams.get("estimateId");

    if (!estimateId) {
      return NextResponse.json(
        { error: "estimateId is required" },
        { status: 400 }
      );
    }

    // Verify the user owns this estimate
    const [estimate] = await db
      .select()
      .from(estimates)
      .where(and(eq(estimates.id, estimateId), eq(estimates.userId, userId)))
      .limit(1);

    if (!estimate) {
      return NextResponse.json(
        { error: "Estimate not found" },
        { status: 404 }
      );
    }

    // Fetch quote requests with vendor info
    const requests = await db
      .select({
        quoteRequest: quoteRequests,
        vendor: vendors,
      })
      .from(quoteRequests)
      .innerJoin(vendors, eq(quoteRequests.vendorId, vendors.id))
      .where(eq(quoteRequests.estimateId, estimateId))
      .orderBy(desc(quoteRequests.createdAt));

    // Fetch quotes for these requests
    const requestIds = requests.map((r) => r.quoteRequest.id);
    let quotes: typeof vendorQuotes.$inferSelect[] = [];
    if (requestIds.length > 0) {
      quotes = await db
        .select()
        .from(vendorQuotes)
        .where(inArray(vendorQuotes.quoteRequestId, requestIds));
    }

    const quotesMap = new Map(quotes.map((q) => [q.quoteRequestId, q]));

    // Transform data
    const result = requests.map((r) => ({
      ...r.quoteRequest,
      vendor: {
        id: r.vendor.id,
        name: r.vendor.name,
        email: r.vendor.email,
        company: r.vendor.company,
        specialty: r.vendor.specialty,
      },
      quote: quotesMap.get(r.quoteRequest.id) || null,
    }));

    return NextResponse.json({
      success: true,
      quoteRequests: result,
    });
  } catch (error) {
    console.error("List quote requests error:", error);
    return NextResponse.json(
      { error: "Failed to fetch quote requests" },
      { status: 500 }
    );
  }
}

// POST - Create a new quote request
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const data = createQuoteRequestSchema.parse(body);

    // Verify the user owns the estimate
    const [estimate] = await db
      .select()
      .from(estimates)
      .where(and(eq(estimates.id, data.estimateId), eq(estimates.userId, userId)))
      .limit(1);

    if (!estimate) {
      return NextResponse.json(
        { error: "Estimate not found" },
        { status: 404 }
      );
    }

    // Verify the user owns the vendor
    const [vendor] = await db
      .select()
      .from(vendors)
      .where(and(eq(vendors.id, data.vendorId), eq(vendors.userId, userId)))
      .limit(1);

    if (!vendor) {
      return NextResponse.json(
        { error: "Vendor not found" },
        { status: 404 }
      );
    }

    // Calculate expiration date
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + data.expiresInDays);

    // Ensure vendor has a valid access token
    let accessToken = vendor.accessToken;
    if (!accessToken || (vendor.tokenExpiresAt && new Date(vendor.tokenExpiresAt) < new Date())) {
      const tokenResult = await createVendorToken(vendor.id);
      accessToken = tokenResult.token;
    }

    // Create quote request
    const [newRequest] = await db
      .insert(quoteRequests)
      .values({
        estimateId: data.estimateId,
        vendorId: data.vendorId,
        message: data.message || null,
        expiresAt,
      })
      .returning();

    // Create quote request items
    await db.insert(quoteRequestItems).values(
      data.lineItemIds.map((lineItemId) => ({
        quoteRequestId: newRequest.id,
        lineItemId,
      }))
    );

    // Generate invite info
    const loginUrl = getVendorLoginUrl(accessToken!);
    const inviteMessage = getVendorInviteMessage(vendor.name, estimate.name, accessToken!);

    return NextResponse.json({
      success: true,
      quoteRequest: newRequest,
      loginUrl,
      inviteMessage,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }

    console.error("Create quote request error:", error);
    return NextResponse.json(
      { error: "Failed to create quote request" },
      { status: 500 }
    );
  }
}
