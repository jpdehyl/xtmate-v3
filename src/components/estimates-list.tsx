"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import type { Estimate } from "@/lib/db/schema";
import { useOnlineStatus } from "@/lib/offline/hooks";
import { getEstimatesOffline, saveEstimatesOffline, type OfflineEstimate } from "@/lib/offline/storage";
import { EstimatesFilters } from "./estimates-filters";

interface EstimatesListProps {
  initialEstimates: Estimate[];
  userId: string;
}

function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(d);
}

function getStatusColor(status: Estimate["status"]): string {
  switch (status) {
    case "draft":
      return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300";
    case "in_progress":
      return "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300";
    case "completed":
      return "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300";
    default:
      return "bg-gray-100 text-gray-700";
  }
}

function formatStatus(status: Estimate["status"]): string {
  return status.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function EstimatesList({ initialEstimates, userId }: EstimatesListProps) {
  const [estimates, setEstimates] = useState<(Estimate | OfflineEstimate)[]>(initialEstimates);
  const [isOfflineData, setIsOfflineData] = useState(false);
  const { isOnline } = useOnlineStatus();

  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<Estimate["status"] | "all">("all");
  const [jobTypeFilter, setJobTypeFilter] = useState<Estimate["jobType"] | "all">("all");

  // Save initial estimates to IndexedDB for offline access
  useEffect(() => {
    if (initialEstimates.length > 0) {
      saveEstimatesOffline(initialEstimates).catch(() => {
        // IndexedDB might not be available
      });
    }
  }, [initialEstimates]);

  // Load from IndexedDB when offline
  useEffect(() => {
    async function loadOfflineData() {
      if (!isOnline) {
        try {
          const offlineEstimates = await getEstimatesOffline(userId);
          if (offlineEstimates.length > 0) {
            // Sort by updatedAt descending
            offlineEstimates.sort((a, b) => {
              const dateA = new Date(a.updatedAt).getTime();
              const dateB = new Date(b.updatedAt).getTime();
              return dateB - dateA;
            });
            setEstimates(offlineEstimates);
            setIsOfflineData(true);
          }
        } catch {
          // IndexedDB not available
        }
      } else {
        setIsOfflineData(false);
      }
    }

    loadOfflineData();
  }, [isOnline, userId]);

  // Filter estimates based on search and filters
  const filteredEstimates = useMemo(() => {
    return estimates.filter((estimate) => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesName = estimate.name.toLowerCase().includes(query);
        const matchesAddress = estimate.propertyAddress?.toLowerCase().includes(query);
        const matchesCity = estimate.propertyCity?.toLowerCase().includes(query);
        const matchesClaim = estimate.claimNumber?.toLowerCase().includes(query);
        const matchesPolicy = estimate.policyNumber?.toLowerCase().includes(query);

        if (!matchesName && !matchesAddress && !matchesCity && !matchesClaim && !matchesPolicy) {
          return false;
        }
      }

      // Status filter
      if (statusFilter !== "all" && estimate.status !== statusFilter) {
        return false;
      }

      // Job type filter
      if (jobTypeFilter !== "all" && estimate.jobType !== jobTypeFilter) {
        return false;
      }

      return true;
    });
  }, [estimates, searchQuery, statusFilter, jobTypeFilter]);

  return (
    <>
      {isOfflineData && (
        <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg text-amber-800 dark:text-amber-200 text-sm">
          Showing cached data. Changes will sync when you&apos;re back online.
        </div>
      )}

      {estimates.length > 0 && (
        <div className="mb-6">
          <EstimatesFilters
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            statusFilter={statusFilter}
            onStatusChange={setStatusFilter}
            jobTypeFilter={jobTypeFilter}
            onJobTypeChange={setJobTypeFilter}
            resultCount={filteredEstimates.length}
            totalCount={estimates.length}
          />
        </div>
      )}

      {estimates.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-gray-300 dark:border-gray-700 rounded-lg">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-gray-100">
            No estimates yet
          </h3>
          <p className="mt-2 text-gray-500 dark:text-gray-400">
            Get started by creating your first estimate.
          </p>
          <Link
            href="/dashboard/estimates/new"
            className="inline-flex items-center mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
          >
            Create Estimate
          </Link>
        </div>
      ) : filteredEstimates.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-gray-300 dark:border-gray-700 rounded-lg">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-gray-100">
            No matching estimates
          </h3>
          <p className="mt-2 text-gray-500 dark:text-gray-400">
            Try adjusting your search or filters.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden border border-gray-200 dark:border-gray-800 rounded-lg">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden sm:table-cell">
                  Address
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden md:table-cell">
                  Created
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-950 divide-y divide-gray-200 dark:divide-gray-800">
              {filteredEstimates.map((estimate) => {
                const isPending = "_syncStatus" in estimate && estimate._syncStatus === "pending";
                return (
                  <tr
                    key={estimate.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <Link
                        href={`/dashboard/estimates/${estimate.id}`}
                        className="text-primary-600 hover:text-primary-700 font-medium"
                      >
                        {estimate.name}
                        {isPending && (
                          <span className="ml-2 inline-flex w-2 h-2 bg-amber-500 rounded-full" title="Pending sync" />
                        )}
                      </Link>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {estimate.jobType === "insurance" ? "Insurance" : "Private"}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(estimate.status)}`}
                      >
                        {formatStatus(estimate.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400 hidden sm:table-cell">
                      {estimate.propertyAddress ? (
                        <span>
                          {estimate.propertyAddress}
                          {estimate.propertyCity && `, ${estimate.propertyCity}`}
                          {estimate.propertyState && `, ${estimate.propertyState}`}
                        </span>
                      ) : (
                        <span className="text-gray-400 dark:text-gray-600">
                          No address
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400 hidden md:table-cell">
                      {formatDate(estimate.createdAt)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
