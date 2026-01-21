"use client";

import { useState, useEffect, useCallback } from "react";
import {
  SLA_MILESTONE_LABELS,
  SLA_MILESTONE_DESCRIPTIONS,
  SLA_MILESTONES,
  formatHours,
} from "@/lib/sla";
import type { SlaEventWithStatus, SlaMilestone } from "@/lib/sla";
import { SLABadge } from "./sla-badge";

interface SlaTabProps {
  estimateId: string;
  isOnline: boolean;
  carrierId?: string | null;
}

export function SlaTab({ estimateId, isOnline, carrierId }: SlaTabProps) {
  const [events, setEvents] = useState<SlaEventWithStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const [completingMilestone, setCompletingMilestone] = useState<string | null>(null);

  // Fetch SLA events
  const fetchEvents = useCallback(async () => {
    if (!isOnline) return;

    try {
      setIsLoading(true);
      const response = await fetch(`/api/sla-events?estimateId=${estimateId}`);
      if (!response.ok) throw new Error("Failed to fetch SLA events");
      const data = await response.json();
      setEvents(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load SLA events");
    } finally {
      setIsLoading(false);
    }
  }, [estimateId, isOnline]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // Initialize SLA tracking
  async function handleInitialize() {
    setIsInitializing(true);
    setError(null);

    try {
      const response = await fetch("/api/sla-events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          estimateId,
          initialize: true,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to initialize SLA tracking");
      }

      const data = await response.json();
      setEvents(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to initialize");
    } finally {
      setIsInitializing(false);
    }
  }

  // Complete a milestone
  async function handleCompleteMilestone(eventId: string) {
    setCompletingMilestone(eventId);
    setError(null);

    try {
      const response = await fetch(`/api/sla-events/${eventId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ complete: true }),
      });

      if (!response.ok) {
        throw new Error("Failed to complete milestone");
      }

      const updatedEvent = await response.json();
      setEvents((prev) =>
        prev.map((e) => (e.id === eventId ? updatedEvent : e))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to complete milestone");
    } finally {
      setCompletingMilestone(null);
    }
  }

  // Get event for a milestone
  function getEventForMilestone(milestone: SlaMilestone): SlaEventWithStatus | undefined {
    return events.find((e) => e.milestone === milestone);
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-48" />
          <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded" />
        </div>
      </div>
    );
  }

  // Not initialized state
  if (events.length === 0) {
    return (
      <div className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg p-8 text-center">
        <svg
          className="w-12 h-12 mx-auto text-gray-400 mb-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
          SLA Tracking Not Started
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
          Start tracking SLA milestones for this estimate. The system will monitor
          target completion times and alert you when deadlines are approaching.
        </p>
        {error && (
          <p className="text-red-600 dark:text-red-400 text-sm mb-4">{error}</p>
        )}
        <button
          onClick={handleInitialize}
          disabled={isInitializing || !isOnline}
          className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isInitializing ? "Starting..." : "Start SLA Tracking"}
        </button>
        {!isOnline && (
          <p className="text-amber-600 dark:text-amber-400 text-sm mt-4">
            SLA tracking requires an internet connection.
          </p>
        )}
      </div>
    );
  }

  // Get overall status
  const overdueCount = events.filter((e) => e.status === "overdue" && !e.completedAt).length;
  const atRiskCount = events.filter((e) => e.status === "at_risk").length;
  const completedCount = events.filter((e) => e.completedAt).length;

  return (
    <div className="space-y-6">
      {/* Header with summary */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">SLA Timeline</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {completedCount} of {events.length} milestones completed
          </p>
        </div>
        <div className="flex items-center gap-3">
          {overdueCount > 0 && (
            <span className="px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-full text-sm font-medium">
              {overdueCount} Overdue
            </span>
          )}
          {atRiskCount > 0 && (
            <span className="px-3 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-full text-sm font-medium">
              {atRiskCount} At Risk
            </span>
          )}
          {overdueCount === 0 && atRiskCount === 0 && completedCount > 0 && (
            <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-sm font-medium">
              On Track
            </span>
          )}
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm">
          {error}
          <button onClick={() => setError(null)} className="ml-2 underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Timeline */}
      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700" />

        <div className="space-y-6">
          {SLA_MILESTONES.map((milestone, index) => {
            const event = getEventForMilestone(milestone);
            const isCompleted = event?.completedAt != null;
            const isPending = !event;

            return (
              <div key={milestone} className="relative flex gap-4">
                {/* Timeline node */}
                <div
                  className={`relative z-10 w-16 h-16 rounded-full flex items-center justify-center flex-shrink-0 ${
                    isCompleted
                      ? event?.isOverdue
                        ? "bg-red-100 dark:bg-red-900/30 border-2 border-red-500"
                        : "bg-green-100 dark:bg-green-900/30 border-2 border-green-500"
                      : isPending
                      ? "bg-gray-100 dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600"
                      : event?.status === "overdue"
                      ? "bg-red-100 dark:bg-red-900/30 border-2 border-red-500 animate-pulse"
                      : event?.status === "at_risk"
                      ? "bg-amber-100 dark:bg-amber-900/30 border-2 border-amber-500"
                      : "bg-blue-100 dark:bg-blue-900/30 border-2 border-blue-500"
                  }`}
                >
                  {isCompleted ? (
                    event?.isOverdue ? (
                      <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    ) : (
                      <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    )
                  ) : isPending ? (
                    <span className="text-gray-400 font-medium">{index + 1}</span>
                  ) : event?.status === "overdue" ? (
                    <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  ) : event?.status === "at_risk" ? (
                    <svg className="w-6 h-6 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  ) : (
                    <span className="text-blue-600 dark:text-blue-400 font-medium">{index + 1}</span>
                  )}
                </div>

                {/* Milestone content */}
                <div className="flex-1 pb-6">
                  <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium text-gray-900 dark:text-gray-100">
                            {SLA_MILESTONE_LABELS[milestone]}
                          </h3>
                          {event && <SLABadge status={event.status} size="sm" />}
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {SLA_MILESTONE_DESCRIPTIONS[milestone]}
                        </p>
                      </div>

                      {/* Complete button */}
                      {event && !isCompleted && (
                        <button
                          onClick={() => handleCompleteMilestone(event.id)}
                          disabled={completingMilestone === event.id || !isOnline}
                          className="px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {completingMilestone === event.id ? "..." : "Complete"}
                        </button>
                      )}
                    </div>

                    {/* Time info */}
                    {event && (
                      <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                        <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
                          {event.targetAt && (
                            <div>
                              <span className="text-gray-500 dark:text-gray-400">Target: </span>
                              <span className="text-gray-900 dark:text-gray-100">
                                {new Date(event.targetAt).toLocaleString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                  hour: "numeric",
                                  minute: "2-digit",
                                })}
                              </span>
                            </div>
                          )}

                          {event.completedAt && (
                            <div>
                              <span className="text-gray-500 dark:text-gray-400">Completed: </span>
                              <span className={event.isOverdue ? "text-red-600 dark:text-red-400" : "text-green-600 dark:text-green-400"}>
                                {new Date(event.completedAt).toLocaleString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                  hour: "numeric",
                                  minute: "2-digit",
                                })}
                              </span>
                            </div>
                          )}

                          {!event.completedAt && event.hoursRemaining !== null && (
                            <div>
                              <span className="text-gray-500 dark:text-gray-400">Time remaining: </span>
                              <span className={`font-medium ${
                                event.status === "at_risk"
                                  ? "text-amber-600 dark:text-amber-400"
                                  : "text-gray-900 dark:text-gray-100"
                              }`}>
                                {formatHours(event.hoursRemaining)}
                              </span>
                            </div>
                          )}

                          {!event.completedAt && event.hoursOverdue !== null && (
                            <div>
                              <span className="text-gray-500 dark:text-gray-400">Overdue by: </span>
                              <span className="font-medium text-red-600 dark:text-red-400">
                                {formatHours(event.hoursOverdue)}
                              </span>
                            </div>
                          )}

                          {event.isOverdue && event.completedAt && event.hoursOverdue !== null && (
                            <div>
                              <span className="text-gray-500 dark:text-gray-400">Late by: </span>
                              <span className="text-red-600 dark:text-red-400">
                                {formatHours(event.hoursOverdue)}
                              </span>
                            </div>
                          )}
                        </div>

                        {event.notes && (
                          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 italic">
                            {event.notes}
                          </p>
                        )}
                      </div>
                    )}

                    {isPending && (
                      <p className="mt-3 text-sm text-gray-400 italic">
                        Not yet started
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
