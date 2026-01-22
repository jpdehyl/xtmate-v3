"use client";

import { useState, useEffect } from "react";
import type { PmScopeItem, Room } from "@/lib/db/schema";
import { ConvertScopeModal } from "./convert-scope-modal";

interface PmScopeWithRoom extends PmScopeItem {
  room?: Room | null;
}

interface PmScopePanelProps {
  estimateId: string;
}

const DAMAGE_TYPE_LABELS: Record<string, { label: string; color: string }> = {
  water: { label: "Water", color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" },
  fire: { label: "Fire", color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200" },
  smoke: { label: "Smoke", color: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200" },
  mold: { label: "Mold", color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" },
  impact: { label: "Impact", color: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200" },
  wind: { label: "Wind", color: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200" },
  vandalism: { label: "Vandalism", color: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200" },
  other: { label: "Other", color: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200" },
};

const SEVERITY_LABELS: Record<string, { label: string; color: string }> = {
  minor: { label: "Minor", color: "text-green-600 dark:text-green-400" },
  moderate: { label: "Moderate", color: "text-yellow-600 dark:text-yellow-400" },
  severe: { label: "Severe", color: "text-red-600 dark:text-red-400" },
};

const CATEGORY_LABELS: Record<string, string> = {
  cat1: "Category 1 (Clean Water)",
  cat2: "Category 2 (Gray Water)",
  cat3: "Category 3 (Black Water)",
};

export function PmScopePanel({ estimateId }: PmScopePanelProps) {
  const [items, setItems] = useState<PmScopeWithRoom[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<PmScopeWithRoom | null>(null);
  const [showConvertModal, setShowConvertModal] = useState(false);

  function handleConvertClick(item: PmScopeWithRoom) {
    setSelectedItem(item);
    setShowConvertModal(true);
  }

  async function handleConvertSuccess() {
    try {
      const response = await fetch(`/api/pm-scope?estimateId=${estimateId}`);
      if (response.ok) {
        const data = await response.json();
        setItems(data);
      }
    } catch (err) {
      console.error("Failed to refresh PM scope items:", err);
    }
    setSelectedItem(null);
  }

  useEffect(() => {
    async function fetchItems() {
      try {
        const response = await fetch(`/api/pm-scope?estimateId=${estimateId}`);
        if (!response.ok) {
          throw new Error("Failed to fetch PM scope items");
        }
        const data = await response.json();
        setItems(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load");
      } finally {
        setIsLoading(false);
      }
    }

    fetchItems();
  }, [estimateId]);

  if (isLoading) {
    return (
      <div className="p-6 text-center text-gray-500 dark:text-gray-400">
        Loading PM scope items...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center text-red-600 dark:text-red-400">
        {error}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="p-6 text-center">
        <div className="mb-4">
          <svg
            className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
            />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">
          No PM Scope Items
        </h3>
        <p className="text-gray-500 dark:text-gray-400">
          The Project Manager hasn&apos;t captured any damage observations yet.
          <br />
          Items will appear here after the PM completes their site visit.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          PM Scope of Work
        </h3>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {items.length} item{items.length !== 1 ? "s" : ""} captured
        </span>
      </div>

      <div className="space-y-3">
        {items.map((item) => {
          const damageInfo = item.damageType ? DAMAGE_TYPE_LABELS[item.damageType] : null;
          const severityInfo = item.severity ? SEVERITY_LABELS[item.severity] : null;
          const suggestedActions = item.suggestedActions as string[] | null;

          return (
            <div
              key={item.id}
              className={`p-4 rounded-lg border ${
                item.convertedToLineItemId
                  ? "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800"
                  : "bg-white border-gray-200 dark:bg-gray-800 dark:border-gray-700"
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-2">
                    {item.room && (
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {item.room.name}
                      </span>
                    )}
                    {damageInfo && (
                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${damageInfo.color}`}>
                        {damageInfo.label}
                      </span>
                    )}
                    {severityInfo && (
                      <span className={`text-xs font-medium ${severityInfo.color}`}>
                        {severityInfo.label}
                      </span>
                    )}
                    {item.category && (
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {CATEGORY_LABELS[item.category] || item.category}
                      </span>
                    )}
                  </div>

                  {item.affectedArea && (
                    <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                      <span className="font-medium">Affected:</span> {item.affectedArea}
                    </p>
                  )}

                  {item.notes && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      {item.notes}
                    </p>
                  )}

                  {suggestedActions && suggestedActions.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                        PM Suggested Actions:
                      </p>
                      <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-400 space-y-0.5">
                        {suggestedActions.map((action, idx) => (
                          <li key={idx}>{action}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="mt-2 text-xs text-gray-400 dark:text-gray-500">
                    Captured {item.capturedAt ? new Date(item.capturedAt).toLocaleString() : "—"}
                  </div>
                </div>

                <div className="flex-shrink-0">
                  {item.convertedToLineItemId ? (
                    <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-green-700 bg-green-100 rounded dark:bg-green-900 dark:text-green-300">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      Converted
                    </span>
                  ) : (
                    <button
                      onClick={() => handleConvertClick(item)}
                      className="px-3 py-1.5 text-sm font-medium text-pd-gold hover:bg-pd-gold hover:text-white border border-pd-gold rounded-lg transition-colors"
                    >
                      Convert to Line Item
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {selectedItem && (
        <ConvertScopeModal
          isOpen={showConvertModal}
          onClose={() => {
            setShowConvertModal(false);
            setSelectedItem(null);
          }}
          scopeItem={selectedItem}
          estimateId={estimateId}
          onSuccess={handleConvertSuccess}
        />
      )}
    </div>
  );
}
