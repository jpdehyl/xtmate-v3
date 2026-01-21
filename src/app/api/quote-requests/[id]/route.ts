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
  vendorQuoteItems,
  lineItems,
} from "@/lib/db/schema";
import { eq, and, inArray } from "drizzle-orm";

interface RouteContext {
  params: Promise<{ id: string }>;
}

// GET - Get a single quote request with details
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch quote request
    const [result] = await db
      .select({
        quoteRequest: quoteRequests,
        vendor: vendors,
      })
      .from(quoteRequests)
      .innerJoin(vendors, eq(quoteRequests.vendorId, vendors.id))
      .where(eq(quoteRequests.id, id))
      .limit(1);

    if (!result) {
      return NextResponse.json(
        { error: "Quote request not found" },
        { status: 404 }
      );
    }

    // Verify user owns the estimate
    const [estimate] = await db
      .select()
      .from(estimates)
      .where(
        and(
          eq(estimates.id, result.quoteRequest.estimateId!),
          eq(estimates.userId, userId)
        )
      )
      .limit(1);

    if (!estimate) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Fetch request items with line item details
    const requestItems = await db
      .select()
      .from(quoteRequestItems)
      .where(eq(quoteRequestItems.quoteRequestId, id));

    const lineItemIds = requestItems.map((ri) => ri.lineItemId!).filter(Boolean);
    let requestLineItems: typeof lineItems.$inferSelect[] = [];
    if (lineItemIds.length > 0) {
      requestLineItems = await db
        .select()
        .from(lineItems)
        .where(inArray(lineItems.id, lineItemIds));
    }

    // Fetch vendor quote if exists
    const [quote] = await db
      .select()
      .from(vendorQuotes)
      .where(eq(vendorQuotes.quoteRequestId, id))
      .limit(1);

    let quoteItems: typeof vendorQuoteItems.$inferSelect[] = [];
    if (quote) {
      quoteItems = await db
        .select()
        .from(vendorQuoteItems)
        .where(eq(vendorQuoteItems.vendorQuoteId, quote.id));
    }

    return NextResponse.json({
      success: true,
      quoteRequest: result.quoteRequest,
      vendor: {
        id: result.vendor.id,
        name: result.vendor.name,
        email: result.vendor.email,
        company: result.vendor.company,
        specialty: result.vendor.specialty,
      },
      lineItems: requestLineItems,
      quote,
      quoteItems,
    });
  } catch (error) {
    console.error("Get quote request error:", error);
    return NextResponse.json(
      { error: "Failed to fetch quote request" },
      { status: 500 }
    );
  }
}

const updateQuoteRequestSchema = z.object({
  status: z.enum(["pending", "viewed", "quoted", "accepted", "rejected", "expired"]).optional(),
  message: z.string().optional(),
});

// PATCH - Update a quote request (accept/reject)
export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const data = updateQuoteRequestSchema.parse(body);

    // Fetch and verify ownership
    const [result] = await db
      .select({
        quoteRequest: quoteRequests,
        estimate: estimates,
      })
      .from(quoteRequests)
      .innerJoin(estimates, eq(quoteRequests.estimateId, estimates.id))
      .where(eq(quoteRequests.id, id))
      .limit(1);

    if (!result) {
      return NextResponse.json(
        { error: "Quote request not found" },
        { status: 404 }
      );
    }

    if (result.estimate.userId !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Update quote request
    const [updated] = await db
      .update(quoteRequests)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(quoteRequests.id, id))
      .returning();

    return NextResponse.json({
      success: true,
      quoteRequest: updated,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }

    console.error("Update quote request error:", error);
    return NextResponse.json(
      { error: "Failed to update quote request" },
      { status: 500 }
    );
  }
}

// DELETE - Delete a quote request
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch and verify ownership
    const [result] = await db
      .select({
        quoteRequest: quoteRequests,
        estimate: estimates,
      })
      .from(quoteRequests)
      .innerJoin(estimates, eq(quoteRequests.estimateId, estimates.id))
      .where(eq(quoteRequests.id, id))
      .limit(1);

    if (!result) {
      return NextResponse.json(
        { error: "Quote request not found" },
        { status: 404 }
      );
    }

    if (result.estimate.userId !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Delete will cascade to quote_request_items
    await db.delete(quoteRequests).where(eq(quoteRequests.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete quote request error:", error);
    return NextResponse.json(
      { error: "Failed to delete quote request" },
      { status: 500 }
    );
  }
}
