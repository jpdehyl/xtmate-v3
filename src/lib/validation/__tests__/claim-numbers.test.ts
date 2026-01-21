import { describe, it, expect } from 'vitest';
import {
  validateClaimNumber,
  validatePolicyNumber,
  claimNumberSchema,
  policyNumberSchema,
  createCarrierClaimSchema,
  CARRIER_CLAIM_PATTERNS,
} from '../claim-numbers';

describe('Claim Number Validation', () => {
  describe('validateClaimNumber', () => {
    describe('generic validation', () => {
      it('accepts valid alphanumeric claim numbers', () => {
        expect(validateClaimNumber('ABC123')).toEqual({ valid: true });
        expect(validateClaimNumber('CLAIM-12345')).toEqual({ valid: true });
        expect(validateClaimNumber('12345678')).toEqual({ valid: true });
      });

      it('rejects empty claim numbers', () => {
        expect(validateClaimNumber('')).toEqual({
          valid: false,
          error: 'Claim number is required',
        });
        expect(validateClaimNumber('   ')).toEqual({
          valid: false,
          error: 'Claim number is required',
        });
      });

      it('rejects claim numbers shorter than 6 characters', () => {
        expect(validateClaimNumber('ABC12')).toEqual({
          valid: false,
          error: 'Claim number must be at least 6 characters',
        });
      });

      it('rejects claim numbers longer than 20 characters', () => {
        expect(validateClaimNumber('A'.repeat(21))).toEqual({
          valid: false,
          error: 'Claim number must be no more than 20 characters',
        });
      });

      it('is case insensitive', () => {
        expect(validateClaimNumber('abc123')).toEqual({ valid: true });
        expect(validateClaimNumber('ABC123')).toEqual({ valid: true });
      });
    });

    describe('carrier-specific validation', () => {
      it('validates State Farm format: SF-XXXXXXXX', () => {
        expect(validateClaimNumber('SF-12345678', 'SF')).toEqual({ valid: true });
        expect(validateClaimNumber('SF-1234567', 'SF')).toEqual({
          valid: false,
          error: 'Invalid SF claim number format. Expected format varies by carrier.',
        });
        expect(validateClaimNumber('SF12345678', 'SF')).toEqual({
          valid: false,
          error: 'Invalid SF claim number format. Expected format varies by carrier.',
        });
      });

      it('validates Allstate format: ALL-XXXXXX', () => {
        expect(validateClaimNumber('ALL-123456', 'ALL')).toEqual({ valid: true });
        expect(validateClaimNumber('ALL-12345', 'ALL')).toEqual({
          valid: false,
          error: 'Invalid ALL claim number format. Expected format varies by carrier.',
        });
      });

      it('validates USAA format: USAA-XXXXXXX', () => {
        expect(validateClaimNumber('USAA-1234567', 'USAA')).toEqual({ valid: true });
        expect(validateClaimNumber('USAA-123456', 'USAA')).toEqual({
          valid: false,
          error: 'Invalid USAA claim number format. Expected format varies by carrier.',
        });
      });

      it('validates Farmers format: FAR-XXXXXX to FAR-XXXXXXXX', () => {
        expect(validateClaimNumber('FAR-123456', 'FAR')).toEqual({ valid: true });
        expect(validateClaimNumber('FAR-12345678', 'FAR')).toEqual({ valid: true });
        expect(validateClaimNumber('FAR-12345', 'FAR')).toEqual({
          valid: false,
          error: 'Invalid FAR claim number format. Expected format varies by carrier.',
        });
      });

      it('falls back to generic validation for unknown carriers', () => {
        expect(validateClaimNumber('CLAIM-12345', 'UNKNOWN')).toEqual({ valid: true });
      });
    });
  });

  describe('validatePolicyNumber', () => {
    it('accepts valid policy numbers', () => {
      expect(validatePolicyNumber('POL123456')).toEqual({ valid: true });
      expect(validatePolicyNumber('ABC-123-XYZ')).toEqual({ valid: true });
    });

    it('rejects empty policy numbers', () => {
      expect(validatePolicyNumber('')).toEqual({
        valid: false,
        error: 'Policy number is required',
      });
    });

    it('rejects policy numbers shorter than 6 characters', () => {
      expect(validatePolicyNumber('POL12')).toEqual({
        valid: false,
        error: 'Policy number must be at least 6 characters',
      });
    });

    it('rejects policy numbers longer than 20 characters', () => {
      expect(validatePolicyNumber('P'.repeat(21))).toEqual({
        valid: false,
        error: 'Policy number must be no more than 20 characters',
      });
    });
  });

  describe('Zod schemas', () => {
    describe('claimNumberSchema', () => {
      it('parses valid claim numbers', () => {
        expect(() => claimNumberSchema.parse('CLAIM-12345')).not.toThrow();
        expect(() => claimNumberSchema.parse('ABC123')).not.toThrow();
      });

      it('throws for invalid claim numbers', () => {
        expect(() => claimNumberSchema.parse('ABC')).toThrow();
        expect(() => claimNumberSchema.parse('')).toThrow();
      });
    });

    describe('policyNumberSchema', () => {
      it('parses valid policy numbers', () => {
        expect(() => policyNumberSchema.parse('POL123456')).not.toThrow();
      });

      it('throws for invalid policy numbers', () => {
        expect(() => policyNumberSchema.parse('POL')).toThrow();
      });
    });

    describe('createCarrierClaimSchema', () => {
      it('creates carrier-specific schema', () => {
        const sfSchema = createCarrierClaimSchema('SF');
        expect(() => sfSchema.parse('SF-12345678')).not.toThrow();
        expect(() => sfSchema.parse('INVALID')).toThrow();
      });

      it('falls back to generic schema for unknown carrier', () => {
        const unknownSchema = createCarrierClaimSchema('UNKNOWN');
        expect(() => unknownSchema.parse('CLAIM-12345')).not.toThrow();
      });
    });
  });

  describe('CARRIER_CLAIM_PATTERNS', () => {
    it('has patterns for major carriers', () => {
      expect(CARRIER_CLAIM_PATTERNS).toHaveProperty('SF');
      expect(CARRIER_CLAIM_PATTERNS).toHaveProperty('ALL');
      expect(CARRIER_CLAIM_PATTERNS).toHaveProperty('USAA');
      expect(CARRIER_CLAIM_PATTERNS).toHaveProperty('FAR');
      expect(CARRIER_CLAIM_PATTERNS).toHaveProperty('PROG');
      expect(CARRIER_CLAIM_PATTERNS).toHaveProperty('GEICO');
      expect(CARRIER_CLAIM_PATTERNS).toHaveProperty('LIBERTY');
      expect(CARRIER_CLAIM_PATTERNS).toHaveProperty('TRAV');
      expect(CARRIER_CLAIM_PATTERNS).toHaveProperty('NATION');
      expect(CARRIER_CLAIM_PATTERNS).toHaveProperty('AIG');
    });
  });
});
