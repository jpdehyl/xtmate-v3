import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

export const metadata: Metadata = {
  title: "XTmate - Estimation Made Simple",
  description: "Professional estimation tool for construction and landscaping projects",
};

function ClerkProviderWrapper({ children }: { children: React.ReactNode }) {
  // During build, Clerk keys may not be available
  // ClerkProvider will use NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY automatically
  if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
    return <>{children}</>;
  }
  return <ClerkProvider>{children}</ClerkProvider>;
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen">
        <ClerkProviderWrapper>{children}</ClerkProviderWrapper>
      </body>
    </html>
  );
}
