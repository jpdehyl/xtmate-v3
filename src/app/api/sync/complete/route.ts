import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { estimates } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { logger } from "@/lib/logger";

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { estimateId, notes } = body;

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

    await db.update(estimates)
      .set({
        workflowStatus: 'pm_completed',
        pmCompletedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(estimates.id, estimateId));

    logger.info("PM completed site capture", { estimateId, userId });

    return NextResponse.json({
      success: true,
      message: "Site capture completed. Ready for estimator review.",
      workflowStatus: 'pm_completed',
    });

  } catch (error) {
    logger.error("Failed to mark PM complete", { error });
    return NextResponse.json(
      { error: "Failed to complete" },
      { status: 500 }
    );
  }
}
