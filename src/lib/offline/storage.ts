import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import type { Estimate } from "@/lib/db/schema";

interface XTmateDB extends DBSchema {
  estimates: {
    key: string;
    value: Estimate & {
      _syncStatus: "synced" | "pending" | "error";
      _lastModified: number;
    };
    indexes: {
      "by-userId": string;
      "by-syncStatus": string;
    };
  };
  syncQueue: {
    key: number;
    value: {
      id: number;
      type: "create" | "update" | "delete";
      estimateId: string;
      data?: Partial<Estimate>;
      timestamp: number;
    };
  };
  metadata: {
    key: string;
    value: {
      key: string;
      value: string | number | boolean;
    };
  };
}

const DB_NAME = "xtmate-offline";
const DB_VERSION = 1;

let dbInstance: IDBPDatabase<XTmateDB> | null = null;

export async function getDB(): Promise<IDBPDatabase<XTmateDB>> {
  if (dbInstance) return dbInstance;

  dbInstance = await openDB<XTmateDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Estimates store
      if (!db.objectStoreNames.contains("estimates")) {
        const estimateStore = db.createObjectStore("estimates", {
          keyPath: "id",
        });
        estimateStore.createIndex("by-userId", "userId");
        estimateStore.createIndex("by-syncStatus", "_syncStatus");
      }

      // Sync queue for pending changes
      if (!db.objectStoreNames.contains("syncQueue")) {
        db.createObjectStore("syncQueue", {
          keyPath: "id",
          autoIncrement: true,
        });
      }

      // Metadata store
      if (!db.objectStoreNames.contains("metadata")) {
        db.createObjectStore("metadata", { keyPath: "key" });
      }
    },
  });

  return dbInstance;
}

export type OfflineEstimate = Estimate & {
  _syncStatus: "synced" | "pending" | "error";
  _lastModified: number;
};

// Estimate operations
export async function saveEstimateOffline(
  estimate: Estimate,
  syncStatus: "synced" | "pending" = "synced"
): Promise<void> {
  const db = await getDB();
  const offlineEstimate: OfflineEstimate = {
    ...estimate,
    _syncStatus: syncStatus,
    _lastModified: Date.now(),
  };
  await db.put("estimates", offlineEstimate);
}

export async function saveEstimatesOffline(estimates: Estimate[]): Promise<void> {
  const db = await getDB();
  const tx = db.transaction("estimates", "readwrite");
  for (const estimate of estimates) {
    const offlineEstimate: OfflineEstimate = {
      ...estimate,
      _syncStatus: "synced",
      _lastModified: Date.now(),
    };
    await tx.store.put(offlineEstimate);
  }
  await tx.done;
}

export async function getEstimateOffline(id: string): Promise<OfflineEstimate | undefined> {
  const db = await getDB();
  return db.get("estimates", id);
}

export async function getEstimatesOffline(userId: string): Promise<OfflineEstimate[]> {
  const db = await getDB();
  const index = db.transaction("estimates", "readonly").store.index("by-userId");
  return index.getAll(userId);
}

export async function deleteEstimateOffline(id: string): Promise<void> {
  const db = await getDB();
  await db.delete("estimates", id);
}

export async function clearEstimatesOffline(): Promise<void> {
  const db = await getDB();
  await db.clear("estimates");
}

// Sync queue operations
export async function addToSyncQueue(
  type: "create" | "update" | "delete",
  estimateId: string,
  data?: Partial<Estimate>
): Promise<void> {
  const db = await getDB();
  await db.add("syncQueue", {
    id: Date.now(),
    type,
    estimateId,
    data,
    timestamp: Date.now(),
  });
}

export async function getSyncQueue(): Promise<XTmateDB["syncQueue"]["value"][]> {
  const db = await getDB();
  return db.getAll("syncQueue");
}

export async function clearSyncQueue(): Promise<void> {
  const db = await getDB();
  await db.clear("syncQueue");
}

export async function removeSyncQueueItem(id: number): Promise<void> {
  const db = await getDB();
  await db.delete("syncQueue", id);
}

// Metadata operations
export async function setMetadata(key: string, value: string | number | boolean): Promise<void> {
  const db = await getDB();
  await db.put("metadata", { key, value });
}

export async function getMetadata(key: string): Promise<string | number | boolean | undefined> {
  const db = await getDB();
  const result = await db.get("metadata", key);
  return result?.value;
}

// Get pending sync count
export async function getPendingSyncCount(): Promise<number> {
  const db = await getDB();
  const index = db.transaction("estimates", "readonly").store.index("by-syncStatus");
  const pendingEstimates = await index.getAllKeys("pending");
  const syncQueue = await db.count("syncQueue");
  return pendingEstimates.length + syncQueue;
}
