import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { UserButton } from "@clerk/nextjs";

// Force dynamic rendering - this page requires authentication
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-xl font-semibold">XTmate</h1>
            <UserButton afterSignOutUrl="/" />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold">Dashboard</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Welcome to XTmate. Start creating estimates.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-lg border border-gray-200 dark:border-gray-800 p-6">
            <h3 className="font-semibold">Recent Estimates</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              No estimates yet. Create your first one!
            </p>
          </div>

          <div className="rounded-lg border border-gray-200 dark:border-gray-800 p-6">
            <h3 className="font-semibold">Quick Actions</h3>
            <div className="mt-4 space-y-2">
              <button className="w-full text-left px-3 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                + New Estimate
              </button>
              <button className="w-full text-left px-3 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                + New Template
              </button>
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 dark:border-gray-800 p-6">
            <h3 className="font-semibold">Getting Started</h3>
            <ul className="mt-4 space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li>1. Create your first estimate</li>
              <li>2. Add line items and materials</li>
              <li>3. Export to PDF or Excel</li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}
