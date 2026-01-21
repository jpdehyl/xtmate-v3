"use client";

import type { SlaStatus } from "@/lib/sla";

interface SLABadgeProps {
  status: SlaStatus;
  size?: "sm" | "md" | "lg";
  showIcon?: boolean;
  className?: string;
}

const STATUS_CONFIG: Record<
  SlaStatus,
  {
    label: string;
    bgColor: string;
    textColor: string;
    icon: React.ReactNode;
  }
> = {
  on_time: {
    label: "On Time",
    bgColor: "bg-green-100 dark:bg-green-900/30",
    textColor: "text-green-700 dark:text-green-400",
    icon: (
      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
    ),
  },
  at_risk: {
    label: "At Risk",
    bgColor: "bg-amber-100 dark:bg-amber-900/30",
    textColor: "text-amber-700 dark:text-amber-400",
    icon: (
      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  overdue: {
    label: "Overdue",
    bgColor: "bg-red-100 dark:bg-red-900/30",
    textColor: "text-red-700 dark:text-red-400",
    icon: (
      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
  },
  completed: {
    label: "Completed",
    bgColor: "bg-blue-100 dark:bg-blue-900/30",
    textColor: "text-blue-700 dark:text-blue-400",
    icon: (
      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  pending: {
    label: "Pending",
    bgColor: "bg-gray-100 dark:bg-gray-800",
    textColor: "text-gray-600 dark:text-gray-400",
    icon: (
      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
};

const SIZE_CLASSES = {
  sm: "text-xs px-2 py-0.5",
  md: "text-sm px-2.5 py-1",
  lg: "text-sm px-3 py-1.5",
};

export function SLABadge({
  status,
  size = "md",
  showIcon = true,
  className = "",
}: SLABadgeProps) {
  const config = STATUS_CONFIG[status];

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-medium ${config.bgColor} ${config.textColor} ${SIZE_CLASSES[size]} ${className}`}
    >
      {showIcon && config.icon}
      {config.label}
    </span>
  );
}

// Compact variant for estimates list
interface SLAIndicatorProps {
  atRisk: number;
  overdue: number;
  className?: string;
}

export function SLAIndicator({ atRisk, overdue, className = "" }: SLAIndicatorProps) {
  if (atRisk === 0 && overdue === 0) {
    return (
      <div className={`flex items-center gap-1 text-green-600 dark:text-green-400 ${className}`}>
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
        <span className="text-xs font-medium">On Track</span>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {overdue > 0 && (
        <div className="flex items-center gap-1 text-red-600 dark:text-red-400">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span className="text-xs font-medium">{overdue}</span>
        </div>
      )}
      {atRisk > 0 && (
        <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-xs font-medium">{atRisk}</span>
        </div>
      )}
    </div>
  );
}

// Status dot for minimal display
interface SLADotProps {
  status: SlaStatus;
  size?: "sm" | "md" | "lg";
  pulse?: boolean;
  className?: string;
}

const DOT_COLORS: Record<SlaStatus, string> = {
  on_time: "bg-green-500",
  at_risk: "bg-amber-500",
  overdue: "bg-red-500",
  completed: "bg-blue-500",
  pending: "bg-gray-400",
};

const DOT_SIZES = {
  sm: "w-2 h-2",
  md: "w-2.5 h-2.5",
  lg: "w-3 h-3",
};

export function SLADot({ status, size = "md", pulse = false, className = "" }: SLADotProps) {
  const shouldPulse = pulse && (status === "at_risk" || status === "overdue");

  return (
    <span className={`relative inline-flex ${className}`}>
      {shouldPulse && (
        <span
          className={`absolute inline-flex h-full w-full rounded-full ${DOT_COLORS[status]} opacity-75 animate-ping`}
        />
      )}
      <span
        className={`relative inline-flex rounded-full ${DOT_COLORS[status]} ${DOT_SIZES[size]}`}
      />
    </span>
  );
}
