import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { slaEvents, estimates, carrierSlaRules } from '@/lib/db/schema';
import { eq, and, isNull } from 'drizzle-orm';
import { z } from 'zod';
import { getSlaEventWithStatus, calculateTargetTime, getSlaRiskCounts, calculateSlaCompliance } from '@/lib/sla';
import type { SlaMilestone } from '@/lib/sla';

// GET /api/sla-events - List SLA events (optionally filtered by estimateId)
export async function GET(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const estimateId = searchParams.get('estimateId');
    const includeStats = searchParams.get('includeStats') === 'true';

    let events;
    if (estimateId) {
      // Verify user owns the estimate
      const [estimate] = await db
        .select()
        .from(estimates)
        .where(and(eq(estimates.id, estimateId), eq(estimates.userId, userId)));

      if (!estimate) {
        return NextResponse.json({ error: 'Estimate not found' }, { status: 404 });
      }

      events = await db
        .select()
        .from(slaEvents)
        .where(eq(slaEvents.estimateId, estimateId))
        .orderBy(slaEvents.createdAt);
    } else {
      // Get all SLA events for user's estimates (for dashboard widget)
      events = await db
        .select({
          slaEvent: slaEvents,
          estimateName: estimates.name,
          estimateId: estimates.id,
        })
        .from(slaEvents)
        .innerJoin(estimates, eq(slaEvents.estimateId, estimates.id))
        .where(eq(estimates.userId, userId));

      // Transform for response
      const eventsWithStatus = events.map((e) => ({
        ...getSlaEventWithStatus(e.slaEvent),
        estimateName: e.estimateName,
        estimateId: e.estimateId,
      }));

      if (includeStats) {
        const { atRisk, overdue } = getSlaRiskCounts(events.map((e) => e.slaEvent));
        const compliance = calculateSlaCompliance(events.map((e) => e.slaEvent));
        return NextResponse.json({
          events: eventsWithStatus,
          stats: { atRisk, overdue, compliance },
        });
      }

      return NextResponse.json(eventsWithStatus);
    }

    // Return events with calculated status
    const eventsWithStatus = events.map((e) => getSlaEventWithStatus(e));
    return NextResponse.json(eventsWithStatus);
  } catch (error) {
    console.error('Error fetching SLA events:', error);
    return NextResponse.json({ error: 'Failed to fetch SLA events' }, { status: 500 });
  }
}

// POST /api/sla-events - Create a new SLA event (or initialize all for an estimate)
const createEventSchema = z.object({
  estimateId: z.string().uuid(),
  milestone: z.enum(['assigned', 'contacted', 'site_visit', 'estimate_uploaded', 'revision_requested', 'approved', 'closed']),
  completedAt: z.string().datetime().optional().nullable(),
  notes: z.string().optional().nullable(),
});

const initializeEventsSchema = z.object({
  estimateId: z.string().uuid(),
  initialize: z.literal(true),
});

export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();

    // Check if this is an initialization request
    if (body.initialize === true) {
      const validatedData = initializeEventsSchema.parse(body);

      // Verify user owns the estimate
      const [estimate] = await db
        .select()
        .from(estimates)
        .where(and(eq(estimates.id, validatedData.estimateId), eq(estimates.userId, userId)));

      if (!estimate) {
        return NextResponse.json({ error: 'Estimate not found' }, { status: 404 });
      }

      // Check if events already exist
      const existingEvents = await db
        .select()
        .from(slaEvents)
        .where(eq(slaEvents.estimateId, validatedData.estimateId));

      if (existingEvents.length > 0) {
        return NextResponse.json({ error: 'SLA events already initialized' }, { status: 400 });
      }

      // Get carrier SLA rules if carrier is set
      let carrierRules: typeof carrierSlaRules.$inferSelect[] = [];
      if (estimate.carrierId) {
        carrierRules = await db
          .select()
          .from(carrierSlaRules)
          .where(eq(carrierSlaRules.carrierId, estimate.carrierId));
      }

      // Create initial SLA events
      const now = new Date();
      const milestonesToCreate: SlaMilestone[] = ['assigned', 'contacted', 'site_visit', 'estimate_uploaded'];

      const newEvents = milestonesToCreate.map((milestone) => {
        const targetAt = milestone === 'assigned'
          ? null // Assigned is immediate
          : calculateTargetTime(milestone, now, carrierRules);

        return {
          estimateId: validatedData.estimateId,
          milestone,
          targetAt,
          completedAt: milestone === 'assigned' ? now : null, // Mark assigned as complete
          isOverdue: false,
        };
      });

      await db.insert(slaEvents).values(newEvents);

      // Fetch and return the created events
      const createdEvents = await db
        .select()
        .from(slaEvents)
        .where(eq(slaEvents.estimateId, validatedData.estimateId))
        .orderBy(slaEvents.createdAt);

      return NextResponse.json(createdEvents.map((e) => getSlaEventWithStatus(e)), { status: 201 });
    }

    // Regular single event creation
    const validatedData = createEventSchema.parse(body);

    // Verify user owns the estimate
    const [estimate] = await db
      .select()
      .from(estimates)
      .where(and(eq(estimates.id, validatedData.estimateId), eq(estimates.userId, userId)));

    if (!estimate) {
      return NextResponse.json({ error: 'Estimate not found' }, { status: 404 });
    }

    // Check if event for this milestone already exists
    const existingEvent = await db
      .select()
      .from(slaEvents)
      .where(
        and(
          eq(slaEvents.estimateId, validatedData.estimateId),
          eq(slaEvents.milestone, validatedData.milestone)
        )
      );

    if (existingEvent.length > 0) {
      return NextResponse.json({ error: 'Event for this milestone already exists' }, { status: 400 });
    }

    // Get carrier SLA rules for target calculation
    let carrierRules: typeof carrierSlaRules.$inferSelect[] = [];
    if (estimate.carrierId) {
      carrierRules = await db
        .select()
        .from(carrierSlaRules)
        .where(eq(carrierSlaRules.carrierId, estimate.carrierId));
    }

    const now = new Date();
    const targetAt = calculateTargetTime(validatedData.milestone as SlaMilestone, now, carrierRules);

    const [newEvent] = await db
      .insert(slaEvents)
      .values({
        estimateId: validatedData.estimateId,
        milestone: validatedData.milestone,
        targetAt,
        completedAt: validatedData.completedAt ? new Date(validatedData.completedAt) : null,
        notes: validatedData.notes,
        isOverdue: false,
      })
      .returning();

    return NextResponse.json(getSlaEventWithStatus(newEvent), { status: 201 });
  } catch (error) {
    console.error('Error creating SLA event:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request body', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to create SLA event' }, { status: 500 });
  }
}
