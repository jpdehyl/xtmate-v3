"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import type { SlaEventWithStatus } from "@/lib/sla";
import { SLA_MILESTONE_LABELS, formatHours } from "@/lib/sla";
import { SLABadge, SLADot } from "./sla-badge";

interface SlaStats {
  atRisk: number;
  overdue: number;
  compliance: number;
}

interface SlaEventWithEstimate extends SlaEventWithStatus {
  estimateName: string;
  estimateId: string;
}

interface SlaDashboardWidgetProps {
  className?: string;
}

export function SlaDashboardWidget({ className = "" }: SlaDashboardWidgetProps) {
  const [events, setEvents] = useState<SlaEventWithEstimate[]>([]);
  const [stats, setStats] = useState<SlaStats>({ atRisk: 0, overdue: 0, compliance: 100 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSlaData() {
      try {
        setIsLoading(true);
        const response = await fetch("/api/sla-events?includeStats=true");
        if (!response.ok) throw new Error("Failed to fetch SLA data");
        const data = await response.json();

        setEvents(data.events || []);
        setStats(data.stats || { atRisk: 0, overdue: 0, compliance: 100 });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load SLA data");
      } finally {
        setIsLoading(false);
      }
    }

    fetchSlaData();
    // Refresh every 5 minutes
    const interval = setInterval(fetchSlaData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Get critical events (overdue or at risk, sorted by urgency)
  const criticalEvents = events
    .filter((e) => (e.status === "overdue" || e.status === "at_risk") && !e.completedAt)
    .sort((a, b) => {
      // Overdue first, then by time remaining/overdue
      if (a.status === "overdue" && b.status !== "overdue") return -1;
      if (b.status === "overdue" && a.status !== "overdue") return 1;
      const aTime = a.hoursOverdue ?? -a.hoursRemaining!;
      const bTime = b.hoursOverdue ?? -b.hoursRemaining!;
      return bTime - aTime; // Most urgent first
    })
    .slice(0, 5);

  if (isLoading) {
    return (
      <div className={`bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-6 ${className}`}>
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-32" />
          <div className="grid grid-cols-3 gap-4">
            <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded" />
            <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded" />
            <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-6 ${className}`}>
        <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
      </div>
    );
  }

  const hasIssues = stats.atRisk > 0 || stats.overdue > 0;

  return (
    <div className={`bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg ${className}`}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            SLA Status
          </h3>
          {hasIssues && (
            <span className="flex items-center gap-1.5 text-sm text-red-600 dark:text-red-400">
              <SLADot status="overdue" pulse />
              Action Required
            </span>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 divide-x divide-gray-100 dark:divide-gray-800">
        <div className="px-4 py-4 text-center">
          <p className="text-2xl font-bold text-red-600 dark:text-red-400">
            {stats.overdue}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Overdue</p>
        </div>
        <div className="px-4 py-4 text-center">
          <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
            {stats.atRisk}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">At Risk</p>
        </div>
        <div className="px-4 py-4 text-center">
          <p className={`text-2xl font-bold ${
            stats.compliance >= 90
              ? "text-green-600 dark:text-green-400"
              : stats.compliance >= 70
              ? "text-amber-600 dark:text-amber-400"
              : "text-red-600 dark:text-red-400"
          }`}>
            {stats.compliance}%
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Compliance</p>
        </div>
      </div>

      {/* Critical Items List */}
      {criticalEvents.length > 0 && (
        <div className="border-t border-gray-100 dark:border-gray-800">
          <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800/50">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              Requires Attention
            </p>
          </div>
          <ul className="divide-y divide-gray-100 dark:divide-gray-800">
            {criticalEvents.map((event) => (
              <li key={event.id} className="px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                <Link href={`/dashboard/estimates/${event.estimateId}`} className="block">
                  <div className="flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                        {event.estimateName}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {SLA_MILESTONE_LABELS[event.milestone]}
                      </p>
                    </div>
                    <div className="ml-4 flex items-center gap-2">
                      {event.status === "overdue" && event.hoursOverdue !== null && (
                        <span className="text-xs text-red-600 dark:text-red-400 font-medium">
                          +{formatHours(event.hoursOverdue)}
                        </span>
                      )}
                      {event.status === "at_risk" && event.hoursRemaining !== null && (
                        <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                          {formatHours(event.hoursRemaining)} left
                        </span>
                      )}
                      <SLABadge status={event.status} size="sm" showIcon={false} />
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Empty State */}
      {events.length === 0 && (
        <div className="px-6 py-8 text-center">
          <svg
            className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No active SLA tracking
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            Start SLA tracking on an estimate to see metrics here
          </p>
        </div>
      )}

      {/* All Good State */}
      {events.length > 0 && !hasIssues && (
        <div className="border-t border-gray-100 dark:border-gray-800 px-6 py-6 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full mb-3">
            <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
            All SLAs On Track
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            No overdue or at-risk milestones
          </p>
        </div>
      )}
    </div>
  );
}
