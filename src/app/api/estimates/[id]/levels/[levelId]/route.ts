import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { estimates, levels } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { z } from "zod";

const updateLevelSchema = z.object({
  name: z.string().min(1).max(10).optional(),
  label: z.string().optional(),
  order: z.number().optional(),
});

type RouteParams = { params: Promise<{ id: string; levelId: string }> };

// GET /api/estimates/[id]/levels/[levelId] - Get a single level
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { userId } = await auth();
    const { id, levelId } = await params;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify ownership of the estimate
    const [estimate] = await db
      .select()
      .from(estimates)
      .where(and(eq(estimates.id, id), eq(estimates.userId, userId)));

    if (!estimate) {
      return NextResponse.json({ error: "Estimate not found" }, { status: 404 });
    }

    const [level] = await db
      .select()
      .from(levels)
      .where(and(eq(levels.id, levelId), eq(levels.estimateId, id)));

    if (!level) {
      return NextResponse.json({ error: "Level not found" }, { status: 404 });
    }

    return NextResponse.json(level);
  } catch (error) {
    console.error("Error fetching level:", error);
    return NextResponse.json(
      { error: "Failed to fetch level" },
      { status: 500 }
    );
  }
}

// PATCH /api/estimates/[id]/levels/[levelId] - Update a level
export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const { userId } = await auth();
    const { id, levelId } = await params;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify ownership of the estimate
    const [estimate] = await db
      .select()
      .from(estimates)
      .where(and(eq(estimates.id, id), eq(estimates.userId, userId)));

    if (!estimate) {
      return NextResponse.json({ error: "Estimate not found" }, { status: 404 });
    }

    const body = await request.json();
    const validatedData = updateLevelSchema.parse(body);

    const [updatedLevel] = await db
      .update(levels)
      .set(validatedData)
      .where(and(eq(levels.id, levelId), eq(levels.estimateId, id)))
      .returning();

    if (!updatedLevel) {
      return NextResponse.json({ error: "Level not found" }, { status: 404 });
    }

    return NextResponse.json(updatedLevel);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Error updating level:", error);
    return NextResponse.json(
      { error: "Failed to update level" },
      { status: 500 }
    );
  }
}

// DELETE /api/estimates/[id]/levels/[levelId] - Delete a level
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const { userId } = await auth();
    const { id, levelId } = await params;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify ownership of the estimate
    const [estimate] = await db
      .select()
      .from(estimates)
      .where(and(eq(estimates.id, id), eq(estimates.userId, userId)));

    if (!estimate) {
      return NextResponse.json({ error: "Estimate not found" }, { status: 404 });
    }

    const [deletedLevel] = await db
      .delete(levels)
      .where(and(eq(levels.id, levelId), eq(levels.estimateId, id)))
      .returning();

    if (!deletedLevel) {
      return NextResponse.json({ error: "Level not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting level:", error);
    return NextResponse.json(
      { error: "Failed to delete level" },
      { status: 500 }
    );
  }
}
