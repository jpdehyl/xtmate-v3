"use client";

import { useState, useEffect, useCallback } from "react";
import { useOnlineStatus, useSyncStatus } from "@/lib/offline/hooks";
import { syncPendingChanges, refreshEstimatesFromServer, setLastSyncTime } from "@/lib/offline/sync";
import { getPendingSyncCount } from "@/lib/offline/storage";

export function OfflineIndicator() {
  const { isOnline } = useOnlineStatus();
  const { isSyncing, startSync, endSync } = useSyncStatus();
  const [pendingCount, setPendingCount] = useState(0);
  const [showBanner, setShowBanner] = useState(false);
  const [bannerMessage, setBannerMessage] = useState("");

  // Check pending sync count
  useEffect(() => {
    const checkPending = async () => {
      try {
        const count = await getPendingSyncCount();
        setPendingCount(count);
      } catch {
        // IndexedDB might not be available
      }
    };

    checkPending();
    const interval = setInterval(checkPending, 5000);
    return () => clearInterval(interval);
  }, []);

  // Auto-sync when coming back online
  const handleSync = useCallback(async () => {
    if (isSyncing || !isOnline) return;

    startSync();
    setBannerMessage("Syncing changes...");
    setShowBanner(true);

    try {
      const success = await syncPendingChanges();
      if (success) {
        await refreshEstimatesFromServer();
        await setLastSyncTime();
        setBannerMessage("All changes synced!");
        setPendingCount(0);
      } else {
        setBannerMessage("Some changes failed to sync");
      }
    } catch {
      setBannerMessage("Sync failed");
    } finally {
      endSync();
      setTimeout(() => setShowBanner(false), 3000);
    }
  }, [isOnline, isSyncing, startSync, endSync]);

  // Sync when coming back online
  useEffect(() => {
    if (isOnline && pendingCount > 0) {
      handleSync();
    }
  }, [isOnline, pendingCount, handleSync]);

  // Show offline indicator
  useEffect(() => {
    if (!isOnline) {
      setBannerMessage("You are offline. Changes will sync when you reconnect.");
      setShowBanner(true);
    }
  }, [isOnline]);

  if (!showBanner && isOnline && pendingCount === 0) {
    return null;
  }

  return (
    <>
      {/* Status pill in header area */}
      <div className="flex items-center gap-2">
        {!isOnline && (
          <span className="inline-flex items-center gap-1.5 px-2 py-1 text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 rounded-full">
            <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
            Offline
          </span>
        )}
        {isOnline && isSyncing && (
          <span className="inline-flex items-center gap-1.5 px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 rounded-full">
            <svg className="w-3 h-3 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Syncing
          </span>
        )}
        {isOnline && pendingCount > 0 && !isSyncing && (
          <button
            onClick={handleSync}
            className="inline-flex items-center gap-1.5 px-2 py-1 text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 rounded-full hover:bg-amber-200 dark:hover:bg-amber-900/50 transition-colors"
          >
            <span className="w-2 h-2 bg-amber-500 rounded-full" />
            {pendingCount} pending
          </button>
        )}
      </div>

      {/* Full-width banner for important messages */}
      {showBanner && (
        <div
          className={`fixed bottom-0 left-0 right-0 z-50 transform transition-transform duration-300 ${
            showBanner ? "translate-y-0" : "translate-y-full"
          }`}
        >
          <div
            className={`px-4 py-3 text-center text-sm font-medium ${
              !isOnline
                ? "bg-amber-500 text-white"
                : isSyncing
                  ? "bg-blue-500 text-white"
                  : "bg-green-500 text-white"
            }`}
          >
            {bannerMessage}
          </div>
        </div>
      )}
    </>
  );
}

// Compact version for mobile or smaller spaces
export function OfflineIndicatorCompact() {
  const { isOnline } = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" title="Offline" />
  );
}
