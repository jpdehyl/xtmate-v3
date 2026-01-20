"use client";

import dynamic from "next/dynamic";

const ClerkUserButton = dynamic(
  () => import("@clerk/nextjs").then((mod) => mod.UserButton),
  {
    ssr: false,
    loading: () => (
      <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse" />
    ),
  }
);

export function UserButton() {
  return <ClerkUserButton afterSignOutUrl="/" />;
}
