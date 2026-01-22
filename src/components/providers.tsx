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

  if (!publishableKey) {
    return (
      <>
        {children}
        <Toaster position="top-right" richColors closeButton />
      </>
    );
  }

  return (
    <ClerkProvider 
      publishableKey={publishableKey}
      signInFallbackRedirectUrl="/dashboard"
      signUpFallbackRedirectUrl="/dashboard"
    >
      <PermissionsProvider>
        {children}
        <Toaster position="top-right" richColors closeButton />
      </PermissionsProvider>
    </ClerkProvider>
  );
}
