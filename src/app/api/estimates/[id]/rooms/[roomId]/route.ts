import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { estimates, rooms, levels } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { z } from "zod";

// Room geometry type for sketch editor
const geometrySchema = z.object({
  walls: z.array(z.object({
    id: z.string(),
    startX: z.number(),
    startY: z.number(),
    endX: z.number(),
    endY: z.number(),
    thickness: z.number().optional(),
  })).optional(),
  openings: z.array(z.object({
    id: z.string(),
    wallId: z.string(),
    type: z.enum(["door", "window"]),
    position: z.number(),
    width: z.number(),
    subtype: z.string().optional(),
  })).optional(),
  fixtures: z.array(z.object({
    id: z.string(),
    type: z.string(),
    x: z.number(),
    y: z.number(),
    rotation: z.number().optional(),
  })).optional(),
  staircases: z.array(z.object({
    id: z.string(),
    type: z.enum(["straight", "l-shaped", "u-shaped"]),
    x: z.number(),
    y: z.number(),
    width: z.number(),
    length: z.number(),
    rotation: z.number().optional(),
    treads: z.number().optional(),
  })).optional(),
  polygon: z.array(z.object({
    x: z.number(),
    y: z.number(),
  })).optional(),
}).optional();

const updateRoomSchema = z.object({
  levelId: z.string().uuid().optional().nullable(),
  name: z.string().min(1).max(100).optional(),
  category: z.string().optional().nullable(),
  lengthIn: z.number().optional().nullable(),
  widthIn: z.number().optional().nullable(),
  heightIn: z.number().optional().nullable(),
  squareFeet: z.number().optional().nullable(),
  cubicFeet: z.number().optional().nullable(),
  perimeterLf: z.number().optional().nullable(),
  wallSf: z.number().optional().nullable(),
  ceilingSf: z.number().optional().nullable(),
  floorMaterial: z.string().optional().nullable(),
  wallMaterial: z.string().optional().nullable(),
  ceilingMaterial: z.string().optional().nullable(),
  geometry: geometrySchema,
  order: z.number().optional(),
});

type RouteParams = { params: Promise<{ id: string; roomId: string }> };

// GET /api/estimates/[id]/rooms/[roomId] - Get a single room
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { userId } = await auth();
    const { id, roomId } = await params;

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

    const [room] = await db
      .select()
      .from(rooms)
      .where(and(eq(rooms.id, roomId), eq(rooms.estimateId, id)));

    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    return NextResponse.json(room);
  } catch (error) {
    console.error("Error fetching room:", error);
    return NextResponse.json(
      { error: "Failed to fetch room" },
      { status: 500 }
    );
  }
}

// PATCH /api/estimates/[id]/rooms/[roomId] - Update a room
export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const { userId } = await auth();
    const { id, roomId } = await params;

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
    const validatedData = updateRoomSchema.parse(body);

    // If levelId is provided, verify it belongs to this estimate
    if (validatedData.levelId) {
      const [level] = await db
        .select()
        .from(levels)
        .where(and(
          eq(levels.id, validatedData.levelId),
          eq(levels.estimateId, id)
        ));

      if (!level) {
        return NextResponse.json(
          { error: "Level not found or doesn't belong to this estimate" },
          { status: 400 }
        );
      }
    }

    // Get current room values for recalculation
    const [currentRoom] = await db
      .select()
      .from(rooms)
      .where(and(eq(rooms.id, roomId), eq(rooms.estimateId, id)));

    if (!currentRoom) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    // Calculate derived values if dimensions are updated
    const lengthIn = validatedData.lengthIn ?? currentRoom.lengthIn;
    const widthIn = validatedData.widthIn ?? currentRoom.widthIn;
    const heightIn = validatedData.heightIn ?? currentRoom.heightIn;

    let updateData: Record<string, unknown> = {
      ...validatedData,
      updatedAt: new Date(),
    };

    // Recalculate if dimensions changed
    if (lengthIn && widthIn) {
      const lengthFt = lengthIn / 12;
      const widthFt = widthIn / 12;
      updateData.squareFeet = validatedData.squareFeet ?? lengthFt * widthFt;
      updateData.perimeterLf = validatedData.perimeterLf ?? 2 * (lengthFt + widthFt);
      updateData.ceilingSf = validatedData.ceilingSf ?? updateData.squareFeet;

      if (heightIn) {
        const heightFt = heightIn / 12;
        updateData.cubicFeet = validatedData.cubicFeet ?? (updateData.squareFeet as number) * heightFt;
        updateData.wallSf = validatedData.wallSf ?? (updateData.perimeterLf as number) * heightFt;
      }
    }

    const [updatedRoom] = await db
      .update(rooms)
      .set(updateData)
      .where(and(eq(rooms.id, roomId), eq(rooms.estimateId, id)))
      .returning();

    return NextResponse.json(updatedRoom);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Error updating room:", error);
    return NextResponse.json(
      { error: "Failed to update room" },
      { status: 500 }
    );
  }
}

// DELETE /api/estimates/[id]/rooms/[roomId] - Delete a room
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const { userId } = await auth();
    const { id, roomId } = await params;

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

    const [deletedRoom] = await db
      .delete(rooms)
      .where(and(eq(rooms.id, roomId), eq(rooms.estimateId, id)))
      .returning();

    if (!deletedRoom) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting room:", error);
    return NextResponse.json(
      { error: "Failed to delete room" },
      { status: 500 }
    );
  }
}
