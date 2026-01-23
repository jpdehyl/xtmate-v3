"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PROJECT_TYPES } from "@/lib/db/schema";

interface QuickCreateTabProps {
  onClose: () => void;
}

export function QuickCreateTab({ onClose }: QuickCreateTabProps) {
  const router = useRouter();
  const [projectType, setProjectType] = useState<string>("R");
  const [name, setName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const jobType = PROJECT_TYPES[projectType as keyof typeof PROJECT_TYPES]?.jobType || "private";

  async function handleCreate() {
    if (!name.trim()) {
      setError("Project name is required");
      return;
    }

    setIsCreating(true);
    setError(null);

    try {
      const response = await fetch("/api/estimates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          projectType,
          jobType,
          scopes: ["repairs"], // Default scope
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create project");
      }

      const data = await response.json();
      onClose();
      router.push(`/dashboard/estimates/${data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Project Type Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Project Type
        </label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {Object.entries(PROJECT_TYPES).map(([code, info]) => (
            <button
              key={code}
              type="button"
              onClick={() => setProjectType(code)}
              className={`p-3 rounded-lg border-2 text-left transition-all ${
                projectType === code
                  ? "border-pd-gold bg-pd-gold/10 ring-1 ring-pd-gold/20"
                  : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
              }`}
            >
              <div className="flex items-center gap-2 mb-0.5">
                <span className={`text-base font-bold ${projectType === code ? "text-pd-gold" : "text-gray-600 dark:text-gray-400"}`}>
                  {code}
                </span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                  info.jobType === "insurance"
                    ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                    : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                }`}>
                  {info.jobType === "insurance" ? "Ins" : "Priv"}
                </span>
              </div>
              <div className="text-xs font-medium text-gray-900 dark:text-white truncate">
                {info.label}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Project Name */}
      <div>
        <label
          htmlFor="project-name"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
        >
          Project Name
        </label>
        <input
          type="text"
          id="project-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && name.trim()) {
              handleCreate();
            }
          }}
          className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm focus:ring-pd-gold focus:border-pd-gold dark:bg-gray-800 dark:text-gray-100"
          placeholder="e.g., Smith Residence"
          autoFocus
        />
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          Project number will be auto-generated
        </p>
      </div>

      {/* Create Button */}
      <button
        onClick={handleCreate}
        disabled={isCreating || !name.trim()}
        className="w-full px-4 py-2.5 bg-pd-gold text-white rounded-lg hover:bg-pd-gold-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isCreating ? "Creating..." : "Create Project"}
      </button>
    </div>
  );
}
