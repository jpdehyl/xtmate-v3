import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { estimates, levels, rooms, lineItems } from "@/lib/db/schema";
import { z } from "zod";
import { checkRateLimit } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";

const esxImportSchema = z.object({
  success: z.literal(true),
  estimate: z.object({
    name: z.string(),
    claimNumber: z.string().optional(),
    policyNumber: z.string().optional(),
    dateOfLoss: z.string().optional(),
    insuredName: z.string().optional(),
    insuredPhone: z.string().optional(),
    insuredEmail: z.string().optional(),
    propertyAddress: z.string().optional(),
    propertyCity: z.string().optional(),
    propertyState: z.string().optional(),
    propertyZip: z.string().optional(),
    adjusterName: z.string().optional(),
    adjusterPhone: z.string().optional(),
    adjusterEmail: z.string().optional(),
    totalAmount: z.number().optional(),
  }),
  levels: z.array(z.object({
    name: z.string(),
    label: z.string().optional(),
  })).optional(),
  rooms: z.array(z.object({
    name: z.string(),
    levelName: z.string(),
    category: z.string().optional(),
    squareFeet: z.number().optional(),
    perimeterLf: z.number().optional(),
    wallSf: z.number().optional(),
    ceilingSf: z.number().optional(),
    heightIn: z.number().optional(),
  })).optional(),
  lineItems: z.array(z.object({
    roomName: z.string(),
    levelName: z.string(),
    selector: z.string(),
    description: z.string(),
    quantity: z.number(),
    unit: z.string(),
    unitPrice: z.number(),
    total: z.number(),
    category: z.string().optional(),
  })).optional(),
});

export async function POST(request: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rateLimit = checkRateLimit(`estimates:import:${userId}`, { windowMs: 60000, maxRequests: 10 });
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: "Too many requests" },
        { status: 429, headers: { "Retry-After": String(Math.ceil(rateLimit.resetIn / 1000)) } }
      );
    }

    const body = await request.json();
    const validatedData = esxImportSchema.parse(body);

    const esxEstimate = validatedData.estimate;
    const esxLevels = validatedData.levels || [];
    const esxRooms = validatedData.rooms || [];
    const esxLineItems = validatedData.lineItems || [];

    // Determine job type based on claim number
    const jobType = esxEstimate.claimNumber ? "insurance" : "private";

    // Create the estimate
    const [newEstimate] = await db
      .insert(estimates)
      .values({
        userId,
        name: esxEstimate.name,
        jobType,
        status: "draft",
        claimNumber: esxEstimate.claimNumber,
        policyNumber: esxEstimate.policyNumber,
        dateOfLoss: esxEstimate.dateOfLoss ? new Date(esxEstimate.dateOfLoss) : null,
        insuredName: esxEstimate.insuredName,
        insuredPhone: esxEstimate.insuredPhone,
        insuredEmail: esxEstimate.insuredEmail,
        propertyAddress: esxEstimate.propertyAddress,
        propertyCity: esxEstimate.propertyCity,
        propertyState: esxEstimate.propertyState,
        propertyZip: esxEstimate.propertyZip,
        adjusterName: esxEstimate.adjusterName,
        adjusterPhone: esxEstimate.adjusterPhone,
        adjusterEmail: esxEstimate.adjusterEmail,
      })
      .returning();

    // Create levels and build a map for room assignment
    const levelMap = new Map<string, string>(); // levelName -> levelId

    for (let i = 0; i < esxLevels.length; i++) {
      const level = esxLevels[i];
      const [newLevel] = await db
        .insert(levels)
        .values({
          estimateId: newEstimate.id,
          name: level.name,
          label: level.label || level.name,
          order: i,
        })
        .returning();

      levelMap.set(level.name, newLevel.id);
      if (level.label) {
        levelMap.set(level.label, newLevel.id);
      }
    }

    // Create rooms and build a map for line item assignment
    const roomMap = new Map<string, string>(); // `${levelName}:${roomName}` -> roomId

    for (let i = 0; i < esxRooms.length; i++) {
      const room = esxRooms[i];
      const levelId = levelMap.get(room.levelName);

      const [newRoom] = await db
        .insert(rooms)
        .values({
          estimateId: newEstimate.id,
          levelId: levelId || null,
          name: room.name,
          category: room.category,
          squareFeet: room.squareFeet,
          perimeterLf: room.perimeterLf,
          wallSf: room.wallSf,
          ceilingSf: room.ceilingSf,
          heightIn: room.heightIn || 96, // Default 8ft
          order: i,
        })
        .returning();

      roomMap.set(`${room.levelName}:${room.name}`, newRoom.id);
    }

    // Create line items
    for (let i = 0; i < esxLineItems.length; i++) {
      const item = esxLineItems[i];
      const roomId = roomMap.get(`${item.levelName}:${item.roomName}`);

      await db.insert(lineItems).values({
        estimateId: newEstimate.id,
        roomId: roomId || null,
        selector: item.selector,
        description: item.description,
        category: item.category,
        quantity: item.quantity,
        unit: item.unit,
        unitPrice: item.unitPrice,
        total: item.total,
        source: "esx_import",
        verified: false,
        order: i,
      });
    }

    logger.info("ESX import successful", {
      estimateId: newEstimate.id,
      levels: esxLevels.length,
      rooms: esxRooms.length,
      lineItems: esxLineItems.length,
    });

    return NextResponse.json({
      id: newEstimate.id,
      message: "Import successful",
      counts: {
        levels: esxLevels.length,
        rooms: esxRooms.length,
        lineItems: esxLineItems.length,
      },
    }, { status: 201 });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid ESX data format", details: error.errors },
        { status: 400 }
      );
    }
    logger.error("Failed to import ESX", error);
    return NextResponse.json(
      { error: "Failed to import estimate" },
      { status: 500 }
    );
  }
}
