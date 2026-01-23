"use client";

import { useState } from "react";
import type { ScopeSuggestion } from "@/app/api/ai/suggest-scope/route";

type AIScopeModalProps = {
  isOpen: boolean;
  onClose: () => void;
  jobType: "insurance" | "private";
  propertyAddress?: string | null;
  propertyCity?: string | null;
  propertyState?: string | null;
  estimateName?: string;
  onAcceptSuggestions?: (suggestions: ScopeSuggestion[]) => void;
};

export function AIScopeModal({
  isOpen,
  onClose,
  jobType,
  propertyAddress,
  propertyCity,
  propertyState,
  estimateName,
  onAcceptSuggestions,
}: AIScopeModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<ScopeSuggestion[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  async function handleGenerate() {
    setIsLoading(true);
    setError(null);
    setSuggestions([]);
    setSelectedIds(new Set());

    try {
      const response = await fetch("/api/ai/suggest-scope", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobType,
          propertyAddress,
          propertyCity,
          propertyState,
          estimateName,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to generate suggestions");
      }

      const data = await response.json();
      setSuggestions(data.suggestions || []);
      // Select all by default
      setSelectedIds(new Set((data.suggestions || []).map((s: ScopeSuggestion) => s.id)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  }

  function toggleSelection(id: string) {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  }

  function handleAccept() {
    const accepted = suggestions.filter((s) => selectedIds.has(s.id));
    onAcceptSuggestions?.(accepted);
    onClose();
  }

  function handleClose() {
    setSuggestions([]);
    setSelectedIds(new Set());
    setError(null);
    onClose();
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" style={{ overscrollBehavior: 'contain' }}>
      <div className="bg-white dark:bg-gray-900 rounded-lg max-w-2xl w-full max-h-[80vh] flex flex-col shadow-xl">
        <div className="p-6 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">AI Scope Suggestions</h3>
            <button
              onClick={handleClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              aria-label="Close dialog"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Get AI-powered scope item suggestions based on your estimate details.
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {!suggestions.length && !isLoading && !error && (
            <div className="text-center py-8">
              <div className="mb-4">
                <svg
                  className="w-12 h-12 mx-auto text-primary-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                  />
                </svg>
              </div>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                AI will analyze your {jobType === "insurance" ? "insurance claim" : "private"} estimate
                {estimateName ? ` "${estimateName}"` : ""} and suggest relevant scope items.
              </p>
              <button
                onClick={handleGenerate}
                className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
              >
                Generate Suggestions
              </button>
            </div>
          )}

          {isLoading && (
            <div className="text-center py-8">
              <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">
                Analyzing estimate and generating suggestions...
              </p>
            </div>
          )}

          {error && (
            <div className="text-center py-8">
              <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400">
                {error}
              </div>
              <button
                onClick={handleGenerate}
                className="px-4 py-2 text-primary-600 hover:text-primary-700 font-medium"
              >
                Try Again
              </button>
            </div>
          )}

          {suggestions.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {selectedIds.size} of {suggestions.length} selected
                </span>
                <button
                  onClick={() => {
                    if (selectedIds.size === suggestions.length) {
                      setSelectedIds(new Set());
                    } else {
                      setSelectedIds(new Set(suggestions.map((s) => s.id)));
                    }
                  }}
                  className="text-sm text-primary-600 hover:text-primary-700"
                >
                  {selectedIds.size === suggestions.length ? "Deselect All" : "Select All"}
                </button>
              </div>

              {suggestions.map((suggestion) => (
                <div
                  key={suggestion.id}
                  onClick={() => toggleSelection(suggestion.id)}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedIds.has(suggestion.id)
                      ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20"
                      : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-5 h-5 mt-0.5 rounded border flex items-center justify-center flex-shrink-0 ${
                        selectedIds.has(suggestion.id)
                          ? "border-primary-500 bg-primary-500"
                          : "border-gray-300 dark:border-gray-600"
                      }`}
                    >
                      {selectedIds.has(suggestion.id) && (
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded">
                          {suggestion.category}
                        </span>
                      </div>
                      <h4 className="font-medium text-gray-900 dark:text-gray-100">
                        {suggestion.item}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {suggestion.description}
                      </p>
                      {(suggestion.estimatedQuantity || suggestion.unit) && (
                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                          Est. Quantity: {suggestion.estimatedQuantity || "TBD"}{" "}
                          {suggestion.unit && `(${suggestion.unit})`}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {suggestions.length > 0 && (
          <div className="p-6 border-t border-gray-200 dark:border-gray-800 flex justify-end gap-4">
            <button
              onClick={handleGenerate}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100"
            >
              Regenerate
            </button>
            <button
              onClick={handleAccept}
              disabled={selectedIds.size === 0}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Accept Selected ({selectedIds.size})
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
