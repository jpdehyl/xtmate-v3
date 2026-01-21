import { z } from 'zod';

/**
 * Carrier-specific claim number patterns
 *
 * Format: CARRIER_CODE-NUMBERS
 * Examples:
 * - State Farm: SF-12345678
 * - Allstate: ALL-123456
 * - USAA: USAA-1234567
 */
export const CARRIER_CLAIM_PATTERNS: Record<string, RegExp> = {
  SF: /^SF-\d{8}$/i,           // State Farm: SF-XXXXXXXX
  ALL: /^ALL-\d{6}$/i,         // Allstate: ALL-XXXXXX
  USAA: /^USAA-\d{7}$/i,       // USAA: USAA-XXXXXXX
  FAR: /^FAR-\d{6,8}$/i,       // Farmers: FAR-XXXXXX to FAR-XXXXXXXX
  PROG: /^PROG-\d{8}$/i,       // Progressive: PROG-XXXXXXXX
  GEICO: /^GEICO-\d{8}$/i,     // GEICO: GEICO-XXXXXXXX
  LIBERTY: /^LIB-\d{8}$/i,     // Liberty Mutual: LIB-XXXXXXXX
  TRAV: /^TRAV-\d{8}$/i,       // Travelers: TRAV-XXXXXXXX
  NATION: /^NW-\d{8}$/i,       // Nationwide: NW-XXXXXXXX
  AIG: /^AIG-\d{8}$/i,         // AIG: AIG-XXXXXXXX
};

/**
 * Generic claim number pattern (fallback)
 * Allows alphanumeric with hyphens, 6-20 characters
 */
export const GENERIC_CLAIM_PATTERN = /^[A-Z0-9][A-Z0-9-]{4,18}[A-Z0-9]$/i;

/**
 * Policy number pattern (generic)
 * Allows alphanumeric with hyphens, 6-20 characters
 */
export const POLICY_NUMBER_PATTERN = /^[A-Z0-9][A-Z0-9-]{4,18}[A-Z0-9]$/i;

/**
 * Validate a claim number against carrier-specific format
 */
export function validateClaimNumber(
  claimNumber: string,
  carrierCode?: string | null
): { valid: boolean; error?: string } {
  if (!claimNumber || claimNumber.trim() === '') {
    return { valid: false, error: 'Claim number is required' };
  }

  const trimmed = claimNumber.trim().toUpperCase();

  // If carrier code provided, validate against carrier-specific pattern
  if (carrierCode && CARRIER_CLAIM_PATTERNS[carrierCode]) {
    const pattern = CARRIER_CLAIM_PATTERNS[carrierCode];
    if (!pattern.test(trimmed)) {
      return {
        valid: false,
        error: `Invalid ${carrierCode} claim number format. Expected format varies by carrier.`,
      };
    }
    return { valid: true };
  }

  // Generic validation
  if (trimmed.length < 6) {
    return { valid: false, error: 'Claim number must be at least 6 characters' };
  }

  if (trimmed.length > 20) {
    return { valid: false, error: 'Claim number must be no more than 20 characters' };
  }

  if (!GENERIC_CLAIM_PATTERN.test(trimmed)) {
    return {
      valid: false,
      error: 'Claim number must contain only letters, numbers, and hyphens',
    };
  }

  return { valid: true };
}

/**
 * Validate a policy number
 */
export function validatePolicyNumber(
  policyNumber: string
): { valid: boolean; error?: string } {
  if (!policyNumber || policyNumber.trim() === '') {
    return { valid: false, error: 'Policy number is required' };
  }

  const trimmed = policyNumber.trim().toUpperCase();

  if (trimmed.length < 6) {
    return { valid: false, error: 'Policy number must be at least 6 characters' };
  }

  if (trimmed.length > 20) {
    return { valid: false, error: 'Policy number must be no more than 20 characters' };
  }

  if (!POLICY_NUMBER_PATTERN.test(trimmed)) {
    return {
      valid: false,
      error: 'Policy number must contain only letters, numbers, and hyphens',
    };
  }

  return { valid: true };
}

/**
 * Zod schema for claim number (generic)
 */
export const claimNumberSchema = z
  .string()
  .min(6, 'Claim number must be at least 6 characters')
  .max(20, 'Claim number must be no more than 20 characters')
  .regex(
    GENERIC_CLAIM_PATTERN,
    'Claim number must contain only letters, numbers, and hyphens'
  );

/**
 * Zod schema for policy number
 */
export const policyNumberSchema = z
  .string()
  .min(6, 'Policy number must be at least 6 characters')
  .max(20, 'Policy number must be no more than 20 characters')
  .regex(
    POLICY_NUMBER_PATTERN,
    'Policy number must contain only letters, numbers, and hyphens'
  );

/**
 * Create a carrier-specific claim number schema
 */
export function createCarrierClaimSchema(carrierCode: string) {
  const pattern = CARRIER_CLAIM_PATTERNS[carrierCode];
  if (!pattern) {
    return claimNumberSchema;
  }

  return z.string().regex(pattern, `Invalid ${carrierCode} claim number format`);
}

/**
 * Required fields for insurance estimates
 */
export const insuranceEstimateRequiredFields = z.object({
  claimNumber: claimNumberSchema,
  policyNumber: policyNumberSchema,
  carrierId: z.string().uuid('Invalid carrier ID'),
  propertyAddress: z.string().min(1, 'Property address is required'),
});

/**
 * Required fields for private estimates
 */
export const privateEstimateRequiredFields = z.object({
  propertyAddress: z.string().min(1, 'Property address is required'),
});
