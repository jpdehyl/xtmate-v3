"use client";

import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mail, RefreshCw, CheckCircle, AlertCircle, ExternalLink } from "lucide-react";
import { useSearchParams } from "next/navigation";

interface GmailStatus {
  connected: boolean;
  status?: string;
  emailAddress?: string;
  lastSyncAt?: string;
  autoCreateEstimates?: boolean;
  watchedLabels?: string[];
}

export function IntegrationsContent() {
  const [gmailStatus, setGmailStatus] = useState<GmailStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const searchParams = useSearchParams();

  const success = searchParams.get("success");
  const error = searchParams.get("error");

  useEffect(() => {
    fetchGmailStatus();
  }, []);

  async function fetchGmailStatus() {
    try {
      const res = await fetch("/api/gmail/status");
      const data = await res.json();
      setGmailStatus(data);
    } catch (err) {
      console.error("Failed to fetch Gmail status:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleConnect() {
    setConnecting(true);
    try {
      const res = await fetch("/api/gmail/connect");
      const data = await res.json();
      if (data.authUrl) {
        window.location.href = data.authUrl;
      }
    } catch (err) {
      console.error("Failed to connect Gmail:", err);
    } finally {
      setConnecting(false);
    }
  }

  async function handleDisconnect() {
    if (!confirm("Are you sure you want to disconnect Gmail? This will stop automatic email processing.")) {
      return;
    }
    try {
      await fetch("/api/gmail/disconnect", { method: "POST" });
      setGmailStatus({ connected: false });
    } catch (err) {
      console.error("Failed to disconnect Gmail:", err);
    }
  }

  async function handleSync() {
    setSyncing(true);
    try {
      const res = await fetch("/api/gmail/sync", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        alert(`Synced! Processed ${data.processed} emails, created ${data.estimatesCreated} estimates.`);
        fetchGmailStatus();
      }
    } catch (err) {
      console.error("Failed to sync emails:", err);
    } finally {
      setSyncing(false);
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Integrations</h1>
          <p className="text-muted-foreground mt-1">
            Connect external services to automate your workflow
          </p>
        </div>

        {success === "gmail_connected" && (
          <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Gmail connected successfully! Your emails will now be automatically processed.
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Failed to connect Gmail: {error}
          </div>
        )}

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <Mail className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <CardTitle className="text-lg">Gmail Integration</CardTitle>
                  <CardDescription>
                    Automatically import claim requests from your email
                  </CardDescription>
                </div>
              </div>
              {loading ? (
                <Badge variant="secondary">Loading...</Badge>
              ) : gmailStatus?.connected ? (
                <Badge variant="default" className="bg-green-600">Connected</Badge>
              ) : (
                <Badge variant="secondary">Not Connected</Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {!loading && (
              <>
                {gmailStatus?.connected ? (
                  <div className="space-y-4">
                    <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Connected Account</span>
                        <span className="text-sm font-medium">{gmailStatus.emailAddress}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Last Synced</span>
                        <span className="text-sm font-medium">
                          {gmailStatus.lastSyncAt 
                            ? new Date(gmailStatus.lastSyncAt).toLocaleString()
                            : "Never"
                          }
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Auto-create Estimates</span>
                        <span className="text-sm font-medium">
                          {gmailStatus.autoCreateEstimates ? "Enabled" : "Disabled"}
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button 
                        onClick={handleSync} 
                        disabled={syncing}
                        variant="outline"
                      >
                        <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? "animate-spin" : ""}`} />
                        {syncing ? "Syncing..." : "Sync Now"}
                      </Button>
                      <Button 
                        variant="ghost" 
                        className="text-red-600 hover:text-red-700"
                        onClick={handleDisconnect}
                      >
                        Disconnect
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Connect your Gmail account to automatically import claim requests. 
                      When a new email arrives, we&apos;ll parse it using AI to extract claim details 
                      and create a draft estimate.
                    </p>
                    
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h4 className="font-medium text-blue-900 mb-2">Setup Required</h4>
                      <p className="text-sm text-blue-800 mb-3">
                        To use Gmail integration, you need Google OAuth credentials:
                      </p>
                      <ol className="text-sm text-blue-800 list-decimal list-inside space-y-1">
                        <li>Create a project in Google Cloud Console</li>
                        <li>Enable the Gmail API</li>
                        <li>Create OAuth 2.0 credentials</li>
                        <li>Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to your environment</li>
                      </ol>
                      <a 
                        href="https://console.cloud.google.com/apis/credentials" 
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline mt-3"
                      >
                        Open Google Cloud Console <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>

                    <Button onClick={handleConnect} disabled={connecting}>
                      <Mail className="h-4 w-4 mr-2" />
                      {connecting ? "Connecting..." : "Connect Gmail"}
                    </Button>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
