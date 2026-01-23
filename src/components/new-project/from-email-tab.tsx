"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Mail,
  RefreshCw,
  Plus,
  XCircle,
  ArrowRight,
  Settings,
} from "lucide-react";
import Link from "next/link";

interface ParsedData {
  insuredName?: string;
  propertyAddress?: string;
  propertyCity?: string;
  claimNumber?: string;
  carrierName?: string;
  damageType?: string;
}

interface IncomingEmail {
  id: string;
  fromAddress: string;
  fromName: string;
  subject: string;
  receivedAt: string;
  parsedData: ParsedData | null;
  parseConfidence: number | null;
  status: "pending" | "processing" | "parsed" | "estimate_created" | "ignored" | "failed";
  estimateId: string | null;
}

interface FromEmailTabProps {
  onClose: () => void;
}

export function FromEmailTab({ onClose }: FromEmailTabProps) {
  const router = useRouter();
  const [emails, setEmails] = useState<IncomingEmail[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchEmails = useCallback(async () => {
    try {
      setError(null);
      const res = await fetch("/api/gmail/emails?status=parsed");
      if (!res.ok) {
        if (res.status === 400) {
          // Gmail not connected
          setEmails([]);
          return;
        }
        throw new Error("Failed to fetch emails");
      }
      const data = await res.json();
      setEmails(data.emails || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load emails");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEmails();
  }, [fetchEmails]);

  async function handleSync() {
    setSyncing(true);
    setError(null);
    try {
      const res = await fetch("/api/gmail/sync", { method: "POST" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to sync");
      }
      await fetchEmails();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to sync");
    } finally {
      setSyncing(false);
    }
  }

  async function handleCreateEstimate(emailId: string) {
    setActionLoading(emailId);
    try {
      const res = await fetch("/api/gmail/emails", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emailId, action: "create_estimate" }),
      });
      const data = await res.json();
      if (data.success && data.estimateId) {
        onClose();
        router.push(`/dashboard/estimates/${data.estimateId}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create estimate");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleIgnore(emailId: string) {
    setActionLoading(emailId);
    try {
      await fetch("/api/gmail/emails", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emailId, action: "ignore" }),
      });
      await fetchEmails();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to ignore email");
    } finally {
      setActionLoading(null);
    }
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin w-8 h-8 border-2 border-pd-gold border-t-transparent rounded-full mx-auto mb-4" />
        <p className="text-sm text-gray-600 dark:text-gray-400">Loading emails...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with sync button */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {emails.length > 0
            ? `${emails.length} email${emails.length > 1 ? "s" : ""} ready to import`
            : "No emails ready to import"
          }
        </p>
        <Button size="sm" variant="outline" onClick={handleSync} disabled={syncing}>
          <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${syncing ? "animate-spin" : ""}`} />
          {syncing ? "Syncing" : "Sync"}
        </Button>
      </div>

      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Email list */}
      {emails.length === 0 ? (
        <div className="text-center py-8 border border-dashed border-gray-300 dark:border-gray-700 rounded-lg">
          <Mail className="h-10 w-10 mx-auto text-gray-400 mb-3" />
          <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-1">No emails ready</h4>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
            Connect Gmail and sync to import claim requests.
          </p>
          <Link href="/dashboard/settings/integrations" onClick={onClose}>
            <Button size="sm" variant="outline">
              <Settings className="h-3.5 w-3.5 mr-1.5" />
              Configure Gmail
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-2 max-h-[320px] overflow-y-auto">
          {emails.map((email) => {
            const parsed = email.parsedData;
            return (
              <div
                key={email.id}
                className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {email.subject}
                    </h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {email.fromName || email.fromAddress}
                    </p>

                    {parsed && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {parsed.insuredName && (
                          <Badge variant="secondary" className="text-[10px]">
                            {parsed.insuredName}
                          </Badge>
                        )}
                        {parsed.claimNumber && (
                          <Badge variant="outline" className="text-[10px]">
                            #{parsed.claimNumber}
                          </Badge>
                        )}
                        {parsed.damageType && (
                          <Badge variant="outline" className="text-[10px]">
                            {parsed.damageType}
                          </Badge>
                        )}
                      </div>
                    )}

                    {email.parseConfidence !== null && (
                      <div className="mt-1.5 text-[10px] text-gray-400">
                        {Math.round(email.parseConfidence * 100)}% confidence
                      </div>
                    )}
                  </div>

                  <div className="flex gap-1.5 flex-shrink-0">
                    <Button
                      size="sm"
                      onClick={() => handleCreateEstimate(email.id)}
                      disabled={actionLoading === email.id}
                      className="h-7 px-2 text-xs"
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Create
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleIgnore(email.id)}
                      disabled={actionLoading === email.id}
                      className="h-7 w-7 p-0"
                    >
                      <XCircle className="h-3.5 w-3.5 text-gray-400" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
