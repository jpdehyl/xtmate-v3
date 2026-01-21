import useSWR from 'swr';
import type { Estimate } from '@/lib/db/schema';
import { getEstimateOffline, saveEstimateOffline } from '@/lib/offline/storage';

// Generic fetcher function
const fetcher = async (url: string): Promise<Estimate> => {
  const response = await fetch(url);
  if (!response.ok) {
    const error = new Error('An error occurred while fetching the data.');
    // Attach extra info to the error object
    (error as Error & { status: number }).status = response.status;
    throw error;
  }
  return response.json();
};

interface UseEstimateOptions {
  /**
   * Initial data to use before the fetch completes.
   * Useful when pre-fetching server-side.
   */
  fallbackData?: Estimate;
  /**
   * Whether the user is online. If false, will use offline data.
   */
  isOnline?: boolean;
}

interface UseEstimateReturn {
  estimate: Estimate | undefined;
  isLoading: boolean;
  isValidating: boolean;
  error: Error | undefined;
  isOfflineData: boolean;
  mutate: () => Promise<Estimate | undefined>;
}

/**
 * SWR hook for fetching and caching estimate data.
 * Provides automatic deduplication, caching, and revalidation.
 * Falls back to offline storage when offline.
 */
export function useEstimate(
  id: string | null,
  options: UseEstimateOptions = {}
): UseEstimateReturn {
  const { fallbackData, isOnline = true } = options;

  const {
    data,
    error,
    isLoading,
    isValidating,
    mutate,
  } = useSWR<Estimate, Error>(
    // Only fetch if we have an ID and are online
    id && isOnline ? `/api/estimates/${id}` : null,
    fetcher,
    {
      fallbackData,
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      dedupingInterval: 5000, // Dedupe requests within 5s
      errorRetryCount: 3,
      onSuccess: async (data) => {
        // Save to offline storage when we get fresh data
        if (data) {
          await saveEstimateOffline(data, 'synced');
        }
      },
    }
  );

  // Determine if we're showing offline data
  const isOfflineData = !isOnline && !!fallbackData;

  return {
    estimate: data,
    isLoading,
    isValidating,
    error,
    isOfflineData,
    mutate: async () => mutate(),
  };
}

/**
 * Fetches estimate from offline storage.
 * Use this to get initial data for the SWR hook.
 */
export async function getOfflineEstimate(id: string): Promise<Estimate | undefined> {
  try {
    const estimate = await getEstimateOffline(id);
    return estimate || undefined;
  } catch {
    return undefined;
  }
}

/**
 * Custom hook for estimates list with SWR.
 */
export function useEstimates() {
  const { data, error, isLoading, isValidating, mutate } = useSWR<Estimate[], Error>(
    '/api/estimates',
    async (url: string) => {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch estimates');
      }
      return response.json();
    },
    {
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      dedupingInterval: 5000,
    }
  );

  return {
    estimates: data || [],
    isLoading,
    isValidating,
    error,
    mutate,
  };
}
