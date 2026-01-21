'use client';

import { useState, useEffect, useMemo } from 'react';
import { Briefcase, TrendingUp, DollarSign, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import { ActivityFeed, type ActivityItem } from '@/components/portfolio/activity-feed';
import { CarrierBreakdown } from '@/components/portfolio/carrier-breakdown';
import { AtRiskList, type AtRiskEstimate } from '@/components/portfolio/at-risk-list';
import { StatCard } from '@/components/dashboard/stat-card';
import { cn } from '@/lib/utils';

interface PortfolioStats {
  totalClaims: number;
  completedClaims: number;
  totalValue: number;
  completionRate: number;
  avgCompletionTime: number;
  inProgressClaims: number;
}

interface CarrierData {
  carrierId: string;
  carrierName: string;
  carrierCode: string;
  count: number;
  totalValue: number;
}

interface PortfolioContentProps {
  userId: string;
}

export function PortfolioContent({ userId }: PortfolioContentProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<PortfolioStats>({
    totalClaims: 0,
    completedClaims: 0,
    totalValue: 0,
    completionRate: 0,
    avgCompletionTime: 0,
    inProgressClaims: 0,
  });
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [carriers, setCarriers] = useState<CarrierData[]>([]);
  const [atRiskEstimates, setAtRiskEstimates] = useState<AtRiskEstimate[]>([]);

  useEffect(() => {
    async function fetchPortfolioData() {
      try {
        setIsLoading(true);

        // Fetch portfolio data from API
        const response = await fetch('/api/portfolio');
        if (!response.ok) throw new Error('Failed to fetch portfolio data');

        const data = await response.json();

        setStats(data.stats || {
          totalClaims: 0,
          completedClaims: 0,
          totalValue: 0,
          completionRate: 0,
          avgCompletionTime: 0,
          inProgressClaims: 0,
        });
        setActivities(data.activities || []);
        setCarriers(data.carriers || []);
        setAtRiskEstimates(data.atRiskEstimates || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load portfolio data');
      } finally {
        setIsLoading(false);
      }
    }

    fetchPortfolioData();
  }, [userId]);

  const formatCurrency = (value: number) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
    return `$${value.toFixed(0)}`;
  };

  const formatHours = (hours: number) => {
    if (hours < 24) return `${Math.round(hours)}h`;
    const days = Math.floor(hours / 24);
    return `${days}d`;
  };

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-800 dark:text-red-200">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Portfolio</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Overview of your claims portfolio and performance metrics
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Briefcase className="w-8 h-8 text-primary-600" />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        <StatCard
          title="Total Claims"
          value={stats.totalClaims}
          icon={Briefcase}
          className={cn(isLoading && 'animate-pulse')}
        />
        <StatCard
          title="Completed"
          value={stats.completedClaims}
          icon={CheckCircle}
          description={`${stats.completionRate}% completion rate`}
          className={cn(isLoading && 'animate-pulse')}
        />
        <StatCard
          title="In Progress"
          value={stats.inProgressClaims}
          icon={Clock}
          className={cn(isLoading && 'animate-pulse')}
        />
        <StatCard
          title="Total Value"
          value={formatCurrency(stats.totalValue)}
          icon={DollarSign}
          className={cn(isLoading && 'animate-pulse')}
        />
        <StatCard
          title="Avg. Completion"
          value={formatHours(stats.avgCompletionTime)}
          icon={TrendingUp}
          className={cn(isLoading && 'animate-pulse')}
        />
        <StatCard
          title="At Risk"
          value={atRiskEstimates.length}
          icon={AlertTriangle}
          className={cn(isLoading && 'animate-pulse', atRiskEstimates.length > 0 && 'border-amber-200 dark:border-amber-800')}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Activity Feed - Takes 2 columns on large screens */}
        <div className="lg:col-span-2">
          <ActivityFeed
            activities={activities}
            isLoading={isLoading}
            maxItems={10}
          />
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          {/* At Risk List */}
          <AtRiskList
            estimates={atRiskEstimates}
            isLoading={isLoading}
            maxItems={5}
          />

          {/* Carrier Breakdown */}
          <CarrierBreakdown
            carriers={carriers}
            isLoading={isLoading}
          />
        </div>
      </div>
    </div>
  );
}
