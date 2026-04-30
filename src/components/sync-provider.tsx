"use client";

import { useEffect, useRef, useCallback } from "react";
import { useOnlineStatus } from "@/hooks/use-online-status";
import { useFishStore } from "@/lib/store";
import { supabase } from "@/lib/supabase";
import { fullSync, FullSyncResult } from "@/lib/sync";

const SYNC_INTERVAL_MS = 60_000;
const DEBOUNCE_MS = 500;
const REALTIME_DEBOUNCE_MS = 1_000;

export function SyncProvider({ children }: { children: React.ReactNode }) {
  const isOnline = useOnlineStatus();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const syncingRef = useRef(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const realtimeDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const runSync = useCallback(async () => {
    if (syncingRef.current) return;
    syncingRef.current = true;

    const store = useFishStore.getState();
    store.setSyncState("syncing");

    try {
      const result = (await fullSync(
        store.entries,
        store.exits,
        store.syncQueue,
        store.lastClearedAt
      )) as FullSyncResult;

      const freshStore = useFishStore.getState();

      if (result.syncedEntryIds.length > 0 || result.syncedExitIds.length > 0) {
        freshStore.markSynced([
          ...result.syncedEntryIds,
          ...result.syncedExitIds,
        ]);
      }

      if (result.failedEntryIds.length > 0 || result.failedExitIds.length > 0) {
        freshStore.markFailed([
          ...result.failedEntryIds,
          ...result.failedExitIds,
        ]);
      }

      if (result.newEntries.length > 0) {
        freshStore.mergeRemoteEntries(result.newEntries);
      }

      if (result.newExits.length > 0) {
        freshStore.mergeRemoteExits(result.newExits);
      }

      if (result.deletedEntryIds && result.deletedEntryIds.length > 0) {
        const delSet = new Set(result.deletedEntryIds);
        useFishStore.setState((s) => ({
          entries: s.entries.filter((e) => !delSet.has(e.id)),
        }));
      }

      if (result.deletedExitIds && result.deletedExitIds.length > 0) {
        const delSet = new Set(result.deletedExitIds);
        useFishStore.setState((s) => ({
          exits: s.exits.filter((e) => !delSet.has(e.id)),
        }));
      }

      freshStore.setLastSyncAt(new Date().toISOString());
      freshStore.setSyncState(result.failed > 0 ? "error" : "synced");

      const totalChanges = result.pushed + result.pulled + (result.deleted ?? 0);
      if (totalChanges > 0) {
        freshStore.setSyncToast({
          message: `${totalChanges} data disinkronisasi`,
          timestamp: Date.now(),
        });
      }
    } catch {
      useFishStore.getState().setSyncState("error");
    } finally {
      syncingRef.current = false;
    }
  }, []);

  const debouncedSync = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      if (navigator.onLine) runSync();
    }, DEBOUNCE_MS);
  }, [runSync]);

  const debouncedRealtimeSync = useCallback(() => {
    if (realtimeDebounceRef.current) clearTimeout(realtimeDebounceRef.current);
    realtimeDebounceRef.current = setTimeout(() => {
      if (navigator.onLine) runSync();
    }, REALTIME_DEBOUNCE_MS);
  }, [runSync]);

  useEffect(() => {
    const unsub = useFishStore.subscribe((state, prev) => {
      if (state.syncQueue.length > prev.syncQueue.length) {
        debouncedSync();
      }
    });
    return unsub;
  }, [debouncedSync]);

  useEffect(() => {
    if (!isOnline) {
      useFishStore.getState().setSyncState("idle");
      return;
    }

    runSync();
    intervalRef.current = setInterval(runSync, SYNC_INTERVAL_MS);

    const channel = supabase
      .channel("stock-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "stock_entries" },
        () => {
          debouncedRealtimeSync();
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "stock_exits" },
        () => {
          debouncedRealtimeSync();
        }
      )
      .subscribe();

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (realtimeDebounceRef.current) {
        clearTimeout(realtimeDebounceRef.current);
        realtimeDebounceRef.current = null;
      }
      supabase.removeChannel(channel);
    };
  }, [isOnline, runSync, debouncedRealtimeSync]);

  return <>{children}</>;
}
