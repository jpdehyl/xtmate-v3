import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { carriers, carrierSlaRules } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

// Major insurance carriers with default SLA rules
const SEED_CARRIERS = [
  {
    code: 'SF',
    name: 'State Farm',
    slaRules: [
      { milestone: 'contacted', targetHours: 4, isBusinessHours: true },
      { milestone: 'site_visit', targetHours: 24, isBusinessHours: true },
      { milestone: 'estimate_uploaded', targetHours: 48, isBusinessHours: true },
    ],
  },
  {
    code: 'ALL',
    name: 'Allstate',
    slaRules: [
      { milestone: 'contacted', targetHours: 4, isBusinessHours: true },
      { milestone: 'site_visit', targetHours: 24, isBusinessHours: true },
      { milestone: 'estimate_uploaded', targetHours: 72, isBusinessHours: true },
    ],
  },
  {
    code: 'FAR',
    name: 'Farmers Insurance',
    slaRules: [
      { milestone: 'contacted', targetHours: 4, isBusinessHours: true },
      { milestone: 'site_visit', targetHours: 48, isBusinessHours: true },
      { milestone: 'estimate_uploaded', targetHours: 72, isBusinessHours: true },
    ],
  },
  {
    code: 'USAA',
    name: 'USAA',
    slaRules: [
      { milestone: 'contacted', targetHours: 2, isBusinessHours: true },
      { milestone: 'site_visit', targetHours: 24, isBusinessHours: true },
      { milestone: 'estimate_uploaded', targetHours: 48, isBusinessHours: true },
    ],
  },
  {
    code: 'PROG',
    name: 'Progressive',
    slaRules: [
      { milestone: 'contacted', targetHours: 4, isBusinessHours: true },
      { milestone: 'site_visit', targetHours: 24, isBusinessHours: true },
      { milestone: 'estimate_uploaded', targetHours: 48, isBusinessHours: true },
    ],
  },
  {
    code: 'GEICO',
    name: 'GEICO',
    slaRules: [
      { milestone: 'contacted', targetHours: 4, isBusinessHours: true },
      { milestone: 'site_visit', targetHours: 24, isBusinessHours: true },
      { milestone: 'estimate_uploaded', targetHours: 48, isBusinessHours: true },
    ],
  },
  {
    code: 'LIBERTY',
    name: 'Liberty Mutual',
    slaRules: [
      { milestone: 'contacted', targetHours: 4, isBusinessHours: true },
      { milestone: 'site_visit', targetHours: 48, isBusinessHours: true },
      { milestone: 'estimate_uploaded', targetHours: 72, isBusinessHours: true },
    ],
  },
  {
    code: 'TRAV',
    name: 'Travelers',
    slaRules: [
      { milestone: 'contacted', targetHours: 4, isBusinessHours: true },
      { milestone: 'site_visit', targetHours: 24, isBusinessHours: true },
      { milestone: 'estimate_uploaded', targetHours: 48, isBusinessHours: true },
    ],
  },
  {
    code: 'NATION',
    name: 'Nationwide',
    slaRules: [
      { milestone: 'contacted', targetHours: 4, isBusinessHours: true },
      { milestone: 'site_visit', targetHours: 48, isBusinessHours: true },
      { milestone: 'estimate_uploaded', targetHours: 72, isBusinessHours: true },
    ],
  },
  {
    code: 'AIG',
    name: 'AIG',
    slaRules: [
      { milestone: 'contacted', targetHours: 4, isBusinessHours: true },
      { milestone: 'site_visit', targetHours: 24, isBusinessHours: true },
      { milestone: 'estimate_uploaded', targetHours: 48, isBusinessHours: true },
    ],
  },
] as const;

// POST /api/carriers/seed - Seed carriers (admin only, dev use)
export async function POST() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const results = [];

    for (const carrierData of SEED_CARRIERS) {
      // Check if carrier already exists
      const existing = await db.select().from(carriers).where(eq(carriers.code, carrierData.code));
      if (existing.length > 0) {
        results.push({ code: carrierData.code, status: 'skipped', message: 'Already exists' });
        continue;
      }

      // Insert carrier
      const [newCarrier] = await db.insert(carriers).values({
        code: carrierData.code,
        name: carrierData.name,
      }).returning();

      // Insert SLA rules
      if (carrierData.slaRules.length > 0) {
        await db.insert(carrierSlaRules).values(
          carrierData.slaRules.map((rule) => ({
            carrierId: newCarrier.id,
            milestone: rule.milestone as 'contacted' | 'site_visit' | 'estimate_uploaded',
            targetHours: rule.targetHours,
            isBusinessHours: rule.isBusinessHours,
          }))
        );
      }

      results.push({ code: carrierData.code, status: 'created', id: newCarrier.id });
    }

    return NextResponse.json({ message: 'Seeding complete', results });
  } catch (error) {
    console.error('Error seeding carriers:', error);
    return NextResponse.json({ error: 'Failed to seed carriers' }, { status: 500 });
  }
}
