import { redirect } from "next/navigation";
import {
  getEstimatesByUserId,
  getActiveEstimatesCount,
} from "@/lib/db/queries";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { DashboardContent } from "./dashboard-content";

// Force dynamic rendering for this route
export const revalidate = 0;

export default async function DashboardPage() {
  if (!process.env.CLERK_SECRET_KEY) {
    redirect("/");
  }

  const { auth } = await import("@clerk/nextjs/server");
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  // Fetch data using cached queries - parallel for performance
  const [userEstimates, activeCount] = await Promise.all([
    getEstimatesByUserId(userId),
    getActiveEstimatesCount(userId),
  ]);

  // Minimize serialization - only pass needed fields to each component
  const metricsData = userEstimates.map((e) => ({
    id: e.id,
    status: e.status,
    total: null as number | null, // Not in schema yet, but typed correctly
    createdAt: e.createdAt,
    jobType: e.jobType,
  }));

  const recentData = userEstimates.slice(0, 5).map((e) => ({
    id: e.id,
    name: e.name,
    propertyAddress: e.propertyAddress,
    propertyCity: e.propertyCity,
    propertyState: e.propertyState,
    status: e.status,
    updatedAt: e.updatedAt,
    jobType: e.jobType,
  }));

  const mapData = userEstimates.map((e) => ({
    id: e.id,
    name: e.name,
    propertyAddress: e.propertyAddress,
    propertyCity: e.propertyCity,
    propertyState: e.propertyState,
    latitude: null as number | null,
    longitude: null as number | null,
    status: e.status,
    jobType: e.jobType,
  }));

  // Full data for the projects table with tabs
  const tableData = userEstimates.map((e) => ({
    id: e.id,
    name: e.name,
    propertyAddress: e.propertyAddress,
    propertyCity: e.propertyCity,
    propertyState: e.propertyState,
    status: e.status,
    updatedAt: e.updatedAt,
    createdAt: e.createdAt,
    jobType: e.jobType,
    projectType: e.projectType ?? null,
    projectNumber: e.projectNumber ?? null,
    claimNumber: e.claimNumber ?? null,
    policyNumber: e.policyNumber ?? null,
    insuredName: e.insuredName ?? null,
    total: null as number | null, // Calculated from line items
  }));

  return (
    <DashboardLayout>
      <DashboardContent
        activeCount={activeCount}
        metricsData={metricsData}
        recentData={recentData}
        mapData={mapData}
        tableData={tableData}
      />
    </DashboardLayout>
  );
}
