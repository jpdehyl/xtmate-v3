import { redirect } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { Users } from "lucide-react";

export const revalidate = 0;

export default async function TeamPage() {
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
        <div className="flex items-center gap-3 mb-3">
          <div className="rounded-xl bg-pd-gold/15 p-2.5">
            <Users className="h-5 w-5 text-pd-gold" />
          </div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Team</h1>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Team management is ready for demo navigation and will surface role, assignment, and productivity insights here.
        </p>
      </section>
    </DashboardLayout>
  );
}
