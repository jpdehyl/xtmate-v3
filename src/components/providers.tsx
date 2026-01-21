"use client";

import { ReactNode } from "react";
import { ClerkProvider } from "@clerk/nextjs";
import { PermissionsProvider } from "@/hooks/usePermissions";
import { Toaster } from "sonner";

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

  // If no Clerk key, render children without provider
  if (!publishableKey) {
    return (
      <>
        {children}
        <Toaster position="top-right" richColors closeButton />
      </>
    );
  }

  return (
    <ClerkProvider publishableKey={publishableKey} afterSignOutUrl="/">
      <PermissionsProvider>
        {children}
        <Toaster position="top-right" richColors closeButton />
      </PermissionsProvider>
    </ClerkProvider>
  );
}
