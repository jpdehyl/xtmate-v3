"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { FileCode, Upload, CheckCircle, AlertCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { parseESXFile, type ESXParseResult } from "@/lib/esx/parser";

interface ImportESXTabProps {
  onClose: () => void;
}

export function ImportESXTab({ onClose }: ImportESXTabProps) {
  const router = useRouter();
  const [dragActive, setDragActive] = useState(false);
  const [parseResult, setParseResult] = useState<ESXParseResult | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = useCallback(async (file: File) => {
    setError(null);
    setParseResult(null);

    if (!file.name.toLowerCase().endsWith(".esx") && !file.name.toLowerCase().endsWith(".xml")) {
      setError("Please upload an .esx or .xml file");
      return;
    }

    const result = await parseESXFile(file);
    setParseResult(result);

    if (!result.success) {
      setError(result.error || "Failed to parse ESX file");
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFile(file);
    }
  }, [handleFile]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  }, [handleFile]);

  const handleImport = async () => {
    if (!parseResult?.success || !parseResult.estimate) return;

    setIsImporting(true);
    setError(null);

    try {
      const response = await fetch("/api/estimates/import-esx", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parseResult),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to import estimate");
      }

      const data = await response.json();
      onClose();
      router.push(`/dashboard/estimates/${data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to import");
    } finally {
      setIsImporting(false);
    }
  };

  const clearFile = () => {
    setParseResult(null);
    setError(null);
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm flex items-center gap-2">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {!parseResult ? (
        // File upload zone
        <div
          onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
          className={`
            border-2 border-dashed rounded-lg p-8 text-center transition-colors
            ${dragActive
              ? "border-pd-gold bg-pd-gold/5"
              : "border-gray-300 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600"
            }
          `}
        >
          <FileCode className="h-10 w-10 mx-auto text-gray-400 mb-3" />
          <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
            Drop ESX file here
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
            or click to browse
          </p>
          <label>
            <input
              type="file"
              accept=".esx,.xml"
              onChange={handleFileInput}
              className="hidden"
            />
            <Button variant="outline" size="sm" asChild>
              <span className="cursor-pointer">
                <Upload className="h-3.5 w-3.5 mr-1.5" />
                Choose File
              </span>
            </Button>
          </label>
        </div>
      ) : parseResult.success ? (
        // Preview parsed data
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
              <CheckCircle className="h-4 w-4" />
              <span className="text-sm font-medium">File parsed successfully</span>
            </div>
            <Button variant="ghost" size="sm" onClick={clearFile}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 space-y-3">
            <div>
              <span className="text-xs text-gray-500 dark:text-gray-400">Project Name</span>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {parseResult.estimate?.name || "Imported Estimate"}
              </p>
            </div>

            {parseResult.estimate?.propertyAddress && (
              <div>
                <span className="text-xs text-gray-500 dark:text-gray-400">Address</span>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  {parseResult.estimate.propertyAddress}
                  {parseResult.estimate.propertyCity && `, ${parseResult.estimate.propertyCity}`}
                  {parseResult.estimate.propertyState && `, ${parseResult.estimate.propertyState}`}
                </p>
              </div>
            )}

            {parseResult.estimate?.claimNumber && (
              <div>
                <span className="text-xs text-gray-500 dark:text-gray-400">Claim #</span>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  {parseResult.estimate.claimNumber}
                </p>
              </div>
            )}

            <div className="flex gap-4 pt-2 border-t border-gray-200 dark:border-gray-700">
              <div>
                <span className="text-xs text-gray-500 dark:text-gray-400">Levels</span>
                <p className="text-sm font-medium">{parseResult.levels?.length || 0}</p>
              </div>
              <div>
                <span className="text-xs text-gray-500 dark:text-gray-400">Rooms</span>
                <p className="text-sm font-medium">{parseResult.rooms?.length || 0}</p>
              </div>
              <div>
                <span className="text-xs text-gray-500 dark:text-gray-400">Line Items</span>
                <p className="text-sm font-medium">{parseResult.lineItems?.length || 0}</p>
              </div>
              {parseResult.photos && parseResult.photos.length > 0 && (
                <div>
                  <span className="text-xs text-gray-500 dark:text-gray-400">Photos</span>
                  <p className="text-sm font-medium">{parseResult.photos.length}</p>
                </div>
              )}
            </div>

            {parseResult.estimate?.totalAmount !== undefined && (
              <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                <span className="text-xs text-gray-500 dark:text-gray-400">Total Amount</span>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  ${parseResult.estimate.totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </p>
              </div>
            )}
          </div>

          <Button
            onClick={handleImport}
            disabled={isImporting}
            className="w-full"
          >
            {isImporting ? "Importing..." : "Import Project"}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
