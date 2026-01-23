"use client";

import { useState, useEffect } from "react";
import type { PmScopeItem, Room } from "@/lib/db/schema";
import { XACTIMATE_CATEGORIES } from "@/lib/reference/xactimate-categories";

interface ConvertScopeModalProps {
  isOpen: boolean;
  onClose: () => void;
  scopeItem: PmScopeItem & { room?: Room | null };
  estimateId: string;
  onSuccess: () => void;
}

const DAMAGE_TO_CATEGORY_MAP: Record<string, string[]> = {
  water: ["WTR", "DRY", "DEM", "FLR", "DRW"],
  fire: ["FIRE", "DEM", "CLN", "DRW", "PNT"],
  smoke: ["CLN", "DEM", "PNT", "DRW"],
  mold: ["MOLD", "DEM", "CLN"],
  impact: ["DEM", "DRW", "FLR", "PNT"],
  wind: ["ROOF", "DEM", "DRW"],
};

const UNIT_OPTIONS = ["SF", "LF", "EA", "SY", "HR", "DAY"];

export function ConvertScopeModal({
  isOpen,
  onClose,
  scopeItem,
  estimateId,
  onSuccess,
}: ConvertScopeModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const suggestedCategories = scopeItem.damageType 
    ? DAMAGE_TO_CATEGORY_MAP[scopeItem.damageType] || [] 
    : [];
  
  const [formData, setFormData] = useState({
    category: suggestedCategories[0] || "DEM",
    selector: "",
    description: "",
    quantity: 0,
    unit: "SF",
    unitPrice: 0,
    roomId: scopeItem.roomId || "",
  });

  useEffect(() => {
    if (isOpen) {
      const room = scopeItem.room;
      let description = scopeItem.notes || scopeItem.affectedArea || "";
      let quantity = 0;
      
      if (room?.squareFeet) {
        quantity = Math.round(room.squareFeet);
      }
      
      setFormData({
        category: suggestedCategories[0] || "DEM",
        selector: "",
        description,
        quantity,
        unit: "SF",
        unitPrice: 0,
        roomId: scopeItem.roomId || "",
      });
      setError(null);
    }
  }, [isOpen, scopeItem, suggestedCategories]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const lineItemResponse = await fetch("/api/line-items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          estimateId,
          roomId: formData.roomId || null,
          category: formData.category,
          selector: formData.selector,
          description: formData.description,
          quantity: formData.quantity,
          unit: formData.unit,
          unitPrice: formData.unitPrice,
          total: formData.quantity * formData.unitPrice,
          source: "pm_converted",
        }),
      });

      if (!lineItemResponse.ok) {
        throw new Error("Failed to create line item");
      }

      const lineItem = await lineItemResponse.json();

      const updateResponse = await fetch(`/api/pm-scope/${scopeItem.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          convertedToLineItemId: lineItem.id,
        }),
      });

      if (!updateResponse.ok) {
        console.warn("Failed to mark scope item as converted");
      }

      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to convert");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!isOpen) return null;

  const categoryOptions = XACTIMATE_CATEGORIES;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" style={{ overscrollBehavior: 'contain' }}>
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Convert to Line Item
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              aria-label="Close dialog"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          {scopeItem.room && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Room: {scopeItem.room.name}
              {scopeItem.room.squareFeet && ` (${Math.round(scopeItem.room.squareFeet)} SF)`}
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {scopeItem.notes && (
            <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
              <p className="text-sm font-medium text-amber-800 dark:text-amber-200">PM Notes:</p>
              <p className="text-sm text-amber-700 dark:text-amber-300">{scopeItem.notes}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Category
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-pd-gold"
              >
                {categoryOptions.map((cat) => (
                  <option key={cat.code} value={cat.code}>
                    {cat.code} - {cat.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Selector (Xact Code)
              </label>
              <input
                type="text"
                value={formData.selector}
                onChange={(e) => setFormData({ ...formData, selector: e.target.value.toUpperCase() })}
                placeholder="e.g., WTR XTRCT"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-pd-gold"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-pd-gold"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Quantity
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-pd-gold"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Unit
              </label>
              <select
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-pd-gold"
              >
                {UNIT_OPTIONS.map((unit) => (
                  <option key={unit} value={unit}>{unit}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Unit Price
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.unitPrice}
                onChange={(e) => setFormData({ ...formData, unitPrice: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-pd-gold"
              />
            </div>
          </div>

          <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Total:</span>
              <span className="text-lg font-bold text-pd-gold">
                ${(formData.quantity * formData.unitPrice).toFixed(2)}
              </span>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !formData.description}
              className="flex-1 px-4 py-2 bg-pd-gold text-white rounded-lg hover:bg-pd-gold-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {isSubmitting ? "Converting..." : "Create Line Item"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
