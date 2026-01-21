"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, Loader2, KeyRound } from "lucide-react";

function VendorLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [token, setToken] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-fill token from URL if provided
  useEffect(() => {
    const urlToken = searchParams.get("token");
    if (urlToken) {
      setToken(urlToken);
      // Auto-submit if token is in URL
      handleLogin(urlToken);
    }

    const errorParam = searchParams.get("error");
    if (errorParam === "inactive") {
      setError("Your vendor account is not active. Please contact the estimator.");
    } else if (errorParam === "expired") {
      setError("Your access token has expired. Please request a new invite link.");
    }
  }, [searchParams]);

  async function handleLogin(tokenToUse?: string) {
    const accessToken = tokenToUse || token;

    if (!accessToken) {
      setError("Please enter your access token");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/vendor/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: accessToken }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Invalid or expired token");
      }

      // Redirect to vendor dashboard
      router.push("/vendor");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
          <KeyRound className="w-6 h-6 text-primary" />
        </div>
        <CardTitle>Vendor Portal</CardTitle>
        <CardDescription>
          Enter your access token to view quote requests and submit bids
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={(e) => { e.preventDefault(); handleLogin(); }} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="token">Access Token</Label>
            <Input
              id="token"
              type="text"
              placeholder="Enter your access token"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              disabled={isLoading}
              autoComplete="off"
            />
            <p className="text-xs text-muted-foreground">
              The access token was included in your invitation email
            </p>
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={isLoading || !token}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Verifying...
              </>
            ) : (
              "Access Portal"
            )}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex-col gap-2 text-center text-sm text-muted-foreground">
        <p>
          {"Don't have a token? Contact the estimator who sent you the quote request."}
        </p>
      </CardFooter>
    </Card>
  );
}

function LoginFormSkeleton() {
  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center animate-pulse">
          <KeyRound className="w-6 h-6 text-primary" />
        </div>
        <CardTitle>Vendor Portal</CardTitle>
        <CardDescription>Loading...</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="h-4 w-24 bg-muted rounded animate-pulse" />
            <div className="h-10 bg-muted rounded animate-pulse" />
          </div>
          <div className="h-10 bg-muted rounded animate-pulse" />
        </div>
      </CardContent>
    </Card>
  );
}

export default function VendorLoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4">
      <Suspense fallback={<LoginFormSkeleton />}>
        <VendorLoginForm />
      </Suspense>
    </div>
  );
}
