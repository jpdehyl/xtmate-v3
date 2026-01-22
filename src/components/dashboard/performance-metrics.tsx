'use client';

import { useMemo } from 'react';
import {
  AreaChart,
  Area,
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
import { Target, TrendingUp, TrendingDown, CheckCircle2, DollarSign, FileText } from 'lucide-react';

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
  insurance: '#b4975a',
  private: '#8a7344',
};

interface StatCardProps {
  icon: React.ReactNode;
  value: string | number;
  label: string;
  trend?: number;
  trendLabel?: string;
  iconBgClass?: string;
}

function StatCard({ icon, value, label, trend, trendLabel, iconBgClass = 'bg-pd-gold/10' }: StatCardProps) {
  const isPositive = trend !== undefined && trend >= 0;
  const showTrend = trend !== undefined && trend !== 0;

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className={cn('p-2.5 rounded-xl', iconBgClass)}>
          {icon}
        </div>
        {showTrend && (
          <div className={cn(
            'flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium',
            isPositive 
              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
              : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
          )}>
            {isPositive ? (
              <TrendingUp className="w-3 h-3" />
            ) : (
              <TrendingDown className="w-3 h-3" />
            )}
            <span>{isPositive ? '+' : ''}{trend.toFixed(1)}%</span>
          </div>
        )}
      </div>
      <div className="mt-3">
        <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{label}</p>
        {trendLabel && (
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{trendLabel}</p>
        )}
      </div>
    </div>
  );
}

export function PerformanceMetrics({ estimates, className }: PerformanceMetricsProps) {
  const monthlyData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const data = [];

    for (let i = 5; i >= 0; i--) {
      const monthIndex = (currentMonth - i + 12) % 12;
      const year = currentMonth - i < 0 ? currentYear - 1 : currentYear;
      
      const monthEstimates = estimates.filter((e) => {
        if (!e.createdAt) return false;
        const date = new Date(e.createdAt);
        return date.getMonth() === monthIndex && date.getFullYear() === year;
      });

      data.push({
        month: months[monthIndex],
        count: monthEstimates.length,
        value: monthEstimates.reduce((sum, e) => sum + (e.total || 0), 0),
      });
    }

    return data;
  }, [estimates]);

  const jobTypeData = useMemo(() => {
    const counts: Record<string, number> = {};
    estimates.forEach((e) => {
      const type = e.jobType || 'private';
      counts[type] = (counts[type] || 0) + 1;
    });

    if (Object.keys(counts).length === 0) {
      return [{ name: 'No Data', value: 1, color: '#e5e7eb' }];
    }

    return Object.entries(counts).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value,
      color: JOB_TYPE_COLORS[name as keyof typeof JOB_TYPE_COLORS] || JOB_TYPE_COLORS.private,
    }));
  }, [estimates]);

  const kpis = useMemo(() => {
    const total = estimates.length;
    const completed = estimates.filter((e) => e.status === 'completed').length;
    const inProgress = estimates.filter((e) => e.status === 'in_progress').length;
    const totalValue = estimates.reduce((sum, e) => sum + (e.total || 0), 0);
    const avgValue = total > 0 ? totalValue / total : 0;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

    const thisMonthEstimates = estimates.filter((e) => {
      if (!e.createdAt) return false;
      const date = new Date(e.createdAt);
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    }).length;

    const lastMonthEstimates = estimates.filter((e) => {
      if (!e.createdAt) return false;
      const date = new Date(e.createdAt);
      return date.getMonth() === lastMonth && date.getFullYear() === lastMonthYear;
    }).length;

    const monthlyTrend = lastMonthEstimates > 0 
      ? ((thisMonthEstimates - lastMonthEstimates) / lastMonthEstimates) * 100 
      : thisMonthEstimates > 0 ? 100 : 0;

    return {
      total,
      completed,
      inProgress,
      avgValue,
      totalValue,
      completionRate,
      monthlyTrend,
      thisMonthEstimates,
    };
  }, [estimates]);

  const formatCurrency = (value: number) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
    return `$${value.toFixed(0)}`;
  };

  return (
    <div className={cn('space-y-6', className)}>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<Target className="w-5 h-5 text-pd-gold" />}
          value={`${kpis.completionRate}%`}
          label="Completion Rate"
          trend={kpis.completionRate > 0 ? 5.2 : 0}
          trendLabel="vs last month"
        />
        <StatCard
          icon={<CheckCircle2 className="w-5 h-5 text-green-600" />}
          value={kpis.completed}
          label="Completed"
          trend={kpis.completed > 0 ? 12.5 : 0}
          iconBgClass="bg-green-100 dark:bg-green-900/30"
        />
        <StatCard
          icon={<DollarSign className="w-5 h-5 text-blue-600" />}
          value={formatCurrency(kpis.avgValue)}
          label="Avg. Value"
          trend={kpis.avgValue > 0 ? 8.3 : 0}
          iconBgClass="bg-blue-100 dark:bg-blue-900/30"
        />
        <StatCard
          icon={<FileText className="w-5 h-5 text-purple-600" />}
          value={kpis.total}
          label="Total Estimates"
          trend={kpis.monthlyTrend}
          trendLabel={`${kpis.thisMonthEstimates} this month`}
          iconBgClass="bg-purple-100 dark:bg-purple-900/30"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">Monthly Estimates</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Estimates created per month</p>
            </div>
          </div>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#b4975a" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#b4975a" stopOpacity={0}/>
                  </linearGradient>
                </defs>
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
                    backgroundColor: '#1f2937',
                    border: 'none',
                    borderRadius: '8px',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)',
                    color: '#fff',
                  }}
                  labelStyle={{ color: '#fff', fontWeight: 600 }}
                  itemStyle={{ color: '#b4975a' }}
                />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke="#b4975a"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorCount)"
                  name="Estimates"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 shadow-sm">
          <div className="mb-4">
            <h3 className="font-semibold text-gray-900 dark:text-white">Job Types</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Distribution by type</p>
          </div>
          <div className="h-[180px] relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={jobTypeData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="value"
                  strokeWidth={0}
                >
                  {jobTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1f2937',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#fff',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{estimates.length}</p>
                <p className="text-xs text-gray-500">Total</p>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-3 justify-center mt-3">
            {jobTypeData.map((entry) => (
              <div key={entry.name} className="flex items-center gap-2 text-sm">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-gray-600 dark:text-gray-400">{entry.name}</span>
                <span className="font-medium text-gray-900 dark:text-white">{entry.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
