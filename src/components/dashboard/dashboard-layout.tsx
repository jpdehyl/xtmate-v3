"use client";

import { ReactNode, useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Sidebar } from "./sidebar";
import { cn } from "@/lib/utils";
import { usePermissions } from "@/hooks/usePermissions";

interface DashboardLayoutProps {
  children: ReactNode;
}

function getInitialCollapsed(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem("xtmate_sidebar_collapsed") === "true";
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { loading: permissionsLoading, needsOnboarding } = usePermissions();
  const [collapsed, setCollapsed] = useState(getInitialCollapsed);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (
      !permissionsLoading &&
      needsOnboarding &&
      pathname !== "/dashboard/onboarding"
    ) {
      router.replace("/dashboard/onboarding");
    }
  }, [permissionsLoading, needsOnboarding, pathname, router]);

  const handleToggleCollapsed = () => {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem("xtmate_sidebar_collapsed", String(next));
  };

  if (
    permissionsLoading ||
    (needsOnboarding && pathname !== "/dashboard/onboarding")
  ) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center shadow-md animate-pulse">
            <span className="text-white font-bold text-lg">PD</span>
          </div>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Sidebar
        collapsed={collapsed}
        onToggleCollapsed={handleToggleCollapsed}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      <button
        type="button"
        aria-label="Open sidebar"
        className="fixed left-4 top-4 z-50 h-10 w-10 rounded-md border bg-white text-sm font-medium shadow-sm md:hidden"
        onClick={() => setMobileOpen((prev) => !prev)}
      >
        ☰
      </button>

      <main
        className={cn(
          "transition-all duration-300 ease-out",
          collapsed ? "md:ml-[84px]" : "md:ml-[260px]"
        )}
      >
        <div className="p-6 pt-20 md:pt-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
