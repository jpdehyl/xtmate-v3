import { SignUp } from "@clerk/nextjs";
import Link from "next/link";

// Force dynamic rendering
export const dynamic = "force-dynamic";

export default function SignUpPage() {
  // Show placeholder if Clerk isn't configured
  if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Sign Up</h1>
          <p className="text-gray-600 mb-4">Clerk authentication not configured.</p>
          <Link href="/" className="text-primary-600 hover:underline">
            Back to home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <SignUp />
    </div>
  );
}
