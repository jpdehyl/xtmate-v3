import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

// Force dynamic rendering - checks auth state
export const dynamic = "force-dynamic";

export default async function HomePage() {
  // Only check auth if Clerk is configured
  if (process.env.CLERK_SECRET_KEY) {
    const { userId } = await auth();
    if (userId) {
      redirect("/dashboard");
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="max-w-2xl text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
          XTmate
        </h1>
        <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
          Professional estimation tool for construction and landscaping projects.
          Create accurate estimates in minutes, not hours.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/sign-up"
            className="rounded-lg bg-primary-600 px-6 py-3 text-white font-medium hover:bg-primary-700 transition-colors"
          >
            Get Started
          </Link>
          <Link
            href="/sign-in"
            className="rounded-lg border border-gray-300 dark:border-gray-700 px-6 py-3 font-medium hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
          >
            Sign In
          </Link>
        </div>
      </div>
    </main>
  );
}
