import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

export const metadata: Metadata = {
  title: "XTmate - Estimation Made Simple",
  description: "Professional estimation tool for construction and landscaping projects",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className="antialiased min-h-screen">{children}</body>
      </html>
    </ClerkProvider>
  );
}
