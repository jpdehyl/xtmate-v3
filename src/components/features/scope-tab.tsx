"use client";

import { useState, useEffect, useCallback } from "react";
import type { LineItem } from "@/lib/db/schema";
import {
  getCategoryByCode,
  getCategoryOptions,
  getUnitOptions,
} from "@/lib/reference/xactimate-categories";
import { TotalsSummary } from "./totals-summary";

interface ScopeTabProps {
  estimateId: string;
  isOnline: boolean;
  onAIScope: () => void;
}

interface EditingCell {
  itemId: string;
  field: keyof LineItem;
}

// Group line items by category
function groupByCategory(items: LineItem[]): { category: string; items: LineItem[] }[] {
  const groups: Record<string, LineItem[]> = {};

  items.forEach((item) => {
    const categoryKey = item.category || "Uncategorized";
    if (!groups[categoryKey]) {
      groups[categoryKey] = [];
    }
    groups[categoryKey].push(item);
  });

  // Sort groups by category name and items by order
  return Object.entries(groups)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([category, groupItems]) => ({
      category,
      items: groupItems.sort((a, b) => (a.order || 0) - (b.order || 0)),
    }));
}

// Format currency
function formatCurrency(amount: number | null | undefined): string {
  if (amount === null || amount === undefined) return "-";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

export function ScopeTab({ estimateId, isOnline, onAIScope }: ScopeTabProps) {
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingCell, setEditingCell] = useState<EditingCell | null>(null);
  const [editValue, setEditValue] = useState<string>("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [dragOverItem, setDragOverItem] = useState<string | null>(null);

  // New item form state
  const [newItem, setNewItem] = useState({
    category: "",
    selector: "",
    description: "",
    quantity: "",
    unit: "SF",
    unitPrice: "",
  });

  // Fetch line items
  const fetchLineItems = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/line-items?estimateId=${estimateId}`);
      if (!response.ok) throw new Error("Failed to fetch line items");
      const data = await response.json();
      setLineItems(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load line items");
    } finally {
      setIsLoading(false);
    }
  }, [estimateId]);

  useEffect(() => {
    if (isOnline) {
      fetchLineItems();
    }
  }, [fetchLineItems, isOnline]);

  // Calculate verified count for header
  const verifiedCount = lineItems.filter((item) => item.verified).length;

  // Start editing a cell
  function handleStartEdit(itemId: string, field: keyof LineItem, currentValue: string | number | null) {
    setEditingCell({ itemId, field });
    setEditValue(String(currentValue ?? ""));
  }

  // Save edited cell
  async function handleSaveEdit() {
    if (!editingCell) return;

    const item = lineItems.find((i) => i.id === editingCell.itemId);
    if (!item) return;

    setIsSaving(true);
    try {
      let updateData: Record<string, unknown> = {};

      // Parse value based on field type
      if (["quantity", "unitPrice", "total"].includes(editingCell.field)) {
        const numValue = parseFloat(editValue) || 0;
        updateData[editingCell.field] = numValue;
      } else {
        updateData[editingCell.field] = editValue;
      }

      const response = await fetch(`/api/line-items/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) throw new Error("Failed to update");

      const updatedItem = await response.json();
      setLineItems((prev) =>
        prev.map((i) => (i.id === item.id ? updatedItem : i))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setIsSaving(false);
      setEditingCell(null);
      setEditValue("");
    }
  }

  // Cancel editing
  function handleCancelEdit() {
    setEditingCell(null);
    setEditValue("");
  }

  // Add new item
  async function handleAddItem(e: React.FormEvent) {
    e.preventDefault();
    setIsSaving(true);

    try {
      const quantity = parseFloat(newItem.quantity) || 0;
      const unitPrice = parseFloat(newItem.unitPrice) || 0;

      const response = await fetch("/api/line-items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          estimateId,
          category: newItem.category || undefined,
          selector: newItem.selector || undefined,
          description: newItem.description || undefined,
          quantity,
          unit: newItem.unit,
          unitPrice,
          total: quantity * unitPrice,
          source: "manual",
        }),
      });

      if (!response.ok) throw new Error("Failed to add item");

      const addedItem = await response.json();
      setLineItems((prev) => [...prev, addedItem]);
      setNewItem({
        category: "",
        selector: "",
        description: "",
        quantity: "",
        unit: "SF",
        unitPrice: "",
      });
      setShowAddForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add item");
    } finally {
      setIsSaving(false);
    }
  }

  // Delete item
  async function handleDeleteItem(itemId: string) {
    try {
      const response = await fetch(`/api/line-items/${itemId}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete");

      setLineItems((prev) => prev.filter((i) => i.id !== itemId));
      setShowDeleteConfirm(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete item");
    }
  }

  // Toggle verified status
  async function handleToggleVerified(item: LineItem) {
    try {
      const response = await fetch(`/api/line-items/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ verified: !item.verified }),
      });

      if (!response.ok) throw new Error("Failed to update");

      const updatedItem = await response.json();
      setLineItems((prev) =>
        prev.map((i) => (i.id === item.id ? updatedItem : i))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update item");
    }
  }

  // Drag and drop handlers
  function handleDragStart(e: React.DragEvent, itemId: string) {
    setDraggedItem(itemId);
    e.dataTransfer.effectAllowed = "move";
    // Add some styling to dragged element
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = "0.5";
    }
  }

  function handleDragEnd(e: React.DragEvent) {
    setDraggedItem(null);
    setDragOverItem(null);
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = "1";
    }
  }

  function handleDragOver(e: React.DragEvent, itemId: string) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (draggedItem && itemId !== draggedItem) {
      setDragOverItem(itemId);
    }
  }

  function handleDragLeave() {
    setDragOverItem(null);
  }

  async function handleDrop(e: React.DragEvent, targetItemId: string, categoryItems: LineItem[]) {
    e.preventDefault();
    setDragOverItem(null);

    if (!draggedItem || draggedItem === targetItemId) return;

    // Find indices within the category
    const draggedIndex = categoryItems.findIndex((item) => item.id === draggedItem);
    const targetIndex = categoryItems.findIndex((item) => item.id === targetItemId);

    if (draggedIndex === -1 || targetIndex === -1) return;

    // Reorder items in the category
    const reorderedItems = [...categoryItems];
    const [movedItem] = reorderedItems.splice(draggedIndex, 1);
    reorderedItems.splice(targetIndex, 0, movedItem);

    // Update order values
    const itemsWithNewOrder = reorderedItems.map((item, index) => ({
      id: item.id,
      order: index,
    }));

    // Optimistically update UI
    setLineItems((prev) => {
      const updated = [...prev];
      itemsWithNewOrder.forEach(({ id, order }) => {
        const itemIndex = updated.findIndex((item) => item.id === id);
        if (itemIndex !== -1) {
          updated[itemIndex] = { ...updated[itemIndex], order };
        }
      });
      return updated;
    });

    // Persist to server
    try {
      const response = await fetch("/api/line-items/reorder", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          estimateId,
          items: itemsWithNewOrder,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to reorder");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reorder items");
      // Refetch on error to restore correct order
      fetchLineItems();
    }

    setDraggedItem(null);
  }

  // Render editable cell
  function renderEditableCell(
    item: LineItem,
    field: keyof LineItem,
    value: string | number | null,
    type: "text" | "number" | "select" = "text",
    options?: { value: string; label: string }[]
  ) {
    const isEditing = editingCell?.itemId === item.id && editingCell?.field === field;

    if (isEditing) {
      if (type === "select" && options) {
        return (
          <select
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleSaveEdit}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSaveEdit();
              if (e.key === "Escape") handleCancelEdit();
            }}
            className="w-full px-2 py-1 border border-primary-500 rounded text-sm focus:outline-none focus:ring-1 focus:ring-primary-500 dark:bg-gray-800"
            autoFocus
          >
            <option value="">Select...</option>
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        );
      }

      return (
        <input
          type={type}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleSaveEdit}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSaveEdit();
            if (e.key === "Escape") handleCancelEdit();
          }}
          className="w-full px-2 py-1 border border-primary-500 rounded text-sm focus:outline-none focus:ring-1 focus:ring-primary-500 dark:bg-gray-800"
          autoFocus
        />
      );
    }

    const displayValue = type === "number" && field === "total"
      ? formatCurrency(value as number)
      : type === "number" && field === "unitPrice"
      ? formatCurrency(value as number)
      : value ?? "-";

    return (
      <span
        onClick={() => handleStartEdit(item.id, field, value)}
        className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 px-2 py-1 rounded block min-h-[28px]"
        title="Click to edit"
      >
        {displayValue}
      </span>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse space-y-4">
          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-full" />
          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-full" />
          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-full" />
        </div>
      </div>
    );
  }

  const groupedItems = groupByCategory(lineItems);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Scope Items</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {lineItems.length} item{lineItems.length !== 1 ? "s" : ""} | {verifiedCount} verified
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setShowAddForm(true)}
            aria-label="Add new line item"
            className="px-4 py-2 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-sm flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Item
          </button>
          <button
            type="button"
            onClick={onAIScope}
            disabled={!isOnline}
            title={!isOnline ? "AI features unavailable offline" : "Get AI scope suggestions"}
            aria-label="Get AI-powered scope suggestions"
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium flex items-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
              />
            </svg>
            AI Suggest
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm">
          {error}
          <button onClick={() => setError(null)} className="ml-2 underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Add Item Form */}
      {showAddForm && (
        <form
          onSubmit={handleAddItem}
          className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800/50 space-y-4"
        >
          <h3 className="font-medium">Add Line Item</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                Category
              </label>
              <select
                value={newItem.category}
                onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-sm dark:bg-gray-900"
              >
                <option value="">Select...</option>
                {getCategoryOptions().map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                Selector (Code)
              </label>
              <input
                type="text"
                value={newItem.selector}
                onChange={(e) => setNewItem({ ...newItem, selector: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-sm dark:bg-gray-900"
                placeholder="e.g., WTR>EXTRC"
              />
            </div>
            <div className="col-span-2 md:col-span-1 lg:col-span-2">
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                Description
              </label>
              <input
                type="text"
                value={newItem.description}
                onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-sm dark:bg-gray-900"
                placeholder="Description of work"
              />
            </div>
            <div className="grid grid-cols-3 gap-2 col-span-2">
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Qty
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={newItem.quantity}
                  onChange={(e) => setNewItem({ ...newItem, quantity: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-sm dark:bg-gray-900"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Unit
                </label>
                <select
                  value={newItem.unit}
                  onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-sm dark:bg-gray-900"
                >
                  {getUnitOptions().map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.value}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Unit Price
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={newItem.unitPrice}
                  onChange={(e) => setNewItem({ ...newItem, unitPrice: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-sm dark:bg-gray-900"
                  placeholder="0.00"
                />
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
            >
              {isSaving ? "Adding..." : "Add Item"}
            </button>
          </div>
        </form>
      )}

      {/* Line Items Table */}
      {lineItems.length === 0 ? (
        <div className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg p-8 text-center">
          <svg
            className="w-12 h-12 mx-auto text-gray-400 mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            No scope items yet
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Click &quot;AI Suggest&quot; to get AI-powered scope recommendations, or add items manually.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {groupedItems.map(({ category, items }) => {
            const categoryInfo = getCategoryByCode(category);
            const categoryTotal = items.reduce((sum, item) => sum + (item.total || 0), 0);

            return (
              <div key={category} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                {/* Category Header */}
                <div className="bg-gray-50 dark:bg-gray-800 px-4 py-3 flex items-center justify-between">
                  <div>
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      {categoryInfo ? `${category} - ${categoryInfo.name}` : category}
                    </span>
                    <span className="ml-2 text-sm text-gray-500">({items.length} items)</span>
                  </div>
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {formatCurrency(categoryTotal)}
                  </span>
                </div>

                {/* Items Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-100 dark:bg-gray-900/50">
                      <tr>
                        <th className="w-8 px-2 py-2"></th>
                        <th className="w-8 px-2 py-2"></th>
                        <th className="text-left px-3 py-2 font-medium text-gray-600 dark:text-gray-400">Code</th>
                        <th className="text-left px-3 py-2 font-medium text-gray-600 dark:text-gray-400">Description</th>
                        <th className="text-right px-3 py-2 font-medium text-gray-600 dark:text-gray-400 w-20">Qty</th>
                        <th className="text-center px-3 py-2 font-medium text-gray-600 dark:text-gray-400 w-16">Unit</th>
                        <th className="text-right px-3 py-2 font-medium text-gray-600 dark:text-gray-400 w-24">Price</th>
                        <th className="text-right px-3 py-2 font-medium text-gray-600 dark:text-gray-400 w-28">Total</th>
                        <th className="w-10 px-2 py-2"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                      {items.map((item) => (
                        <tr
                          key={item.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, item.id)}
                          onDragEnd={handleDragEnd}
                          onDragOver={(e) => handleDragOver(e, item.id)}
                          onDragLeave={handleDragLeave}
                          onDrop={(e) => handleDrop(e, item.id, items)}
                          className={`hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${
                            item.source === "ai_generated" && !item.verified
                              ? "bg-amber-50/50 dark:bg-amber-900/10"
                              : ""
                          } ${dragOverItem === item.id ? "border-t-2 border-primary-500" : ""}`}
                        >
                          {/* Drag Handle */}
                          <td className="px-2 py-2 text-center cursor-move" aria-label="Drag to reorder">
                            <svg
                              className="w-4 h-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                              aria-hidden="true"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M4 8h16M4 16h16"
                              />
                            </svg>
                          </td>
                          {/* Verify Checkbox */}
                          <td className="px-2 py-2 text-center">
                            <button
                              onClick={() => handleToggleVerified(item)}
                              className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                                item.verified
                                  ? "bg-green-500 border-green-500 text-white"
                                  : "border-gray-300 dark:border-gray-600 hover:border-green-500"
                              }`}
                              title={item.verified ? "Verified" : "Click to verify"}
                              aria-label={item.verified ? "Mark as unverified" : "Mark as verified"}
                              aria-pressed={item.verified ?? false}
                            >
                              {item.verified && (
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                                  <path
                                    fillRule="evenodd"
                                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                              )}
                            </button>
                          </td>
                          <td className="px-3 py-2">
                            {renderEditableCell(item, "selector", item.selector, "text")}
                          </td>
                          <td className="px-3 py-2">
                            {renderEditableCell(item, "description", item.description, "text")}
                          </td>
                          <td className="px-3 py-2 text-right">
                            {renderEditableCell(item, "quantity", item.quantity, "number")}
                          </td>
                          <td className="px-3 py-2 text-center">
                            {renderEditableCell(
                              item,
                              "unit",
                              item.unit,
                              "select",
                              getUnitOptions()
                            )}
                          </td>
                          <td className="px-3 py-2 text-right">
                            {renderEditableCell(item, "unitPrice", item.unitPrice, "number")}
                          </td>
                          <td className="px-3 py-2 text-right font-medium">
                            {formatCurrency(item.total)}
                          </td>
                          <td className="px-2 py-2">
                            <button
                              onClick={() => setShowDeleteConfirm(item.id)}
                              className="text-gray-400 hover:text-red-500 transition-colors p-1"
                              title="Delete"
                              aria-label="Delete line item"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                />
                              </svg>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}

          {/* Totals Summary */}
          <TotalsSummary
            lineItems={lineItems}
            defaultOptions={{ overheadPercent: 10, profitPercent: 10, taxPercent: 0 }}
            editable={true}
          />
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-lg p-6 max-w-md mx-4 shadow-xl">
            <h3 className="text-lg font-semibold mb-2">Delete Line Item</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Are you sure you want to delete this line item? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-4">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteItem(showDeleteConfirm)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
