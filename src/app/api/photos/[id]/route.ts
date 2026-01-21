import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { estimates, photos, rooms } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { z } from "zod";
import { del } from "@vercel/blob";

const PHOTO_TYPES = ["BEFORE", "DURING", "AFTER", "DAMAGE", "EQUIPMENT", "OVERVIEW"] as const;

const updatePhotoSchema = z.object({
  roomId: z.string().uuid().nullable().optional(),
  annotationId: z.string().uuid().nullable().optional(),
  photoType: z.enum(PHOTO_TYPES).nullable().optional(),
  caption: z.string().max(500).nullable().optional(),
  order: z.number().optional(),
});

type RouteParams = { params: Promise<{ id: string }> };

// GET /api/photos/[id] - Get a single photo
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { userId } = await auth();
    const { id } = await params;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [photo] = await db.select().from(photos).where(eq(photos.id, id));

    if (!photo || !photo.estimateId) {
      return NextResponse.json({ error: "Photo not found" }, { status: 404 });
    }

    // Verify ownership through estimate
    const [estimate] = await db
      .select()
      .from(estimates)
      .where(and(eq(estimates.id, photo.estimateId), eq(estimates.userId, userId)));

    if (!estimate) {
      return NextResponse.json({ error: "Photo not found" }, { status: 404 });
    }

    return NextResponse.json(photo);
  } catch (error) {
    console.error("Error fetching photo:", error);
    return NextResponse.json(
      { error: "Failed to fetch photo" },
      { status: 500 }
    );
  }
}

// PATCH /api/photos/[id] - Update a photo
export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const { userId } = await auth();
    const { id } = await params;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [existingPhoto] = await db.select().from(photos).where(eq(photos.id, id));

    if (!existingPhoto || !existingPhoto.estimateId) {
      return NextResponse.json({ error: "Photo not found" }, { status: 404 });
    }

    const photoEstimateId = existingPhoto.estimateId;

    // Verify ownership through estimate
    const [estimate] = await db
      .select()
      .from(estimates)
      .where(
        and(eq(estimates.id, photoEstimateId), eq(estimates.userId, userId))
      );

    if (!estimate) {
      return NextResponse.json({ error: "Photo not found" }, { status: 404 });
    }

    const body = await request.json();
    const validatedData = updatePhotoSchema.parse(body);

    // If roomId is provided, verify it belongs to the same estimate
    if (validatedData.roomId) {
      const [room] = await db
        .select()
        .from(rooms)
        .where(
          and(
            eq(rooms.id, validatedData.roomId),
            eq(rooms.estimateId, photoEstimateId)
          )
        );

      if (!room) {
        return NextResponse.json(
          { error: "Room not found or doesn't belong to this estimate" },
          { status: 400 }
        );
      }
    }

    const [updatedPhoto] = await db
      .update(photos)
      .set({
        ...(validatedData.roomId !== undefined && { roomId: validatedData.roomId }),
        ...(validatedData.annotationId !== undefined && {
          annotationId: validatedData.annotationId,
        }),
        ...(validatedData.photoType !== undefined && {
          photoType: validatedData.photoType,
        }),
        ...(validatedData.caption !== undefined && { caption: validatedData.caption }),
        ...(validatedData.order !== undefined && { order: validatedData.order }),
      })
      .where(eq(photos.id, id))
      .returning();

    return NextResponse.json(updatedPhoto);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Error updating photo:", error);
    return NextResponse.json(
      { error: "Failed to update photo" },
      { status: 500 }
    );
  }
}

// DELETE /api/photos/[id] - Delete a photo
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const { userId } = await auth();
    const { id } = await params;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [existingPhoto] = await db.select().from(photos).where(eq(photos.id, id));

    if (!existingPhoto || !existingPhoto.estimateId) {
      return NextResponse.json({ error: "Photo not found" }, { status: 404 });
    }

    // Verify ownership through estimate
    const [estimate] = await db
      .select()
      .from(estimates)
      .where(
        and(eq(estimates.id, existingPhoto.estimateId), eq(estimates.userId, userId))
      );

    if (!estimate) {
      return NextResponse.json({ error: "Photo not found" }, { status: 404 });
    }

    // Delete from Vercel Blob
    try {
      await del(existingPhoto.url);
    } catch (blobError) {
      console.error("Error deleting from blob storage:", blobError);
      // Continue with database deletion even if blob deletion fails
    }

    // Delete from database
    await db.delete(photos).where(eq(photos.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting photo:", error);
    return NextResponse.json(
      { error: "Failed to delete photo" },
      { status: 500 }
    );
  }
}
