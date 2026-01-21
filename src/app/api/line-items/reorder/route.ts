import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { estimates, lineItems } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { z } from "zod";

const reorderSchema = z.object({
  estimateId: z.string().uuid(),
  items: z.array(z.object({
    id: z.string().uuid(),
    order: z.number().int().min(0),
  })).min(1),
});

// PATCH /api/line-items/reorder - Reorder line items
export async function PATCH(request: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = reorderSchema.parse(body);

    // Verify ownership of the estimate
    const [estimate] = await db
      .select()
      .from(estimates)
      .where(and(eq(estimates.id, validatedData.estimateId), eq(estimates.userId, userId)));

    if (!estimate) {
      return NextResponse.json({ error: "Estimate not found" }, { status: 404 });
    }

    // Update each item's order
    const updatePromises = validatedData.items.map((item) =>
      db
        .update(lineItems)
        .set({ order: item.order, updatedAt: new Date() })
        .where(and(
          eq(lineItems.id, item.id),
          eq(lineItems.estimateId, validatedData.estimateId)
        ))
    );

    await Promise.all(updatePromises);

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Error reordering line items:", error);
    return NextResponse.json(
      { error: "Failed to reorder line items" },
      { status: 500 }
    );
  }
}
