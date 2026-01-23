"use client";

import { useState } from "react";
import {
  calculateEstimateTotals,
  formatCurrency,
  formatPercent,
  type TotalsOptions,
} from "@/lib/calculations/estimate-totals";
import type { LineItem } from "@/lib/db/schema";

interface TotalsSummaryProps {
  lineItems: LineItem[];
  defaultOptions?: TotalsOptions;
  editable?: boolean;
  onOptionsChange?: (options: TotalsOptions) => void;
}

export function TotalsSummary({
  lineItems,
  defaultOptions = { overheadPercent: 10, profitPercent: 10, taxPercent: 0 },
  editable = true,
  onOptionsChange,
}: TotalsSummaryProps) {
  const [options, setOptions] = useState<TotalsOptions>(defaultOptions);
  const [isEditing, setIsEditing] = useState(false);

  const totals = calculateEstimateTotals(lineItems, options);

  function handleOptionChange(field: keyof TotalsOptions, value: string) {
    const numValue = parseFloat(value) || 0;
    const newOptions = { ...options, [field]: numValue };
    setOptions(newOptions);
    onOptionsChange?.(newOptions);
  }

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gray-50 dark:bg-gray-800 px-4 py-3 flex items-center justify-between border-b border-gray-200 dark:border-gray-700">
        <span className="font-semibold text-gray-900 dark:text-gray-100">
          Estimate Summary
        </span>
        {editable && (
          <button
            type="button"
            onClick={() => setIsEditing(!isEditing)}
            className="text-sm text-primary-600 hover:text-primary-700"
          >
            {isEditing ? "Done" : "Edit Rates"}
          </button>
        )}
      </div>

      {/* Rates Editor */}
      {isEditing && (
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border-b border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label htmlFor="overhead-percent" className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                Overhead %
              </label>
              <input
                id="overhead-percent"
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={options.overheadPercent ?? 10}
                onChange={(e) => handleOptionChange("overheadPercent", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-sm dark:bg-gray-900"
                autoComplete="off"
              />
            </div>
            <div>
              <label htmlFor="profit-percent" className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                Profit %
              </label>
              <input
                id="profit-percent"
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={options.profitPercent ?? 10}
                onChange={(e) => handleOptionChange("profitPercent", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-sm dark:bg-gray-900"
                autoComplete="off"
              />
            </div>
            <div>
              <label htmlFor="tax-percent" className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                Tax %
              </label>
              <input
                id="tax-percent"
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={options.taxPercent ?? 0}
                onChange={(e) => handleOptionChange("taxPercent", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-sm dark:bg-gray-900"
                autoComplete="off"
              />
            </div>
          </div>
        </div>
      )}

      {/* Totals */}
      <div className="p-4 space-y-3">
        {/* Item counts */}
        <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
          <span>Line Items</span>
          <span>
            {totals.itemCount} ({totals.verifiedCount} verified)
          </span>
        </div>

        <hr className="border-gray-200 dark:border-gray-700" />

        {/* Subtotal */}
        <div className="flex justify-between">
          <span className="text-gray-700 dark:text-gray-300">Subtotal</span>
          <span className="font-medium">{formatCurrency(totals.subtotal)}</span>
        </div>

        {/* Overhead */}
        {(options.overheadPercent ?? 0) > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">
              Overhead ({formatPercent(options.overheadPercent ?? 0)})
            </span>
            <span className="text-gray-700 dark:text-gray-300">
              {formatCurrency(totals.overhead)}
            </span>
          </div>
        )}

        {/* Profit */}
        {(options.profitPercent ?? 0) > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">
              Profit ({formatPercent(options.profitPercent ?? 0)})
            </span>
            <span className="text-gray-700 dark:text-gray-300">
              {formatCurrency(totals.profit)}
            </span>
          </div>
        )}

        {/* Tax */}
        {(options.taxPercent ?? 0) > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">
              Tax ({formatPercent(options.taxPercent ?? 0)})
            </span>
            <span className="text-gray-700 dark:text-gray-300">
              {formatCurrency(totals.tax)}
            </span>
          </div>
        )}

        <hr className="border-gray-200 dark:border-gray-700" />

        {/* Grand Total */}
        <div className="flex justify-between text-lg">
          <span className="font-semibold text-gray-900 dark:text-gray-100">
            Grand Total
          </span>
          <span className="font-bold text-primary-600 dark:text-primary-400">
            {formatCurrency(totals.grandTotal)}
          </span>
        </div>
      </div>
    </div>
  );
}
