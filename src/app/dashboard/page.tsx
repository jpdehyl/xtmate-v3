import { redirect } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/header";
import { EstimatesList } from "@/components/estimates-list";
import { db } from "@/lib/db";
import { estimates } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

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

  return (
    <div className="min-h-screen">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">
          <div>
            <h2 className="text-2xl font-bold">Estimates</h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Manage your project estimates
            </p>
          </div>
          <Link
            href="/dashboard/estimates/new"
            className="inline-flex items-center justify-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
          >
            + New Estimate
          </Link>
        </div>

        <EstimatesList initialEstimates={userEstimates} userId={userId} />
      </main>
    </div>
  );
}
