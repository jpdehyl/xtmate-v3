import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { pmScopeItems, rooms } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { logger } from "@/lib/logger";

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const estimateId = searchParams.get("estimateId");

    if (!estimateId) {
      return NextResponse.json(
        { error: "estimateId is required" },
        { status: 400 }
      );
    }

    const items = await db.query.pmScopeItems.findMany({
      where: eq(pmScopeItems.estimateId, estimateId),
      orderBy: desc(pmScopeItems.capturedAt),
    });

    const roomIds = [...new Set(items.filter(i => i.roomId).map(i => i.roomId!))];
    const roomsData = roomIds.length > 0 
      ? await db.query.rooms.findMany({
          where: eq(rooms.estimateId, estimateId),
        })
      : [];

    const roomsMap = new Map(roomsData.map(r => [r.id, r]));

    const itemsWithRooms = items.map(item => ({
      ...item,
      room: item.roomId ? roomsMap.get(item.roomId) : null,
    }));

    return NextResponse.json(itemsWithRooms);

  } catch (error) {
    logger.error("Failed to fetch PM scope items", { error });
    return NextResponse.json(
      { error: "Failed to fetch items" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { 
      estimateId,
      roomId,
      damageType,
      severity,
      category,
      affectedArea,
      notes,
      suggestedActions,
      photoIds,
    } = body;

    if (!estimateId) {
      return NextResponse.json(
        { error: "estimateId is required" },
        { status: 400 }
      );
    }

    const [newItem] = await db.insert(pmScopeItems).values({
      estimateId,
      roomId,
      damageType,
      severity,
      category,
      affectedArea,
      notes,
      suggestedActions,
      photoIds,
      capturedBy: userId,
      capturedAt: new Date(),
    }).returning();

    logger.info("PM scope item created", { id: newItem.id, estimateId });

    return NextResponse.json(newItem, { status: 201 });

  } catch (error) {
    logger.error("Failed to create PM scope item", { error });
    return NextResponse.json(
      { error: "Failed to create item" },
      { status: 500 }
    );
  }
}
