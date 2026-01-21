import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { carriers, carrierSlaRules } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

// GET /api/carriers - List all carriers with their SLA rules
export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const allCarriers = await db.select().from(carriers).orderBy(carriers.name);

    // Get SLA rules for each carrier
    const carriersWithRules = await Promise.all(
      allCarriers.map(async (carrier) => {
        const rules = await db
          .select()
          .from(carrierSlaRules)
          .where(eq(carrierSlaRules.carrierId, carrier.id));
        return { ...carrier, slaRules: rules };
      })
    );

    return NextResponse.json(carriersWithRules);
  } catch (error) {
    console.error('Error fetching carriers:', error);
    return NextResponse.json({ error: 'Failed to fetch carriers' }, { status: 500 });
  }
}

// POST /api/carriers - Create a new carrier
const createCarrierSchema = z.object({
  code: z.string().min(1).max(10),
  name: z.string().min(1),
  contactEmail: z.string().email().optional().nullable(),
  contactPhone: z.string().optional().nullable(),
  logoUrl: z.string().url().optional().nullable(),
  slaRules: z.array(z.object({
    milestone: z.enum(['assigned', 'contacted', 'site_visit', 'estimate_uploaded', 'revision_requested', 'approved', 'closed']),
    targetHours: z.number().min(0),
    isBusinessHours: z.boolean().optional(),
  })).optional(),
});

export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const validatedData = createCarrierSchema.parse(body);

    const { slaRules: rules, ...carrierData } = validatedData;

    // Insert carrier
    const [newCarrier] = await db.insert(carriers).values(carrierData).returning();

    // Insert SLA rules if provided
    if (rules && rules.length > 0) {
      await db.insert(carrierSlaRules).values(
        rules.map((rule) => ({
          carrierId: newCarrier.id,
          milestone: rule.milestone,
          targetHours: rule.targetHours,
          isBusinessHours: rule.isBusinessHours ?? true,
        }))
      );
    }

    return NextResponse.json(newCarrier, { status: 201 });
  } catch (error) {
    console.error('Error creating carrier:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request body', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to create carrier' }, { status: 500 });
  }
}
