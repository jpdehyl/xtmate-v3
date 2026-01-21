import { SlaStatus, SlaEventWithStatus, DEFAULT_SLA_TARGETS, SlaMilestone } from './types';
import type { SlaEvent, CarrierSlaRule } from '@/lib/db/schema';

const AT_RISK_THRESHOLD_HOURS = 4; // Mark as at-risk when within 4 hours of target

/**
 * Calculate the SLA status for an event
 */
export function calculateSlaStatus(event: SlaEvent): SlaStatus {
  // If completed, check if it was overdue
  if (event.completedAt) {
    return event.isOverdue ? 'overdue' : 'completed';
  }

  // If no target, it's pending
  if (!event.targetAt) {
    return 'pending';
  }

  const now = new Date();
  const targetTime = new Date(event.targetAt);

  // If past target, it's overdue
  if (now > targetTime) {
    return 'overdue';
  }

  // If within threshold, it's at risk
  const hoursUntilTarget = (targetTime.getTime() - now.getTime()) / (1000 * 60 * 60);
  if (hoursUntilTarget <= AT_RISK_THRESHOLD_HOURS) {
    return 'at_risk';
  }

  return 'on_time';
}

/**
 * Calculate hours remaining or overdue for an SLA event
 */
export function calculateHoursRemaining(event: SlaEvent): { hoursRemaining: number | null; hoursOverdue: number | null } {
  if (!event.targetAt) {
    return { hoursRemaining: null, hoursOverdue: null };
  }

  const referenceTime = event.completedAt ? new Date(event.completedAt) : new Date();
  const targetTime = new Date(event.targetAt);
  const diffMs = targetTime.getTime() - referenceTime.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);

  if (diffHours >= 0) {
    return { hoursRemaining: Math.round(diffHours * 10) / 10, hoursOverdue: null };
  } else {
    return { hoursRemaining: null, hoursOverdue: Math.round(Math.abs(diffHours) * 10) / 10 };
  }
}

/**
 * Get SLA event with calculated status
 */
export function getSlaEventWithStatus(event: SlaEvent): SlaEventWithStatus {
  const status = calculateSlaStatus(event);
  const { hoursRemaining, hoursOverdue } = calculateHoursRemaining(event);

  return {
    id: event.id,
    milestone: event.milestone as SlaMilestone,
    targetAt: event.targetAt,
    completedAt: event.completedAt,
    isOverdue: event.isOverdue ?? false,
    notes: event.notes,
    status,
    hoursRemaining,
    hoursOverdue,
  };
}

/**
 * Calculate target time for a milestone based on carrier rules or defaults
 */
export function calculateTargetTime(
  milestone: SlaMilestone,
  baseTime: Date,
  carrierRules: CarrierSlaRule[]
): Date | null {
  // Find carrier-specific rule
  const rule = carrierRules.find(r => r.milestone === milestone);
  const targetHours = rule?.targetHours ?? DEFAULT_SLA_TARGETS[milestone];

  // If target is 0, no deadline (externally triggered)
  if (targetHours === 0) {
    return null;
  }

  const targetTime = new Date(baseTime);

  // For simplicity, we're adding calendar hours
  // In production, you might want to implement business hours calculation
  targetTime.setTime(targetTime.getTime() + targetHours * 60 * 60 * 1000);

  return targetTime;
}

/**
 * Get overall SLA compliance rate for a set of estimates
 */
export function calculateSlaCompliance(events: SlaEvent[]): number {
  const completedEvents = events.filter(e => e.completedAt);
  if (completedEvents.length === 0) return 100;

  const onTimeEvents = completedEvents.filter(e => !e.isOverdue);
  return Math.round((onTimeEvents.length / completedEvents.length) * 100);
}

/**
 * Get counts of at-risk and overdue events
 */
export function getSlaRiskCounts(events: SlaEvent[]): { atRisk: number; overdue: number } {
  let atRisk = 0;
  let overdue = 0;

  events.forEach(event => {
    const status = calculateSlaStatus(event);
    if (status === 'at_risk') atRisk++;
    if (status === 'overdue') overdue++;
  });

  return { atRisk, overdue };
}

/**
 * Format hours for display
 */
export function formatHours(hours: number): string {
  if (hours < 1) {
    const minutes = Math.round(hours * 60);
    return `${minutes}m`;
  }
  if (hours < 24) {
    return `${Math.round(hours * 10) / 10}h`;
  }
  const days = Math.floor(hours / 24);
  const remainingHours = Math.round((hours % 24) * 10) / 10;
  if (remainingHours === 0) {
    return `${days}d`;
  }
  return `${days}d ${remainingHours}h`;
}
