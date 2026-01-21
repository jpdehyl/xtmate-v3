"use client";

import { ReactNode, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Sidebar } from "./sidebar";
import { cn } from "@/lib/utils";
import { usePermissions } from "@/hooks/usePermissions";

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { loading: permissionsLoading, needsOnboarding } = usePermissions();

  // Redirect to onboarding if user hasn't completed setup (except on onboarding page)
  useEffect(() => {
    if (
      !permissionsLoading &&
      needsOnboarding &&
      pathname !== "/dashboard/onboarding"
    ) {
      router.replace("/dashboard/onboarding");
    }
  }, [permissionsLoading, needsOnboarding, pathname, router]);

  // Show loading state while checking permissions, or if redirecting to onboarding
  if (
    permissionsLoading ||
    (needsOnboarding && pathname !== "/dashboard/onboarding")
  ) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 bg-gradient-to-br from-pd-gold-400 to-pd-gold-600 rounded-lg flex items-center justify-center shadow-md animate-pulse">
            <span className="text-white font-bold text-lg">PD</span>
          </div>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Sidebar showCommandCenter={true} />

      {/* Main content with sidebar offset */}
      <main
        className={cn(
          "transition-all duration-300 ease-out",
          "ml-[72px] lg:ml-[260px]" // Collapsed on mobile, expanded on desktop
        )}
      >
        <div className="p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
