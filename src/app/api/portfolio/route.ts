import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { estimates, carriers, slaEvents, lineItems } from '@/lib/db/schema';
import { eq, desc, isNull, sum, sql } from 'drizzle-orm';
import { SLA_MILESTONE_LABELS, getSlaEventWithStatus } from '@/lib/sla';
import { checkRateLimit } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const rateLimit = checkRateLimit(`portfolio:${userId}`, { windowMs: 60000, maxRequests: 30 });
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil(rateLimit.resetIn / 1000)) } }
      );
    }

    // Fetch all estimates for the user
    const userEstimates = await db
      .select()
      .from(estimates)
      .where(eq(estimates.userId, userId))
      .orderBy(desc(estimates.updatedAt));

    // Calculate stats
    const totalClaims = userEstimates.length;
    const completedClaims = userEstimates.filter(e => e.status === 'completed').length;
    const inProgressClaims = userEstimates.filter(e => e.status === 'in_progress').length;
    const completionRate = totalClaims > 0 ? Math.round((completedClaims / totalClaims) * 100) : 0;

    // Calculate total value from line items
    const estimateIds = userEstimates.map(e => e.id);
    let totalValue = 0;
    if (estimateIds.length > 0) {
      const lineItemTotals = await db
        .select({ total: sum(lineItems.total) })
        .from(lineItems)
        .where(sql`${lineItems.estimateId} = ANY(${estimateIds})`);
      totalValue = Number(lineItemTotals[0]?.total) || 0;
    }

    // Calculate average completion time from actual timestamps
    const completedEstimates = userEstimates.filter(e => e.status === 'completed' && e.createdAt);
    let avgCompletionTime = 48;
    if (completedEstimates.length > 0) {
      const totalHours = completedEstimates.reduce((sum, e) => {
        const created = new Date(e.createdAt);
        const updated = new Date(e.updatedAt);
        return sum + (updated.getTime() - created.getTime()) / (1000 * 60 * 60);
      }, 0);
      avgCompletionTime = Math.round(totalHours / completedEstimates.length);
    }

    const stats = {
      totalClaims,
      completedClaims,
      inProgressClaims,
      totalValue,
      completionRate,
      avgCompletionTime,
    };

    // Generate mock activities based on recent estimates
    const activities = userEstimates.slice(0, 10).map((estimate, index) => ({
      id: `activity-${estimate.id}`,
      type: index % 3 === 0 ? 'estimate_created' : index % 3 === 1 ? 'estimate_updated' : 'status_changed',
      description: index % 3 === 0
        ? 'created estimate'
        : index % 3 === 1
        ? 'updated estimate'
        : 'changed status to ' + (estimate.status || 'draft'),
      timestamp: estimate.updatedAt,
      estimateId: estimate.id,
      estimateName: estimate.name,
      userName: 'You',
    }));

    // Fetch carrier data
    const allCarriers = await db.select().from(carriers);

    // Group estimates by carrier
    const carrierMap = new Map<string, { carrier: typeof allCarriers[0]; count: number; totalValue: number }>();

    for (const estimate of userEstimates) {
      if (estimate.carrierId) {
        const carrier = allCarriers.find(c => c.id === estimate.carrierId);
        if (carrier) {
          const existing = carrierMap.get(carrier.id) || { carrier, count: 0, totalValue: 0 };
          existing.count++;
          // totalValue would come from line items
          carrierMap.set(carrier.id, existing);
        }
      }
    }

    const carrierData = Array.from(carrierMap.values()).map(({ carrier, count, totalValue }) => ({
      carrierId: carrier.id,
      carrierName: carrier.name,
      carrierCode: carrier.code,
      count,
      totalValue,
    }));

    // Fetch at-risk estimates from SLA events
    const atRiskSlaEvents = await db
      .select()
      .from(slaEvents)
      .where(isNull(slaEvents.completedAt));

    // Process SLA events to find at-risk/overdue estimates
    const atRiskEstimateIds = new Set<string>();
    const atRiskEstimatesData: {
      id: string;
      name: string;
      propertyAddress: string | null;
      status: 'at_risk' | 'overdue';
      milestone: string;
      milestoneLabel: string;
      hoursRemaining: number | null;
      hoursOverdue: number | null;
      carrierName: string | null;
    }[] = [];

    for (const event of atRiskSlaEvents) {
      if (!event.estimateId) continue;

      const estimate = userEstimates.find(e => e.id === event.estimateId);
      if (!estimate) continue;

      const eventWithStatus = getSlaEventWithStatus(event);

      if (eventWithStatus.status === 'at_risk' || eventWithStatus.status === 'overdue') {
        if (!atRiskEstimateIds.has(estimate.id)) {
          atRiskEstimateIds.add(estimate.id);

          const carrier = estimate.carrierId
            ? allCarriers.find(c => c.id === estimate.carrierId)
            : null;

          atRiskEstimatesData.push({
            id: estimate.id,
            name: estimate.name,
            propertyAddress: estimate.propertyAddress,
            status: eventWithStatus.status as 'at_risk' | 'overdue',
            milestone: event.milestone,
            milestoneLabel: SLA_MILESTONE_LABELS[event.milestone] || event.milestone,
            hoursRemaining: eventWithStatus.hoursRemaining,
            hoursOverdue: eventWithStatus.hoursOverdue,
            carrierName: carrier?.name || null,
          });
        }
      }
    }

    // Sort at-risk estimates by urgency (overdue first, then by hours remaining)
    atRiskEstimatesData.sort((a, b) => {
      if (a.status === 'overdue' && b.status !== 'overdue') return -1;
      if (b.status === 'overdue' && a.status !== 'overdue') return 1;
      if (a.status === 'overdue' && b.status === 'overdue') {
        return (b.hoursOverdue || 0) - (a.hoursOverdue || 0);
      }
      return (a.hoursRemaining || 0) - (b.hoursRemaining || 0);
    });

    return NextResponse.json({
      stats,
      activities,
      carriers: carrierData,
      atRiskEstimates: atRiskEstimatesData,
    });
  } catch (error) {
    logger.error('Portfolio API error', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
