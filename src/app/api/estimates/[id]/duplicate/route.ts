import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { estimates } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { auth } = await import("@clerk/nextjs/server");
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Fetch the original estimate
    const [originalEstimate] = await db
      .select()
      .from(estimates)
      .where(eq(estimates.id, id));

    if (!originalEstimate) {
      return NextResponse.json({ error: "Estimate not found" }, { status: 404 });
    }

    // Verify ownership
    if (originalEstimate.userId !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Create a duplicate with a new name
    const [duplicatedEstimate] = await db
      .insert(estimates)
      .values({
        userId,
        name: `${originalEstimate.name} (Copy)`,
        status: "draft",
        jobType: originalEstimate.jobType,
        propertyAddress: originalEstimate.propertyAddress,
        propertyCity: originalEstimate.propertyCity,
        propertyState: originalEstimate.propertyState,
        propertyZip: originalEstimate.propertyZip,
        claimNumber: originalEstimate.claimNumber,
        policyNumber: originalEstimate.policyNumber,
      })
      .returning();

    return NextResponse.json(duplicatedEstimate, { status: 201 });
  } catch (error) {
    console.error("Error duplicating estimate:", error);
    return NextResponse.json(
      { error: "Failed to duplicate estimate" },
      { status: 500 }
    );
  }
}
