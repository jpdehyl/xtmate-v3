import { redirect, notFound } from "next/navigation";
import { getVendorFromCookies } from "@/lib/auth/vendor";
import { db } from "@/lib/db";
import {
  quoteRequests,
  quoteRequestItems,
  lineItems,
  estimates,
  rooms,
  photos,
  vendorQuotes,
  vendorQuoteItems,
} from "@/lib/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import { QuoteDetailClient } from "./quote-detail-client";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function QuoteDetailPage({ params }: Props) {
  const { id } = await params;
  const vendor = await getVendorFromCookies();

  if (!vendor) {
    redirect("/vendor/login");
  }

  // Fetch the quote request
  const [quoteRequest] = await db
    .select()
    .from(quoteRequests)
    .where(and(eq(quoteRequests.id, id), eq(quoteRequests.vendorId, vendor.id)))
    .limit(1);

  if (!quoteRequest) {
    notFound();
  }

  // Fetch the estimate
  const [estimate] = await db
    .select()
    .from(estimates)
    .where(eq(estimates.id, quoteRequest.estimateId!))
    .limit(1);

  if (!estimate) {
    notFound();
  }

  // Mark as viewed if not already
  if (!quoteRequest.viewedAt) {
    await db
      .update(quoteRequests)
      .set({
        viewedAt: new Date(),
        status: "viewed",
        updatedAt: new Date(),
      })
      .where(eq(quoteRequests.id, id));
  }

  // Fetch line items included in the quote request
  const requestItems = await db
    .select()
    .from(quoteRequestItems)
    .where(eq(quoteRequestItems.quoteRequestId, id));

  const lineItemIds = requestItems.map((ri) => ri.lineItemId!).filter(Boolean);

  let scopeItems: typeof lineItems.$inferSelect[] = [];
  if (lineItemIds.length > 0) {
    scopeItems = await db
      .select()
      .from(lineItems)
      .where(inArray(lineItems.id, lineItemIds));
  }

  // Fetch rooms for context
  const estimateRooms = await db
    .select()
    .from(rooms)
    .where(eq(rooms.estimateId, estimate.id));

  // Fetch photos for context (read-only for vendor)
  const estimatePhotos = await db
    .select()
    .from(photos)
    .where(eq(photos.estimateId, estimate.id))
    .limit(20); // Limit photos for vendor view

  // Fetch any existing vendor quote
  const [existingQuote] = await db
    .select()
    .from(vendorQuotes)
    .where(eq(vendorQuotes.quoteRequestId, id))
    .limit(1);

  let existingQuoteItems: typeof vendorQuoteItems.$inferSelect[] = [];
  if (existingQuote) {
    existingQuoteItems = await db
      .select()
      .from(vendorQuoteItems)
      .where(eq(vendorQuoteItems.vendorQuoteId, existingQuote.id));
  }

  return (
    <QuoteDetailClient
      vendor={vendor}
      quoteRequest={quoteRequest}
      estimate={estimate}
      lineItems={scopeItems}
      rooms={estimateRooms}
      photos={estimatePhotos}
      existingQuote={existingQuote || null}
      existingQuoteItems={existingQuoteItems}
    />
  );
}
