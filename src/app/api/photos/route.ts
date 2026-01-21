import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { estimates, photos, rooms } from "@/lib/db/schema";
import { eq, and, asc, desc } from "drizzle-orm";
import { z } from "zod";
import { put } from "@vercel/blob";

const PHOTO_TYPES = ["BEFORE", "DURING", "AFTER", "DAMAGE", "EQUIPMENT", "OVERVIEW"] as const;

const createPhotoSchema = z.object({
  estimateId: z.string().uuid(),
  roomId: z.string().uuid().optional(),
  annotationId: z.string().uuid().optional(),
  photoType: z.enum(PHOTO_TYPES).optional(),
  caption: z.string().max(500).optional(),
  takenAt: z.string().datetime().optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
});

// GET /api/photos - Get photos for an estimate
export async function GET(request: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);
    const estimateId = url.searchParams.get("estimateId");
    const photoType = url.searchParams.get("photoType");
    const roomId = url.searchParams.get("roomId");

    if (!estimateId) {
      return NextResponse.json(
        { error: "estimateId is required" },
        { status: 400 }
      );
    }

    // Verify ownership of the estimate
    const [estimate] = await db
      .select()
      .from(estimates)
      .where(and(eq(estimates.id, estimateId), eq(estimates.userId, userId)));

    if (!estimate) {
      return NextResponse.json({ error: "Estimate not found" }, { status: 404 });
    }

    // Build query with optional filters
    let photosList;

    if (photoType && roomId) {
      photosList = await db
        .select()
        .from(photos)
        .where(
          and(
            eq(photos.estimateId, estimateId),
            eq(photos.photoType, photoType as typeof PHOTO_TYPES[number]),
            eq(photos.roomId, roomId)
          )
        )
        .orderBy(asc(photos.order), desc(photos.createdAt));
    } else if (photoType) {
      photosList = await db
        .select()
        .from(photos)
        .where(
          and(
            eq(photos.estimateId, estimateId),
            eq(photos.photoType, photoType as typeof PHOTO_TYPES[number])
          )
        )
        .orderBy(asc(photos.order), desc(photos.createdAt));
    } else if (roomId) {
      photosList = await db
        .select()
        .from(photos)
        .where(and(eq(photos.estimateId, estimateId), eq(photos.roomId, roomId)))
        .orderBy(asc(photos.order), desc(photos.createdAt));
    } else {
      photosList = await db
        .select()
        .from(photos)
        .where(eq(photos.estimateId, estimateId))
        .orderBy(asc(photos.order), desc(photos.createdAt));
    }

    return NextResponse.json(photosList);
  } catch (error) {
    console.error("Error fetching photos:", error);
    return NextResponse.json(
      { error: "Failed to fetch photos" },
      { status: 500 }
    );
  }
}

// POST /api/photos - Upload a new photo
export async function POST(request: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const metadataStr = formData.get("metadata") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Only JPEG, PNG, WebP, and HEIC are allowed." },
        { status: 400 }
      );
    }

    // Validate file size (max 10MB)
    const MAX_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 10MB." },
        { status: 400 }
      );
    }

    // Parse metadata
    let metadata;
    try {
      metadata = metadataStr ? JSON.parse(metadataStr) : {};
      metadata = createPhotoSchema.parse(metadata);
    } catch (e) {
      if (e instanceof z.ZodError) {
        return NextResponse.json(
          { error: "Validation failed", details: e.errors },
          { status: 400 }
        );
      }
      return NextResponse.json(
        { error: "Invalid metadata format" },
        { status: 400 }
      );
    }

    // Verify ownership of the estimate
    const [estimate] = await db
      .select()
      .from(estimates)
      .where(and(eq(estimates.id, metadata.estimateId), eq(estimates.userId, userId)));

    if (!estimate) {
      return NextResponse.json({ error: "Estimate not found" }, { status: 404 });
    }

    // If roomId is provided, verify it belongs to this estimate
    if (metadata.roomId) {
      const [room] = await db
        .select()
        .from(rooms)
        .where(
          and(eq(rooms.id, metadata.roomId), eq(rooms.estimateId, metadata.estimateId))
        );

      if (!room) {
        return NextResponse.json(
          { error: "Room not found or doesn't belong to this estimate" },
          { status: 400 }
        );
      }
    }

    // Generate unique filename
    const timestamp = Date.now();
    const ext = file.name.split(".").pop() || "jpg";
    const filename = `photos/${metadata.estimateId}/${timestamp}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

    // Upload to Vercel Blob
    const blob = await put(filename, file, {
      access: "public",
      addRandomSuffix: false,
    });

    // Get max order for existing photos
    const existingPhotos = await db
      .select()
      .from(photos)
      .where(eq(photos.estimateId, metadata.estimateId));

    const maxOrder = existingPhotos.reduce((max, p) => Math.max(max, p.order || 0), -1);

    // Save photo record to database
    const [newPhoto] = await db
      .insert(photos)
      .values({
        estimateId: metadata.estimateId,
        roomId: metadata.roomId,
        annotationId: metadata.annotationId,
        url: blob.url,
        thumbnailUrl: blob.url, // Using same URL for now (could resize later)
        filename: file.name,
        mimeType: file.type,
        sizeBytes: file.size,
        photoType: metadata.photoType,
        caption: metadata.caption,
        takenAt: metadata.takenAt ? new Date(metadata.takenAt) : null,
        latitude: metadata.latitude,
        longitude: metadata.longitude,
        order: maxOrder + 1,
      })
      .returning();

    return NextResponse.json(newPhoto, { status: 201 });
  } catch (error) {
    console.error("Error uploading photo:", error);
    return NextResponse.json(
      { error: "Failed to upload photo" },
      { status: 500 }
    );
  }
}
