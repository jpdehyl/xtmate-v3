"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Estimate } from "@/lib/db/schema";
import { OfflineIndicator } from "@/components/offline-indicator";
import { useOnlineStatus } from "@/lib/offline/hooks";
import {
  saveEstimateOffline,
  addToSyncQueue,
  deleteEstimateOffline,
} from "@/lib/offline/storage";
import { AIScopeModal } from "@/components/features/ai-scope-modal";
import { EnhanceDescriptionModal } from "@/components/features/enhance-description-modal";
import { RoomsTab } from "@/components/features/rooms-tab";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { SketchEditor } from "@/components/sketch-editor";
import type { ScopeSuggestion } from "@/app/api/ai/suggest-scope/route";
import type { Room } from "@/lib/db/schema";

type TabValue = "details" | "rooms" | "scope" | "photos" | "sla";

interface EstimateDetailClientProps {
  initialEstimate: Estimate;
}

export function EstimateDetailClient({ initialEstimate }: EstimateDetailClientProps) {
  const router = useRouter();
  const { isOnline } = useOnlineStatus();
  const [estimate, setEstimate] = useState<Estimate>(initialEstimate);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isExporting, setIsExporting] = useState<"pdf" | "excel" | null>(null);
  const [isOfflineData, setIsOfflineData] = useState(false);
  const [isDuplicating, setIsDuplicating] = useState(false);
  const [showScopeModal, setShowScopeModal] = useState(false);
  const [showEnhanceModal, setShowEnhanceModal] = useState(false);
  const [acceptedSuggestions, setAcceptedSuggestions] = useState<ScopeSuggestion[]>([]);
  const [activeTab, setActiveTab] = useState<TabValue>("details");
  const [showSketchEditor, setShowSketchEditor] = useState(false);

  const saveEstimate = useCallback(
    async (updates: Partial<Estimate>) => {
      setIsSaving(true);
      try {
        if (isOnline) {
          const response = await fetch(`/api/estimates/${estimate.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updates),
          });

          if (!response.ok) {
            throw new Error("Failed to save");
          }

          const updatedEstimate = await response.json();
          setEstimate(updatedEstimate);
          setLastSaved(new Date());
          await saveEstimateOffline(updatedEstimate, "synced");
        } else {
          const updatedEstimate = {
            ...estimate,
            ...updates,
            updatedAt: new Date(),
          } as Estimate;
          setEstimate(updatedEstimate);
          await saveEstimateOffline(updatedEstimate, "pending");
          await addToSyncQueue("update", estimate.id, updates);
          setLastSaved(new Date());
          setIsOfflineData(true);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to save");
      } finally {
        setIsSaving(false);
      }
    },
    [estimate, isOnline]
  );

  async function handleDelete() {
    setIsDeleting(true);
    try {
      if (isOnline) {
        const response = await fetch(`/api/estimates/${estimate.id}`, {
          method: "DELETE",
        });

        if (!response.ok) {
          throw new Error("Failed to delete");
        }
      } else {
        await addToSyncQueue("delete", estimate.id);
      }

      await deleteEstimateOffline(estimate.id);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete");
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  }

  function handleFieldChange(field: keyof Estimate, value: string) {
    setEstimate({ ...estimate, [field]: value });
  }

  function handleFieldBlur(field: keyof Estimate, value: string) {
    saveEstimate({ [field]: value });
  }

  async function handleExport(format: "pdf" | "excel") {
    if (!isOnline) {
      setError("Export is not available offline");
      return;
    }

    setIsExporting(format);
    try {
      const response = await fetch(`/api/estimates/${estimate.id}/export?format=${format}`);
      if (!response.ok) {
        throw new Error("Export failed");
      }

      const blob = await response.blob();
      const contentDisposition = response.headers.get("Content-Disposition");
      const filenameMatch = contentDisposition?.match(/filename="(.+)"/);
      const filename = filenameMatch?.[1] || `estimate.${format === "pdf" ? "pdf" : "xlsx"}`;

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Export failed");
    } finally {
      setIsExporting(null);
    }
  }

  async function handleDuplicate() {
    if (!isOnline) {
      setError("Duplicate is not available offline");
      return;
    }

    setIsDuplicating(true);
    try {
      const response = await fetch(`/api/estimates/${estimate.id}/duplicate`, {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to duplicate estimate");
      }

      const duplicatedEstimate = await response.json();
      router.push(`/dashboard/estimates/${duplicatedEstimate.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to duplicate");
      setIsDuplicating(false);
    }
  }

  function handleAcceptSuggestions(suggestions: ScopeSuggestion[]) {
    setAcceptedSuggestions((prev) => [...prev, ...suggestions]);
  }

  function handleRemoveSuggestion(suggestionId: string) {
    setAcceptedSuggestions((prev) => prev.filter((s) => s.id !== suggestionId));
  }

  async function handleEnhanceAccept(enhancedName: string) {
    handleFieldChange("name", enhancedName);
    await saveEstimate({ name: enhancedName });
  }

  async function handleSaveRooms(rooms: Partial<Room>[]) {
    for (const roomData of rooms) {
      try {
        await fetch(`/api/estimates/${estimate.id}/rooms`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(roomData),
        });
      } catch (err) {
        console.error("Failed to save room:", err);
      }
    }
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link
              href="/dashboard"
              className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
            >
              &larr; Back
            </Link>
            <div className="flex items-center gap-2 sm:gap-4">
              <OfflineIndicator />
              {isSaving && (
                <span className="text-sm text-gray-500">Saving...</span>
              )}
              {lastSaved && !isSaving && (
                <span className="text-sm text-green-600 dark:text-green-400">
                  {isOfflineData ? "Saved locally" : "Saved"}
                </span>
              )}
              <button
                onClick={() => handleExport("pdf")}
                disabled={isExporting !== null || !isOnline}
                title={!isOnline ? "Export unavailable offline" : "Export as PDF"}
                className="px-3 py-1.5 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <span className="hidden sm:inline">
                  {isExporting === "pdf" ? "Exporting..." : "PDF"}
                </span>
              </button>
              <button
                onClick={() => handleExport("excel")}
                disabled={isExporting !== null || !isOnline}
                title={!isOnline ? "Export unavailable offline" : "Export as Excel"}
                className="px-3 py-1.5 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <span className="hidden sm:inline">
                  {isExporting === "excel" ? "Exporting..." : "Excel"}
                </span>
              </button>
              <button
                onClick={handleDuplicate}
                disabled={isDuplicating || !isOnline}
                title={!isOnline ? "Duplicate unavailable offline" : "Duplicate estimate"}
                className="px-3 py-1.5 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
                <span className="hidden sm:inline">
                  {isDuplicating ? "Duplicating..." : "Duplicate"}
                </span>
              </button>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="px-3 py-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors text-sm"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isOfflineData && (
          <div className="mb-6 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg text-amber-800 dark:text-amber-200 text-sm">
            You are viewing cached data. Changes will sync when you&apos;re back online.
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400">
            {error}
          </div>
        )}

        <Tabs defaultValue="details" value={activeTab} onValueChange={(v) => setActiveTab(v as TabValue)}>
          <TabsList className="mb-6 w-full sm:w-auto flex overflow-x-auto">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="rooms">Rooms</TabsTrigger>
            <TabsTrigger value="scope">Scope</TabsTrigger>
            <TabsTrigger value="photos">Photos</TabsTrigger>
            <TabsTrigger value="sla">SLA</TabsTrigger>
          </TabsList>

          <TabsContent value="details">
            <div className="space-y-8">
              <section>
            <h2 className="text-lg font-semibold mb-4">Basic Information</h2>
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Estimate Name
                </label>
                <div className="mt-1 flex gap-2">
                  <input
                    type="text"
                    id="name"
                    value={estimate.name}
                    onChange={(e) => handleFieldChange("name", e.target.value)}
                    onBlur={(e) => handleFieldBlur("name", e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-900 dark:text-gray-100"
                  />
                  <button
                    type="button"
                    onClick={() => setShowEnhanceModal(true)}
                    disabled={!isOnline}
                    title={!isOnline ? "AI features unavailable offline" : "Enhance with AI"}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center gap-1 text-sm text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <span className="hidden sm:inline">Enhance</span>
                  </button>
                </div>
              </div>

              <div>
                <label
                  htmlFor="status"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Status
                </label>
                <select
                  id="status"
                  value={estimate.status}
                  onChange={(e) => {
                    handleFieldChange("status", e.target.value);
                    saveEstimate({ status: e.target.value as Estimate["status"] });
                  }}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-900 dark:text-gray-100"
                >
                  <option value="draft">Draft</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="jobType"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Job Type
                </label>
                <select
                  id="jobType"
                  value={estimate.jobType}
                  onChange={(e) => {
                    handleFieldChange("jobType", e.target.value);
                    saveEstimate({ jobType: e.target.value as Estimate["jobType"] });
                  }}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-900 dark:text-gray-100"
                >
                  <option value="private">Private</option>
                  <option value="insurance">Insurance</option>
                </select>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-4">Property Address</h2>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="md:col-span-2">
                <label
                  htmlFor="propertyAddress"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Street Address
                </label>
                <input
                  type="text"
                  id="propertyAddress"
                  value={estimate.propertyAddress || ""}
                  onChange={(e) =>
                    handleFieldChange("propertyAddress", e.target.value)
                  }
                  onBlur={(e) =>
                    handleFieldBlur("propertyAddress", e.target.value)
                  }
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-900 dark:text-gray-100"
                />
              </div>

              <div>
                <label
                  htmlFor="propertyCity"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  City
                </label>
                <input
                  type="text"
                  id="propertyCity"
                  value={estimate.propertyCity || ""}
                  onChange={(e) =>
                    handleFieldChange("propertyCity", e.target.value)
                  }
                  onBlur={(e) => handleFieldBlur("propertyCity", e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-900 dark:text-gray-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="propertyState"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    State
                  </label>
                  <input
                    type="text"
                    id="propertyState"
                    maxLength={2}
                    value={estimate.propertyState || ""}
                    onChange={(e) =>
                      handleFieldChange("propertyState", e.target.value)
                    }
                    onBlur={(e) =>
                      handleFieldBlur("propertyState", e.target.value)
                    }
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-900 dark:text-gray-100 uppercase"
                  />
                </div>

                <div>
                  <label
                    htmlFor="propertyZip"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    ZIP
                  </label>
                  <input
                    type="text"
                    id="propertyZip"
                    maxLength={10}
                    value={estimate.propertyZip || ""}
                    onChange={(e) =>
                      handleFieldChange("propertyZip", e.target.value)
                    }
                    onBlur={(e) => handleFieldBlur("propertyZip", e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-900 dark:text-gray-100"
                  />
                </div>
              </div>
            </div>
          </section>

          {estimate.jobType === "insurance" && (
            <section>
              <h2 className="text-lg font-semibold mb-4">Insurance Details</h2>
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <label
                    htmlFor="claimNumber"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    Claim Number
                  </label>
                  <input
                    type="text"
                    id="claimNumber"
                    value={estimate.claimNumber || ""}
                    onChange={(e) =>
                      handleFieldChange("claimNumber", e.target.value)
                    }
                    onBlur={(e) =>
                      handleFieldBlur("claimNumber", e.target.value)
                    }
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-900 dark:text-gray-100"
                  />
                </div>

                <div>
                  <label
                    htmlFor="policyNumber"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    Policy Number
                  </label>
                  <input
                    type="text"
                    id="policyNumber"
                    value={estimate.policyNumber || ""}
                    onChange={(e) =>
                      handleFieldChange("policyNumber", e.target.value)
                    }
                    onBlur={(e) =>
                      handleFieldBlur("policyNumber", e.target.value)
                    }
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-900 dark:text-gray-100"
                  />
                </div>
              </div>
            </section>
          )}

              <section className="border-t border-gray-200 dark:border-gray-800 pt-6">
                <p className="text-sm text-gray-500">
                  Created:{" "}
                  {new Date(estimate.createdAt).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </p>
                <p className="text-sm text-gray-500">
                  Last updated:{" "}
                  {new Date(estimate.updatedAt).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </p>
              </section>
            </div>
          </TabsContent>

          <TabsContent value="rooms">
            <RoomsTab
              estimateId={estimate.id}
              isOnline={isOnline}
              onOpenSketchEditor={() => setShowSketchEditor(true)}
            />
          </TabsContent>

          <TabsContent value="scope">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold">Scope Items</h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Line items and pricing for this estimate
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowScopeModal(true)}
                  disabled={!isOnline}
                  title={!isOnline ? "AI features unavailable offline" : "Get AI scope suggestions"}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium flex items-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

              {acceptedSuggestions.length === 0 ? (
                <div className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg p-8 text-center">
                  <svg
                    className="w-12 h-12 mx-auto text-gray-400 mb-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
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
                  <p className="text-sm text-gray-500 dark:text-gray-500">
                    Full line item management coming in Sprint M4.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {acceptedSuggestions.map((suggestion) => (
                    <div
                      key={suggestion.id}
                      className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
                    >
                      <div className="flex items-start justify-between gap-4">
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
                        <button
                          onClick={() => handleRemoveSuggestion(suggestion.id)}
                          className="text-gray-400 hover:text-red-500 transition-colors"
                          title="Remove suggestion"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                  <p className="text-sm text-gray-500 italic">
                    {acceptedSuggestions.length} suggested scope item{acceptedSuggestions.length !== 1 ? "s" : ""} added
                  </p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="photos">
            <div className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg p-8 text-center">
              <svg
                className="w-12 h-12 mx-auto text-gray-400 mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                Photos
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Photo management coming in Sprint M5.
              </p>
            </div>
          </TabsContent>

          <TabsContent value="sla">
            <div className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg p-8 text-center">
              <svg
                className="w-12 h-12 mx-auto text-gray-400 mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                SLA & Workflow
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                SLA tracking and workflow management coming in Sprint M6.
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </main>

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-lg p-6 max-w-md mx-4 shadow-xl">
            <h3 className="text-lg font-semibold mb-2">Delete Estimate</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Are you sure you want to delete &quot;{estimate.name}&quot;? This
              action cannot be undone.
            </p>
            <div className="flex justify-end gap-4">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      <AIScopeModal
        isOpen={showScopeModal}
        onClose={() => setShowScopeModal(false)}
        jobType={estimate.jobType}
        propertyAddress={estimate.propertyAddress}
        propertyCity={estimate.propertyCity}
        propertyState={estimate.propertyState}
        estimateName={estimate.name}
        onAcceptSuggestions={handleAcceptSuggestions}
      />

      <EnhanceDescriptionModal
        isOpen={showEnhanceModal}
        onClose={() => setShowEnhanceModal(false)}
        currentName={estimate.name}
        jobType={estimate.jobType}
        propertyAddress={estimate.propertyAddress}
        propertyCity={estimate.propertyCity}
        propertyState={estimate.propertyState}
        onAccept={handleEnhanceAccept}
      />

      {showSketchEditor && (
        <SketchEditor
          estimateId={estimate.id}
          onClose={() => setShowSketchEditor(false)}
          onSaveRooms={handleSaveRooms}
        />
      )}
    </div>
  );
}
