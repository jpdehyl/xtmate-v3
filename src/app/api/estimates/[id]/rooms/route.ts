import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { estimates, rooms, levels } from "@/lib/db/schema";
import { eq, and, asc } from "drizzle-orm";
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

const createRoomSchema = z.object({
  levelId: z.string().uuid().optional(),
  name: z.string().min(1).max(100),
  category: z.string().optional(),
  lengthIn: z.number().optional(),
  widthIn: z.number().optional(),
  heightIn: z.number().optional(),
  squareFeet: z.number().optional(),
  cubicFeet: z.number().optional(),
  perimeterLf: z.number().optional(),
  wallSf: z.number().optional(),
  ceilingSf: z.number().optional(),
  floorMaterial: z.string().optional(),
  wallMaterial: z.string().optional(),
  ceilingMaterial: z.string().optional(),
  geometry: geometrySchema,
  order: z.number().optional(),
});

type RouteParams = { params: Promise<{ id: string }> };

// GET /api/estimates/[id]/rooms - Get all rooms for an estimate
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

    // Optional filter by levelId
    const url = new URL(request.url);
    const levelId = url.searchParams.get("levelId");

    let roomsList;
    if (levelId) {
      roomsList = await db
        .select()
        .from(rooms)
        .where(and(eq(rooms.estimateId, id), eq(rooms.levelId, levelId)))
        .orderBy(asc(rooms.order));
    } else {
      roomsList = await db
        .select()
        .from(rooms)
        .where(eq(rooms.estimateId, id))
        .orderBy(asc(rooms.order));
    }

    return NextResponse.json(roomsList);
  } catch (error) {
    console.error("Error fetching rooms:", error);
    return NextResponse.json(
      { error: "Failed to fetch rooms" },
      { status: 500 }
    );
  }
}

// POST /api/estimates/[id]/rooms - Create a new room
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
    const validatedData = createRoomSchema.parse(body);

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

    // Get max order for existing rooms
    const existingRooms = await db
      .select()
      .from(rooms)
      .where(eq(rooms.estimateId, id));

    const maxOrder = existingRooms.reduce((max, r) => Math.max(max, r.order || 0), -1);

    // Calculate derived values if dimensions are provided
    let squareFeet = validatedData.squareFeet;
    let cubicFeet = validatedData.cubicFeet;
    let perimeterLf = validatedData.perimeterLf;
    let wallSf = validatedData.wallSf;
    let ceilingSf = validatedData.ceilingSf;

    if (validatedData.lengthIn && validatedData.widthIn) {
      const lengthFt = validatedData.lengthIn / 12;
      const widthFt = validatedData.widthIn / 12;
      squareFeet = squareFeet ?? lengthFt * widthFt;
      perimeterLf = perimeterLf ?? 2 * (lengthFt + widthFt);
      ceilingSf = ceilingSf ?? squareFeet;

      if (validatedData.heightIn) {
        const heightFt = validatedData.heightIn / 12;
        cubicFeet = cubicFeet ?? squareFeet * heightFt;
        wallSf = wallSf ?? perimeterLf * heightFt;
      }
    }

    const [newRoom] = await db
      .insert(rooms)
      .values({
        estimateId: id,
        levelId: validatedData.levelId,
        name: validatedData.name,
        category: validatedData.category,
        lengthIn: validatedData.lengthIn,
        widthIn: validatedData.widthIn,
        heightIn: validatedData.heightIn ?? 96, // 8ft default
        squareFeet,
        cubicFeet,
        perimeterLf,
        wallSf,
        ceilingSf,
        floorMaterial: validatedData.floorMaterial,
        wallMaterial: validatedData.wallMaterial,
        ceilingMaterial: validatedData.ceilingMaterial,
        geometry: validatedData.geometry,
        order: validatedData.order ?? maxOrder + 1,
      })
      .returning();

    return NextResponse.json(newRoom, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Error creating room:", error);
    return NextResponse.json(
      { error: "Failed to create room" },
      { status: 500 }
    );
  }
}
