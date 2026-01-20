"use client";

import { ReactNode, useEffect, useState } from "react";

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  const [ClerkWrapper, setClerkWrapper] = useState<React.ComponentType<{
    children: ReactNode;
  }> | null>(null);

  useEffect(() => {
    const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

    if (publishableKey) {
      // Only import Clerk on client-side when key is available
      import("@clerk/nextjs").then(({ ClerkProvider }) => {
        setClerkWrapper(() => ({ children }: { children: ReactNode }) => (
          <ClerkProvider publishableKey={publishableKey} afterSignOutUrl="/">
            {children}
          </ClerkProvider>
        ));
      });
    }
  }, []);

  // If Clerk is loaded, use it; otherwise render children directly
  if (ClerkWrapper) {
    return <ClerkWrapper>{children}</ClerkWrapper>;
  }

  return <>{children}</>;
}
