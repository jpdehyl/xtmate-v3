'use client';

import { useMemo } from 'react';
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
import { cn } from '@/lib/utils';
import { TrendingUp, Target, Clock, CheckCircle } from 'lucide-react';

interface EstimateData {
  id: string;
  status: string | null;
  total?: number | null;
  createdAt: Date | null;
  jobType?: string | null;
}

interface PerformanceMetricsProps {
  estimates: EstimateData[];
  className?: string;
}

const JOB_TYPE_COLORS = {
  insurance: '#3B82F6',
  private: '#10B981',
};

const STATUS_COLORS = {
  draft: '#94A3B8',
  in_progress: '#F59E0B',
  completed: '#10B981',
};

export function PerformanceMetrics({ estimates, className }: PerformanceMetricsProps) {
  // Calculate monthly data for the bar chart
  const monthlyData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentMonth = new Date().getMonth();
    const data = [];

    for (let i = 5; i >= 0; i--) {
      const monthIndex = (currentMonth - i + 12) % 12;
      const monthEstimates = estimates.filter((e) => {
        if (!e.createdAt) return false;
        const date = new Date(e.createdAt);
        return date.getMonth() === monthIndex;
      });

      data.push({
        month: months[monthIndex],
        count: monthEstimates.length,
        value: monthEstimates.reduce((sum, e) => sum + (e.total || 0), 0),
      });
    }

    return data;
  }, [estimates]);

  // Calculate job type distribution for pie chart
  const jobTypeData = useMemo(() => {
    const counts: Record<string, number> = {};
    estimates.forEach((e) => {
      const type = e.jobType || 'private';
      counts[type] = (counts[type] || 0) + 1;
    });

    return Object.entries(counts).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value,
      color: JOB_TYPE_COLORS[name as keyof typeof JOB_TYPE_COLORS] || JOB_TYPE_COLORS.private,
    }));
  }, [estimates]);

  // Calculate status distribution
  const statusData = useMemo(() => {
    const counts: Record<string, number> = {};
    estimates.forEach((e) => {
      const status = e.status || 'draft';
      counts[status] = (counts[status] || 0) + 1;
    });

    return Object.entries(counts).map(([name, value]) => ({
      name: name.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
      value,
      color: STATUS_COLORS[name as keyof typeof STATUS_COLORS] || STATUS_COLORS.draft,
    }));
  }, [estimates]);

  // Calculate KPIs
  const kpis = useMemo(() => {
    const total = estimates.length;
    const completed = estimates.filter((e) => e.status === 'completed').length;
    const avgValue = total > 0 ? estimates.reduce((sum, e) => sum + (e.total || 0), 0) / total : 0;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    return {
      total,
      completed,
      avgValue,
      completionRate,
    };
  }, [estimates]);

  // Format currency
  const formatCurrency = (value: number) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
    return `$${value.toFixed(0)}`;
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10">
              <Target className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{kpis.completionRate}%</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Completion Rate</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10">
              <CheckCircle className="w-5 h-5 text-emerald-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{kpis.completed}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Completed</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/10">
              <TrendingUp className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(kpis.avgValue)}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Avg. Value</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-500/10">
              <Clock className="w-5 h-5 text-purple-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{kpis.total}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Total Estimates</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Estimates Bar Chart */}
        <div className="lg:col-span-2 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">Monthly Estimates</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Estimates created per month</p>
            </div>
          </div>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
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
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  }}
                  labelStyle={{ color: '#111827' }}
                />
                <Bar
                  dataKey="count"
                  fill="#0284c7"
                  radius={[4, 4, 0, 0]}
                  name="Estimates"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Job Type Pie Chart */}
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 shadow-sm">
          <div className="mb-4">
            <h3 className="font-semibold text-gray-900 dark:text-white">Job Types</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Distribution by type</p>
          </div>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={jobTypeData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {jobTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          {/* Legend */}
          <div className="flex flex-wrap gap-2 justify-center mt-2">
            {jobTypeData.map((entry) => (
              <div key={entry.name} className="flex items-center gap-1.5 text-xs">
                <div
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-gray-500 dark:text-gray-400">{entry.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
