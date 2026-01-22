import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { pmScopeItems } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { logger } from "@/lib/logger";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { convertedToLineItemId } = body;

    const existing = await db.query.pmScopeItems.findFirst({
      where: eq(pmScopeItems.id, id),
    });

    if (!existing) {
      return NextResponse.json(
        { error: "PM scope item not found" },
        { status: 404 }
      );
    }

    const [updated] = await db.update(pmScopeItems)
      .set({
        convertedToLineItemId,
        convertedAt: convertedToLineItemId ? new Date() : null,
        convertedBy: convertedToLineItemId ? userId : null,
        updatedAt: new Date(),
      })
      .where(eq(pmScopeItems.id, id))
      .returning();

    logger.info("PM scope item updated", { id, convertedToLineItemId });

    return NextResponse.json(updated);

  } catch (error) {
    logger.error("Failed to update PM scope item", { error });
    return NextResponse.json(
      { error: "Failed to update" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const existing = await db.query.pmScopeItems.findFirst({
      where: eq(pmScopeItems.id, id),
    });

    if (!existing) {
      return NextResponse.json(
        { error: "PM scope item not found" },
        { status: 404 }
      );
    }

    await db.delete(pmScopeItems).where(eq(pmScopeItems.id, id));

    logger.info("PM scope item deleted", { id });

    return NextResponse.json({ success: true });

  } catch (error) {
    logger.error("Failed to delete PM scope item", { error });
    return NextResponse.json(
      { error: "Failed to delete" },
      { status: 500 }
    );
  }
}
