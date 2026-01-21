"use client";

import type { Estimate } from "@/lib/db/schema";

interface EstimatesFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  statusFilter: Estimate["status"] | "all";
  onStatusChange: (status: Estimate["status"] | "all") => void;
  jobTypeFilter: Estimate["jobType"] | "all";
  onJobTypeChange: (jobType: Estimate["jobType"] | "all") => void;
  resultCount: number;
  totalCount: number;
}

export function EstimatesFilters({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusChange,
  jobTypeFilter,
  onJobTypeChange,
  resultCount,
  totalCount,
}: EstimatesFiltersProps) {
  const hasFilters = searchQuery || statusFilter !== "all" || jobTypeFilter !== "all";

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg
              className="h-5 w-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Search estimates..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange("")}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => onStatusChange(e.target.value as Estimate["status"] | "all")}
          className="px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
        >
          <option value="all">All Statuses</option>
          <option value="draft">Draft</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
        </select>

        {/* Job Type Filter */}
        <select
          value={jobTypeFilter}
          onChange={(e) => onJobTypeChange(e.target.value as Estimate["jobType"] | "all")}
          className="px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
        >
          <option value="all">All Types</option>
          <option value="private">Private</option>
          <option value="insurance">Insurance</option>
        </select>
      </div>

      {/* Results count and clear filters */}
      {hasFilters && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-400">
            Showing {resultCount} of {totalCount} estimate{totalCount !== 1 ? "s" : ""}
          </span>
          <button
            onClick={() => {
              onSearchChange("");
              onStatusChange("all");
              onJobTypeChange("all");
            }}
            className="text-primary-600 hover:text-primary-700 font-medium"
          >
            Clear filters
          </button>
        </div>
      )}
    </div>
  );
}
