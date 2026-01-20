"use client";

import {
  getSyncQueue,
  removeSyncQueueItem,
  saveEstimateOffline,
  getEstimateOffline,
} from "./storage";

type SyncCallback = (success: boolean, message: string) => void;

export async function syncPendingChanges(onProgress?: SyncCallback): Promise<boolean> {
  const queue = await getSyncQueue();

  if (queue.length === 0) {
    onProgress?.(true, "No changes to sync");
    return true;
  }

  let hasErrors = false;

  for (const item of queue) {
    try {
      let success = false;

      switch (item.type) {
        case "create":
          success = await syncCreate(item.estimateId, item.data);
          break;
        case "update":
          success = await syncUpdate(item.estimateId, item.data);
          break;
        case "delete":
          success = await syncDelete(item.estimateId);
          break;
      }

      if (success) {
        await removeSyncQueueItem(item.id);
        onProgress?.(true, `Synced ${item.type} for estimate ${item.estimateId}`);
      } else {
        hasErrors = true;
        onProgress?.(false, `Failed to sync ${item.type} for estimate ${item.estimateId}`);
      }
    } catch (error) {
      hasErrors = true;
      onProgress?.(false, `Error syncing: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  return !hasErrors;
}

async function syncCreate(estimateId: string, data?: Record<string, unknown>): Promise<boolean> {
  try {
    const response = await fetch("/api/estimates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (response.ok) {
      const serverEstimate = await response.json();
      // Update local storage with server response (includes server-generated ID if different)
      await saveEstimateOffline(serverEstimate, "synced");
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

async function syncUpdate(estimateId: string, data?: Record<string, unknown>): Promise<boolean> {
  try {
    const response = await fetch(`/api/estimates/${estimateId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (response.ok) {
      const serverEstimate = await response.json();
      await saveEstimateOffline(serverEstimate, "synced");
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

async function syncDelete(estimateId: string): Promise<boolean> {
  try {
    const response = await fetch(`/api/estimates/${estimateId}`, {
      method: "DELETE",
    });

    // Success or 404 (already deleted) are both acceptable
    return response.ok || response.status === 404;
  } catch {
    return false;
  }
}

// Refresh all estimates from server
export async function refreshEstimatesFromServer(): Promise<boolean> {
  try {
    const response = await fetch("/api/estimates");
    if (!response.ok) return false;

    const estimates = await response.json();
    const { saveEstimatesOffline } = await import("./storage");
    await saveEstimatesOffline(estimates);
    return true;
  } catch {
    return false;
  }
}

// Background sync registration (for when service worker supports it)
export function registerBackgroundSync(): void {
  if (typeof window === "undefined") return;

  if ("serviceWorker" in navigator && "sync" in ServiceWorkerRegistration.prototype) {
    navigator.serviceWorker.ready.then((registration) => {
      // Type assertion needed for experimental sync API
      (registration as ServiceWorkerRegistration & {
        sync: { register: (tag: string) => Promise<void> };
      }).sync?.register?.("sync-estimates").catch(() => {
        // Background sync not supported, will use online event instead
      });
    });
  }
}

// Get the last sync timestamp from metadata
export async function getLastSyncTime(): Promise<Date | null> {
  const { getMetadata } = await import("./storage");
  const timestamp = await getMetadata("lastSyncTime");
  if (typeof timestamp === "number") {
    return new Date(timestamp);
  }
  return null;
}

// Set the last sync timestamp
export async function setLastSyncTime(): Promise<void> {
  const { setMetadata } = await import("./storage");
  await setMetadata("lastSyncTime", Date.now());
}
