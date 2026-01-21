"use client";

import { useState, useEffect } from "react";
import type { Carrier } from "@/lib/db/schema";

interface CarrierSelectorProps {
  value: string | null | undefined;
  onChange: (carrierId: string | null) => void;
  onBlur?: () => void;
  disabled?: boolean;
  className?: string;
}

export function CarrierSelector({
  value,
  onChange,
  onBlur,
  disabled = false,
  className = "",
}: CarrierSelectorProps) {
  const [carriers, setCarriers] = useState<Carrier[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCarriers() {
      try {
        setIsLoading(true);
        const response = await fetch("/api/carriers");
        if (!response.ok) throw new Error("Failed to fetch carriers");
        const data = await response.json();
        setCarriers(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load carriers");
      } finally {
        setIsLoading(false);
      }
    }

    fetchCarriers();
  }, []);

  if (error) {
    return (
      <select
        disabled
        className={`mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm dark:bg-gray-900 dark:text-gray-100 opacity-50 ${className}`}
      >
        <option>Error loading carriers</option>
      </select>
    );
  }

  return (
    <select
      value={value || ""}
      onChange={(e) => onChange(e.target.value || null)}
      onBlur={onBlur}
      disabled={disabled || isLoading}
      className={`mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-900 dark:text-gray-100 disabled:opacity-50 ${className}`}
    >
      <option value="">
        {isLoading ? "Loading carriers..." : "Select carrier (optional)"}
      </option>
      {carriers.map((carrier) => (
        <option key={carrier.id} value={carrier.id}>
          {carrier.code} - {carrier.name}
        </option>
      ))}
    </select>
  );
}
