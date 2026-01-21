'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Clock, FileText, Camera, Upload, CheckCircle, AlertTriangle, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ActivityItem {
  id: string;
  type: 'estimate_created' | 'estimate_updated' | 'photo_uploaded' | 'status_changed' | 'sla_event' | 'export';
  description: string;
  timestamp: Date;
  estimateId?: string;
  estimateName?: string;
  userId?: string;
  userName?: string;
  userAvatar?: string;
}

interface ActivityFeedProps {
  activities?: ActivityItem[];
  isLoading?: boolean;
  className?: string;
  maxItems?: number;
}

const ACTIVITY_ICONS = {
  estimate_created: Plus,
  estimate_updated: FileText,
  photo_uploaded: Camera,
  status_changed: CheckCircle,
  sla_event: AlertTriangle,
  export: Upload,
};

const ACTIVITY_COLORS = {
  estimate_created: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
  estimate_updated: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  photo_uploaded: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
  status_changed: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
  sla_event: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
  export: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400',
};

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - new Date(date).getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return new Date(date).toLocaleDateString();
}

function getInitials(name?: string): string {
  if (!name) return '??';
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function ActivityFeed({ activities = [], isLoading = false, className, maxItems = 10 }: ActivityFeedProps) {
  const displayActivities = activities.slice(0, maxItems);

  if (isLoading) {
    return (
      <div className={cn('bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl', className)}>
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800">
          <div className="h-6 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        </div>
        <div className="divide-y divide-gray-100 dark:divide-gray-800">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="px-6 py-4 animate-pulse">
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-3/4 bg-gray-200 dark:bg-gray-700 rounded" />
                  <div className="h-3 w-1/4 bg-gray-100 dark:bg-gray-800 rounded" />
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
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Recent Activity
          </h3>
          <Clock className="w-5 h-5 text-gray-400" />
        </div>
      </div>

      {/* Activity List */}
      {displayActivities.length > 0 ? (
        <div className="divide-y divide-gray-100 dark:divide-gray-800">
          {displayActivities.map((activity) => {
            const Icon = ACTIVITY_ICONS[activity.type];
            const colorClass = ACTIVITY_COLORS[activity.type];

            return (
              <div
                key={activity.id}
                className="px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
              >
                <div className="flex gap-4">
                  {/* User Avatar or Activity Icon */}
                  {activity.userAvatar ? (
                    <img
                      src={activity.userAvatar}
                      alt={activity.userName || 'User'}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : activity.userName ? (
                    <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                      <span className="text-sm font-medium text-primary-700 dark:text-primary-300">
                        {getInitials(activity.userName)}
                      </span>
                    </div>
                  ) : (
                    <div className={cn('w-10 h-10 rounded-full flex items-center justify-center', colorClass)}>
                      <Icon className="w-5 h-5" />
                    </div>
                  )}

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900 dark:text-white">
                      {activity.userName && (
                        <span className="font-medium">{activity.userName} </span>
                      )}
                      {activity.description}
                      {activity.estimateName && activity.estimateId && (
                        <Link
                          href={`/dashboard/estimates/${activity.estimateId}`}
                          className="font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 ml-1"
                        >
                          {activity.estimateName}
                        </Link>
                      )}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {formatRelativeTime(activity.timestamp)}
                    </p>
                  </div>

                  {/* Activity Type Icon (for activities with user avatar) */}
                  {activity.userAvatar && (
                    <div className={cn('w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0', colorClass)}>
                      <Icon className="w-4 h-4" />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="px-6 py-12 text-center">
          <Clock className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <p className="text-sm text-gray-500 dark:text-gray-400">No recent activity</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            Activity will appear here as you work on estimates
          </p>
        </div>
      )}
    </div>
  );
}
