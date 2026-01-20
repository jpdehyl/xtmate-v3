import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { estimates } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

type RouteParams = { params: Promise<{ id: string }> };

// POST /api/estimates/[id]/duplicate - Duplicate an estimate
export async function POST(request: Request, { params }: RouteParams) {
  try {
    const { userId } = await auth();
    const { id } = await params;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch the original estimate
    const [original] = await db
      .select()
      .from(estimates)
      .where(and(eq(estimates.id, id), eq(estimates.userId, userId)));

    if (!original) {
      return NextResponse.json({ error: "Estimate not found" }, { status: 404 });
    }

    // Create duplicate with "(Copy)" appended to name and reset dates
    const [duplicated] = await db
      .insert(estimates)
      .values({
        userId,
        name: `${original.name} (Copy)`,
        status: "draft", // Reset to draft
        jobType: original.jobType,
        propertyAddress: original.propertyAddress,
        propertyCity: original.propertyCity,
        propertyState: original.propertyState,
        propertyZip: original.propertyZip,
        claimNumber: original.claimNumber,
        policyNumber: original.policyNumber,
        // createdAt and updatedAt will use defaults (now)
      })
      .returning();

    return NextResponse.json(duplicated, { status: 201 });
  } catch (error) {
    console.error("Error duplicating estimate:", error);
    return NextResponse.json(
      { error: "Failed to duplicate estimate" },
      { status: 500 }
    );
  }
}
