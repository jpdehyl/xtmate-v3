import { redirect } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { AnalyticsContent } from "./analytics-content";

// Force dynamic rendering for this route
export const revalidate = 0;

export default async function AnalyticsPage() {
  if (!process.env.CLERK_SECRET_KEY) {
    redirect("/");
  }

  const { auth } = await import("@clerk/nextjs/server");
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  return (
    <DashboardLayout>
      <AnalyticsContent userId={userId} />
    </DashboardLayout>
  );
}
