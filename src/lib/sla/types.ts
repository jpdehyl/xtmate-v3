// SLA types and utilities

export type SlaMilestone =
  | 'assigned'
  | 'contacted'
  | 'site_visit'
  | 'estimate_uploaded'
  | 'revision_requested'
  | 'approved'
  | 'closed';

export const SLA_MILESTONES: SlaMilestone[] = [
  'assigned',
  'contacted',
  'site_visit',
  'estimate_uploaded',
  'revision_requested',
  'approved',
  'closed',
];

export const SLA_MILESTONE_LABELS: Record<SlaMilestone, string> = {
  assigned: 'Job Assigned',
  contacted: 'Insured Contacted',
  site_visit: 'Site Visit',
  estimate_uploaded: 'Estimate Uploaded',
  revision_requested: 'Revision Requested',
  approved: 'Approved',
  closed: 'Job Closed',
};

export const SLA_MILESTONE_DESCRIPTIONS: Record<SlaMilestone, string> = {
  assigned: 'Job has been received and assigned to estimator',
  contacted: 'Initial contact made with the insured party',
  site_visit: 'On-site inspection completed',
  estimate_uploaded: 'Estimate has been submitted for review',
  revision_requested: 'Revisions have been requested by adjuster',
  approved: 'Estimate has been approved',
  closed: 'Job has been completed and closed',
};

// Default SLA target hours (used when no carrier-specific rules exist)
export const DEFAULT_SLA_TARGETS: Record<SlaMilestone, number> = {
  assigned: 0, // Immediate - this is when the job starts
  contacted: 4, // 4 hours to contact insured
  site_visit: 24, // 24 hours to complete site visit
  estimate_uploaded: 48, // 48 hours to upload estimate
  revision_requested: 0, // Triggered externally
  approved: 0, // Triggered externally
  closed: 0, // Triggered externally
};

export type SlaStatus = 'on_time' | 'at_risk' | 'overdue' | 'completed' | 'pending';

export interface SlaEventWithStatus {
  id: string;
  milestone: SlaMilestone;
  targetAt: Date | null;
  completedAt: Date | null;
  isOverdue: boolean;
  notes: string | null;
  status: SlaStatus;
  hoursRemaining: number | null;
  hoursOverdue: number | null;
}
