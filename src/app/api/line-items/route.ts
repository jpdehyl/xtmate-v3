import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { estimates, lineItems, rooms } from "@/lib/db/schema";
import { eq, and, asc } from "drizzle-orm";
import { z } from "zod";

const createLineItemSchema = z.object({
  estimateId: z.string().uuid(),
  roomId: z.string().uuid().optional().nullable(),
  annotationId: z.string().uuid().optional().nullable(),
  category: z.string().optional(),
  selector: z.string().optional(), // Xactimate code
  description: z.string().optional(),
  quantity: z.number().optional(),
  unit: z.string().optional(),
  unitPrice: z.number().optional(),
  total: z.number().optional(),
  source: z.enum(["manual", "ai_generated", "template"]).optional(),
  aiConfidence: z.number().optional(),
  verified: z.boolean().optional(),
  order: z.number().optional(),
});

// GET /api/line-items?estimateId=X - List all line items for an estimate
export async function GET(request: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);
    const estimateId = url.searchParams.get("estimateId");

    if (!estimateId) {
      return NextResponse.json(
        { error: "estimateId query parameter is required" },
        { status: 400 }
      );
    }

    // Verify ownership of the estimate
    const [estimate] = await db
      .select()
      .from(estimates)
      .where(and(eq(estimates.id, estimateId), eq(estimates.userId, userId)));

    if (!estimate) {
      return NextResponse.json({ error: "Estimate not found" }, { status: 404 });
    }

    // Get all line items for this estimate
    const items = await db
      .select()
      .from(lineItems)
      .where(eq(lineItems.estimateId, estimateId))
      .orderBy(asc(lineItems.order), asc(lineItems.createdAt));

    return NextResponse.json(items);
  } catch (error) {
    console.error("Error fetching line items:", error);
    return NextResponse.json(
      { error: "Failed to fetch line items" },
      { status: 500 }
    );
  }
}

// POST /api/line-items - Create a new line item
export async function POST(request: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createLineItemSchema.parse(body);

    // Verify ownership of the estimate
    const [estimate] = await db
      .select()
      .from(estimates)
      .where(and(eq(estimates.id, validatedData.estimateId), eq(estimates.userId, userId)));

    if (!estimate) {
      return NextResponse.json({ error: "Estimate not found" }, { status: 404 });
    }

    // If roomId is provided, verify it belongs to this estimate
    if (validatedData.roomId) {
      const [room] = await db
        .select()
        .from(rooms)
        .where(and(
          eq(rooms.id, validatedData.roomId),
          eq(rooms.estimateId, validatedData.estimateId)
        ));

      if (!room) {
        return NextResponse.json(
          { error: "Room not found or doesn't belong to this estimate" },
          { status: 400 }
        );
      }
    }

    // Get max order for existing items
    const existingItems = await db
      .select()
      .from(lineItems)
      .where(eq(lineItems.estimateId, validatedData.estimateId));

    const maxOrder = existingItems.reduce((max, item) => Math.max(max, item.order || 0), -1);

    // Calculate total if quantity and unitPrice are provided
    let total = validatedData.total;
    if (validatedData.quantity !== undefined && validatedData.unitPrice !== undefined && total === undefined) {
      total = validatedData.quantity * validatedData.unitPrice;
    }

    const [newItem] = await db
      .insert(lineItems)
      .values({
        estimateId: validatedData.estimateId,
        roomId: validatedData.roomId,
        annotationId: validatedData.annotationId,
        category: validatedData.category,
        selector: validatedData.selector,
        description: validatedData.description,
        quantity: validatedData.quantity,
        unit: validatedData.unit,
        unitPrice: validatedData.unitPrice,
        total,
        source: validatedData.source ?? "manual",
        aiConfidence: validatedData.aiConfidence,
        verified: validatedData.verified ?? false,
        order: validatedData.order ?? maxOrder + 1,
      })
      .returning();

    return NextResponse.json(newItem, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Error creating line item:", error);
    return NextResponse.json(
      { error: "Failed to create line item" },
      { status: 500 }
    );
  }
}
