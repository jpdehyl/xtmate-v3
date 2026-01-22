import * as React from 'react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: React.ComponentType<{ className?: string }>;
  trend?: {
    value: number;
    label: string;
    positive?: boolean;
  };
  className?: string;
}

export function StatCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  className,
}: StatCardProps) {
  return (
    <div
      className={cn(
        'rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 shadow-sm transition-shadow hover:shadow-md',
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 text-balance">
            {title}
          </p>
          <p className="text-2xl font-bold tracking-tight tabular-nums text-gray-900 dark:text-white">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </p>
        </div>
        {Icon && (
          <div className="rounded-md bg-pd-gold/10 p-2">
            <Icon className="h-5 w-5 text-pd-gold" aria-hidden="true" />
          </div>
        )}
      </div>

      {(description || trend) && (
        <div className="mt-3 flex items-center gap-2 text-xs">
          {trend && (
            <span
              className={cn(
                'inline-flex items-center rounded-full px-1.5 py-0.5 font-medium tabular-nums',
                trend.positive
                  ? 'bg-pd-gold/15 text-pd-gold-700 dark:text-pd-gold'
                  : 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400'
              )}
            >
              {trend.positive ? '+' : ''}
              {trend.value}%
            </span>
          )}
          {description && (
            <span className="text-gray-500 dark:text-gray-400">{description}</span>
          )}
          {trend && <span className="text-gray-500 dark:text-gray-400">{trend.label}</span>}
        </div>
      )}
    </div>
  );
}

export function StatCardSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 shadow-sm',
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-8 w-16" />
        </div>
        <Skeleton className="h-9 w-9 rounded-md" />
      </div>
      <div className="mt-3 flex items-center gap-2">
        <Skeleton className="h-4 w-12 rounded-full" />
        <Skeleton className="h-4 w-24" />
      </div>
    </div>
  );
}

interface StatCardsGridProps {
  children: React.ReactNode;
  className?: string;
}

export function StatCardsGrid({ children, className }: StatCardsGridProps) {
  return (
    <div
      className={cn(
        'grid gap-4 sm:grid-cols-2 lg:grid-cols-4',
        className
      )}
    >
      {children}
    </div>
  );
}
