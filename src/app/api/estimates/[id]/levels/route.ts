import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { estimates, levels } from "@/lib/db/schema";
import { eq, and, asc } from "drizzle-orm";
import { z } from "zod";

const createLevelSchema = z.object({
  name: z.string().min(1).max(10),
  label: z.string().optional(),
  order: z.number().optional(),
});

type RouteParams = { params: Promise<{ id: string }> };

// GET /api/estimates/[id]/levels - Get all levels for an estimate
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { userId } = await auth();
    const { id } = await params;

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

    const levelsList = await db
      .select()
      .from(levels)
      .where(eq(levels.estimateId, id))
      .orderBy(asc(levels.order));

    return NextResponse.json(levelsList);
  } catch (error) {
    console.error("Error fetching levels:", error);
    return NextResponse.json(
      { error: "Failed to fetch levels" },
      { status: 500 }
    );
  }
}

// POST /api/estimates/[id]/levels - Create a new level
export async function POST(request: Request, { params }: RouteParams) {
  try {
    const { userId } = await auth();
    const { id } = await params;

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
    const validatedData = createLevelSchema.parse(body);

    // Get the max order for existing levels
    const existingLevels = await db
      .select()
      .from(levels)
      .where(eq(levels.estimateId, id));

    const maxOrder = existingLevels.reduce((max, l) => Math.max(max, l.order || 0), -1);

    const [newLevel] = await db
      .insert(levels)
      .values({
        estimateId: id,
        name: validatedData.name,
        label: validatedData.label,
        order: validatedData.order ?? maxOrder + 1,
      })
      .returning();

    return NextResponse.json(newLevel, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Error creating level:", error);
    return NextResponse.json(
      { error: "Failed to create level" },
      { status: 500 }
    );
  }
}
