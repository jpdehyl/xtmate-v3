"use client";

import dynamic from "next/dynamic";
import Link from "next/link";

const SignIn = dynamic(
  () => import("@clerk/nextjs").then((mod) => mod.SignIn),
  {
    ssr: false,
    loading: () => (
      <div className="animate-pulse bg-gray-200 dark:bg-gray-800 rounded-lg w-96 h-96" />
    ),
  }
);

export default function SignInPage() {
  const hasClerk = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

  if (!hasClerk) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Sign In</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Authentication not configured yet.
          </p>
          <Link href="/" className="text-primary-600 hover:underline">
            Back to home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <SignIn />
    </div>
  );
}
