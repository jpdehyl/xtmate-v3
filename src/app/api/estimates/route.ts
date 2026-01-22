import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { estimates } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { z } from "zod";
import { checkRateLimit } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";

const baseEstimateSchema = z.object({
  name: z.string().min(1, "Name is required"),
  jobType: z.enum(["insurance", "private"]).default("private"),
  propertyAddress: z.string().optional(),
  propertyCity: z.string().optional(),
  propertyState: z.string().optional(),
  propertyZip: z.string().optional(),
  claimNumber: z.string().optional(),
  policyNumber: z.string().optional(),
  carrierId: z.string().uuid().nullable().optional(),
});

const createEstimateSchema = baseEstimateSchema.refine(
  (data) => {
    if (data.jobType === "insurance") {
      return data.claimNumber && data.claimNumber.length > 0;
    }
    return true;
  },
  {
    message: "Claim number is required for insurance jobs",
    path: ["claimNumber"],
  }
);

// GET /api/estimates - List user's estimates
export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rateLimit = checkRateLimit(`estimates:${userId}`, { windowMs: 60000, maxRequests: 60 });
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: "Too many requests" },
        { status: 429, headers: { "Retry-After": String(Math.ceil(rateLimit.resetIn / 1000)) } }
      );
    }

    const userEstimates = await db
      .select()
      .from(estimates)
      .where(eq(estimates.userId, userId))
      .orderBy(desc(estimates.updatedAt));

    return NextResponse.json(userEstimates);
  } catch (error) {
    logger.error("Failed to fetch estimates", error);
    return NextResponse.json(
      { error: "Failed to fetch estimates" },
      { status: 500 }
    );
  }
}

// POST /api/estimates - Create new estimate
export async function POST(request: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rateLimit = checkRateLimit(`estimates:create:${userId}`, { windowMs: 60000, maxRequests: 30 });
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: "Too many requests" },
        { status: 429, headers: { "Retry-After": String(Math.ceil(rateLimit.resetIn / 1000)) } }
      );
    }

    const body = await request.json();
    const validatedData = createEstimateSchema.parse(body);

    const [newEstimate] = await db
      .insert(estimates)
      .values({
        ...validatedData,
        userId,
      })
      .returning();

    return NextResponse.json(newEstimate, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }
    logger.error("Failed to create estimate", error);
    return NextResponse.json(
      { error: "Failed to create estimate" },
      { status: 500 }
    );
  }
}
