import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { priceLists } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { z } from "zod";

const createPriceListSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().optional(),
  region: z.string().optional(),
  effectiveDate: z.string().optional(), // ISO date string
  expirationDate: z.string().optional(), // ISO date string
});

// GET /api/price-lists - List user's price lists
export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const lists = await db
      .select()
      .from(priceLists)
      .where(eq(priceLists.userId, userId))
      .orderBy(desc(priceLists.createdAt));

    return NextResponse.json(lists);
  } catch (error) {
    console.error("Error fetching price lists:", error);
    return NextResponse.json(
      { error: "Failed to fetch price lists" },
      { status: 500 }
    );
  }
}

// POST /api/price-lists - Create a new price list
export async function POST(request: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createPriceListSchema.parse(body);

    const [newList] = await db
      .insert(priceLists)
      .values({
        userId,
        name: validatedData.name,
        description: validatedData.description,
        region: validatedData.region,
        effectiveDate: validatedData.effectiveDate ? new Date(validatedData.effectiveDate) : undefined,
        expirationDate: validatedData.expirationDate ? new Date(validatedData.expirationDate) : undefined,
        isActive: true,
        itemCount: 0,
      })
      .returning();

    return NextResponse.json(newList, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Error creating price list:", error);
    return NextResponse.json(
      { error: "Failed to create price list" },
      { status: 500 }
    );
  }
}
