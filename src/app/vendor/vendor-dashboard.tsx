"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { Vendor, QuoteRequest, Estimate, VendorQuote } from "@/lib/db/schema";
import {
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  LogOut,
  Building2,
  ArrowRight,
  AlertCircle,
} from "lucide-react";

interface QuoteRequestWithDetails extends QuoteRequest {
  estimate: Estimate;
  quote: VendorQuote | null;
}

interface VendorDashboardProps {
  vendor: Vendor;
  requests: QuoteRequestWithDetails[];
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
      label: "Quote Submitted",
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
    label: "New Request",
    color: "bg-primary/10 text-primary",
    icon: FileText,
  };
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

export function VendorDashboard({ vendor, requests }: VendorDashboardProps) {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  async function handleLogout() {
    setIsLoggingOut(true);
    try {
      await fetch("/api/vendor/auth/logout", { method: "POST" });
      router.push("/vendor/login");
    } catch (error) {
      console.error("Logout failed:", error);
      setIsLoggingOut(false);
    }
  }

  const pendingCount = requests.filter(
    (r) => !r.quote && r.status !== "expired" && (!r.expiresAt || new Date(r.expiresAt) >= new Date())
  ).length;

  const submittedCount = requests.filter((r) => r.quote).length;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <header className="bg-white dark:bg-slate-800 border-b">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="font-semibold">{vendor.name}</h1>
              <p className="text-sm text-muted-foreground">{vendor.company || vendor.email}</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleLogout}
            disabled={isLoggingOut}
          >
            <LogOut className="w-4 h-4 mr-2" />
            {isLoggingOut ? "Signing out..." : "Sign Out"}
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pending Requests</p>
                  <p className="text-2xl font-bold">{pendingCount}</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-yellow-100 dark:bg-yellow-900 flex items-center justify-center">
                  <Clock className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Quotes Submitted</p>
                  <p className="text-2xl font-bold">{submittedCount}</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Requests</p>
                  <p className="text-2xl font-bold">{requests.length}</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <FileText className="w-6 h-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quote Requests */}
        <Card>
          <CardHeader>
            <CardTitle>Quote Requests</CardTitle>
            <CardDescription>
              View scope details and submit your pricing for each project
            </CardDescription>
          </CardHeader>
          <CardContent>
            {requests.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
                  <FileText className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="font-medium mb-1">No quote requests yet</h3>
                <p className="text-sm text-muted-foreground">
                  {"You'll see quote requests here when estimators send them to you"}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {requests.map((request) => {
                  const statusInfo = getStatusInfo(request);
                  const StatusIcon = statusInfo.icon;
                  const isExpired = request.expiresAt && new Date(request.expiresAt) < new Date();
                  const canSubmitQuote = !request.quote && !isExpired && request.status !== "rejected";

                  return (
                    <div
                      key={request.id}
                      className="border rounded-lg p-4 hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-medium truncate">
                              {request.estimate.name}
                            </h3>
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${statusInfo.color}`}
                            >
                              <StatusIcon className="w-3 h-3" />
                              {statusInfo.label}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground truncate">
                            {request.estimate.propertyAddress || "No address"}
                            {request.estimate.propertyCity && `, ${request.estimate.propertyCity}`}
                            {request.estimate.propertyState && `, ${request.estimate.propertyState}`}
                          </p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                            <span>Requested: {formatDate(request.createdAt)}</span>
                            {request.expiresAt && (
                              <span className={isExpired ? "text-destructive" : ""}>
                                {isExpired ? "Expired" : "Expires"}: {formatDate(request.expiresAt)}
                              </span>
                            )}
                            {request.quote && (
                              <span className="font-medium text-foreground">
                                Your quote: {formatCurrency(request.quote.totalAmount)}
                              </span>
                            )}
                          </div>
                          {request.message && (
                            <p className="mt-2 text-sm bg-muted/50 rounded p-2">
                              {request.message}
                            </p>
                          )}
                        </div>
                        <div className="flex-shrink-0">
                          {canSubmitQuote ? (
                            <Link href={`/vendor/quotes/${request.id}`}>
                              <Button size="sm">
                                Submit Quote
                                <ArrowRight className="w-4 h-4 ml-2" />
                              </Button>
                            </Link>
                          ) : (
                            <Link href={`/vendor/quotes/${request.id}`}>
                              <Button variant="outline" size="sm">
                                View Details
                              </Button>
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Help Section */}
        <Card className="mt-8">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="font-medium mb-1">Need Help?</h3>
                <p className="text-sm text-muted-foreground">
                  If you have questions about a quote request or need to update your contact information,
                  please reach out to the estimator who sent you the request. Your access token is specific
                  to your vendor account.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
