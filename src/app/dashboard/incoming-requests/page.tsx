"use client";

import { useState, useEffect, useCallback } from "react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Mail, 
  RefreshCw, 
  Plus, 
  XCircle, 
  CheckCircle, 
  Clock, 
  ArrowRight,
  Filter
} from "lucide-react";
import Link from "next/link";

interface ParsedData {
  insuredName?: string;
  insuredPhone?: string;
  propertyAddress?: string;
  propertyCity?: string;
  propertyState?: string;
  claimNumber?: string;
  carrierName?: string;
  adjusterName?: string;
  damageType?: string;
}

interface IncomingEmail {
  id: string;
  gmailMessageId: string;
  fromAddress: string;
  fromName: string;
  subject: string;
  receivedAt: string;
  parsedData: ParsedData | null;
  parseConfidence: number | null;
  status: "pending" | "processing" | "parsed" | "estimate_created" | "ignored" | "failed";
  estimateId: string | null;
}

const STATUS_BADGES: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  pending: { label: "Pending", variant: "secondary" },
  processing: { label: "Processing", variant: "secondary" },
  parsed: { label: "Ready", variant: "default" },
  estimate_created: { label: "Estimate Created", variant: "outline" },
  ignored: { label: "Ignored", variant: "outline" },
  failed: { label: "Failed", variant: "destructive" },
};

export default function IncomingRequestsPage() {
  const [emails, setEmails] = useState<IncomingEmail[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [filter, setFilter] = useState<string>("all");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchEmails = useCallback(async () => {
    try {
      const statusParam = filter !== "all" ? `?status=${filter}` : "";
      const res = await fetch(`/api/gmail/emails${statusParam}`);
      const data = await res.json();
      setEmails(data.emails || []);
    } catch (err) {
      console.error("Failed to fetch emails:", err);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchEmails();
  }, [fetchEmails]);

  async function handleSync() {
    setSyncing(true);
    try {
      const res = await fetch("/api/gmail/sync", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        fetchEmails();
      }
    } catch (err) {
      console.error("Failed to sync:", err);
    } finally {
      setSyncing(false);
    }
  }

  async function handleAction(emailId: string, action: "create_estimate" | "ignore") {
    setActionLoading(emailId);
    try {
      const res = await fetch("/api/gmail/emails", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emailId, action }),
      });
      const data = await res.json();
      if (data.success) {
        if (action === "create_estimate" && data.estimateId) {
          window.location.href = `/dashboard/estimates/${data.estimateId}`;
        } else {
          fetchEmails();
        }
      }
    } catch (err) {
      console.error("Failed to perform action:", err);
    } finally {
      setActionLoading(null);
    }
  }

  const pendingCount = emails.filter(e => e.status === "parsed").length;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Incoming Requests</h1>
            <p className="text-muted-foreground mt-1">
              Claim requests received via email
            </p>
          </div>
          <Button onClick={handleSync} disabled={syncing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? "animate-spin" : ""}`} />
            {syncing ? "Syncing..." : "Sync Emails"}
          </Button>
        </div>

        {pendingCount > 0 && (
          <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded-lg flex items-center gap-2">
            <Clock className="h-5 w-5" />
            {pendingCount} new request{pendingCount > 1 ? "s" : ""} ready for review
          </div>
        )}

        <div className="flex gap-2">
          <Button 
            variant={filter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("all")}
          >
            All
          </Button>
          <Button 
            variant={filter === "parsed" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("parsed")}
          >
            Ready
          </Button>
          <Button 
            variant={filter === "estimate_created" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("estimate_created")}
          >
            Created
          </Button>
          <Button 
            variant={filter === "ignored" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("ignored")}
          >
            Ignored
          </Button>
        </div>

        {loading ? (
          <div className="text-center py-12 text-muted-foreground">
            Loading emails...
          </div>
        ) : emails.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Mail className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No Incoming Requests</h3>
              <p className="text-muted-foreground mb-4">
                {filter === "all" 
                  ? "Connect Gmail and sync to import claim requests from your email."
                  : "No emails match this filter."}
              </p>
              {filter === "all" && (
                <Link href="/dashboard/settings/integrations">
                  <Button variant="outline">
                    Configure Gmail Integration
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {emails.map((email) => {
              const badge = STATUS_BADGES[email.status] || STATUS_BADGES.pending;
              const parsed = email.parsedData;

              return (
                <Card key={email.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="py-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium truncate">{email.subject}</h3>
                          <Badge variant={badge.variant}>{badge.label}</Badge>
                        </div>
                        
                        <p className="text-sm text-muted-foreground mb-2">
                          From: {email.fromName || email.fromAddress} | {new Date(email.receivedAt).toLocaleString()}
                        </p>

                        {parsed && (
                          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
                            {parsed.insuredName && (
                              <span><strong>Insured:</strong> {parsed.insuredName}</span>
                            )}
                            {parsed.propertyAddress && (
                              <span><strong>Address:</strong> {parsed.propertyAddress}</span>
                            )}
                            {parsed.claimNumber && (
                              <span><strong>Claim #:</strong> {parsed.claimNumber}</span>
                            )}
                            {parsed.carrierName && (
                              <span><strong>Carrier:</strong> {parsed.carrierName}</span>
                            )}
                            {parsed.damageType && (
                              <span><strong>Damage:</strong> {parsed.damageType}</span>
                            )}
                          </div>
                        )}

                        {email.parseConfidence !== null && (
                          <div className="mt-2 text-xs text-muted-foreground">
                            Confidence: {Math.round(email.parseConfidence * 100)}%
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2 flex-shrink-0">
                        {(email.status === "parsed" || email.status === "ignored") && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => handleAction(email.id, "create_estimate")}
                              disabled={actionLoading === email.id}
                            >
                              <Plus className="h-4 w-4 mr-1" />
                              Create Estimate
                            </Button>
                            {email.status === "parsed" && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleAction(email.id, "ignore")}
                                disabled={actionLoading === email.id}
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                            )}
                          </>
                        )}
                        {email.status === "estimate_created" && email.estimateId && (
                          <Link href={`/dashboard/estimates/${email.estimateId}`}>
                            <Button size="sm" variant="outline">
                              View Estimate <ArrowRight className="h-4 w-4 ml-1" />
                            </Button>
                          </Link>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
