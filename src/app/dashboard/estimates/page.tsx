import { redirect } from "next/navigation";
import { getEstimatesByUserId } from "@/lib/db/queries";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { EstimatesPageContent } from "./estimates-page-content";

// Force dynamic rendering
export const dynamic = "force-dynamic";

export default async function EstimatesPage() {
  if (!process.env.CLERK_SECRET_KEY) {
    redirect("/");
  }

  const { auth } = await import("@clerk/nextjs/server");
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  // Fetch all estimates for the user
  const userEstimates = await getEstimatesByUserId(userId);

  // Transform data for the table
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
    total: null as number | null,
  }));

  return (
    <DashboardLayout>
      <EstimatesPageContent estimates={tableData} />
    </DashboardLayout>
  );
}
