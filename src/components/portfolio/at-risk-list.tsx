'use client';

import Link from 'next/link';
import { AlertTriangle, Clock, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SLABadge, SLADot } from '@/components/features/sla-badge';

export interface AtRiskEstimate {
  id: string;
  name: string;
  propertyAddress?: string | null;
  status: 'at_risk' | 'overdue';
  milestone: string;
  milestoneLabel: string;
  hoursRemaining?: number | null;
  hoursOverdue?: number | null;
  carrierName?: string | null;
}

interface AtRiskListProps {
  estimates?: AtRiskEstimate[];
  isLoading?: boolean;
  className?: string;
  maxItems?: number;
}

function formatHours(hours: number): string {
  if (hours < 1) return '<1h';
  if (hours < 24) return `${Math.round(hours)}h`;
  const days = Math.floor(hours / 24);
  const remainingHours = Math.round(hours % 24);
  if (remainingHours === 0) return `${days}d`;
  return `${days}d ${remainingHours}h`;
}

export function AtRiskList({
  estimates = [],
  isLoading = false,
  className,
  maxItems = 10,
}: AtRiskListProps) {
  const displayEstimates = estimates.slice(0, maxItems);
  const overdueCount = estimates.filter(e => e.status === 'overdue').length;
  const atRiskCount = estimates.filter(e => e.status === 'at_risk').length;

  if (isLoading) {
    return (
      <div className={cn('bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl', className)}>
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800">
          <div className="h-6 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        </div>
        <div className="divide-y divide-gray-100 dark:divide-gray-800">
          {[1, 2, 3].map(i => (
            <div key={i} className="px-6 py-4 animate-pulse">
              <div className="flex gap-4">
                <div className="w-3 h-3 rounded-full bg-gray-200 dark:bg-gray-700 mt-1" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-1/2 bg-gray-200 dark:bg-gray-700 rounded" />
                  <div className="h-3 w-1/3 bg-gray-100 dark:bg-gray-800 rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={cn('bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl', className)}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              At Risk Claims
            </h3>
            {(overdueCount > 0 || atRiskCount > 0) && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-xs font-medium">
                <SLADot status="overdue" pulse={overdueCount > 0} />
                {overdueCount + atRiskCount}
              </span>
            )}
          </div>
          <AlertTriangle className="w-5 h-5 text-amber-500" />
        </div>
        {estimates.length > 0 && (
          <div className="flex gap-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
            {overdueCount > 0 && (
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-red-500" />
                {overdueCount} overdue
              </span>
            )}
            {atRiskCount > 0 && (
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                {atRiskCount} at risk
              </span>
            )}
          </div>
        )}
      </div>

      {/* List */}
      {displayEstimates.length > 0 ? (
        <div className="divide-y divide-gray-100 dark:divide-gray-800">
          {displayEstimates.map((estimate) => (
            <Link
              key={estimate.id}
              href={`/dashboard/estimates/${estimate.id}`}
              className="block px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
            >
              <div className="flex items-start gap-3">
                <SLADot
                  status={estimate.status}
                  pulse={estimate.status === 'overdue'}
                  className="mt-1.5"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {estimate.name}
                    </p>
                    <SLABadge status={estimate.status} size="sm" showIcon={false} />
                  </div>
                  {estimate.propertyAddress && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                      {estimate.propertyAddress}
                    </p>
                  )}
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {estimate.milestoneLabel}
                    </span>
                    {estimate.status === 'overdue' && estimate.hoursOverdue != null && (
                      <span className="text-xs font-medium text-red-600 dark:text-red-400">
                        +{formatHours(estimate.hoursOverdue)} overdue
                      </span>
                    )}
                    {estimate.status === 'at_risk' && estimate.hoursRemaining != null && (
                      <span className="text-xs font-medium text-amber-600 dark:text-amber-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatHours(estimate.hoursRemaining)} left
                      </span>
                    )}
                  </div>
                  {estimate.carrierName && (
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                      {estimate.carrierName}
                    </p>
                  )}
                </div>
                <ArrowRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="px-6 py-12 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full mb-3">
            <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-sm font-medium text-gray-900 dark:text-white">
            No At-Risk Claims
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            All SLA milestones are on track
          </p>
        </div>
      )}

      {/* View All Link */}
      {estimates.length > maxItems && (
        <div className="px-6 py-3 border-t border-gray-100 dark:border-gray-800">
          <Link
            href="/dashboard?filter=at_risk"
            className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 font-medium flex items-center gap-1"
          >
            View all {estimates.length} claims
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}
    </div>
  );
}
