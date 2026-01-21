'use client';

import { useState, useEffect, useMemo } from 'react';
import { BarChart3, TrendingUp, DollarSign, Clock, CheckCircle } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { DateRangePicker, getDefaultDateRange, type DateRange } from '@/components/analytics/date-range-picker';
import { RevenueChart } from '@/components/analytics/revenue-chart';
import { TeamMetrics, type TeamMemberMetrics } from '@/components/analytics/team-metrics';
import { ExportAnalytics } from '@/components/analytics/export-analytics';
import { StatCard } from '@/components/dashboard/stat-card';
import { cn } from '@/lib/utils';

interface AnalyticsStats {
  totalClaims: number;
  completedClaims: number;
  totalRevenue: number;
  avgClaimValue: number;
  completionRate: number;
  avgCompletionHours: number;
}

interface StatusData {
  name: string;
  value: number;
  color: string;
  [key: string]: string | number;
}

interface RevenueDataPoint {
  date: string;
  revenue: number;
  claims: number;
}

interface AnalyticsContentProps {
  userId: string;
}

const STATUS_COLORS = {
  draft: '#94A3B8',
  in_progress: '#F59E0B',
  completed: '#10B981',
};

function formatCurrency(value: number): string {
  if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
  return `$${value.toFixed(0)}`;
}

function formatHours(hours: number): string {
  if (hours < 24) return `${Math.round(hours)}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

export function AnalyticsContent({ userId }: AnalyticsContentProps) {
  const [dateRange, setDateRange] = useState<DateRange>(getDefaultDateRange);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [stats, setStats] = useState<AnalyticsStats>({
    totalClaims: 0,
    completedClaims: 0,
    totalRevenue: 0,
    avgClaimValue: 0,
    completionRate: 0,
    avgCompletionHours: 0,
  });

  const [statusData, setStatusData] = useState<StatusData[]>([]);
  const [revenueData, setRevenueData] = useState<RevenueDataPoint[]>([]);
  const [monthlyData, setMonthlyData] = useState<{ month: string; claims: number }[]>([]);
  const [teamMetrics, setTeamMetrics] = useState<TeamMemberMetrics[]>([]);

  useEffect(() => {
    async function fetchAnalyticsData() {
      try {
        setIsLoading(true);

        const params = new URLSearchParams({
          start: dateRange.start.toISOString(),
          end: dateRange.end.toISOString(),
        });

        const response = await fetch(`/api/analytics?${params}`);
        if (!response.ok) throw new Error('Failed to fetch analytics data');

        const data = await response.json();

        setStats(data.stats || {
          totalClaims: 0,
          completedClaims: 0,
          totalRevenue: 0,
          avgClaimValue: 0,
          completionRate: 0,
          avgCompletionHours: 0,
        });
        setStatusData(data.statusData || []);
        setRevenueData(data.revenueData || []);
        setMonthlyData(data.monthlyData || []);
        setTeamMetrics(data.teamMetrics || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load analytics data');
      } finally {
        setIsLoading(false);
      }
    }

    fetchAnalyticsData();
  }, [userId, dateRange]);

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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Analytics</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Track performance and trends over time
          </p>
        </div>
        <div className="flex items-center gap-3">
          <DateRangePicker value={dateRange} onChange={setDateRange} />
          <ExportAnalytics dateRange={dateRange} />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard
          title="Total Claims"
          value={stats.totalClaims}
          icon={BarChart3}
          className={cn(isLoading && 'animate-pulse')}
        />
        <StatCard
          title="Completed"
          value={stats.completedClaims}
          icon={CheckCircle}
          className={cn(isLoading && 'animate-pulse')}
        />
        <StatCard
          title="Total Revenue"
          value={formatCurrency(stats.totalRevenue)}
          icon={DollarSign}
          className={cn(isLoading && 'animate-pulse')}
        />
        <StatCard
          title="Avg. Claim Value"
          value={formatCurrency(stats.avgClaimValue)}
          icon={TrendingUp}
          className={cn(isLoading && 'animate-pulse')}
        />
        <StatCard
          title="Completion Rate"
          value={`${stats.completionRate}%`}
          icon={CheckCircle}
          className={cn(isLoading && 'animate-pulse')}
        />
        <StatCard
          title="Avg. Completion"
          value={formatHours(stats.avgCompletionHours)}
          icon={Clock}
          className={cn(isLoading && 'animate-pulse')}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart - Takes 2 columns */}
        <div className="lg:col-span-2">
          <RevenueChart
            data={revenueData}
            dateRange={dateRange}
            isLoading={isLoading}
          />
        </div>

        {/* Status Distribution */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Claims by Status
          </h3>
          {statusData.length > 0 ? (
            <>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      content={({ active, payload }) => {
                        if (!active || !payload?.length) return null;
                        const data = payload[0].payload;
                        return (
                          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3">
                            <p className="font-medium text-gray-900 dark:text-white">{data.name}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{data.value} claims</p>
                          </div>
                        );
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap gap-3 justify-center mt-4">
                {statusData.map((status) => (
                  <div key={status.name} className="flex items-center gap-2 text-sm">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: status.color }}
                    />
                    <span className="text-gray-600 dark:text-gray-400">{status.name}</span>
                    <span className="font-medium text-gray-900 dark:text-white">{status.value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="h-[200px] flex items-center justify-center">
              <p className="text-gray-500 dark:text-gray-400">No data available</p>
            </div>
          )}
        </div>
      </div>

      {/* Monthly Claims Chart */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Monthly Claims Volume
        </h3>
        <div className="h-[250px]">
          {monthlyData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 12, fill: '#6b7280' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: '#6b7280' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (!active || !payload?.length) return null;
                    return (
                      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3">
                        <p className="font-medium text-gray-900 dark:text-white">{label}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          {payload[0].value} claims
                        </p>
                      </div>
                    );
                  }}
                />
                <Bar dataKey="claims" fill="#0284c7" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center">
              <p className="text-gray-500 dark:text-gray-400">No data for selected period</p>
            </div>
          )}
        </div>
      </div>

      {/* Team Metrics */}
      <TeamMetrics members={teamMetrics} isLoading={isLoading} />
    </div>
  );
}
