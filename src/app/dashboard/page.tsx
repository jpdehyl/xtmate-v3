import { redirect } from "next/navigation";
import Link from "next/link";
import { UserButton } from "@/components/user-button";
import { db } from "@/lib/db";
import { estimates } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import type { Estimate } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function getStatusColor(status: Estimate["status"]): string {
  switch (status) {
    case "draft":
      return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300";
    case "in_progress":
      return "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300";
    case "completed":
      return "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300";
    default:
      return "bg-gray-100 text-gray-700";
  }
}

function formatStatus(status: Estimate["status"]): string {
  return status.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

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
      <header className="border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-xl font-semibold">XTmate</h1>
            <UserButton />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-bold">Estimates</h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Manage your project estimates
            </p>
          </div>
          <Link
            href="/dashboard/estimates/new"
            className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
          >
            + New Estimate
          </Link>
        </div>

        {userEstimates.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-gray-300 dark:border-gray-700 rounded-lg">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-gray-100">
              No estimates yet
            </h3>
            <p className="mt-2 text-gray-500 dark:text-gray-400">
              Get started by creating your first estimate.
            </p>
            <Link
              href="/dashboard/estimates/new"
              className="inline-flex items-center mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
            >
              Create Estimate
            </Link>
          </div>
        ) : (
          <div className="overflow-hidden border border-gray-200 dark:border-gray-800 rounded-lg">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Address
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Created
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-950 divide-y divide-gray-200 dark:divide-gray-800">
                {userEstimates.map((estimate) => (
                  <tr
                    key={estimate.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <Link
                        href={`/dashboard/estimates/${estimate.id}`}
                        className="text-primary-600 hover:text-primary-700 font-medium"
                      >
                        {estimate.name}
                      </Link>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {estimate.jobType === "insurance"
                          ? "Insurance"
                          : "Private"}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(estimate.status)}`}
                      >
                        {formatStatus(estimate.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                      {estimate.propertyAddress ? (
                        <span>
                          {estimate.propertyAddress}
                          {estimate.propertyCity && `, ${estimate.propertyCity}`}
                          {estimate.propertyState && `, ${estimate.propertyState}`}
                        </span>
                      ) : (
                        <span className="text-gray-400 dark:text-gray-600">
                          No address
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                      {formatDate(estimate.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
