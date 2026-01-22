import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { 
  estimates, 
  levels, 
  rooms, 
  lineItems, 
  photos,
  esxExports,
} from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { generateESX, generateESXFilename } from "@/lib/esx/generator";
import { logger } from "@/lib/logger";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const estimate = await db.query.estimates.findFirst({
      where: eq(estimates.id, id),
    });

    if (!estimate) {
      return NextResponse.json(
        { error: "Estimate not found" },
        { status: 404 }
      );
    }

    const estimateLevels = await db.query.levels.findMany({
      where: eq(levels.estimateId, id),
      orderBy: levels.order,
    });

    const estimateRooms = await db.query.rooms.findMany({
      where: eq(rooms.estimateId, id),
      orderBy: rooms.order,
    });

    const estimateLineItems = await db.query.lineItems.findMany({
      where: eq(lineItems.estimateId, id),
      orderBy: lineItems.order,
    });

    const estimatePhotos = await db.query.photos.findMany({
      where: eq(photos.estimateId, id),
      orderBy: photos.order,
    });

    const esxContent = generateESX({
      estimate: {
        ...estimate,
        levels: estimateLevels,
        rooms: estimateRooms,
        lineItems: estimateLineItems,
        photos: estimatePhotos,
      },
      includePhotos: true,
    });

    const filename = generateESXFilename(estimate);

    const totalAmount = estimateLineItems.reduce((sum, item) => sum + (item.total || 0), 0);

    const existingExports = await db.query.esxExports.findMany({
      where: eq(esxExports.estimateId, id),
    });

    await db.insert(esxExports).values({
      estimateId: id,
      filename,
      fileSizeBytes: Buffer.byteLength(esxContent, 'utf8'),
      roomCount: estimateRooms.length,
      lineItemCount: estimateLineItems.length,
      photoCount: estimatePhotos.length,
      totalAmount,
      exportedBy: userId,
      version: existingExports.length + 1,
    });

    await db.update(estimates)
      .set({
        workflowStatus: 'exported',
        updatedAt: new Date(),
      })
      .where(eq(estimates.id, id));

    logger.info("ESX export generated", { 
      estimateId: id, 
      filename,
      roomCount: estimateRooms.length,
      lineItemCount: estimateLineItems.length,
    });

    return new NextResponse(esxContent, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });

  } catch (error) {
    logger.error("ESX export failed", { error });
    return NextResponse.json(
      { error: "Failed to generate ESX" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const { includePhotos = true, notes } = await request.json();

    const estimate = await db.query.estimates.findFirst({
      where: eq(estimates.id, id),
    });

    if (!estimate) {
      return NextResponse.json(
        { error: "Estimate not found" },
        { status: 404 }
      );
    }

    const estimateLevels = await db.query.levels.findMany({
      where: eq(levels.estimateId, id),
      orderBy: levels.order,
    });

    const estimateRooms = await db.query.rooms.findMany({
      where: eq(rooms.estimateId, id),
      orderBy: rooms.order,
    });

    const estimateLineItems = await db.query.lineItems.findMany({
      where: eq(lineItems.estimateId, id),
      orderBy: lineItems.order,
    });

    const estimatePhotos = await db.query.photos.findMany({
      where: eq(photos.estimateId, id),
      orderBy: photos.order,
    });

    const esxContent = generateESX({
      estimate: {
        ...estimate,
        levels: estimateLevels,
        rooms: estimateRooms,
        lineItems: estimateLineItems,
        photos: estimatePhotos,
      },
      includePhotos,
    });

    const filename = generateESXFilename(estimate);
    const totalAmount = estimateLineItems.reduce((sum, item) => sum + (item.total || 0), 0);

    const existingExports = await db.query.esxExports.findMany({
      where: eq(esxExports.estimateId, id),
    });

    const [exportRecord] = await db.insert(esxExports).values({
      estimateId: id,
      filename,
      fileSizeBytes: Buffer.byteLength(esxContent, 'utf8'),
      roomCount: estimateRooms.length,
      lineItemCount: estimateLineItems.length,
      photoCount: estimatePhotos.length,
      totalAmount,
      exportedBy: userId,
      version: existingExports.length + 1,
      notes,
    }).returning();

    await db.update(estimates)
      .set({
        workflowStatus: 'exported',
        updatedAt: new Date(),
      })
      .where(eq(estimates.id, id));

    return NextResponse.json({
      success: true,
      export: exportRecord,
      filename,
      content: esxContent,
    });

  } catch (error) {
    logger.error("ESX export failed", { error });
    return NextResponse.json(
      { error: "Failed to generate ESX" },
      { status: 500 }
    );
  }
}
