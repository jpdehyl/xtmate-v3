import type { LineItem } from "@/lib/db/schema";

export interface EstimateTotals {
  subtotal: number;
  overhead: number;
  profit: number;
  tax: number;
  grandTotal: number;
  itemCount: number;
  verifiedCount: number;
  unverifiedCount: number;
}

export interface TotalsOptions {
  overheadPercent?: number;
  profitPercent?: number;
  taxPercent?: number;
}

const DEFAULT_OPTIONS: Required<TotalsOptions> = {
  overheadPercent: 10,
  profitPercent: 10,
  taxPercent: 0,
};

/**
 * Calculate estimate totals from line items
 *
 * Formula:
 * - Subtotal = sum of all line item totals
 * - Overhead = Subtotal × (overheadPercent / 100)
 * - Profit = Subtotal × (profitPercent / 100)
 * - Tax = (Subtotal + Overhead + Profit) × (taxPercent / 100)
 * - Grand Total = Subtotal + Overhead + Profit + Tax
 */
export function calculateEstimateTotals(
  lineItems: LineItem[],
  options: TotalsOptions = {}
): EstimateTotals {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  // Calculate subtotal from line items
  const subtotal = lineItems.reduce((sum, item) => {
    return sum + (item.total || 0);
  }, 0);

  // Calculate overhead and profit on subtotal
  const overhead = subtotal * (opts.overheadPercent / 100);
  const profit = subtotal * (opts.profitPercent / 100);

  // Tax is calculated on subtotal + overhead + profit
  const taxableAmount = subtotal + overhead + profit;
  const tax = taxableAmount * (opts.taxPercent / 100);

  // Grand total
  const grandTotal = subtotal + overhead + profit + tax;

  // Count items
  const itemCount = lineItems.length;
  const verifiedCount = lineItems.filter((item) => item.verified).length;
  const unverifiedCount = itemCount - verifiedCount;

  return {
    subtotal,
    overhead,
    profit,
    tax,
    grandTotal,
    itemCount,
    verifiedCount,
    unverifiedCount,
  };
}

/**
 * Calculate a single line item total from quantity and unit price
 */
export function calculateLineItemTotal(
  quantity: number | null | undefined,
  unitPrice: number | null | undefined
): number {
  if (quantity === null || quantity === undefined) return 0;
  if (unitPrice === null || unitPrice === undefined) return 0;
  return quantity * unitPrice;
}

/**
 * Format a number as currency
 */
export function formatCurrency(amount: number | null | undefined): string {
  if (amount === null || amount === undefined) return "$0.00";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format a number as percentage
 */
export function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

/**
 * Group line items by category and calculate subtotals
 */
export function calculateCategoryTotals(
  lineItems: LineItem[]
): { category: string; total: number; count: number }[] {
  const groups: Record<string, { total: number; count: number }> = {};

  for (const item of lineItems) {
    const category = item.category || "Uncategorized";
    if (!groups[category]) {
      groups[category] = { total: 0, count: 0 };
    }
    groups[category].total += item.total || 0;
    groups[category].count += 1;
  }

  return Object.entries(groups)
    .map(([category, data]) => ({
      category,
      total: data.total,
      count: data.count,
    }))
    .sort((a, b) => b.total - a.total);
}
