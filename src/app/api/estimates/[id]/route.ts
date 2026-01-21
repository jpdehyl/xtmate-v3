import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { estimates } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { z } from "zod";
import { checkRateLimit } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";

const updateEstimateSchema = z.object({
  name: z.string().min(1).optional(),
  status: z.enum(["draft", "in_progress", "completed"]).optional(),
  jobType: z.enum(["insurance", "private"]).optional(),
  propertyAddress: z.string().optional(),
  propertyCity: z.string().optional(),
  propertyState: z.string().optional(),
  propertyZip: z.string().optional(),
  claimNumber: z.string().min(1).optional(),
  policyNumber: z.string().min(1).optional(),
  carrierId: z.string().uuid().nullable().optional(),
}).refine(
  (data) => {
    if (data.jobType === "insurance") {
      return data.claimNumber !== undefined && data.claimNumber !== null && data.claimNumber.length > 0;
    }
    return true;
  },
  {
    message: "Claim number is required for insurance jobs",
    path: ["claimNumber"],
  }
);

type RouteParams = { params: Promise<{ id: string }> };

// GET /api/estimates/[id] - Get single estimate
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { userId } = await auth();
    const { id } = await params;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rateLimit = checkRateLimit(`estimate:${userId}`, { windowMs: 60000, maxRequests: 120 });
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: "Too many requests" },
        { status: 429, headers: { "Retry-After": String(Math.ceil(rateLimit.resetIn / 1000)) } }
      );
    }

    const [estimate] = await db
      .select()
      .from(estimates)
      .where(and(eq(estimates.id, id), eq(estimates.userId, userId)));

    if (!estimate) {
      return NextResponse.json({ error: "Estimate not found" }, { status: 404 });
    }

    return NextResponse.json(estimate);
  } catch (error) {
    logger.error("Failed to fetch estimate", error);
    return NextResponse.json(
      { error: "Failed to fetch estimate" },
      { status: 500 }
    );
  }
}

// PATCH /api/estimates/[id] - Update estimate
export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const { userId } = await auth();
    const { id } = await params;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rateLimit = checkRateLimit(`estimate:update:${userId}`, { windowMs: 60000, maxRequests: 60 });
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: "Too many requests" },
        { status: 429, headers: { "Retry-After": String(Math.ceil(rateLimit.resetIn / 1000)) } }
      );
    }

    const body = await request.json();
    const validatedData = updateEstimateSchema.parse(body);

    const [updatedEstimate] = await db
      .update(estimates)
      .set({
        ...validatedData,
        updatedAt: new Date(),
      })
      .where(and(eq(estimates.id, id), eq(estimates.userId, userId)))
      .returning();

    if (!updatedEstimate) {
      return NextResponse.json({ error: "Estimate not found" }, { status: 404 });
    }

    return NextResponse.json(updatedEstimate);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }
    logger.error("Failed to update estimate", error);
    return NextResponse.json(
      { error: "Failed to update estimate" },
      { status: 500 }
    );
  }
}

// DELETE /api/estimates/[id] - Delete estimate
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const { userId } = await auth();
    const { id } = await params;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rateLimit = checkRateLimit(`estimate:delete:${userId}`, { windowMs: 60000, maxRequests: 30 });
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: "Too many requests" },
        { status: 429, headers: { "Retry-After": String(Math.ceil(rateLimit.resetIn / 1000)) } }
      );
    }

    const [deletedEstimate] = await db
      .delete(estimates)
      .where(and(eq(estimates.id, id), eq(estimates.userId, userId)))
      .returning();

    if (!deletedEstimate) {
      return NextResponse.json({ error: "Estimate not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Failed to delete estimate", error);
    return NextResponse.json(
      { error: "Failed to delete estimate" },
      { status: 500 }
    );
  }
}
