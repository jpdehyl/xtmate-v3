"use client";

interface WorkflowStatusBadgeProps {
  status: string | null | undefined;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}

const WORKFLOW_STATUS_CONFIG: Record<string, {
  label: string;
  color: string;
  bgColor: string;
  icon: string;
  description: string;
}> = {
  draft: {
    label: "Draft",
    color: "text-gray-700 dark:text-gray-300",
    bgColor: "bg-gray-100 dark:bg-gray-700",
    icon: "📝",
    description: "Initial creation, not assigned",
  },
  pm_assigned: {
    label: "PM Assigned",
    color: "text-blue-700 dark:text-blue-300",
    bgColor: "bg-blue-100 dark:bg-blue-900/30",
    icon: "👤",
    description: "Waiting for PM to start site visit",
  },
  pm_in_progress: {
    label: "PM On Site",
    color: "text-amber-700 dark:text-amber-300",
    bgColor: "bg-amber-100 dark:bg-amber-900/30",
    icon: "📱",
    description: "PM is capturing site data",
  },
  pm_completed: {
    label: "PM Complete",
    color: "text-green-700 dark:text-green-300",
    bgColor: "bg-green-100 dark:bg-green-900/30",
    icon: "✅",
    description: "Site capture complete, ready for estimator",
  },
  estimator_review: {
    label: "Estimator Review",
    color: "text-purple-700 dark:text-purple-300",
    bgColor: "bg-purple-100 dark:bg-purple-900/30",
    icon: "🔍",
    description: "Estimator is building the estimate",
  },
  ready_for_export: {
    label: "Ready to Export",
    color: "text-pd-gold-700 dark:text-pd-gold-300",
    bgColor: "bg-pd-gold/20",
    icon: "📤",
    description: "Estimate complete, ready for ESX export",
  },
  exported: {
    label: "Exported",
    color: "text-teal-700 dark:text-teal-300",
    bgColor: "bg-teal-100 dark:bg-teal-900/30",
    icon: "📁",
    description: "ESX file has been generated",
  },
  submitted: {
    label: "Submitted",
    color: "text-emerald-700 dark:text-emerald-300",
    bgColor: "bg-emerald-100 dark:bg-emerald-900/30",
    icon: "🎉",
    description: "Submitted to insurance carrier",
  },
};

const WORKFLOW_STEPS = [
  "draft",
  "pm_assigned",
  "pm_in_progress",
  "pm_completed",
  "estimator_review",
  "ready_for_export",
  "exported",
  "submitted",
];

export function WorkflowStatusBadge({ 
  status, 
  size = "md",
  showLabel = true,
}: WorkflowStatusBadgeProps) {
  const currentStatus = status || "draft";
  const config = WORKFLOW_STATUS_CONFIG[currentStatus] || WORKFLOW_STATUS_CONFIG.draft;

  const sizeClasses = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-3 py-1 text-sm",
    lg: "px-4 py-1.5 text-base",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-full ${config.bgColor} ${config.color} ${sizeClasses[size]}`}
      title={config.description}
    >
      <span>{config.icon}</span>
      {showLabel && <span>{config.label}</span>}
    </span>
  );
}

export function WorkflowProgressBar({ status }: { status: string | null | undefined }) {
  const currentStatus = status || "draft";
  const currentIndex = WORKFLOW_STEPS.indexOf(currentStatus);
  const progress = ((currentIndex + 1) / WORKFLOW_STEPS.length) * 100;

  return (
    <div className="w-full">
      <div className="flex justify-between mb-2">
        <WorkflowStatusBadge status={currentStatus} size="sm" />
        <span className="text-xs text-gray-500 dark:text-gray-400">
          Step {currentIndex + 1} of {WORKFLOW_STEPS.length}
        </span>
      </div>
      <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          className="h-full bg-pd-gold transition-all duration-500 ease-out rounded-full"
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="flex justify-between mt-1">
        <span className="text-xs text-gray-500 dark:text-gray-400">Draft</span>
        <span className="text-xs text-gray-500 dark:text-gray-400">Submitted</span>
      </div>
    </div>
  );
}
