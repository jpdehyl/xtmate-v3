"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function NewEstimatePage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("name") as string,
      jobType: formData.get("jobType") as string,
      propertyAddress: formData.get("propertyAddress") as string,
      propertyCity: formData.get("propertyCity") as string,
      propertyState: formData.get("propertyState") as string,
      propertyZip: formData.get("propertyZip") as string,
    };

    try {
      const response = await fetch("/api/estimates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || "Failed to create estimate");
      }

      const estimate = await response.json();
      router.push(`/dashboard/estimates/${estimate.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <Link
              href="/dashboard"
              className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
            >
              &larr; Back to Dashboard
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold">New Estimate</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Create a new project estimate
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Estimate Name *
            </label>
            <input
              type="text"
              name="name"
              id="name"
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-900 dark:text-gray-100"
              placeholder="e.g., Smith Residence Restoration"
            />
          </div>

          <div>
            <label
              htmlFor="jobType"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Job Type *
            </label>
            <select
              name="jobType"
              id="jobType"
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-900 dark:text-gray-100"
            >
              <option value="private">Private</option>
              <option value="insurance">Insurance</option>
            </select>
          </div>

          <fieldset className="border border-gray-200 dark:border-gray-800 rounded-lg p-4">
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
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-900 dark:text-gray-100"
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
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-900 dark:text-gray-100"
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
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-900 dark:text-gray-100 uppercase"
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
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-900 dark:text-gray-100"
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
              disabled={isSubmitting}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Creating..." : "Create Estimate"}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
