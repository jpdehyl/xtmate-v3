"use client";

import { useState } from "react";

type EnhanceDescriptionModalProps = {
  isOpen: boolean;
  onClose: () => void;
  currentName: string;
  jobType: "insurance" | "private";
  propertyAddress?: string | null;
  propertyCity?: string | null;
  propertyState?: string | null;
  onAccept: (enhancedName: string) => void;
};

export function EnhanceDescriptionModal({
  isOpen,
  onClose,
  currentName,
  jobType,
  propertyAddress,
  propertyCity,
  propertyState,
  onAccept,
}: EnhanceDescriptionModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [enhancedName, setEnhancedName] = useState<string | null>(null);
  const [explanation, setExplanation] = useState<string | null>(null);

  async function handleEnhance() {
    setIsLoading(true);
    setError(null);
    setEnhancedName(null);
    setExplanation(null);

    try {
      const response = await fetch("/api/ai/enhance-description", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: currentName,
          jobType,
          propertyAddress,
          propertyCity,
          propertyState,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to enhance description");
      }

      const data = await response.json();
      setEnhancedName(data.enhancedName);
      setExplanation(data.explanation);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  }

  function handleAccept() {
    if (enhancedName) {
      onAccept(enhancedName);
      handleClose();
    }
  }

  function handleClose() {
    setEnhancedName(null);
    setExplanation(null);
    setError(null);
    onClose();
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-lg max-w-lg w-full shadow-xl">
        <div className="p-6 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Enhance Estimate Name</h3>
            <button
              onClick={handleClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            AI will suggest a more professional name for your estimate.
          </p>
        </div>

        <div className="p-6">
          {!enhancedName && !isLoading && !error && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Current Name
                </label>
                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-gray-900 dark:text-gray-100">
                  {currentName}
                </div>
              </div>
              <button
                onClick={handleEnhance}
                className="w-full px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
                Enhance with AI
              </button>
            </div>
          )}

          {isLoading && (
            <div className="text-center py-8">
              <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">
                Enhancing your estimate name...
              </p>
            </div>
          )}

          {error && (
            <div className="space-y-4">
              <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400">
                {error}
              </div>
              <button
                onClick={handleEnhance}
                className="w-full px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
              >
                Try Again
              </button>
            </div>
          )}

          {enhancedName && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Current Name
                </label>
                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-gray-500 dark:text-gray-400 line-through">
                  {currentName}
                </div>
              </div>

              <div className="flex items-center justify-center">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Enhanced Name
                </label>
                <div className="p-3 bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-lg text-gray-900 dark:text-gray-100">
                  {enhancedName}
                </div>
              </div>

              {explanation && (
                <p className="text-sm text-gray-600 dark:text-gray-400 italic">
                  {explanation}
                </p>
              )}
            </div>
          )}
        </div>

        {enhancedName && (
          <div className="p-6 border-t border-gray-200 dark:border-gray-800 flex justify-end gap-4">
            <button
              onClick={handleEnhance}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100"
            >
              Regenerate
            </button>
            <button
              onClick={() => {
                setEnhancedName(null);
                setExplanation(null);
              }}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100"
            >
              Dismiss
            </button>
            <button
              onClick={handleAccept}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
            >
              Apply Change
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
