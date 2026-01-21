import { describe, it, expect } from 'vitest';
import {
  calculateEstimateTotals,
  calculateLineItemTotal,
  formatCurrency,
  formatPercent,
  calculateCategoryTotals,
} from '../estimate-totals';
import type { LineItem } from '@/lib/db/schema';

const createLineItem = (overrides: Partial<LineItem> = {}): LineItem => ({
  id: Math.random().toString(),
  estimateId: 'est-123',
  roomId: null,
  annotationId: null,
  category: 'DRY',
  selector: 'DRY001',
  description: 'Test item',
  quantity: 1,
  unit: 'EA',
  unitPrice: 100,
  total: 100,
  source: 'manual',
  aiConfidence: null,
  verified: false,
  order: 0,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

describe('Estimate Totals Calculations', () => {
  describe('calculateEstimateTotals', () => {
    it('returns zero totals for empty line items', () => {
      const result = calculateEstimateTotals([]);
      expect(result.subtotal).toBe(0);
      expect(result.overhead).toBe(0);
      expect(result.profit).toBe(0);
      expect(result.tax).toBe(0);
      expect(result.grandTotal).toBe(0);
      expect(result.itemCount).toBe(0);
    });

    it('calculates subtotal correctly', () => {
      const lineItems = [
        createLineItem({ total: 100 }),
        createLineItem({ total: 200 }),
        createLineItem({ total: 50 }),
      ];
      const result = calculateEstimateTotals(lineItems);
      expect(result.subtotal).toBe(350);
    });

    it('applies default 10% overhead', () => {
      const lineItems = [createLineItem({ total: 1000 })];
      const result = calculateEstimateTotals(lineItems);
      expect(result.overhead).toBe(100); // 10% of 1000
    });

    it('applies default 10% profit', () => {
      const lineItems = [createLineItem({ total: 1000 })];
      const result = calculateEstimateTotals(lineItems);
      expect(result.profit).toBe(100); // 10% of 1000
    });

    it('applies custom overhead and profit percentages', () => {
      const lineItems = [createLineItem({ total: 1000 })];
      const result = calculateEstimateTotals(lineItems, {
        overheadPercent: 15,
        profitPercent: 20,
      });
      expect(result.overhead).toBe(150); // 15% of 1000
      expect(result.profit).toBe(200); // 20% of 1000
    });

    it('calculates tax on subtotal + overhead + profit', () => {
      const lineItems = [createLineItem({ total: 1000 })];
      const result = calculateEstimateTotals(lineItems, {
        overheadPercent: 10,
        profitPercent: 10,
        taxPercent: 8,
      });
      // Subtotal: 1000
      // Overhead: 100 (10%)
      // Profit: 100 (10%)
      // Taxable: 1200
      // Tax: 96 (8% of 1200)
      expect(result.tax).toBe(96);
    });

    it('calculates grand total correctly', () => {
      const lineItems = [createLineItem({ total: 1000 })];
      const result = calculateEstimateTotals(lineItems, {
        overheadPercent: 10,
        profitPercent: 10,
        taxPercent: 8,
      });
      // 1000 + 100 + 100 + 96 = 1296
      expect(result.grandTotal).toBe(1296);
    });

    it('counts verified and unverified items', () => {
      const lineItems = [
        createLineItem({ verified: true }),
        createLineItem({ verified: true }),
        createLineItem({ verified: false }),
      ];
      const result = calculateEstimateTotals(lineItems);
      expect(result.itemCount).toBe(3);
      expect(result.verifiedCount).toBe(2);
      expect(result.unverifiedCount).toBe(1);
    });

    it('handles null total values in line items', () => {
      const lineItems = [
        createLineItem({ total: 100 }),
        createLineItem({ total: null }),
        createLineItem({ total: 200 }),
      ];
      const result = calculateEstimateTotals(lineItems);
      expect(result.subtotal).toBe(300);
    });
  });

  describe('calculateLineItemTotal', () => {
    it('multiplies quantity by unit price', () => {
      expect(calculateLineItemTotal(10, 25)).toBe(250);
    });

    it('returns 0 for null quantity', () => {
      expect(calculateLineItemTotal(null, 25)).toBe(0);
    });

    it('returns 0 for null unit price', () => {
      expect(calculateLineItemTotal(10, null)).toBe(0);
    });

    it('returns 0 for undefined values', () => {
      expect(calculateLineItemTotal(undefined, 25)).toBe(0);
      expect(calculateLineItemTotal(10, undefined)).toBe(0);
    });

    it('handles decimal quantities', () => {
      expect(calculateLineItemTotal(2.5, 100)).toBe(250);
    });

    it('handles decimal unit prices', () => {
      expect(calculateLineItemTotal(10, 12.50)).toBe(125);
    });
  });

  describe('formatCurrency', () => {
    it('formats positive numbers', () => {
      expect(formatCurrency(1234.56)).toBe('$1,234.56');
    });

    it('formats zero', () => {
      expect(formatCurrency(0)).toBe('$0.00');
    });

    it('formats null as $0.00', () => {
      expect(formatCurrency(null)).toBe('$0.00');
    });

    it('formats undefined as $0.00', () => {
      expect(formatCurrency(undefined)).toBe('$0.00');
    });

    it('formats large numbers with commas', () => {
      expect(formatCurrency(1234567.89)).toBe('$1,234,567.89');
    });

    it('rounds to 2 decimal places', () => {
      expect(formatCurrency(123.456)).toBe('$123.46');
    });
  });

  describe('formatPercent', () => {
    it('formats with one decimal place', () => {
      expect(formatPercent(10)).toBe('10.0%');
      expect(formatPercent(10.5)).toBe('10.5%');
    });

    it('rounds to one decimal place', () => {
      expect(formatPercent(10.56)).toBe('10.6%');
    });
  });

  describe('calculateCategoryTotals', () => {
    it('groups items by category', () => {
      const lineItems = [
        createLineItem({ category: 'DRY', total: 100 }),
        createLineItem({ category: 'DRY', total: 200 }),
        createLineItem({ category: 'WTR', total: 150 }),
      ];
      const result = calculateCategoryTotals(lineItems);
      expect(result).toHaveLength(2);
    });

    it('calculates totals per category', () => {
      const lineItems = [
        createLineItem({ category: 'DRY', total: 100 }),
        createLineItem({ category: 'DRY', total: 200 }),
        createLineItem({ category: 'WTR', total: 150 }),
      ];
      const result = calculateCategoryTotals(lineItems);
      const dryCategory = result.find(c => c.category === 'DRY');
      const wtrCategory = result.find(c => c.category === 'WTR');

      expect(dryCategory?.total).toBe(300);
      expect(dryCategory?.count).toBe(2);
      expect(wtrCategory?.total).toBe(150);
      expect(wtrCategory?.count).toBe(1);
    });

    it('sorts by total descending', () => {
      const lineItems = [
        createLineItem({ category: 'A', total: 100 }),
        createLineItem({ category: 'B', total: 300 }),
        createLineItem({ category: 'C', total: 200 }),
      ];
      const result = calculateCategoryTotals(lineItems);
      expect(result[0].category).toBe('B');
      expect(result[1].category).toBe('C');
      expect(result[2].category).toBe('A');
    });

    it('handles null category as "Uncategorized"', () => {
      const lineItems = [
        createLineItem({ category: null, total: 100 }),
      ];
      const result = calculateCategoryTotals(lineItems);
      expect(result[0].category).toBe('Uncategorized');
    });

    it('handles empty line items', () => {
      const result = calculateCategoryTotals([]);
      expect(result).toHaveLength(0);
    });
  });
});
