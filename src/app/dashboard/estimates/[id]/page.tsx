import { redirect, notFound } from "next/navigation";
import { getEstimateById } from "@/lib/db/queries";
import { EstimateDetailClient } from "./estimate-detail-client";

export const dynamic = "force-dynamic";

type PageParams = { id: string };

export default async function EstimateDetailPage({
  params,
}: {
  params: Promise<PageParams>;
}) {
  // Verify Clerk is configured
  if (!process.env.CLERK_SECRET_KEY) {
    redirect("/");
  }

  // Get authenticated user
  const { auth } = await import("@clerk/nextjs/server");
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  // Resolve params
  const { id } = await params;

  // Fetch estimate server-side using cached query
  const estimate = await getEstimateById(id, userId);

  if (!estimate) {
    notFound();
  }

  // Pass pre-fetched data to client component
  return <EstimateDetailClient initialEstimate={estimate} />;
}
