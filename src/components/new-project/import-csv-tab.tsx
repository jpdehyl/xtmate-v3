"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Table, Upload, CheckCircle, AlertCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ImportCSVTabProps {
  onClose: () => void;
}

interface CSVRow {
  [key: string]: string;
}

interface ColumnMapping {
  name?: string;
  propertyAddress?: string;
  propertyCity?: string;
  propertyState?: string;
  propertyZip?: string;
  claimNumber?: string;
  policyNumber?: string;
  jobType?: string;
}

const FIELD_OPTIONS = [
  { key: "name", label: "Project Name", required: true },
  { key: "propertyAddress", label: "Address", required: false },
  { key: "propertyCity", label: "City", required: false },
  { key: "propertyState", label: "State", required: false },
  { key: "propertyZip", label: "ZIP", required: false },
  { key: "claimNumber", label: "Claim #", required: false },
  { key: "policyNumber", label: "Policy #", required: false },
  { key: "jobType", label: "Job Type", required: false },
];

function parseCSV(content: string): { headers: string[]; rows: CSVRow[] } {
  const lines = content.trim().split("\n");
  if (lines.length < 2) {
    return { headers: [], rows: [] };
  }

  // Parse header row
  const headers = parseCSVLine(lines[0]);

  // Parse data rows
  const rows: CSVRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    const row: CSVRow = {};
    headers.forEach((header, idx) => {
      row[header] = values[idx] || "";
    });
    rows.push(row);
  }

  return { headers, rows };
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current.trim());

  return result;
}

export function ImportCSVTab({ onClose }: ImportCSVTabProps) {
  const router = useRouter();
  const [dragActive, setDragActive] = useState(false);
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<CSVRow[]>([]);
  const [mapping, setMapping] = useState<ColumnMapping>({});
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [importResult, setImportResult] = useState<{ created: number; errors: number } | null>(null);

  const handleFile = useCallback(async (file: File) => {
    setError(null);
    setHeaders([]);
    setRows([]);
    setMapping({});
    setImportResult(null);

    if (!file.name.toLowerCase().endsWith(".csv")) {
      setError("Please upload a .csv file");
      return;
    }

    const content = await file.text();
    const { headers: parsedHeaders, rows: parsedRows } = parseCSV(content);

    if (parsedHeaders.length === 0) {
      setError("CSV file is empty or invalid");
      return;
    }

    setHeaders(parsedHeaders);
    setRows(parsedRows);

    // Auto-map columns by matching header names
    const autoMapping: ColumnMapping = {};
    parsedHeaders.forEach((header) => {
      const lowerHeader = header.toLowerCase().replace(/[^a-z]/g, "");
      if (lowerHeader.includes("name") || lowerHeader.includes("project")) {
        autoMapping.name = header;
      } else if (lowerHeader.includes("address") || lowerHeader.includes("street")) {
        autoMapping.propertyAddress = header;
      } else if (lowerHeader.includes("city")) {
        autoMapping.propertyCity = header;
      } else if (lowerHeader.includes("state")) {
        autoMapping.propertyState = header;
      } else if (lowerHeader.includes("zip") || lowerHeader.includes("postal")) {
        autoMapping.propertyZip = header;
      } else if (lowerHeader.includes("claim")) {
        autoMapping.claimNumber = header;
      } else if (lowerHeader.includes("policy")) {
        autoMapping.policyNumber = header;
      } else if (lowerHeader.includes("type") || lowerHeader.includes("job")) {
        autoMapping.jobType = header;
      }
    });
    setMapping(autoMapping);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleImport = async () => {
    if (!mapping.name) {
      setError("Project Name mapping is required");
      return;
    }

    setIsImporting(true);
    setError(null);

    try {
      const response = await fetch("/api/estimates/import-csv", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mapping, rows }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to import");
      }

      const data = await response.json();
      setImportResult({ created: data.created, errors: data.errors?.length || 0 });

      // If only one created, navigate to it
      if (data.created === 1 && data.estimateIds?.[0]) {
        onClose();
        router.push(`/dashboard/estimates/${data.estimateIds[0]}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to import");
    } finally {
      setIsImporting(false);
    }
  };

  const clearFile = () => {
    setHeaders([]);
    setRows([]);
    setMapping({});
    setError(null);
    setImportResult(null);
  };

  const updateMapping = (field: string, value: string) => {
    setMapping((prev) => ({
      ...prev,
      [field]: value || undefined,
    }));
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm flex items-center gap-2">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {importResult && (
        <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-green-700 dark:text-green-400 text-sm flex items-center gap-2">
          <CheckCircle className="h-4 w-4 flex-shrink-0" />
          {importResult.created} project{importResult.created !== 1 ? "s" : ""} imported successfully
          {importResult.errors > 0 && ` (${importResult.errors} errors)`}
        </div>
      )}

      {headers.length === 0 ? (
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
          <Table className="h-10 w-10 mx-auto text-gray-400 mb-3" />
          <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
            Drop CSV file here
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
            First row should be column headers
          </p>
          <label>
            <input
              type="file"
              accept=".csv"
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
      ) : (
        // Column mapping
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
              <CheckCircle className="h-4 w-4" />
              <span className="text-sm font-medium">{rows.length} row{rows.length !== 1 ? "s" : ""} found</span>
            </div>
            <Button variant="ghost" size="sm" onClick={clearFile}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Column mapping */}
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
              Map columns to fields
            </h4>
            <div className="space-y-2">
              {FIELD_OPTIONS.map((field) => (
                <div key={field.key} className="flex items-center gap-3">
                  <span className="text-sm text-gray-600 dark:text-gray-400 w-28">
                    {field.label}
                    {field.required && <span className="text-red-500">*</span>}
                  </span>
                  <select
                    value={mapping[field.key as keyof ColumnMapping] || ""}
                    onChange={(e) => updateMapping(field.key, e.target.value)}
                    className="flex-1 text-sm border border-gray-300 dark:border-gray-700 rounded-md px-2 py-1.5 bg-white dark:bg-gray-800"
                  >
                    <option value="">-- Select column --</option>
                    {headers.map((header) => (
                      <option key={header} value={header}>
                        {header}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </div>

          {/* Preview */}
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Preview: First {Math.min(3, rows.length)} rows
          </div>
          <div className="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-lg">
            <table className="w-full text-xs">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  {headers.slice(0, 5).map((header) => (
                    <th key={header} className="px-2 py-1.5 text-left font-medium text-gray-600 dark:text-gray-400 truncate max-w-[120px]">
                      {header}
                    </th>
                  ))}
                  {headers.length > 5 && (
                    <th className="px-2 py-1.5 text-left text-gray-400">+{headers.length - 5}</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {rows.slice(0, 3).map((row, idx) => (
                  <tr key={idx} className="border-t border-gray-200 dark:border-gray-700">
                    {headers.slice(0, 5).map((header) => (
                      <td key={header} className="px-2 py-1.5 text-gray-700 dark:text-gray-300 truncate max-w-[120px]">
                        {row[header]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Button
            onClick={handleImport}
            disabled={isImporting || !mapping.name}
            className="w-full"
          >
            {isImporting ? "Importing..." : `Import ${rows.length} Project${rows.length !== 1 ? "s" : ""}`}
          </Button>
        </div>
      )}
    </div>
  );
}
