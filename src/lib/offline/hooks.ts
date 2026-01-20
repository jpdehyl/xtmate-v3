"use client";

import { useState, useEffect, useCallback, useRef } from "react";

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(true);
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    // Check initial status
    if (typeof window !== "undefined") {
      setIsOnline(navigator.onLine);
    }

    const handleOnline = () => {
      setIsOnline(true);
      // Track that we came back online after being offline
      setWasOffline((prev) => {
        if (!prev) return prev;
        // Will trigger sync in components that care
        return false;
      });
    };

    const handleOffline = () => {
      setIsOnline(false);
      setWasOffline(true);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return { isOnline, wasOffline };
}

export function useConnectionQuality() {
  const [connectionType, setConnectionType] = useState<string>("unknown");
  const [effectiveType, setEffectiveType] = useState<string>("unknown");

  useEffect(() => {
    if (typeof window === "undefined") return;

    const connection = (navigator as Navigator & {
      connection?: {
        type?: string;
        effectiveType?: string;
        addEventListener: (event: string, handler: () => void) => void;
        removeEventListener: (event: string, handler: () => void) => void;
      };
    }).connection;

    if (connection) {
      const updateConnectionInfo = () => {
        setConnectionType(connection.type || "unknown");
        setEffectiveType(connection.effectiveType || "unknown");
      };

      updateConnectionInfo();
      connection.addEventListener("change", updateConnectionInfo);

      return () => {
        connection.removeEventListener("change", updateConnectionInfo);
      };
    }
  }, []);

  return { connectionType, effectiveType };
}

// Hook for managing sync state
export function useSyncStatus() {
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const syncRef = useRef(false);

  const startSync = useCallback(() => {
    if (syncRef.current) return;
    syncRef.current = true;
    setIsSyncing(true);
    setSyncError(null);
  }, []);

  const endSync = useCallback((error?: string) => {
    syncRef.current = false;
    setIsSyncing(false);
    if (error) {
      setSyncError(error);
    } else {
      setLastSyncTime(new Date());
    }
  }, []);

  return {
    isSyncing,
    lastSyncTime,
    syncError,
    startSync,
    endSync,
  };
}
