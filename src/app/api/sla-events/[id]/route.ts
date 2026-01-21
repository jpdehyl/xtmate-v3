import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { slaEvents, estimates } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';
import { getSlaEventWithStatus } from '@/lib/sla';

type RouteParams = { params: Promise<{ id: string }> };

// GET /api/sla-events/[id] - Get a single SLA event
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;

    const [event] = await db
      .select({
        slaEvent: slaEvents,
        estimateUserId: estimates.userId,
      })
      .from(slaEvents)
      .innerJoin(estimates, eq(slaEvents.estimateId, estimates.id))
      .where(eq(slaEvents.id, id));

    if (!event || event.estimateUserId !== userId) {
      return NextResponse.json({ error: 'SLA event not found' }, { status: 404 });
    }

    return NextResponse.json(getSlaEventWithStatus(event.slaEvent));
  } catch (error) {
    console.error('Error fetching SLA event:', error);
    return NextResponse.json({ error: 'Failed to fetch SLA event' }, { status: 500 });
  }
}

// PATCH /api/sla-events/[id] - Update/complete an SLA event
const updateEventSchema = z.object({
  completedAt: z.string().datetime().optional().nullable(),
  complete: z.boolean().optional(), // Shorthand to complete now
  notes: z.string().optional().nullable(),
});

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const validatedData = updateEventSchema.parse(body);

    // Verify user owns the estimate associated with this event
    const [event] = await db
      .select({
        slaEvent: slaEvents,
        estimateUserId: estimates.userId,
      })
      .from(slaEvents)
      .innerJoin(estimates, eq(slaEvents.estimateId, estimates.id))
      .where(eq(slaEvents.id, id));

    if (!event || event.estimateUserId !== userId) {
      return NextResponse.json({ error: 'SLA event not found' }, { status: 404 });
    }

    // Build update data
    const updateData: Partial<typeof slaEvents.$inferInsert> = {};

    if (validatedData.complete === true) {
      // Complete now
      const now = new Date();
      updateData.completedAt = now;

      // Check if overdue
      if (event.slaEvent.targetAt) {
        updateData.isOverdue = now > new Date(event.slaEvent.targetAt);
      }
    } else if (validatedData.completedAt !== undefined) {
      updateData.completedAt = validatedData.completedAt
        ? new Date(validatedData.completedAt)
        : null;

      // Check if overdue
      if (updateData.completedAt && event.slaEvent.targetAt) {
        updateData.isOverdue = updateData.completedAt > new Date(event.slaEvent.targetAt);
      }
    }

    if (validatedData.notes !== undefined) {
      updateData.notes = validatedData.notes;
    }

    const [updatedEvent] = await db
      .update(slaEvents)
      .set(updateData)
      .where(eq(slaEvents.id, id))
      .returning();

    return NextResponse.json(getSlaEventWithStatus(updatedEvent));
  } catch (error) {
    console.error('Error updating SLA event:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request body', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to update SLA event' }, { status: 500 });
  }
}

// DELETE /api/sla-events/[id] - Delete an SLA event
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;

    // Verify user owns the estimate associated with this event
    const [event] = await db
      .select({
        slaEvent: slaEvents,
        estimateUserId: estimates.userId,
      })
      .from(slaEvents)
      .innerJoin(estimates, eq(slaEvents.estimateId, estimates.id))
      .where(eq(slaEvents.id, id));

    if (!event || event.estimateUserId !== userId) {
      return NextResponse.json({ error: 'SLA event not found' }, { status: 404 });
    }

    await db.delete(slaEvents).where(eq(slaEvents.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting SLA event:', error);
    return NextResponse.json({ error: 'Failed to delete SLA event' }, { status: 500 });
  }
}
