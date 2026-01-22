import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { 
  estimates, 
  rooms, 
  levels, 
  photos, 
  pmScopeItems,
  syncQueue,
  lineItems,
} from "@/lib/db/schema";
import { eq, and, inArray, desc } from "drizzle-orm";
import { logger } from "@/lib/logger";

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { 
      estimateId, 
      deviceId, 
      syncTimestamp,
      rooms: roomsData,
      photos: photosData,
      pmScope: pmScopeData,
      levels: levelsData,
    } = body;

    if (!estimateId || !deviceId) {
      return NextResponse.json(
        { error: "estimateId and deviceId are required" },
        { status: 400 }
      );
    }

    const estimate = await db.query.estimates.findFirst({
      where: eq(estimates.id, estimateId),
    });

    if (!estimate) {
      return NextResponse.json(
        { error: "Estimate not found" },
        { status: 404 }
      );
    }

    const results = {
      levels: [] as { localId: string; serverId: string }[],
      rooms: [] as { localId: string; serverId: string }[],
      photos: [] as { localId: string; serverId: string }[],
      pmScope: [] as { localId: string; serverId: string }[],
    };

    if (levelsData && Array.isArray(levelsData)) {
      for (const level of levelsData) {
        const existingLevel = level.localId 
          ? await db.query.levels.findFirst({
              where: and(
                eq(levels.estimateId, estimateId),
                eq(levels.name, level.name)
              ),
            })
          : null;

        if (existingLevel) {
          results.levels.push({ localId: level.localId, serverId: existingLevel.id });
        } else {
          const [newLevel] = await db.insert(levels).values({
            estimateId,
            name: level.name,
            label: level.label,
            order: level.order || 0,
          }).returning();
          results.levels.push({ localId: level.localId, serverId: newLevel.id });
        }
      }
    }

    if (roomsData && Array.isArray(roomsData)) {
      for (const room of roomsData) {
        const levelMapping = results.levels.find(l => l.localId === room.levelLocalId);
        const levelId = levelMapping?.serverId || room.levelId;

        const existingRoom = room.localId
          ? await db.query.rooms.findFirst({
              where: and(
                eq(rooms.estimateId, estimateId),
                eq(rooms.name, room.name),
                levelId ? eq(rooms.levelId, levelId) : undefined
              ),
            })
          : null;

        if (existingRoom) {
          await db.update(rooms)
            .set({
              lengthIn: room.dimensions?.length ? room.dimensions.length * 12 : existingRoom.lengthIn,
              widthIn: room.dimensions?.width ? room.dimensions.width * 12 : existingRoom.widthIn,
              heightIn: room.dimensions?.height ? room.dimensions.height * 12 : existingRoom.heightIn,
              squareFeet: room.dimensions?.squareFeet,
              geometry: room.sketch,
              updatedAt: new Date(),
            })
            .where(eq(rooms.id, existingRoom.id));
          results.rooms.push({ localId: room.localId, serverId: existingRoom.id });
        } else {
          const [newRoom] = await db.insert(rooms).values({
            estimateId,
            levelId,
            name: room.name,
            category: room.category,
            lengthIn: room.dimensions?.length ? room.dimensions.length * 12 : null,
            widthIn: room.dimensions?.width ? room.dimensions.width * 12 : null,
            heightIn: room.dimensions?.height ? room.dimensions.height * 12 : 96,
            squareFeet: room.dimensions?.squareFeet,
            geometry: room.sketch,
            order: room.order || 0,
          }).returning();
          results.rooms.push({ localId: room.localId, serverId: newRoom.id });
        }
      }
    }

    if (photosData && Array.isArray(photosData)) {
      for (const photo of photosData) {
        const roomMapping = results.rooms.find(r => r.localId === photo.roomLocalId);
        const roomId = roomMapping?.serverId || photo.roomId;

        const [newPhoto] = await db.insert(photos).values({
          estimateId,
          roomId,
          url: photo.url,
          thumbnailUrl: photo.thumbnailUrl,
          filename: photo.filename,
          mimeType: photo.mimeType,
          photoType: photo.type?.toUpperCase() || 'DAMAGE',
          caption: photo.caption,
          takenAt: photo.timestamp ? new Date(photo.timestamp) : new Date(),
          latitude: photo.geoLocation?.lat,
          longitude: photo.geoLocation?.lng,
        }).returning();
        results.photos.push({ localId: photo.localId, serverId: newPhoto.id });
      }
    }

    if (pmScopeData && Array.isArray(pmScopeData)) {
      for (const scope of pmScopeData) {
        const roomMapping = results.rooms.find(r => r.localId === scope.roomLocalId);
        const roomId = roomMapping?.serverId || scope.roomId;

        const photoIds = scope.photoLocalIds?.map((localId: string) => {
          const mapping = results.photos.find(p => p.localId === localId);
          return mapping?.serverId || localId;
        });

        const [newScope] = await db.insert(pmScopeItems).values({
          estimateId,
          roomId,
          damageType: scope.damageType,
          severity: scope.severity,
          category: scope.category,
          affectedArea: scope.affectedArea,
          notes: scope.notes,
          suggestedActions: scope.suggestedActions,
          photoIds,
          capturedAt: scope.capturedAt ? new Date(scope.capturedAt) : new Date(),
          capturedBy: userId,
          deviceId,
          localId: scope.localId,
        }).returning();
        results.pmScope.push({ localId: scope.localId, serverId: newScope.id });
      }
    }

    await db.update(estimates)
      .set({
        workflowStatus: 'pm_in_progress',
        updatedAt: new Date(),
      })
      .where(eq(estimates.id, estimateId));

    logger.info("Sync completed", {
      estimateId,
      deviceId,
      levelsCount: results.levels.length,
      roomsCount: results.rooms.length,
      photosCount: results.photos.length,
      pmScopeCount: results.pmScope.length,
    });

    return NextResponse.json({
      success: true,
      syncTimestamp: new Date().toISOString(),
      mappings: results,
    });

  } catch (error) {
    logger.error("Sync failed", { error });
    return NextResponse.json(
      { error: "Sync failed" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const estimateId = searchParams.get("estimateId");
    const since = searchParams.get("since");

    if (!estimateId) {
      return NextResponse.json(
        { error: "estimateId is required" },
        { status: 400 }
      );
    }

    const estimate = await db.query.estimates.findFirst({
      where: eq(estimates.id, estimateId),
    });

    if (!estimate) {
      return NextResponse.json(
        { error: "Estimate not found" },
        { status: 404 }
      );
    }

    const estimateLevels = await db.query.levels.findMany({
      where: eq(levels.estimateId, estimateId),
      orderBy: levels.order,
    });

    const estimateRooms = await db.query.rooms.findMany({
      where: eq(rooms.estimateId, estimateId),
      orderBy: rooms.order,
    });

    const estimatePhotos = await db.query.photos.findMany({
      where: eq(photos.estimateId, estimateId),
      orderBy: photos.order,
    });

    const estimatePmScope = await db.query.pmScopeItems.findMany({
      where: eq(pmScopeItems.estimateId, estimateId),
      orderBy: desc(pmScopeItems.capturedAt),
    });

    const estimateLineItems = await db.query.lineItems.findMany({
      where: eq(lineItems.estimateId, estimateId),
      orderBy: lineItems.order,
    });

    return NextResponse.json({
      estimate,
      levels: estimateLevels,
      rooms: estimateRooms,
      photos: estimatePhotos,
      pmScope: estimatePmScope,
      lineItems: estimateLineItems,
      serverTimestamp: new Date().toISOString(),
    });

  } catch (error) {
    logger.error("Sync pull failed", { error });
    return NextResponse.json(
      { error: "Failed to pull data" },
      { status: 500 }
    );
  }
}
