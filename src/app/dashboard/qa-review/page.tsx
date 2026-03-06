import { redirect } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import Link from "next/link";
import { ClipboardCheck, ArrowRight } from "lucide-react";

export const revalidate = 0;

export default async function QAReviewPage() {
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
      <section className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-8 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="rounded-xl bg-pd-gold/15 p-3">
            <ClipboardCheck className="h-6 w-6 text-pd-gold" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">QA Review</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 max-w-2xl">
              Review pending estimates, validate scope quality, and confirm export readiness before handoff.
            </p>
            <Link
              href="/dashboard/estimates"
              className="inline-flex items-center gap-2 text-sm font-medium text-pd-gold hover:text-pd-gold-600"
            >
              Open estimates queue
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </DashboardLayout>
  );
}
