import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { estimates, lineItems, organizationMembers } from '@/lib/db/schema';
import { eq, and, gte, lte, desc, sql } from 'drizzle-orm';

const STATUS_COLORS: Record<string, string> = {
  draft: '#94A3B8',
  in_progress: '#F59E0B',
  completed: '#10B981',
};

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const startParam = searchParams.get('start');
    const endParam = searchParams.get('end');

    const startDate = startParam ? new Date(startParam) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = endParam ? new Date(endParam) : new Date();

    // Fetch estimates within date range
    const userEstimates = await db
      .select()
      .from(estimates)
      .where(
        and(
          eq(estimates.userId, userId),
          gte(estimates.createdAt, startDate),
          lte(estimates.createdAt, endDate)
        )
      )
      .orderBy(desc(estimates.createdAt));

    // Calculate basic stats
    const totalClaims = userEstimates.length;
    const completedClaims = userEstimates.filter(e => e.status === 'completed').length;
    const completionRate = totalClaims > 0 ? Math.round((completedClaims / totalClaims) * 100) : 0;

    // Calculate revenue from line items (sum of totals for completed estimates)
    let totalRevenue = 0;
    const completedEstimateIds = userEstimates
      .filter(e => e.status === 'completed')
      .map(e => e.id);

    if (completedEstimateIds.length > 0) {
      // Fetch line item totals for completed estimates
      const lineItemTotals = await db
        .select({
          estimateId: lineItems.estimateId,
          total: sql<number>`COALESCE(SUM(${lineItems.total}), 0)`,
        })
        .from(lineItems)
        .where(sql`${lineItems.estimateId} = ANY(${completedEstimateIds})`)
        .groupBy(lineItems.estimateId);

      totalRevenue = lineItemTotals.reduce((sum, item) => sum + (item.total || 0), 0);
    }

    const avgClaimValue = totalClaims > 0 ? totalRevenue / totalClaims : 0;

    // Placeholder for avg completion time (would need actual timestamps)
    const avgCompletionHours = 48;

    const stats = {
      totalClaims,
      completedClaims,
      totalRevenue,
      avgClaimValue,
      completionRate,
      avgCompletionHours,
    };

    // Calculate status distribution
    const statusCounts: Record<string, number> = {};
    userEstimates.forEach(estimate => {
      const status = estimate.status || 'draft';
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });

    const statusData = Object.entries(statusCounts).map(([status, count]) => ({
      name: status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
      value: count,
      color: STATUS_COLORS[status] || '#94A3B8',
    }));

    // Generate revenue data points (aggregate by week or month depending on range)
    const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const useWeekly = daysDiff <= 90;

    const revenueData: { date: string; revenue: number; claims: number }[] = [];

    if (useWeekly) {
      // Group by week
      const weeks = Math.ceil(daysDiff / 7);
      for (let i = 0; i < weeks; i++) {
        const weekStart = new Date(startDate);
        weekStart.setDate(weekStart.getDate() + i * 7);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 7);

        const weekEstimates = userEstimates.filter(e => {
          const created = new Date(e.createdAt);
          return created >= weekStart && created < weekEnd;
        });

        revenueData.push({
          date: weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          revenue: weekEstimates.length * 5000, // Placeholder
          claims: weekEstimates.length,
        });
      }
    } else {
      // Group by month
      const months: Map<string, { revenue: number; claims: number }> = new Map();

      userEstimates.forEach(estimate => {
        const date = new Date(estimate.createdAt);
        const monthKey = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });

        const existing = months.get(monthKey) || { revenue: 0, claims: 0 };
        existing.claims++;
        existing.revenue += 5000; // Placeholder
        months.set(monthKey, existing);
      });

      months.forEach((data, month) => {
        revenueData.push({
          date: month,
          ...data,
        });
      });
    }

    // Generate monthly data for bar chart
    const monthlyData: { month: string; claims: number }[] = [];
    const monthCounts: Map<string, number> = new Map();

    userEstimates.forEach(estimate => {
      const date = new Date(estimate.createdAt);
      const monthKey = date.toLocaleDateString('en-US', { month: 'short' });
      monthCounts.set(monthKey, (monthCounts.get(monthKey) || 0) + 1);
    });

    // Get last 6 months
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentMonth = new Date().getMonth();

    for (let i = 5; i >= 0; i--) {
      const monthIndex = (currentMonth - i + 12) % 12;
      const monthName = months[monthIndex];
      monthlyData.push({
        month: monthName,
        claims: monthCounts.get(monthName) || 0,
      });
    }

    // Team metrics (single user for now, would expand with organization members)
    const teamMetrics = [{
      userId,
      userName: 'You',
      userAvatar: null,
      claimsCompleted: completedClaims,
      claimsInProgress: userEstimates.filter(e => e.status === 'in_progress').length,
      totalRevenue,
      avgCompletionHours,
    }];

    return NextResponse.json({
      stats,
      statusData,
      revenueData,
      monthlyData,
      teamMetrics,
    });
  } catch (error) {
    console.error('Analytics API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
