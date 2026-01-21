import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { estimates, lineItems } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { z } from "zod";

const bulkLineItemSchema = z.object({
  category: z.string().optional(),
  selector: z.string().optional(),
  description: z.string().optional(),
  quantity: z.number().optional(),
  unit: z.string().optional(),
  unitPrice: z.number().optional(),
  total: z.number().optional(),
  source: z.enum(["manual", "ai_generated", "template"]).optional(),
  aiConfidence: z.number().optional(),
  roomId: z.string().uuid().optional().nullable(),
});

const bulkCreateSchema = z.object({
  estimateId: z.string().uuid(),
  items: z.array(bulkLineItemSchema).min(1).max(100),
});

// POST /api/line-items/bulk - Bulk create line items (for AI suggestions)
export async function POST(request: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = bulkCreateSchema.parse(body);

    // Verify ownership of the estimate
    const [estimate] = await db
      .select()
      .from(estimates)
      .where(and(eq(estimates.id, validatedData.estimateId), eq(estimates.userId, userId)));

    if (!estimate) {
      return NextResponse.json({ error: "Estimate not found" }, { status: 404 });
    }

    // Get max order for existing items
    const existingItems = await db
      .select()
      .from(lineItems)
      .where(eq(lineItems.estimateId, validatedData.estimateId));

    let maxOrder = existingItems.reduce((max, item) => Math.max(max, item.order || 0), -1);

    // Prepare items for insertion
    const itemsToInsert = validatedData.items.map((item) => {
      maxOrder += 1;

      // Calculate total if quantity and unitPrice are provided
      let total = item.total;
      if (item.quantity !== undefined && item.unitPrice !== undefined && total === undefined) {
        total = item.quantity * item.unitPrice;
      }

      return {
        estimateId: validatedData.estimateId,
        roomId: item.roomId,
        category: item.category,
        selector: item.selector,
        description: item.description,
        quantity: item.quantity,
        unit: item.unit,
        unitPrice: item.unitPrice,
        total,
        source: item.source ?? "ai_generated",
        aiConfidence: item.aiConfidence,
        verified: false,
        order: maxOrder,
      };
    });

    // Insert all items
    const newItems = await db
      .insert(lineItems)
      .values(itemsToInsert)
      .returning();

    return NextResponse.json({ items: newItems, count: newItems.length }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Error bulk creating line items:", error);
    return NextResponse.json(
      { error: "Failed to create line items" },
      { status: 500 }
    );
  }
}
