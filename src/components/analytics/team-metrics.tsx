'use client';

import { useMemo, useState } from 'react';
import { Users, ArrowUpDown, ChevronUp, ChevronDown, Clock, DollarSign, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface TeamMemberMetrics {
  userId: string;
  userName: string;
  userAvatar?: string | null;
  claimsCompleted: number;
  claimsInProgress: number;
  totalRevenue: number;
  avgCompletionHours: number;
}

interface TeamMetricsProps {
  members?: TeamMemberMetrics[];
  isLoading?: boolean;
  className?: string;
}

type SortField = 'userName' | 'claimsCompleted' | 'totalRevenue' | 'avgCompletionHours';
type SortDirection = 'asc' | 'desc';

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

function getInitials(name: string): string {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function TeamMetrics({ members = [], isLoading = false, className }: TeamMetricsProps) {
  const [sortField, setSortField] = useState<SortField>('claimsCompleted');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const sortedMembers = useMemo(() => {
    return [...members].sort((a, b) => {
      const multiplier = sortDirection === 'asc' ? 1 : -1;
      if (sortField === 'userName') {
        return multiplier * a.userName.localeCompare(b.userName);
      }
      return multiplier * (a[sortField] - b[sortField]);
    });
  }, [members, sortField, sortDirection]);

  const teamTotals = useMemo(() => {
    return {
      totalClaims: members.reduce((sum, m) => sum + m.claimsCompleted, 0),
      totalRevenue: members.reduce((sum, m) => sum + m.totalRevenue, 0),
      avgCompletion: members.length > 0
        ? members.reduce((sum, m) => sum + m.avgCompletionHours, 0) / members.length
        : 0,
    };
  }, [members]);

  const handleSort = (field: SortField) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (field !== sortField) {
      return <ArrowUpDown className="w-4 h-4 text-gray-400" />;
    }
    return sortDirection === 'asc' ? (
      <ChevronUp className="w-4 h-4 text-primary-600" />
    ) : (
      <ChevronDown className="w-4 h-4 text-primary-600" />
    );
  };

  if (isLoading) {
    return (
      <div className={cn('bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl', className)}>
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800">
          <div className="h-6 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        </div>
        <div className="p-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex items-center gap-4 py-4 animate-pulse">
              <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded" />
                <div className="h-3 w-24 bg-gray-100 dark:bg-gray-800 rounded" />
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
            Team Performance
          </h3>
          <Users className="w-5 h-5 text-gray-400" />
        </div>
        {members.length > 0 && (
          <div className="flex gap-6 mt-3 text-sm">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-500" />
              <span className="text-gray-500 dark:text-gray-400">{teamTotals.totalClaims} claims</span>
            </div>
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-green-500" />
              <span className="text-gray-500 dark:text-gray-400">{formatCurrency(teamTotals.totalRevenue)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-500" />
              <span className="text-gray-500 dark:text-gray-400">{formatHours(teamTotals.avgCompletion)} avg</span>
            </div>
          </div>
        )}
      </div>

      {members.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-800">
                <th className="px-6 py-3 text-left">
                  <button
                    onClick={() => handleSort('userName')}
                    className="flex items-center gap-1 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hover:text-gray-700 dark:hover:text-gray-200"
                  >
                    Team Member
                    <SortIcon field="userName" />
                  </button>
                </th>
                <th className="px-6 py-3 text-right">
                  <button
                    onClick={() => handleSort('claimsCompleted')}
                    className="flex items-center gap-1 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hover:text-gray-700 dark:hover:text-gray-200 ml-auto"
                  >
                    Claims
                    <SortIcon field="claimsCompleted" />
                  </button>
                </th>
                <th className="px-6 py-3 text-right">
                  <button
                    onClick={() => handleSort('totalRevenue')}
                    className="flex items-center gap-1 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hover:text-gray-700 dark:hover:text-gray-200 ml-auto"
                  >
                    Revenue
                    <SortIcon field="totalRevenue" />
                  </button>
                </th>
                <th className="px-6 py-3 text-right">
                  <button
                    onClick={() => handleSort('avgCompletionHours')}
                    className="flex items-center gap-1 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hover:text-gray-700 dark:hover:text-gray-200 ml-auto"
                  >
                    Avg Time
                    <SortIcon field="avgCompletionHours" />
                  </button>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {sortedMembers.map((member) => (
                <tr key={member.userId} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {member.userAvatar ? (
                        <img
                          src={member.userAvatar}
                          alt={member.userName}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                          <span className="text-sm font-medium text-primary-700 dark:text-primary-300">
                            {getInitials(member.userName)}
                          </span>
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {member.userName}
                        </p>
                        {member.claimsInProgress > 0 && (
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {member.claimsInProgress} in progress
                          </p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {member.claimsCompleted}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {formatCurrency(member.totalRevenue)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {formatHours(member.avgCompletionHours)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="px-6 py-12 text-center">
          <Users className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <p className="text-sm text-gray-500 dark:text-gray-400">No team data available</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            Team members will appear as they complete claims
          </p>
        </div>
      )}
    </div>
  );
}
