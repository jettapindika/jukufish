"use client";

import { useEffect, useRef, useCallback } from "react";
import { useOnlineStatus } from "@/hooks/use-online-status";
import { useFishStore } from "@/lib/store";
import { supabase } from "@/lib/supabase";
import { fullSync, FullSyncResult, pullRemoteEntries, pullRemoteExits } from "@/lib/sync";
import type { StockEntry, StockExit } from "@/lib/types";

const SYNC_INTERVAL_MS = 60_000;
const DEBOUNCE_MS = 500;

export function SyncProvider({ children }: { children: React.ReactNode }) {
  const isOnline = useOnlineStatus();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const syncingRef = useRef(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevQueueLenRef = useRef(0);

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
        async () => {
          const store = useFishStore.getState();
          const recentlyClearedMs = store.lastClearedAt ? Date.now() - new Date(store.lastClearedAt).getTime() : Infinity;
          if (recentlyClearedMs < 10_000) return;
          const newEntries = await pullRemoteEntries(store.entries, store.lastClearedAt);
          if (newEntries.length > 0) {
            useFishStore.getState().mergeRemoteEntries(newEntries);
            useFishStore.getState().setSyncToast({
              message: `${newEntries.length} stok baru diterima`,
              timestamp: Date.now(),
            });
          }
          try {
            const { supabase: sb } = await import("@/lib/supabase");
            const { data: allRemote } = await sb.from("stock_entries").select("id, marked_for_exit, marked_by");
            if (allRemote) {
              const freshStore = useFishStore.getState();
              let updated = false;
              const updatedEntries = freshStore.entries.map((e) => {
                const remote = allRemote.find((r: { id: string }) => r.id === e.id);
                if (remote && remote.marked_for_exit !== (e.markedForExit ?? false)) {
                  updated = true;
                  return { ...e, markedForExit: remote.marked_for_exit, markedBy: remote.marked_by };
                }
                return e;
              });
              if (updated) useFishStore.setState({ entries: updatedEntries });
            }
          } catch { /* offline */ }
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "stock_exits" },
        async () => {
          const store = useFishStore.getState();
          const recentlyClearedMs = store.lastClearedAt ? Date.now() - new Date(store.lastClearedAt).getTime() : Infinity;
          if (recentlyClearedMs < 10_000) return;
          const newExits = await pullRemoteExits(store.exits, store.lastClearedAt);
          if (newExits.length > 0) {
            useFishStore.getState().mergeRemoteExits(newExits);
            useFishStore.getState().setSyncToast({
              message: `${newExits.length} stok keluar diterima`,
              timestamp: Date.now(),
            });
          }
        }
      )
      .subscribe();

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      supabase.removeChannel(channel);
    };
  }, [isOnline, runSync]);

  return <>{children}</>;
}
