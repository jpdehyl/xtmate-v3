'use client';

import { useMemo } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts';
import { Building2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CarrierData {
  carrierId: string;
  carrierName: string;
  carrierCode: string;
  count: number;
  totalValue: number;
}

interface CarrierBreakdownProps {
  carriers?: CarrierData[];
  isLoading?: boolean;
  className?: string;
  onCarrierClick?: (carrierId: string) => void;
}

// Color palette for carriers
const CARRIER_COLORS = [
  '#3B82F6', // blue
  '#10B981', // emerald
  '#F59E0B', // amber
  '#EF4444', // red
  '#8B5CF6', // violet
  '#EC4899', // pink
  '#06B6D4', // cyan
  '#84CC16', // lime
  '#F97316', // orange
  '#6366F1', // indigo
];

function formatCurrency(value: number): string {
  if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
  return `$${value.toFixed(0)}`;
}

export function CarrierBreakdown({
  carriers = [],
  isLoading = false,
  className,
  onCarrierClick,
}: CarrierBreakdownProps) {
  const chartData = useMemo(() => {
    return carriers.map((carrier, index) => ({
      ...carrier,
      color: CARRIER_COLORS[index % CARRIER_COLORS.length],
    }));
  }, [carriers]);

  const totalClaims = useMemo(() => {
    return carriers.reduce((sum, c) => sum + c.count, 0);
  }, [carriers]);

  const totalValue = useMemo(() => {
    return carriers.reduce((sum, c) => sum + c.totalValue, 0);
  }, [carriers]);

  if (isLoading) {
    return (
      <div className={cn('bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl', className)}>
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800">
          <div className="h-6 w-40 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        </div>
        <div className="p-6">
          <div className="h-[200px] bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className={cn('bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl', className)}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Claims by Carrier
          </h3>
          <Building2 className="w-5 h-5 text-gray-400" />
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {totalClaims} claims totaling {formatCurrency(totalValue)}
        </p>
      </div>

      {carriers.length > 0 ? (
        <>
          {/* Donut Chart */}
          <div className="p-4">
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="count"
                    nameKey="carrierName"
                  >
                    {chartData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.color}
                        className="cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => onCarrierClick?.(entry.carrierId)}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const data = payload[0].payload;
                      return (
                        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3">
                          <p className="font-medium text-gray-900 dark:text-white">
                            {data.carrierName}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {data.count} claims ({((data.count / totalClaims) * 100).toFixed(1)}%)
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {formatCurrency(data.totalValue)}
                          </p>
                        </div>
                      );
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Legend / Table */}
          <div className="border-t border-gray-100 dark:border-gray-800">
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {chartData.map((carrier) => (
                <button
                  key={carrier.carrierId}
                  onClick={() => onCarrierClick?.(carrier.carrierId)}
                  className="w-full px-6 py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: carrier.color }}
                    />
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {carrier.carrierName}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {carrier.carrierCode}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {carrier.count}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {formatCurrency(carrier.totalValue)}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </>
      ) : (
        <div className="px-6 py-12 text-center">
          <Building2 className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <p className="text-sm text-gray-500 dark:text-gray-400">No carrier data</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            Add insurance estimates with carriers to see breakdown
          </p>
        </div>
      )}
    </div>
  );
}
