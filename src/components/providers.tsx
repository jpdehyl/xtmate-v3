"use client";

import { ReactNode } from "react";
import { ClerkProvider } from "@clerk/nextjs";
import { PermissionsProvider } from "@/hooks/usePermissions";

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

  // If no Clerk key, render children without provider
  if (!publishableKey) {
    return <>{children}</>;
  }

  return (
    <ClerkProvider publishableKey={publishableKey} afterSignOutUrl="/">
      <PermissionsProvider>{children}</PermissionsProvider>
    </ClerkProvider>
  );
}
