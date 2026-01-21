/**
 * Token-based authentication for Vendor Portal
 *
 * Vendors don't use Clerk - they access the portal via unique tokens.
 * This provides a separate authentication flow for external vendors.
 */

import { db } from "@/lib/db";
import { vendors, type Vendor } from "@/lib/db/schema";
import { eq, and, gt } from "drizzle-orm";
import { cookies } from "next/headers";

// Cookie name for vendor session
const VENDOR_TOKEN_COOKIE = "vendor_token";
const VENDOR_ID_COOKIE = "vendor_id";

// Token expiration (30 days by default)
const TOKEN_EXPIRATION_DAYS = 30;

/**
 * Generate a secure random token for vendor portal access
 */
export function generateVendorToken(): string {
  // Generate a UUID without dashes for cleaner URLs
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join(
    ""
  );
}

/**
 * Calculate token expiration date
 */
export function getTokenExpiration(days: number = TOKEN_EXPIRATION_DAYS): Date {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
}

/**
 * Validate a vendor token and return the vendor if valid
 */
export async function validateVendorToken(
  token: string
): Promise<Vendor | null> {
  if (!token || token.length < 32) {
    return null;
  }

  try {
    const result = await db
      .select()
      .from(vendors)
      .where(
        and(
          eq(vendors.accessToken, token),
          eq(vendors.isActive, true),
          gt(vendors.tokenExpiresAt, new Date())
        )
      )
      .limit(1);

    return result[0] || null;
  } catch (error) {
    console.error("Error validating vendor token:", error);
    return null;
  }
}

/**
 * Get vendor from request cookies
 */
export async function getVendorFromCookies(): Promise<Vendor | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(VENDOR_TOKEN_COOKIE)?.value;

  if (!token) {
    return null;
  }

  return validateVendorToken(token);
}

/**
 * Set vendor session cookie
 */
export async function setVendorCookie(token: string, vendorId: string): Promise<void> {
  const cookieStore = await cookies();
  const expires = getTokenExpiration();

  cookieStore.set(VENDOR_TOKEN_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires,
    path: "/vendor",
  });

  cookieStore.set(VENDOR_ID_COOKIE, vendorId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires,
    path: "/vendor",
  });
}

/**
 * Clear vendor session cookies
 */
export async function clearVendorCookies(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(VENDOR_TOKEN_COOKIE);
  cookieStore.delete(VENDOR_ID_COOKIE);
}

/**
 * Create or refresh a vendor's access token
 */
export async function createVendorToken(
  vendorId: string
): Promise<{ token: string; expiresAt: Date }> {
  const token = generateVendorToken();
  const expiresAt = getTokenExpiration();

  await db
    .update(vendors)
    .set({
      accessToken: token,
      tokenExpiresAt: expiresAt,
      updatedAt: new Date(),
    })
    .where(eq(vendors.id, vendorId));

  return { token, expiresAt };
}

/**
 * Invalidate a vendor's access token
 */
export async function invalidateVendorToken(vendorId: string): Promise<void> {
  await db
    .update(vendors)
    .set({
      accessToken: null,
      tokenExpiresAt: null,
      updatedAt: new Date(),
    })
    .where(eq(vendors.id, vendorId));
}

/**
 * Check if a vendor token is still valid (not expired)
 */
export function isTokenValid(vendor: Vendor): boolean {
  if (!vendor.tokenExpiresAt) {
    return false;
  }
  return new Date(vendor.tokenExpiresAt) > new Date();
}

/**
 * Generate a vendor portal login URL
 */
export function getVendorLoginUrl(token: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://xtmate-v3.vercel.app";
  return `${baseUrl}/vendor/login?token=${token}`;
}

/**
 * Generate an invite message for a vendor
 */
export function getVendorInviteMessage(
  vendorName: string,
  estimateName: string,
  token: string
): { subject: string; body: string } {
  const loginUrl = getVendorLoginUrl(token);

  return {
    subject: `Quote Request: ${estimateName}`,
    body: `Hello ${vendorName},

You have been invited to submit a quote for: ${estimateName}

Please use the following link to access the vendor portal and view the scope of work:

${loginUrl}

This link will expire in ${TOKEN_EXPIRATION_DAYS} days.

If you have any questions, please contact us.

Best regards,
XTmate Team`,
  };
}

// Type exports
export interface VendorSession {
  vendor: Vendor;
  isAuthenticated: true;
}

export interface VendorSessionError {
  isAuthenticated: false;
  error: string;
  redirectTo: string;
}

export type VendorAuthResult = VendorSession | VendorSessionError;

/**
 * Require vendor authentication for a route
 * Returns the vendor if authenticated, or an error object
 */
export async function requireVendorAuth(): Promise<VendorAuthResult> {
  const vendor = await getVendorFromCookies();

  if (!vendor) {
    return {
      isAuthenticated: false,
      error: "Not authenticated",
      redirectTo: "/vendor/login",
    };
  }

  if (!vendor.isActive) {
    return {
      isAuthenticated: false,
      error: "Account is not active",
      redirectTo: "/vendor/login?error=inactive",
    };
  }

  return {
    isAuthenticated: true,
    vendor,
  };
}
