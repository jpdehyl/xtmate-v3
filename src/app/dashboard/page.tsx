import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { estimates } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import {
  DashboardLayout,
  WelcomeBanner,
  PerformanceMetrics,
  RecentEstimates,
  ProjectsMap,
} from "@/components/dashboard";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  if (!process.env.CLERK_SECRET_KEY) {
    redirect("/");
  }

  const { auth } = await import("@clerk/nextjs/server");
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const userEstimates = await db
    .select()
    .from(estimates)
    .where(eq(estimates.userId, userId))
    .orderBy(desc(estimates.updatedAt));

  // Count active (in_progress) estimates
  const activeCount = userEstimates.filter(
    (e) => e.status === "in_progress"
  ).length;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Welcome Banner */}
        <WelcomeBanner activeClaimsCount={activeCount} />

        {/* Performance Metrics with Charts */}
        <PerformanceMetrics estimates={userEstimates} />

        {/* Two Column Layout: Recent Estimates + Map */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <RecentEstimates estimates={userEstimates} />
          <ProjectsMap projects={userEstimates} />
        </div>
      </div>
    </DashboardLayout>
  );
}
