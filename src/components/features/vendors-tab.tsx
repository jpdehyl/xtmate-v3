"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Vendor, QuoteRequest, VendorQuote, LineItem } from "@/lib/db/schema";
import { VENDOR_SPECIALTIES } from "@/lib/db/schema";
import {
  Plus,
  Send,
  Loader2,
  Users,
  Mail,
  Phone,
  Building2,
  CheckCircle,
  Clock,
  XCircle,
  Eye,
  ChevronDown,
  ChevronUp,
  Copy,
  Link as LinkIcon,
  DollarSign,
  Trash2,
  RefreshCw,
} from "lucide-react";

interface QuoteRequestWithDetails extends QuoteRequest {
  vendor: {
    id: string;
    name: string;
    email: string;
    company: string | null;
    specialty: string | null;
  };
  quote: VendorQuote | null;
}

interface VendorsTabProps {
  estimateId: string;
  isOnline: boolean;
}

function formatDate(date: Date | string | null) {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatCurrency(amount: number | null | undefined) {
  if (amount === null || amount === undefined) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

function getStatusInfo(request: QuoteRequestWithDetails) {
  if (request.quote) {
    if (request.status === "accepted") {
      return {
        label: "Accepted",
        color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
        icon: CheckCircle,
      };
    }
    if (request.status === "rejected") {
      return {
        label: "Rejected",
        color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
        icon: XCircle,
      };
    }
    return {
      label: "Quote Received",
      color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      icon: CheckCircle,
    };
  }

  if (request.expiresAt && new Date(request.expiresAt) < new Date()) {
    return {
      label: "Expired",
      color: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
      icon: Clock,
    };
  }

  if (request.viewedAt) {
    return {
      label: "Viewed",
      color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
      icon: Eye,
    };
  }

  return {
    label: "Pending",
    color: "bg-primary/10 text-primary",
    icon: Clock,
  };
}

export function VendorsTab({ estimateId, isOnline }: VendorsTabProps) {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [quoteRequests, setQuoteRequests] = useState<QuoteRequestWithDetails[]>([]);
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // New vendor form state
  const [showNewVendor, setShowNewVendor] = useState(false);
  const [newVendor, setNewVendor] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    specialty: "",
  });
  const [isCreatingVendor, setIsCreatingVendor] = useState(false);

  // Quote request form state
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [selectedVendorId, setSelectedVendorId] = useState<string>("");
  const [selectedLineItemIds, setSelectedLineItemIds] = useState<string[]>([]);
  const [requestMessage, setRequestMessage] = useState("");
  const [expiresInDays, setExpiresInDays] = useState(14);
  const [isCreatingRequest, setIsCreatingRequest] = useState(false);
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);

  // Quote comparison state
  const [showComparison, setShowComparison] = useState(false);

  useEffect(() => {
    fetchData();
  }, [estimateId]);

  async function fetchData() {
    setIsLoading(true);
    setError(null);

    try {
      // Fetch vendors, quote requests, and line items in parallel
      const [vendorsRes, requestsRes, lineItemsRes] = await Promise.all([
        fetch("/api/vendors"),
        fetch(`/api/quote-requests?estimateId=${estimateId}`),
        fetch(`/api/line-items?estimateId=${estimateId}`),
      ]);

      if (!vendorsRes.ok || !requestsRes.ok || !lineItemsRes.ok) {
        throw new Error("Failed to fetch data");
      }

      const vendorsData = await vendorsRes.json();
      const requestsData = await requestsRes.json();
      const lineItemsData = await lineItemsRes.json();

      setVendors(vendorsData.vendors || []);
      setQuoteRequests(requestsData.quoteRequests || []);
      setLineItems(lineItemsData.items || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleCreateVendor(e: React.FormEvent) {
    e.preventDefault();
    setIsCreatingVendor(true);

    try {
      const response = await fetch("/api/vendors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newVendor,
          generateToken: true,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create vendor");
      }

      const data = await response.json();
      setVendors((prev) => [data.vendor, ...prev]);
      setNewVendor({ name: "", email: "", phone: "", company: "", specialty: "" });
      setShowNewVendor(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create vendor");
    } finally {
      setIsCreatingVendor(false);
    }
  }

  async function handleCreateQuoteRequest(e: React.FormEvent) {
    e.preventDefault();

    if (!selectedVendorId || selectedLineItemIds.length === 0) {
      setError("Please select a vendor and at least one line item");
      return;
    }

    setIsCreatingRequest(true);
    setError(null);

    try {
      const response = await fetch("/api/quote-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          estimateId,
          vendorId: selectedVendorId,
          lineItemIds: selectedLineItemIds,
          message: requestMessage || undefined,
          expiresInDays,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create quote request");
      }

      const data = await response.json();
      setInviteUrl(data.loginUrl);

      // Refresh quote requests
      await fetchData();

      // Reset form
      setSelectedVendorId("");
      setSelectedLineItemIds([]);
      setRequestMessage("");
      setShowRequestForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create request");
    } finally {
      setIsCreatingRequest(false);
    }
  }

  async function handleAcceptQuote(requestId: string) {
    try {
      const response = await fetch(`/api/quote-requests/${requestId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "accepted" }),
      });

      if (!response.ok) {
        throw new Error("Failed to accept quote");
      }

      await fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to accept quote");
    }
  }

  async function handleRejectQuote(requestId: string) {
    try {
      const response = await fetch(`/api/quote-requests/${requestId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "rejected" }),
      });

      if (!response.ok) {
        throw new Error("Failed to reject quote");
      }

      await fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reject quote");
    }
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
  }

  function toggleLineItem(itemId: string) {
    setSelectedLineItemIds((prev) =>
      prev.includes(itemId)
        ? prev.filter((id) => id !== itemId)
        : [...prev, itemId]
    );
  }

  function selectAllLineItems() {
    setSelectedLineItemIds(lineItems.map((item) => item.id));
  }

  function clearLineItemSelection() {
    setSelectedLineItemIds([]);
  }

  const quotedRequests = quoteRequests.filter((r) => r.quote);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-4 bg-destructive/10 text-destructive rounded-lg flex items-center gap-2">
          <XCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
          <button
            onClick={() => setError(null)}
            className="ml-auto text-sm hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Invite URL Modal */}
      {inviteUrl && (
        <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5" />
            <div className="flex-1">
              <p className="font-medium text-green-800 dark:text-green-200">
                Quote request sent!
              </p>
              <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                Share this link with the vendor:
              </p>
              <div className="flex items-center gap-2 mt-2">
                <code className="flex-1 bg-green-100 dark:bg-green-800 px-2 py-1 rounded text-xs overflow-x-auto">
                  {inviteUrl}
                </code>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copyToClipboard(inviteUrl)}
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <button
              onClick={() => setInviteUrl(null)}
              className="text-green-600 hover:text-green-800"
            >
              &times;
            </button>
          </div>
        </div>
      )}

      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Vendor Quotes</h2>
          <p className="text-sm text-muted-foreground">
            Request quotes from subcontractors for specific scope items
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowNewVendor(!showNewVendor)}
            disabled={!isOnline}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Vendor
          </Button>
          <Button
            size="sm"
            onClick={() => setShowRequestForm(!showRequestForm)}
            disabled={!isOnline || vendors.length === 0 || lineItems.length === 0}
          >
            <Send className="w-4 h-4 mr-2" />
            Request Quote
          </Button>
        </div>
      </div>

      {/* New Vendor Form */}
      {showNewVendor && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Add New Vendor</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateVendor} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="vendor-name">Name *</Label>
                  <Input
                    id="vendor-name"
                    value={newVendor.name}
                    onChange={(e) => setNewVendor({ ...newVendor, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="vendor-email">Email *</Label>
                  <Input
                    id="vendor-email"
                    type="email"
                    value={newVendor.email}
                    onChange={(e) => setNewVendor({ ...newVendor, email: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="vendor-phone">Phone</Label>
                  <Input
                    id="vendor-phone"
                    value={newVendor.phone}
                    onChange={(e) => setNewVendor({ ...newVendor, phone: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="vendor-company">Company</Label>
                  <Input
                    id="vendor-company"
                    value={newVendor.company}
                    onChange={(e) => setNewVendor({ ...newVendor, company: e.target.value })}
                  />
                </div>
                <div className="sm:col-span-2">
                  <Label htmlFor="vendor-specialty">Specialty</Label>
                  <select
                    id="vendor-specialty"
                    value={newVendor.specialty}
                    onChange={(e) => setNewVendor({ ...newVendor, specialty: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-900 dark:text-gray-100"
                  >
                    <option value="">Select specialty...</option>
                    {VENDOR_SPECIALTIES.map((specialty) => (
                      <option key={specialty} value={specialty}>
                        {specialty.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowNewVendor(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isCreatingVendor}>
                  {isCreatingVendor ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Add Vendor"
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Quote Request Form */}
      {showRequestForm && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Request Quote</CardTitle>
            <CardDescription>
              Select a vendor and the line items to include in the quote request
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateQuoteRequest} className="space-y-4">
              <div>
                <Label htmlFor="select-vendor">Select Vendor *</Label>
                <select
                  id="select-vendor"
                  value={selectedVendorId}
                  onChange={(e) => setSelectedVendorId(e.target.value)}
                  required
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-900 dark:text-gray-100"
                >
                  <option value="">Choose a vendor...</option>
                  {vendors.map((vendor) => (
                    <option key={vendor.id} value={vendor.id}>
                      {vendor.name} {vendor.company && `(${vendor.company})`}
                      {vendor.specialty && ` - ${vendor.specialty}`}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Select Line Items *</Label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={selectAllLineItems}
                      className="text-xs text-primary hover:underline"
                    >
                      Select all
                    </button>
                    <button
                      type="button"
                      onClick={clearLineItemSelection}
                      className="text-xs text-muted-foreground hover:underline"
                    >
                      Clear
                    </button>
                  </div>
                </div>
                <div className="border rounded-lg max-h-60 overflow-y-auto">
                  {lineItems.length === 0 ? (
                    <p className="p-4 text-sm text-muted-foreground text-center">
                      No line items available. Add scope items first.
                    </p>
                  ) : (
                    lineItems.map((item) => (
                      <label
                        key={item.id}
                        className="flex items-start gap-3 p-3 hover:bg-muted/50 cursor-pointer border-b last:border-b-0"
                      >
                        <input
                          type="checkbox"
                          checked={selectedLineItemIds.includes(item.id)}
                          onChange={() => toggleLineItem(item.id)}
                          className="mt-1"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {item.description || "No description"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {item.selector && <span className="font-mono">{item.selector}</span>}
                            {item.quantity && item.unit && (
                              <span className="ml-2">
                                Qty: {item.quantity} {item.unit}
                              </span>
                            )}
                          </p>
                        </div>
                      </label>
                    ))
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {selectedLineItemIds.length} of {lineItems.length} items selected
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="expires-days">Expires In (Days)</Label>
                  <Input
                    id="expires-days"
                    type="number"
                    min="1"
                    max="90"
                    value={expiresInDays}
                    onChange={(e) => setExpiresInDays(parseInt(e.target.value) || 14)}
                  />
                </div>
                <div>
                  <Label htmlFor="request-message">Message (Optional)</Label>
                  <Input
                    id="request-message"
                    value={requestMessage}
                    onChange={(e) => setRequestMessage(e.target.value)}
                    placeholder="Any special instructions..."
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowRequestForm(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isCreatingRequest || !selectedVendorId || selectedLineItemIds.length === 0}
                >
                  {isCreatingRequest ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Send Request
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Quote Comparison */}
      {quotedRequests.length >= 2 && (
        <Card>
          <CardHeader
            className="cursor-pointer"
            onClick={() => setShowComparison(!showComparison)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                <CardTitle className="text-base">Quote Comparison</CardTitle>
                <span className="text-sm text-muted-foreground">
                  ({quotedRequests.length} quotes)
                </span>
              </div>
              {showComparison ? (
                <ChevronUp className="w-5 h-5" />
              ) : (
                <ChevronDown className="w-5 h-5" />
              )}
            </div>
          </CardHeader>
          {showComparison && (
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-3">Vendor</th>
                      <th className="text-right py-2 px-3">Total</th>
                      <th className="text-right py-2 px-3">Labor</th>
                      <th className="text-right py-2 px-3">Material</th>
                      <th className="text-left py-2 px-3">Status</th>
                      <th className="py-2 px-3"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {quotedRequests
                      .sort((a, b) => (a.quote?.totalAmount || 0) - (b.quote?.totalAmount || 0))
                      .map((request, index) => {
                        const isLowest = index === 0;
                        const statusInfo = getStatusInfo(request);

                        return (
                          <tr key={request.id} className="border-b last:border-b-0">
                            <td className="py-2 px-3">
                              <div className="font-medium">{request.vendor.name}</div>
                              {request.vendor.company && (
                                <div className="text-xs text-muted-foreground">
                                  {request.vendor.company}
                                </div>
                              )}
                            </td>
                            <td className="py-2 px-3 text-right">
                              <span className={isLowest ? "font-bold text-green-600" : ""}>
                                {formatCurrency(request.quote?.totalAmount)}
                              </span>
                              {isLowest && (
                                <span className="ml-1 text-xs text-green-600">
                                  (Lowest)
                                </span>
                              )}
                            </td>
                            <td className="py-2 px-3 text-right">
                              {formatCurrency(request.quote?.laborAmount)}
                            </td>
                            <td className="py-2 px-3 text-right">
                              {formatCurrency(request.quote?.materialAmount)}
                            </td>
                            <td className="py-2 px-3">
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${statusInfo.color}`}
                              >
                                {statusInfo.label}
                              </span>
                            </td>
                            <td className="py-2 px-3">
                              {request.status === "quoted" && (
                                <div className="flex gap-1">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleAcceptQuote(request.id)}
                                  >
                                    Accept
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleRejectQuote(request.id)}
                                  >
                                    Reject
                                  </Button>
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          )}
        </Card>
      )}

      {/* Quote Requests List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="w-5 h-5" />
              Quote Requests ({quoteRequests.length})
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={fetchData}>
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {quoteRequests.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">No quote requests yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                {vendors.length === 0
                  ? "Add a vendor first, then request quotes"
                  : "Request quotes from your vendors above"}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {quoteRequests.map((request) => {
                const statusInfo = getStatusInfo(request);
                const StatusIcon = statusInfo.icon;

                return (
                  <div
                    key={request.id}
                    className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">{request.vendor.name}</span>
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${statusInfo.color}`}>
                            <StatusIcon className="w-3 h-3" />
                            {statusInfo.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          {request.vendor.company && (
                            <span className="flex items-center gap-1">
                              <Building2 className="w-3 h-3" />
                              {request.vendor.company}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {request.vendor.email}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          <span>Sent: {formatDate(request.createdAt)}</span>
                          {request.expiresAt && (
                            <span>
                              {new Date(request.expiresAt) < new Date()
                                ? "Expired"
                                : "Expires"}: {formatDate(request.expiresAt)}
                            </span>
                          )}
                          {request.viewedAt && (
                            <span>Viewed: {formatDate(request.viewedAt)}</span>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        {request.quote ? (
                          <div>
                            <p className="text-lg font-semibold">
                              {formatCurrency(request.quote.totalAmount)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Valid until: {formatDate(request.quote.validUntil)}
                            </p>
                            {request.status === "quoted" && (
                              <div className="flex gap-1 mt-2">
                                <Button
                                  size="sm"
                                  onClick={() => handleAcceptQuote(request.id)}
                                >
                                  Accept
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleRejectQuote(request.id)}
                                >
                                  Reject
                                </Button>
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">
                            Awaiting quote
                          </span>
                        )}
                      </div>
                    </div>
                    {request.message && (
                      <p className="mt-2 text-sm bg-muted/50 rounded p-2">
                        {request.message}
                      </p>
                    )}
                    {request.quote?.notes && (
                      <p className="mt-2 text-sm bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 rounded p-2">
                        Vendor notes: {request.quote.notes}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Vendors List */}
      {vendors.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Your Vendors ({vendors.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {vendors.map((vendor) => (
                <div key={vendor.id} className="border rounded-lg p-3">
                  <p className="font-medium">{vendor.name}</p>
                  {vendor.company && (
                    <p className="text-sm text-muted-foreground">{vendor.company}</p>
                  )}
                  <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                    <Mail className="w-3 h-3" />
                    <span className="truncate">{vendor.email}</span>
                  </div>
                  {vendor.phone && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Phone className="w-3 h-3" />
                      <span>{vendor.phone}</span>
                    </div>
                  )}
                  {vendor.specialty && (
                    <span className="inline-block mt-2 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                      {vendor.specialty.replace(/_/g, " ")}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
