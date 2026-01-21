import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { estimates, lineItems, rooms } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { z } from "zod";

type RouteParams = { params: Promise<{ id: string }> };

const updateLineItemSchema = z.object({
  roomId: z.string().uuid().optional().nullable(),
  annotationId: z.string().uuid().optional().nullable(),
  category: z.string().optional(),
  selector: z.string().optional(),
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

// GET /api/line-items/[id] - Get a single line item
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { userId } = await auth();
    const { id } = await params;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the line item
    const [item] = await db
      .select()
      .from(lineItems)
      .where(eq(lineItems.id, id));

    if (!item) {
      return NextResponse.json({ error: "Line item not found" }, { status: 404 });
    }

    // Verify ownership through estimate
    const [estimate] = await db
      .select()
      .from(estimates)
      .where(and(eq(estimates.id, item.estimateId!), eq(estimates.userId, userId)));

    if (!estimate) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    return NextResponse.json(item);
  } catch (error) {
    console.error("Error fetching line item:", error);
    return NextResponse.json(
      { error: "Failed to fetch line item" },
      { status: 500 }
    );
  }
}

// PATCH /api/line-items/[id] - Update a line item
export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const { userId } = await auth();
    const { id } = await params;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the existing line item
    const [existingItem] = await db
      .select()
      .from(lineItems)
      .where(eq(lineItems.id, id));

    if (!existingItem) {
      return NextResponse.json({ error: "Line item not found" }, { status: 404 });
    }

    // Verify ownership through estimate
    const [estimate] = await db
      .select()
      .from(estimates)
      .where(and(eq(estimates.id, existingItem.estimateId!), eq(estimates.userId, userId)));

    if (!estimate) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = updateLineItemSchema.parse(body);

    // If roomId is provided, verify it belongs to this estimate
    if (validatedData.roomId) {
      const [room] = await db
        .select()
        .from(rooms)
        .where(and(
          eq(rooms.id, validatedData.roomId),
          eq(rooms.estimateId, existingItem.estimateId!)
        ));

      if (!room) {
        return NextResponse.json(
          { error: "Room not found or doesn't belong to this estimate" },
          { status: 400 }
        );
      }
    }

    // Calculate total if quantity and unitPrice are being updated
    let total = validatedData.total;
    if (total === undefined) {
      const newQuantity = validatedData.quantity ?? existingItem.quantity;
      const newUnitPrice = validatedData.unitPrice ?? existingItem.unitPrice;
      if (newQuantity !== null && newUnitPrice !== null) {
        total = newQuantity * newUnitPrice;
      }
    }

    const [updatedItem] = await db
      .update(lineItems)
      .set({
        ...validatedData,
        total,
        updatedAt: new Date(),
      })
      .where(eq(lineItems.id, id))
      .returning();

    return NextResponse.json(updatedItem);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Error updating line item:", error);
    return NextResponse.json(
      { error: "Failed to update line item" },
      { status: 500 }
    );
  }
}

// DELETE /api/line-items/[id] - Delete a line item
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const { userId } = await auth();
    const { id } = await params;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the line item
    const [item] = await db
      .select()
      .from(lineItems)
      .where(eq(lineItems.id, id));

    if (!item) {
      return NextResponse.json({ error: "Line item not found" }, { status: 404 });
    }

    // Verify ownership through estimate
    const [estimate] = await db
      .select()
      .from(estimates)
      .where(and(eq(estimates.id, item.estimateId!), eq(estimates.userId, userId)));

    if (!estimate) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    await db.delete(lineItems).where(eq(lineItems.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting line item:", error);
    return NextResponse.json(
      { error: "Failed to delete line item" },
      { status: 500 }
    );
  }
}
