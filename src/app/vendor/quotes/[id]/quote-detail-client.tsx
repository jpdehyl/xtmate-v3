"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type {
  Vendor,
  QuoteRequest,
  Estimate,
  LineItem,
  Room,
  Photo,
  VendorQuote,
  VendorQuoteItem,
} from "@/lib/db/schema";
import {
  ArrowLeft,
  Building2,
  FileText,
  Image as ImageIcon,
  MapPin,
  Clock,
  CheckCircle,
  XCircle,
  Send,
  Loader2,
  AlertCircle,
  DollarSign,
} from "lucide-react";

interface QuoteDetailClientProps {
  vendor: Vendor;
  quoteRequest: QuoteRequest;
  estimate: Estimate;
  lineItems: LineItem[];
  rooms: Room[];
  photos: Photo[];
  existingQuote: VendorQuote | null;
  existingQuoteItems: VendorQuoteItem[];
}

function formatDate(date: Date | string | null) {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatCurrency(amount: number | null) {
  if (amount === null) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

export function QuoteDetailClient({
  vendor,
  quoteRequest,
  estimate,
  lineItems,
  rooms,
  photos,
  existingQuote,
  existingQuoteItems,
}: QuoteDetailClientProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Initialize line item prices from existing quote or zeros
  const existingPricesMap = new Map(
    existingQuoteItems.map((item) => [item.lineItemId, item])
  );

  const [itemPrices, setItemPrices] = useState<Record<string, { unitPrice: string; notes: string }>>(
    lineItems.reduce((acc, item) => {
      const existing = existingPricesMap.get(item.id);
      acc[item.id] = {
        unitPrice: existing?.unitPrice?.toString() || "",
        notes: existing?.notes || "",
      };
      return acc;
    }, {} as Record<string, { unitPrice: string; notes: string }>)
  );

  const [laborAmount, setLaborAmount] = useState(existingQuote?.laborAmount?.toString() || "");
  const [materialAmount, setMaterialAmount] = useState(existingQuote?.materialAmount?.toString() || "");
  const [notes, setNotes] = useState(existingQuote?.notes || "");

  const isExpired = quoteRequest.expiresAt && new Date(quoteRequest.expiresAt) < new Date();
  const isAccepted = quoteRequest.status === "accepted";
  const isRejected = quoteRequest.status === "rejected";
  const canSubmit = !existingQuote && !isExpired && !isRejected;

  // Calculate total from item prices
  const calculatedTotal = lineItems.reduce((sum, item) => {
    const priceData = itemPrices[item.id];
    const unitPrice = parseFloat(priceData?.unitPrice || "0") || 0;
    const quantity = item.quantity || 1;
    return sum + unitPrice * quantity;
  }, 0);

  const totalAmount = calculatedTotal + (parseFloat(laborAmount) || 0) + (parseFloat(materialAmount) || 0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!canSubmit) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const items = lineItems.map((item) => ({
        lineItemId: item.id,
        unitPrice: parseFloat(itemPrices[item.id]?.unitPrice || "0") || null,
        quantity: item.quantity,
        total: (parseFloat(itemPrices[item.id]?.unitPrice || "0") || 0) * (item.quantity || 1),
        notes: itemPrices[item.id]?.notes || null,
      }));

      const response = await fetch("/api/vendor/quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quoteRequestId: quoteRequest.id,
          totalAmount,
          laborAmount: parseFloat(laborAmount) || null,
          materialAmount: parseFloat(materialAmount) || null,
          notes: notes || null,
          items,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to submit quote");
      }

      setSuccess(true);
      setTimeout(() => {
        router.push("/vendor");
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Submission failed");
    } finally {
      setIsSubmitting(false);
    }
  }

  function updateItemPrice(itemId: string, field: "unitPrice" | "notes", value: string) {
    setItemPrices((prev) => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        [field]: value,
      },
    }));
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <header className="bg-white dark:bg-slate-800 border-b">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/vendor">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </Link>
            <div>
              <h1 className="font-semibold">{estimate.name}</h1>
              <p className="text-sm text-muted-foreground">{vendor.name}</p>
            </div>
          </div>
          {existingQuote && (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
              <CheckCircle className="w-4 h-4" />
              Quote Submitted
            </span>
          )}
          {isAccepted && (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
              <CheckCircle className="w-4 h-4" />
              Quote Accepted
            </span>
          )}
          {isRejected && (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
              <XCircle className="w-4 h-4" />
              Quote Rejected
            </span>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Success Message */}
        {success && (
          <div className="mb-6 p-4 rounded-lg bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 flex items-center gap-3">
            <CheckCircle className="w-5 h-5" />
            <div>
              <p className="font-medium">Quote submitted successfully!</p>
              <p className="text-sm opacity-80">Redirecting to dashboard...</p>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 rounded-lg bg-destructive/10 text-destructive flex items-center gap-3">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Project Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Property Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="w-5 h-5" />
                  Property Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">
                      {estimate.propertyAddress || "No address provided"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {[estimate.propertyCity, estimate.propertyState, estimate.propertyZip]
                        .filter(Boolean)
                        .join(", ") || "—"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Request Date</p>
                    <p className="font-medium">{formatDate(quoteRequest.createdAt)}</p>
                  </div>
                </div>
                {quoteRequest.expiresAt && (
                  <div className="flex items-center gap-3">
                    <Clock className={`w-5 h-5 ${isExpired ? "text-destructive" : "text-muted-foreground"}`} />
                    <div>
                      <p className="text-sm text-muted-foreground">
                        {isExpired ? "Expired" : "Expires"}
                      </p>
                      <p className={`font-medium ${isExpired ? "text-destructive" : ""}`}>
                        {formatDate(quoteRequest.expiresAt)}
                      </p>
                    </div>
                  </div>
                )}
                {quoteRequest.message && (
                  <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                    <p className="text-sm font-medium mb-1">Message from Estimator</p>
                    <p className="text-sm text-muted-foreground">{quoteRequest.message}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Rooms */}
            {rooms.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="w-5 h-5" />
                    Rooms ({rooms.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {rooms.map((room) => (
                      <div key={room.id} className="p-3 border rounded-lg">
                        <p className="font-medium">{room.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {room.squareFeet ? `${room.squareFeet.toFixed(0)} sq ft` : "—"}
                          {room.category && ` • ${room.category}`}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Scope of Work */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Scope of Work ({lineItems.length} items)
                </CardTitle>
                <CardDescription>
                  {canSubmit
                    ? "Enter your unit prices for each line item"
                    : "Review the scope of work below"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {lineItems.length === 0 ? (
                  <p className="text-center py-8 text-muted-foreground">
                    No line items included in this quote request
                  </p>
                ) : (
                  <div className="space-y-4">
                    {lineItems.map((item) => {
                      const priceData = itemPrices[item.id];
                      const existingItem = existingPricesMap.get(item.id);
                      const itemTotal =
                        (parseFloat(priceData?.unitPrice || "0") || 0) * (item.quantity || 1);

                      return (
                        <div key={item.id} className="border rounded-lg p-4">
                          <div className="flex items-start justify-between gap-4 mb-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                {item.selector && (
                                  <span className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded">
                                    {item.selector}
                                  </span>
                                )}
                                {item.category && (
                                  <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                                    {item.category}
                                  </span>
                                )}
                              </div>
                              <p className="font-medium">{item.description || "No description"}</p>
                              <p className="text-sm text-muted-foreground">
                                Quantity: {item.quantity || 1} {item.unit || "EA"}
                              </p>
                            </div>
                          </div>

                          {canSubmit ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div>
                                <Label htmlFor={`price-${item.id}`} className="text-xs">
                                  Your Unit Price ({item.unit || "EA"})
                                </Label>
                                <div className="relative mt-1">
                                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                  <Input
                                    id={`price-${item.id}`}
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    placeholder="0.00"
                                    value={priceData?.unitPrice || ""}
                                    onChange={(e) => updateItemPrice(item.id, "unitPrice", e.target.value)}
                                    className="pl-8"
                                  />
                                </div>
                              </div>
                              <div>
                                <Label htmlFor={`notes-${item.id}`} className="text-xs">
                                  Notes (optional)
                                </Label>
                                <Input
                                  id={`notes-${item.id}`}
                                  type="text"
                                  placeholder="Any notes..."
                                  value={priceData?.notes || ""}
                                  onChange={(e) => updateItemPrice(item.id, "notes", e.target.value)}
                                  className="mt-1"
                                />
                              </div>
                              {itemTotal > 0 && (
                                <div className="sm:col-span-2 text-right text-sm">
                                  Item Total: <span className="font-medium">{formatCurrency(itemTotal)}</span>
                                </div>
                              )}
                            </div>
                          ) : existingItem ? (
                            <div className="flex items-center justify-between text-sm bg-muted/50 rounded p-2">
                              <span>Your Price: {formatCurrency(existingItem.unitPrice)} / {item.unit}</span>
                              <span className="font-medium">Total: {formatCurrency(existingItem.total)}</span>
                            </div>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Photos */}
            {photos.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ImageIcon className="w-5 h-5" />
                    Photos ({photos.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {photos.map((photo) => (
                      <div key={photo.id} className="relative aspect-square rounded-lg overflow-hidden bg-muted">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={photo.thumbnailUrl || photo.url}
                          alt={photo.caption || "Photo"}
                          className="w-full h-full object-cover"
                        />
                        {photo.photoType && (
                          <span className="absolute bottom-1 left-1 text-xs bg-black/70 text-white px-1.5 py-0.5 rounded">
                            {photo.photoType}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Quote Summary */}
          <div className="space-y-6">
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  {existingQuote ? "Submitted Quote" : "Your Quote"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {canSubmit && (
                  <>
                    <div>
                      <Label htmlFor="labor" className="text-sm">
                        Additional Labor Cost
                      </Label>
                      <div className="relative mt-1">
                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="labor"
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0.00"
                          value={laborAmount}
                          onChange={(e) => setLaborAmount(e.target.value)}
                          className="pl-8"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="material" className="text-sm">
                        Additional Material Cost
                      </Label>
                      <div className="relative mt-1">
                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="material"
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0.00"
                          value={materialAmount}
                          onChange={(e) => setMaterialAmount(e.target.value)}
                          className="pl-8"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="notes" className="text-sm">
                        Notes for Estimator
                      </Label>
                      <textarea
                        id="notes"
                        rows={3}
                        placeholder="Any additional notes, conditions, or clarifications..."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                      />
                    </div>
                  </>
                )}

                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Line Items</span>
                    <span>{formatCurrency(existingQuote ? existingQuote.totalAmount! - (existingQuote.laborAmount || 0) - (existingQuote.materialAmount || 0) : calculatedTotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Additional Labor</span>
                    <span>{formatCurrency(existingQuote?.laborAmount ?? (parseFloat(laborAmount) || 0))}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Additional Materials</span>
                    <span>{formatCurrency(existingQuote?.materialAmount ?? (parseFloat(materialAmount) || 0))}</span>
                  </div>
                  <div className="flex justify-between font-semibold text-lg border-t pt-2">
                    <span>Total</span>
                    <span className="text-primary">
                      {formatCurrency(existingQuote?.totalAmount ?? totalAmount)}
                    </span>
                  </div>
                </div>

                {existingQuote?.validUntil && (
                  <p className="text-xs text-muted-foreground">
                    Quote valid until: {formatDate(existingQuote.validUntil)}
                  </p>
                )}
              </CardContent>
              {canSubmit && (
                <CardFooter>
                  <Button
                    onClick={handleSubmit}
                    disabled={isSubmitting || totalAmount === 0}
                    className="w-full"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Submit Quote
                      </>
                    )}
                  </Button>
                </CardFooter>
              )}
              {isExpired && !existingQuote && (
                <CardFooter>
                  <div className="w-full p-3 bg-muted rounded-lg text-center">
                    <p className="text-sm text-muted-foreground">
                      This quote request has expired
                    </p>
                  </div>
                </CardFooter>
              )}
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
