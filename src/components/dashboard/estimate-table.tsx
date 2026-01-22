'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { FileText, ChevronRight, Search, Filter } from 'lucide-react';

interface Estimate {
  id: string;
  name: string | null;
  propertyAddress: string | null;
  propertyCity: string | null;
  propertyState: string | null;
  status: string | null;
  updatedAt: Date | null;
  createdAt: Date | null;
  jobType: string | null;
  claimNumber?: string | null;
  policyNumber?: string | null;
  insuredName?: string | null;
  total?: number | null;
  userId?: string | null;
}

interface EstimateTableProps {
  estimates: Estimate[];
  className?: string;
}

// Tab configuration
const tabs = [
  { id: 'all', label: 'All', filter: () => true },
  { id: 'draft', label: 'Draft', filter: (e: Estimate) => e.status === 'draft' },
  { id: 'working', label: 'Working', filter: (e: Estimate) => e.status === 'in_progress' },
  { id: 'synced', label: 'Synced', filter: (e: Estimate) => e.status === 'completed' },
  { id: 'revision', label: 'Revision', filter: (e: Estimate) => e.status === 'revision' },
] as const;

type TabId = typeof tabs[number]['id'];

const statusConfig: Record<string, { label: string; color: string }> = {
  draft: { label: 'Draft', color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' },
  in_progress: { label: 'Working', color: 'bg-pd-gold/15 text-pd-gold-700 dark:bg-pd-gold/20 dark:text-pd-gold' },
  completed: { label: 'Synced', color: 'bg-pd-gold/25 text-pd-gold-800 dark:bg-pd-gold/30 dark:text-pd-gold' },
  revision: { label: 'Revision', color: 'bg-pd-gold/10 text-pd-gold-600 dark:bg-pd-gold/15 dark:text-pd-gold-400' },
};

const jobTypeConfig: Record<string, { label: string; color: string }> = {
  insurance: { label: 'Insurance', color: 'bg-pd-gold/15 text-pd-gold-700 dark:bg-pd-gold/20 dark:text-pd-gold' },
  private: { label: 'Private', color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400' },
};

function formatCurrency(value: number | null | undefined): string {
  if (value == null) return '-';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(date: Date | null | undefined): string {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function EstimateTable({ estimates, className }: EstimateTableProps) {
  const [activeTab, setActiveTab] = useState<TabId>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Filter estimates based on active tab and search
  const filteredEstimates = useMemo(() => {
    const tabFilter = tabs.find(t => t.id === activeTab)?.filter || (() => true);

    return estimates
      .filter(tabFilter)
      .filter(e => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        return (
          e.name?.toLowerCase().includes(query) ||
          e.propertyAddress?.toLowerCase().includes(query) ||
          e.propertyCity?.toLowerCase().includes(query) ||
          e.claimNumber?.toLowerCase().includes(query) ||
          e.policyNumber?.toLowerCase().includes(query) ||
          e.insuredName?.toLowerCase().includes(query)
        );
      })
      .sort((a, b) => {
        const dateA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
        const dateB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
        return dateB - dateA;
      });
  }, [estimates, activeTab, searchQuery]);

  // Get counts for each tab
  const tabCounts = useMemo(() => {
    const counts: Record<TabId, number> = {
      all: estimates.length,
      draft: 0,
      working: 0,
      synced: 0,
      revision: 0,
    };

    estimates.forEach(e => {
      if (e.status === 'draft') counts.draft++;
      else if (e.status === 'in_progress') counts.working++;
      else if (e.status === 'completed') counts.synced++;
      else if (e.status === 'revision') counts.revision++;
    });

    return counts;
  }, [estimates]);

  return (
    <div className={cn('rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm overflow-hidden', className)}>
      {/* Header with Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center justify-between px-5 pt-4">
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">Claims & Projects</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {filteredEstimates.length} {filteredEstimates.length === 1 ? 'estimate' : 'estimates'}
            </p>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pd-gold focus:border-transparent"
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-5 mt-4 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors whitespace-nowrap',
                activeTab === tab.id
                  ? 'bg-pd-gold/10 text-pd-gold-700 dark:text-pd-gold border-b-2 border-pd-gold'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800'
              )}
            >
              {tab.label}
              <span className={cn(
                'ml-2 px-1.5 py-0.5 text-xs rounded-full',
                activeTab === tab.id
                  ? 'bg-pd-gold/20 text-pd-gold-700 dark:text-pd-gold'
                  : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
              )}>
                {tabCounts[tab.id]}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {filteredEstimates.length === 0 ? (
        <div className="p-12 text-center">
          <FileText className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {searchQuery ? 'No estimates match your search' : 'No estimates in this category'}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Claim/Project
                </th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Insured
                </th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Profile
                </th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-5 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Modified
                </th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {filteredEstimates.map((estimate) => {
                const status = statusConfig[estimate.status || 'draft'] || statusConfig.draft;
                const jobType = jobTypeConfig[estimate.jobType || 'private'] || jobTypeConfig.private;
                const address = [estimate.propertyCity, estimate.propertyState]
                  .filter(Boolean)
                  .join(', ');

                return (
                  <tr
                    key={estimate.id}
                    className="group hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer"
                  >
                    <td className="px-5 py-4">
                      <Link
                        href={`/dashboard/estimates/${estimate.id}`}
                        className="block"
                      >
                        <div className="font-medium text-gray-900 dark:text-white group-hover:text-pd-gold transition-colors">
                          {estimate.name || 'Untitled Estimate'}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {estimate.claimNumber || address || 'No location'}
                        </div>
                      </Link>
                    </td>
                    <td className="px-5 py-4">
                      <Link
                        href={`/dashboard/estimates/${estimate.id}`}
                        className="block text-sm text-gray-600 dark:text-gray-300"
                      >
                        {estimate.insuredName || '-'}
                      </Link>
                    </td>
                    <td className="px-5 py-4">
                      <Link href={`/dashboard/estimates/${estimate.id}`}>
                        <span className={cn('px-2 py-1 text-xs font-medium rounded-full', jobType.color)}>
                          {jobType.label}
                        </span>
                      </Link>
                    </td>
                    <td className="px-5 py-4">
                      <Link href={`/dashboard/estimates/${estimate.id}`}>
                        <span className={cn('px-2 py-1 text-xs font-medium rounded-full', status.color)}>
                          {status.label}
                        </span>
                      </Link>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Link
                        href={`/dashboard/estimates/${estimate.id}`}
                        className="block text-sm font-medium text-gray-900 dark:text-white tabular-nums"
                      >
                        {formatCurrency(estimate.total)}
                      </Link>
                    </td>
                    <td className="px-5 py-4">
                      <Link
                        href={`/dashboard/estimates/${estimate.id}`}
                        className="block text-sm text-gray-500 dark:text-gray-400"
                      >
                        {formatDate(estimate.updatedAt)}
                      </Link>
                    </td>
                    <td className="px-5 py-4">
                      <Link
                        href={`/dashboard/estimates/${estimate.id}`}
                        className="flex items-center justify-end"
                      >
                        <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 group-hover:translate-x-0.5 transition-all" />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
