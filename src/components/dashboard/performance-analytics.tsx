'use client';

import { useMemo } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from 'recharts';
import { cn } from '@/lib/utils';
import { Lightbulb } from 'lucide-react';

interface EstimateData {
  id: string;
  status: string | null;
  total?: number | null;
  createdAt: Date | null;
  jobType?: string | null;
}

interface PerformanceAnalyticsProps {
  estimates: EstimateData[];
  className?: string;
}

export function PerformanceAnalytics({ estimates, className }: PerformanceAnalyticsProps) {
  const stats = useMemo(() => {
    const total = estimates.length;
    const completed = estimates.filter((e) => e.status === 'completed').length;
    const inProgress = estimates.filter((e) => e.status === 'in_progress').length;
    const draft = estimates.filter((e) => e.status === 'draft').length;
    
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
    const engagementRate = total > 0 ? Math.round(((completed + inProgress) / total) * 100) : 0;
    const responseRate = total > 0 ? Math.round(((total - draft) / total) * 100) : 78;

    return {
      total,
      completed,
      inProgress,
      draft,
      completionRate,
      engagementRate,
      responseRate,
    };
  }, [estimates]);

  const donutData = useMemo(() => [
    { name: 'Task Completion', value: stats.completionRate, color: '#22c55e' },
    { name: 'User Engagement', value: stats.engagementRate, color: '#3b82f6' },
    { name: 'Response Time', value: stats.responseRate, color: '#f59e0b' },
  ], [stats]);

  return (
    <div className={cn('rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm', className)}>
      <div className="p-5 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">Insights</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Performance analytics</p>
          </div>
          <div className="flex gap-1">
            <button className="px-2.5 py-1 text-xs rounded-full bg-pd-gold text-white">
              Performance
            </button>
            <button className="px-2.5 py-1 text-xs rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
              Trends
            </button>
          </div>
        </div>
      </div>

      <div className="p-5">
        <div className="relative h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={donutData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={4}
                dataKey="value"
                strokeWidth={0}
              >
                {donutData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center">
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.completionRate}%</p>
              <p className="text-xs text-gray-500">Overall</p>
            </div>
          </div>
        </div>

        <div className="mt-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-green-500"></span>
              <span className="text-sm text-gray-600 dark:text-gray-400">Task Completion</span>
            </div>
            <span className="text-sm font-medium text-gray-900 dark:text-white">{stats.completionRate}%</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-blue-500"></span>
              <span className="text-sm text-gray-600 dark:text-gray-400">User Engagement</span>
            </div>
            <span className="text-sm font-medium text-gray-900 dark:text-white">{stats.engagementRate}%</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-amber-500"></span>
              <span className="text-sm text-gray-600 dark:text-gray-400">Response Time</span>
            </div>
            <span className="text-sm font-medium text-gray-900 dark:text-white">{stats.responseRate}%</span>
          </div>
        </div>

        <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30">
              <Lightbulb className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">Tip: Improve performance</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Complete in-progress estimates to boost your completion rate and overall analytics.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
