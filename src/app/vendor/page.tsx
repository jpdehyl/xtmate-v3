import { redirect } from "next/navigation";
import { getVendorFromCookies } from "@/lib/auth/vendor";
import { db } from "@/lib/db";
import { quoteRequests, estimates, vendorQuotes } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { VendorDashboard } from "./vendor-dashboard";

export default async function VendorPage() {
  const vendor = await getVendorFromCookies();

  if (!vendor) {
    redirect("/vendor/login");
  }

  // Fetch quote requests for this vendor
  const requests = await db
    .select({
      quoteRequest: quoteRequests,
      estimate: estimates,
    })
    .from(quoteRequests)
    .innerJoin(estimates, eq(quoteRequests.estimateId, estimates.id))
    .where(eq(quoteRequests.vendorId, vendor.id))
    .orderBy(desc(quoteRequests.createdAt));

  // Fetch any submitted quotes
  const quotes = await db
    .select()
    .from(vendorQuotes)
    .where(
      eq(
        vendorQuotes.quoteRequestId,
        requests.length > 0 ? requests[0].quoteRequest.id : "00000000-0000-0000-0000-000000000000"
      )
    );

  const quotesByRequestId = new Map(
    quotes.map((q) => [q.quoteRequestId, q])
  );

  // Transform data for the client
  const requestsWithQuotes = requests.map((r) => ({
    ...r.quoteRequest,
    estimate: r.estimate,
    quote: quotesByRequestId.get(r.quoteRequest.id) || null,
  }));

  return <VendorDashboard vendor={vendor} requests={requestsWithQuotes} />;
}
