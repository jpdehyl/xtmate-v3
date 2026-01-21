"use server";

import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { estimates } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

// Schema for creating an estimate
const createEstimateSchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  jobType: z.enum(["insurance", "private"]).default("private"),
  propertyAddress: z.string().optional(),
  propertyCity: z.string().optional(),
  propertyState: z.string().max(2).optional(),
  propertyZip: z.string().max(10).optional(),
});

// Schema for updating an estimate
const updateEstimateSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  status: z.enum(["draft", "in_progress", "completed"]).optional(),
  jobType: z.enum(["insurance", "private"]).optional(),
  propertyAddress: z.string().optional(),
  propertyCity: z.string().optional(),
  propertyState: z.string().max(2).optional(),
  propertyZip: z.string().max(10).optional(),
  claimNumber: z.string().optional(),
  policyNumber: z.string().optional(),
});

export type CreateEstimateState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

export type UpdateEstimateState = {
  error?: string;
  success?: boolean;
};

/**
 * Server action to create a new estimate.
 * Authenticates the user and validates input before creating.
 */
export async function createEstimate(
  prevState: CreateEstimateState,
  formData: FormData
): Promise<CreateEstimateState> {
  // Authenticate
  const { userId } = await auth();
  if (!userId) {
    return { error: "Unauthorized" };
  }

  // Parse and validate form data
  const rawData = {
    name: formData.get("name"),
    jobType: formData.get("jobType"),
    propertyAddress: formData.get("propertyAddress"),
    propertyCity: formData.get("propertyCity"),
    propertyState: formData.get("propertyState"),
    propertyZip: formData.get("propertyZip"),
  };

  const result = createEstimateSchema.safeParse(rawData);

  if (!result.success) {
    return {
      error: "Validation failed",
      fieldErrors: result.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  try {
    // Insert new estimate
    const [newEstimate] = await db
      .insert(estimates)
      .values({
        userId,
        name: result.data.name,
        jobType: result.data.jobType,
        propertyAddress: result.data.propertyAddress || null,
        propertyCity: result.data.propertyCity || null,
        propertyState: result.data.propertyState || null,
        propertyZip: result.data.propertyZip || null,
      })
      .returning();

    // Redirect to the new estimate
    redirect(`/dashboard/estimates/${newEstimate.id}`);
  } catch (error) {
    // If redirect throws (which it does), re-throw it
    if (error instanceof Error && error.message === "NEXT_REDIRECT") {
      throw error;
    }
    console.error("Failed to create estimate:", error);
    return { error: "Failed to create estimate. Please try again." };
  }
}

/**
 * Server action to update an existing estimate.
 * Verifies ownership before updating.
 */
export async function updateEstimate(
  id: string,
  data: z.infer<typeof updateEstimateSchema>
): Promise<UpdateEstimateState> {
  // Authenticate
  const { userId } = await auth();
  if (!userId) {
    return { error: "Unauthorized" };
  }

  // Validate input
  const result = updateEstimateSchema.safeParse(data);
  if (!result.success) {
    return { error: "Invalid data" };
  }

  try {
    // Verify ownership and update
    const [existing] = await db
      .select({ userId: estimates.userId })
      .from(estimates)
      .where(eq(estimates.id, id))
      .limit(1);

    if (!existing || existing.userId !== userId) {
      return { error: "Estimate not found" };
    }

    // Update estimate
    await db
      .update(estimates)
      .set({
        ...result.data,
        updatedAt: new Date(),
      })
      .where(eq(estimates.id, id));

    return { success: true };
  } catch (error) {
    console.error("Failed to update estimate:", error);
    return { error: "Failed to update estimate" };
  }
}

/**
 * Server action to delete an estimate.
 * Verifies ownership before deleting.
 */
export async function deleteEstimate(id: string): Promise<{ error?: string }> {
  // Authenticate
  const { userId } = await auth();
  if (!userId) {
    return { error: "Unauthorized" };
  }

  try {
    // Verify ownership
    const [existing] = await db
      .select({ userId: estimates.userId })
      .from(estimates)
      .where(eq(estimates.id, id))
      .limit(1);

    if (!existing || existing.userId !== userId) {
      return { error: "Estimate not found" };
    }

    // Delete estimate
    await db.delete(estimates).where(eq(estimates.id, id));

    return {};
  } catch (error) {
    console.error("Failed to delete estimate:", error);
    return { error: "Failed to delete estimate" };
  }
}

/**
 * Server action to duplicate an estimate.
 * Creates a copy with "(Copy)" appended to the name.
 */
export async function duplicateEstimate(id: string): Promise<{ id?: string; error?: string }> {
  // Authenticate
  const { userId } = await auth();
  if (!userId) {
    return { error: "Unauthorized" };
  }

  try {
    // Fetch the original estimate
    const [original] = await db
      .select()
      .from(estimates)
      .where(eq(estimates.id, id))
      .limit(1);

    if (!original || original.userId !== userId) {
      return { error: "Estimate not found" };
    }

    // Create a duplicate
    const [duplicate] = await db
      .insert(estimates)
      .values({
        userId,
        name: `${original.name} (Copy)`,
        status: "draft",
        jobType: original.jobType,
        propertyAddress: original.propertyAddress,
        propertyCity: original.propertyCity,
        propertyState: original.propertyState,
        propertyZip: original.propertyZip,
        claimNumber: original.claimNumber,
        policyNumber: original.policyNumber,
      })
      .returning();

    return { id: duplicate.id };
  } catch (error) {
    console.error("Failed to duplicate estimate:", error);
    return { error: "Failed to duplicate estimate" };
  }
}
