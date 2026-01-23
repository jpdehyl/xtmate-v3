"use server";

import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { estimates } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import { z } from "zod";

// Schema for creating an estimate (project)
const createEstimateSchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  jobType: z.enum(["insurance", "private"]).default("private"),
  projectType: z.enum(["E", "R", "P", "A", "C", "Z"]).default("R"),
  scopes: z.string().optional(), // JSON string of scopes array
  propertyAddress: z.string().optional(),
  propertyCity: z.string().optional(),
  propertyState: z.string().max(2).optional(),
  propertyZip: z.string().max(10).optional(),
});

/**
 * Generate a project number in format: YY-XXXX-T
 * YY = 2-digit year
 * XXXX = sequential number (padded)
 * T = project type (E, R, P, A, C, Z)
 */
async function generateProjectNumber(projectType: string): Promise<string> {
  const year = new Date().getFullYear().toString().slice(-2); // "26" for 2026

  // Get the count of projects this year
  const result = await db.execute(
    sql`SELECT COUNT(*) as count FROM estimates WHERE project_number LIKE ${`${year}-%`}`
  );

  const count = Number(result.rows?.[0]?.count || 0) + 1;
  const paddedNumber = count.toString().padStart(4, "0");

  return `${year}-${paddedNumber}-${projectType}`;
}

// Schema for updating a project
const updateEstimateSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  status: z.enum(["draft", "in_progress", "completed"]).optional(),
  jobType: z.enum(["insurance", "private"]).optional(),
  projectType: z.enum(["E", "R", "P", "A", "C", "Z"]).optional(),
  scopes: z.array(z.string()).optional(),
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
 * Server action to create a new project.
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
    projectType: formData.get("projectType"),
    scopes: formData.get("scopes"),
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
    // Generate project number
    const projectNumber = await generateProjectNumber(result.data.projectType);

    // Parse scopes from JSON string
    let scopes: string[] = ["repairs"];
    if (result.data.scopes) {
      try {
        scopes = JSON.parse(result.data.scopes);
      } catch {
        // Keep default
      }
    }

    // Insert new project
    const [newEstimate] = await db
      .insert(estimates)
      .values({
        userId,
        name: result.data.name,
        jobType: result.data.jobType,
        projectType: result.data.projectType,
        projectNumber,
        scopes,
        propertyAddress: result.data.propertyAddress || null,
        propertyCity: result.data.propertyCity || null,
        propertyState: result.data.propertyState || null,
        propertyZip: result.data.propertyZip || null,
      })
      .returning();

    // Redirect to the new project
    redirect(`/dashboard/estimates/${newEstimate.id}`);
  } catch (error) {
    // If redirect throws (which it does), re-throw it
    if (error instanceof Error && error.message === "NEXT_REDIRECT") {
      throw error;
    }
    console.error("Failed to create project:", error);
    return { error: "Failed to create project. Please try again." };
  }
}

/**
 * Server action to update an existing project.
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
      return { error: "Project not found" };
    }

    // Update project
    await db
      .update(estimates)
      .set({
        ...result.data,
        updatedAt: new Date(),
      })
      .where(eq(estimates.id, id));

    return { success: true };
  } catch (error) {
    console.error("Failed to update project:", error);
    return { error: "Failed to update project" };
  }
}

/**
 * Server action to delete a project.
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
      return { error: "Project not found" };
    }

    // Delete project
    await db.delete(estimates).where(eq(estimates.id, id));

    return {};
  } catch (error) {
    console.error("Failed to delete project:", error);
    return { error: "Failed to delete project" };
  }
}

/**
 * Server action to duplicate a project.
 * Creates a copy with "(Copy)" appended to the name.
 */
export async function duplicateEstimate(id: string): Promise<{ id?: string; error?: string }> {
  // Authenticate
  const { userId } = await auth();
  if (!userId) {
    return { error: "Unauthorized" };
  }

  try {
    // Fetch the original project
    const [original] = await db
      .select()
      .from(estimates)
      .where(eq(estimates.id, id))
      .limit(1);

    if (!original || original.userId !== userId) {
      return { error: "Project not found" };
    }

    // Generate new project number
    const projectNumber = await generateProjectNumber(original.projectType || "R");

    // Create a duplicate
    const [duplicate] = await db
      .insert(estimates)
      .values({
        userId,
        name: `${original.name} (Copy)`,
        status: "draft",
        jobType: original.jobType,
        projectType: original.projectType,
        projectNumber,
        scopes: original.scopes,
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
    console.error("Failed to duplicate project:", error);
    return { error: "Failed to duplicate project" };
  }
}
