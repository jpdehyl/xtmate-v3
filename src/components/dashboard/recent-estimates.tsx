'use client';

import Link from 'next/link';
import { ChevronRight, FileText, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface Estimate {
  id: string;
  name: string | null;
  propertyAddress: string | null;
  propertyCity: string | null;
  propertyState: string | null;
  status: string | null;
  updatedAt: Date | null;
  jobType: string | null;
}

interface RecentEstimatesProps {
  estimates: Estimate[];
  className?: string;
}

const statusConfig: Record<string, { label: string; color: string }> = {
  draft: { label: 'Draft', color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' },
  in_progress: { label: 'In Progress', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  completed: { label: 'Completed', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
};

export function RecentEstimates({ estimates, className }: RecentEstimatesProps) {
  const recentEstimates = estimates.slice(0, 5);

  return (
    <div className={cn('rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm', className)}>
      <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-800">
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-white">Recent Estimates</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">Your latest {recentEstimates.length} estimates</p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href="/dashboard/estimates/new">
            <Plus className="w-4 h-4 mr-1" />
            New
          </Link>
        </Button>
      </div>

      {recentEstimates.length === 0 ? (
        <div className="p-8 text-center">
          <FileText className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">No estimates yet</p>
          <Button asChild size="sm">
            <Link href="/dashboard/estimates/new">
              <Plus className="w-4 h-4 mr-1" />
              Create your first estimate
            </Link>
          </Button>
        </div>
      ) : (
        <ul className="divide-y divide-gray-100 dark:divide-gray-800">
          {recentEstimates.map((estimate, index) => {
            const status = statusConfig[estimate.status || 'draft'] || statusConfig.draft;
            const address = [estimate.propertyAddress, estimate.propertyCity, estimate.propertyState]
              .filter(Boolean)
              .join(', ');

            return (
              <li key={estimate.id}>
                <Link
                  href={`/dashboard/estimates/${estimate.id}`}
                  className="group flex items-center gap-4 px-5 py-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                >
                  {/* Icon */}
                  <div className={cn(
                    'flex-shrink-0 p-2.5 rounded-xl',
                    estimate.jobType === 'insurance'
                      ? 'bg-blue-100 dark:bg-blue-900/30'
                      : 'bg-emerald-100 dark:bg-emerald-900/30'
                  )}>
                    <FileText className={cn(
                      'w-5 h-5',
                      estimate.jobType === 'insurance'
                        ? 'text-blue-600 dark:text-blue-400'
                        : 'text-emerald-600 dark:text-emerald-400'
                    )} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-gray-900 dark:text-white truncate group-hover:text-primary-600 transition-colors">
                        {estimate.name || 'Untitled Estimate'}
                      </span>
                      <span className={cn('px-2 py-0.5 text-xs font-medium rounded-full', status.color)}>
                        {status.label}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                      {address || 'No address'}
                    </p>
                  </div>

                  {/* Date and Arrow */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {estimate.updatedAt
                        ? new Date(estimate.updatedAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                          })
                        : 'N/A'}
                    </span>
                    <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 group-hover:translate-x-0.5 transition-all" />
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      {estimates.length > 5 && (
        <div className="p-4 border-t border-gray-200 dark:border-gray-800">
          <Link
            href="/dashboard/estimates"
            className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 font-medium flex items-center justify-center gap-1"
          >
            View all {estimates.length} estimates
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      )}
    </div>
  );
}
