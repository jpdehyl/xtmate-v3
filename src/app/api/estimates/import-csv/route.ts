import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { estimates } from "@/lib/db/schema";
import { z } from "zod";
import { checkRateLimit } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";

const csvImportSchema = z.object({
  mapping: z.object({
    name: z.string(),
    propertyAddress: z.string().optional(),
    propertyCity: z.string().optional(),
    propertyState: z.string().optional(),
    propertyZip: z.string().optional(),
    claimNumber: z.string().optional(),
    policyNumber: z.string().optional(),
    jobType: z.string().optional(),
  }),
  rows: z.array(z.record(z.string())),
});

export async function POST(request: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rateLimit = checkRateLimit(`estimates:import:${userId}`, { windowMs: 60000, maxRequests: 5 });
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: "Too many requests" },
        { status: 429, headers: { "Retry-After": String(Math.ceil(rateLimit.resetIn / 1000)) } }
      );
    }

    const body = await request.json();
    const validatedData = csvImportSchema.parse(body);

    const { mapping, rows } = validatedData;
    const estimateIds: string[] = [];
    const errors: Array<{ row: number; error: string }> = [];

    // Process each row
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];

      try {
        // Extract values using mapping
        const name = row[mapping.name]?.trim();
        if (!name) {
          errors.push({ row: i + 1, error: "Missing project name" });
          continue;
        }

        const propertyAddress = mapping.propertyAddress ? row[mapping.propertyAddress]?.trim() : undefined;
        const propertyCity = mapping.propertyCity ? row[mapping.propertyCity]?.trim() : undefined;
        const propertyState = mapping.propertyState ? row[mapping.propertyState]?.trim() : undefined;
        const propertyZip = mapping.propertyZip ? row[mapping.propertyZip]?.trim() : undefined;
        const claimNumber = mapping.claimNumber ? row[mapping.claimNumber]?.trim() : undefined;
        const policyNumber = mapping.policyNumber ? row[mapping.policyNumber]?.trim() : undefined;

        // Determine job type
        let jobType: "insurance" | "private" = "private";
        if (mapping.jobType) {
          const jobTypeValue = row[mapping.jobType]?.trim().toLowerCase();
          if (jobTypeValue === "insurance" || jobTypeValue === "ins" || jobTypeValue === "i") {
            jobType = "insurance";
          }
        } else if (claimNumber) {
          // Default to insurance if claim number provided
          jobType = "insurance";
        }

        // Create the estimate
        const [newEstimate] = await db
          .insert(estimates)
          .values({
            userId,
            name,
            jobType,
            status: "draft",
            propertyAddress: propertyAddress || null,
            propertyCity: propertyCity || null,
            propertyState: propertyState || null,
            propertyZip: propertyZip || null,
            claimNumber: claimNumber || null,
            policyNumber: policyNumber || null,
          })
          .returning();

        estimateIds.push(newEstimate.id);
      } catch (err) {
        errors.push({
          row: i + 1,
          error: err instanceof Error ? err.message : "Unknown error",
        });
      }
    }

    logger.info("CSV import completed", {
      userId,
      created: estimateIds.length,
      errors: errors.length,
      total: rows.length,
    });

    return NextResponse.json({
      success: true,
      created: estimateIds.length,
      errors,
      estimateIds,
    }, { status: 201 });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid CSV data format", details: error.errors },
        { status: 400 }
      );
    }
    logger.error("Failed to import CSV", error);
    return NextResponse.json(
      { error: "Failed to import estimates" },
      { status: 500 }
    );
  }
}
