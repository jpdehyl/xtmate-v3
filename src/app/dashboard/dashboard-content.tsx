"use client";

import { Suspense } from "react";
import dynamic from "next/dynamic";
import { WelcomeBanner } from "@/components/dashboard/welcome-banner";
import { RecentEstimates } from "@/components/dashboard/recent-estimates";

// Dynamic imports for heavy components (recharts ~300KB, Google Maps ~200KB)
const PerformanceMetrics = dynamic(
  () => import("@/components/dashboard/performance-metrics").then((m) => m.PerformanceMetrics),
  {
    ssr: false,
    loading: () => <PerformanceMetricsSkeleton />,
  }
);

const ProjectsMap = dynamic(
  () => import("@/components/dashboard/projects-map").then((m) => m.ProjectsMap),
  {
    ssr: false,
    loading: () => <ProjectsMapSkeleton />,
  }
);

// Skeleton components for loading states
function PerformanceMetricsSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gray-200 dark:bg-gray-700" />
              <div className="space-y-2">
                <div className="h-6 w-16 bg-gray-200 dark:bg-gray-700 rounded" />
                <div className="h-3 w-20 bg-gray-100 dark:bg-gray-800 rounded" />
              </div>
            </div>
          </div>
        ))}
      </div>
      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 shadow-sm">
          <div className="h-[200px] bg-gray-100 dark:bg-gray-800 rounded" />
        </div>
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 shadow-sm">
          <div className="h-[200px] bg-gray-100 dark:bg-gray-800 rounded" />
        </div>
      </div>
    </div>
  );
}

function ProjectsMapSkeleton() {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm overflow-hidden">
      <div className="p-5 border-b border-gray-200 dark:border-gray-800">
        <div className="h-5 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        <div className="h-4 w-48 bg-gray-100 dark:bg-gray-800 rounded mt-1 animate-pulse" />
      </div>
      <div className="h-[300px] bg-gray-50 dark:bg-gray-800/50 animate-pulse" />
    </div>
  );
}

// Types for the data we receive from the server
interface MetricsData {
  id: string;
  status: string | null;
  total: number | null;
  createdAt: Date | null;
  jobType: string | null;
}

interface RecentData {
  id: string;
  name: string;
  propertyAddress: string | null;
  propertyCity: string | null;
  propertyState: string | null;
  status: string | null;
  updatedAt: Date | null;
  jobType: string | null;
}

interface MapData {
  id: string;
  name: string;
  propertyAddress: string | null;
  propertyCity: string | null;
  propertyState: string | null;
  status: string | null;
  jobType: string | null;
}

interface DashboardContentProps {
  activeCount: number;
  metricsData: MetricsData[];
  recentData: RecentData[];
  mapData: MapData[];
}

export function DashboardContent({
  activeCount,
  metricsData,
  recentData,
  mapData,
}: DashboardContentProps) {
  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <WelcomeBanner activeClaimsCount={activeCount} />

      {/* Performance Metrics with Charts - dynamically loaded */}
      <Suspense fallback={<PerformanceMetricsSkeleton />}>
        <PerformanceMetrics estimates={metricsData} />
      </Suspense>

      {/* Two Column Layout: Recent Estimates + Map */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentEstimates estimates={recentData} />
        <Suspense fallback={<ProjectsMapSkeleton />}>
          <ProjectsMap projects={mapData} />
        </Suspense>
      </div>
    </div>
  );
}
