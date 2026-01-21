'use client';

import { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { DateRange } from './date-range-picker';

interface RevenueDataPoint {
  date: string;
  revenue: number;
  claims: number;
}

interface RevenueChartProps {
  data: RevenueDataPoint[];
  dateRange: DateRange;
  isLoading?: boolean;
  className?: string;
}

function formatCurrency(value: number): string {
  if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
  return `$${value.toFixed(0)}`;
}

function calculateTrend(data: RevenueDataPoint[]): { value: number; direction: 'up' | 'down' | 'flat' } {
  if (data.length < 2) return { value: 0, direction: 'flat' };

  const midpoint = Math.floor(data.length / 2);
  const firstHalf = data.slice(0, midpoint);
  const secondHalf = data.slice(midpoint);

  const firstAvg = firstHalf.reduce((sum, d) => sum + d.revenue, 0) / firstHalf.length || 0;
  const secondAvg = secondHalf.reduce((sum, d) => sum + d.revenue, 0) / secondHalf.length || 0;

  if (firstAvg === 0) return { value: 0, direction: 'flat' };

  const percentChange = ((secondAvg - firstAvg) / firstAvg) * 100;

  if (Math.abs(percentChange) < 1) return { value: 0, direction: 'flat' };
  return {
    value: Math.abs(Math.round(percentChange)),
    direction: percentChange > 0 ? 'up' : 'down',
  };
}

export function RevenueChart({ data, dateRange, isLoading = false, className }: RevenueChartProps) {
  const stats = useMemo(() => {
    const totalRevenue = data.reduce((sum, d) => sum + d.revenue, 0);
    const totalClaims = data.reduce((sum, d) => sum + d.claims, 0);
    const avgRevenue = data.length > 0 ? totalRevenue / data.length : 0;
    const trend = calculateTrend(data);

    return { totalRevenue, totalClaims, avgRevenue, trend };
  }, [data]);

  const TrendIcon = stats.trend.direction === 'up' ? TrendingUp : stats.trend.direction === 'down' ? TrendingDown : Minus;
  const trendColor = stats.trend.direction === 'up' ? 'text-green-600' : stats.trend.direction === 'down' ? 'text-red-600' : 'text-gray-400';

  if (isLoading) {
    return (
      <div className={cn('bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-6', className)}>
        <div className="animate-pulse space-y-4">
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded" />
              <div className="h-8 w-32 bg-gray-200 dark:bg-gray-700 rounded" />
            </div>
            <div className="h-6 w-20 bg-gray-200 dark:bg-gray-700 rounded" />
          </div>
          <div className="h-[200px] bg-gray-100 dark:bg-gray-800 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className={cn('bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl', className)}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Total Revenue</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
              {formatCurrency(stats.totalRevenue)}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {stats.totalClaims} claims completed
            </p>
          </div>
          {stats.trend.value > 0 && (
            <div className={cn('flex items-center gap-1 px-2 py-1 rounded-full text-sm font-medium', trendColor)}>
              <TrendIcon className="w-4 h-4" />
              <span>{stats.trend.value}%</span>
            </div>
          )}
        </div>
      </div>

      {/* Chart */}
      <div className="p-4">
        <div className="h-[250px]">
          {data.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0284c7" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#0284c7" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12, fill: '#6b7280' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: '#6b7280' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(value) => formatCurrency(value)}
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (!active || !payload?.length) return null;
                    return (
                      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{label}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          Revenue: {formatCurrency(payload[0].value as number)}
                        </p>
                        {payload[0].payload.claims > 0 && (
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {payload[0].payload.claims} claims
                          </p>
                        )}
                      </div>
                    );
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#0284c7"
                  strokeWidth={2}
                  fill="url(#colorRevenue)"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center">
              <p className="text-gray-500 dark:text-gray-400">No data for selected period</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
