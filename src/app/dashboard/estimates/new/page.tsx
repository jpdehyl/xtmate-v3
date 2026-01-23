"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { createEstimate, type CreateEstimateState } from "../actions";
import { PROJECT_TYPES, PROJECT_SCOPES } from "@/lib/db/schema";

const initialState: CreateEstimateState = {};

export default function NewProjectPage() {
  const [state, formAction, isPending] = useActionState(createEstimate, initialState);
  const [projectType, setProjectType] = useState<string>("R");
  const [selectedScopes, setSelectedScopes] = useState<string[]>(["repairs"]);

  // Derive jobType from projectType
  const jobType = PROJECT_TYPES[projectType as keyof typeof PROJECT_TYPES]?.jobType || "private";

  const toggleScope = (scope: string) => {
    setSelectedScopes(prev =>
      prev.includes(scope)
        ? prev.filter(s => s !== scope)
        : [...prev, scope]
    );
  };

  return (
    <DashboardLayout>
      <div className="max-w-2xl">
        <div className="mb-8">
          <Link
            href="/dashboard"
            className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 text-sm"
          >
            &larr; Back to Dashboard
          </Link>
          <h2 className="text-2xl font-bold mt-4">New Project</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Create a new restoration project
          </p>
        </div>

        {state.error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400">
            {state.error}
          </div>
        )}

        <form action={formAction} className="space-y-6">
          {/* Hidden fields for derived values */}
          <input type="hidden" name="jobType" value={jobType} />
          <input type="hidden" name="projectType" value={projectType} />
          <input type="hidden" name="scopes" value={JSON.stringify(selectedScopes)} />

          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 space-y-6">
            {/* Project Type Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Project Type *
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {Object.entries(PROJECT_TYPES).map(([code, info]) => (
                  <button
                    key={code}
                    type="button"
                    onClick={() => setProjectType(code)}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${
                      projectType === code
                        ? "border-pd-gold bg-pd-gold/10 ring-2 ring-pd-gold/20"
                        : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-lg font-bold ${projectType === code ? "text-pd-gold" : "text-gray-600 dark:text-gray-400"}`}>
                        {code}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        info.jobType === "insurance"
                          ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                          : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                      }`}>
                        {info.jobType === "insurance" ? "Insurance" : "Private"}
                      </span>
                    </div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {info.label}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {info.description}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Work Scopes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Work Scopes
              </label>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                Select which types of work this project includes
              </p>
              <div className="flex flex-wrap gap-3">
                {Object.entries(PROJECT_SCOPES).map(([key, info]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => toggleScope(key)}
                    className={`px-4 py-2 rounded-lg border transition-all flex items-center gap-2 ${
                      selectedScopes.includes(key)
                        ? "border-pd-gold bg-pd-gold/10 text-pd-gold-700 dark:text-pd-gold"
                        : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300"
                    }`}
                  >
                    <span className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                      selectedScopes.includes(key)
                        ? "border-pd-gold bg-pd-gold text-white"
                        : "border-gray-300 dark:border-gray-600"
                    }`}>
                      {selectedScopes.includes(key) && (
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </span>
                    <span className="font-medium">{info.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Project Name */}
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Project Name *
              </label>
              <input
                type="text"
                name="name"
                id="name"
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-800 dark:text-gray-100"
                placeholder="e.g., Smith Residence Restoration"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                A project number will be auto-generated (e.g., 26-0001-{projectType}_SMITH)
              </p>
              {state.fieldErrors?.name && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {state.fieldErrors.name[0]}
                </p>
              )}
            </div>
          </div>

          <fieldset className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6">
            <legend className="text-sm font-medium text-gray-700 dark:text-gray-300 px-2">
              Property Address
            </legend>
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="propertyAddress"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Street Address
                </label>
                <input
                  type="text"
                  name="propertyAddress"
                  id="propertyAddress"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-800 dark:text-gray-100"
                  placeholder="123 Main St"
                />
              </div>

              <div className="grid grid-cols-6 gap-4">
                <div className="col-span-3">
                  <label
                    htmlFor="propertyCity"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    City
                  </label>
                  <input
                    type="text"
                    name="propertyCity"
                    id="propertyCity"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-800 dark:text-gray-100"
                  />
                </div>

                <div className="col-span-1">
                  <label
                    htmlFor="propertyState"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    State
                  </label>
                  <input
                    type="text"
                    name="propertyState"
                    id="propertyState"
                    maxLength={2}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-800 dark:text-gray-100 uppercase"
                    placeholder="TX"
                  />
                </div>

                <div className="col-span-2">
                  <label
                    htmlFor="propertyZip"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    ZIP
                  </label>
                  <input
                    type="text"
                    name="propertyZip"
                    id="propertyZip"
                    maxLength={10}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-800 dark:text-gray-100"
                    placeholder="12345"
                  />
                </div>
              </div>
            </div>
          </fieldset>

          <div className="flex justify-end gap-4">
            <Link
              href="/dashboard"
              className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isPending}
              className="px-4 py-2 bg-pd-gold text-white rounded-lg hover:bg-pd-gold-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPending ? "Creating..." : "Create Project"}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
