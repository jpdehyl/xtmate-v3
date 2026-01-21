import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getVendorFromCookies } from "@/lib/auth/vendor";
import { db } from "@/lib/db";
import { quoteRequests, vendorQuotes, vendorQuoteItems } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

const quoteItemSchema = z.object({
  lineItemId: z.string().uuid(),
  unitPrice: z.number().nullable(),
  quantity: z.number().nullable(),
  total: z.number().nullable(),
  notes: z.string().nullable(),
});

const createQuoteSchema = z.object({
  quoteRequestId: z.string().uuid(),
  totalAmount: z.number().min(0),
  laborAmount: z.number().nullable(),
  materialAmount: z.number().nullable(),
  notes: z.string().nullable(),
  items: z.array(quoteItemSchema),
  validUntil: z.string().datetime().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const vendor = await getVendorFromCookies();

    if (!vendor) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const data = createQuoteSchema.parse(body);

    // Verify the quote request belongs to this vendor
    const [quoteRequest] = await db
      .select()
      .from(quoteRequests)
      .where(
        and(
          eq(quoteRequests.id, data.quoteRequestId),
          eq(quoteRequests.vendorId, vendor.id)
        )
      )
      .limit(1);

    if (!quoteRequest) {
      return NextResponse.json(
        { error: "Quote request not found" },
        { status: 404 }
      );
    }

    // Check if quote request is expired
    if (quoteRequest.expiresAt && new Date(quoteRequest.expiresAt) < new Date()) {
      return NextResponse.json(
        { error: "Quote request has expired" },
        { status: 400 }
      );
    }

    // Check if a quote already exists
    const [existingQuote] = await db
      .select()
      .from(vendorQuotes)
      .where(eq(vendorQuotes.quoteRequestId, data.quoteRequestId))
      .limit(1);

    if (existingQuote) {
      return NextResponse.json(
        { error: "A quote has already been submitted for this request" },
        { status: 400 }
      );
    }

    // Default valid until to 30 days from now
    const validUntil = data.validUntil
      ? new Date(data.validUntil)
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    // Create the vendor quote
    const [newQuote] = await db
      .insert(vendorQuotes)
      .values({
        quoteRequestId: data.quoteRequestId,
        totalAmount: data.totalAmount,
        laborAmount: data.laborAmount,
        materialAmount: data.materialAmount,
        notes: data.notes,
        validUntil,
      })
      .returning();

    // Create quote items
    if (data.items.length > 0) {
      await db.insert(vendorQuoteItems).values(
        data.items.map((item) => ({
          vendorQuoteId: newQuote.id,
          lineItemId: item.lineItemId,
          unitPrice: item.unitPrice,
          quantity: item.quantity,
          total: item.total,
          notes: item.notes,
        }))
      );
    }

    // Update quote request status
    await db
      .update(quoteRequests)
      .set({
        status: "quoted",
        updatedAt: new Date(),
      })
      .where(eq(quoteRequests.id, data.quoteRequestId));

    return NextResponse.json({
      success: true,
      quote: newQuote,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }

    console.error("Submit quote error:", error);
    return NextResponse.json(
      { error: "Failed to submit quote" },
      { status: 500 }
    );
  }
}

// GET - Fetch vendor's quotes
export async function GET() {
  try {
    const vendor = await getVendorFromCookies();

    if (!vendor) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    // Fetch all quote requests for this vendor
    const requests = await db
      .select()
      .from(quoteRequests)
      .where(eq(quoteRequests.vendorId, vendor.id));

    // Fetch all quotes for these requests
    const requestIds = requests.map((r) => r.id);
    const quotes =
      requestIds.length > 0
        ? await db
            .select()
            .from(vendorQuotes)
            .where(eq(vendorQuotes.quoteRequestId, requestIds[0])) // TODO: Use IN clause
        : [];

    return NextResponse.json({
      success: true,
      requests,
      quotes,
    });
  } catch (error) {
    console.error("Fetch quotes error:", error);
    return NextResponse.json(
      { error: "Failed to fetch quotes" },
      { status: 500 }
    );
  }
}
