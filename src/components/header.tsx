"use client";

import Link from "next/link";
import { UserButton } from "./user-button";
import { OfflineIndicator } from "./offline-indicator";

interface HeaderProps {
  showBackLink?: boolean;
  backLinkHref?: string;
  backLinkText?: string;
  rightContent?: React.ReactNode;
}

export function Header({
  showBackLink = false,
  backLinkHref = "/dashboard",
  backLinkText = "Back to Dashboard",
  rightContent,
}: HeaderProps) {
  return (
    <header className="border-b border-gray-200 dark:border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {showBackLink ? (
            <Link
              href={backLinkHref}
              className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
            >
              &larr; {backLinkText}
            </Link>
          ) : (
            <Link href="/dashboard" className="text-xl font-semibold">
              XTmate
            </Link>
          )}
          <div className="flex items-center gap-3">
            <OfflineIndicator />
            {rightContent}
            {!showBackLink && <UserButton />}
          </div>
        </div>
      </div>
    </header>
  );
}
