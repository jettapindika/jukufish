import { supabase } from "./supabase";
import { StockEntry, StockExit, SyncQueueItem } from "./types";

interface SyncResult {
  pushed: number;
  pulled: number;
  failed: number;
  deleted: number;
}

function entryToPayload(entry: StockEntry) {
  return {
    id: entry.id,
    fish_type_id: entry.fishId,
    grade: entry.grade,
    weight_kg: entry.weightKg,
    entered_at: entry.enteredAt,
    entered_by: entry.enteredBy,
    entered_by_name: entry.enteredByName || null,
    qr_code: entry.qrCode || null,
    marked_for_exit: entry.markedForExit ?? false,
    marked_by: entry.markedBy ?? null,
    synced_at: new Date().toISOString(),
  };
}

function rowToEntry(row: Record<string, unknown>): StockEntry {
  return {
    id: row.id as string,
    fishId: row.fish_type_id as string,
    grade: row.grade as StockEntry["grade"],
    weightKg: row.weight_kg as number,
    enteredAt: row.entered_at as string,
    enteredBy: row.entered_by as StockEntry["enteredBy"],
    enteredByName: (row.entered_by_name as string) || undefined,
    qrCode: (row.qr_code as string) || `JUKU-${row.id}`,
    markedForExit: (row.marked_for_exit as boolean) ?? false,
    markedBy: (row.marked_by as StockEntry["markedBy"]) || undefined,
  };
}

function exitToPayload(exit: StockExit) {
  return {
    id: exit.id,
    stock_entry_id: exit.stockEntryId,
    exited_at: exit.exitedAt,
    exited_by: exit.exitedBy,
    reason: exit.reason,
    synced_at: new Date().toISOString(),
  };
}

function rowToExit(row: Record<string, unknown>): StockExit {
  return {
    id: row.id as string,
    stockEntryId: row.stock_entry_id as string,
    exitedAt: row.exited_at as string,
    exitedBy: row.exited_by as StockExit["exitedBy"],
    reason: row.reason as string,
  };
}

export async function pullRemoteEntries(
  localEntries: StockEntry[],
  afterDate?: string | null
): Promise<StockEntry[]> {
  let query = supabase.from("stock_entries").select("*").order("entered_at", { ascending: true });
  if (afterDate) query = query.gt("created_at", afterDate);
  const { data, error } = await query;
  if (error || !data) return [];

  const localIds = new Set(localEntries.map((e) => e.id));
  return data.filter((row) => !localIds.has(row.id as string)).map(rowToEntry);
}

export async function pullRemoteExits(
  localExits: StockExit[],
  afterDate?: string | null
): Promise<StockExit[]> {
  let query = supabase.from("stock_exits").select("*").order("exited_at", { ascending: true });
  if (afterDate) query = query.gt("created_at", afterDate);
  const { data, error } = await query;
  if (error || !data) return [];

  const localIds = new Set(localExits.map((e) => e.id));
  return data.filter((row) => !localIds.has(row.id as string)).map(rowToExit);
}

export async function fullSync(
  entries: StockEntry[],
  exits: StockExit[],
  queue: SyncQueueItem[],
  lastClearedAt?: string | null
): Promise<SyncResult> {
  let pushed = 0;
  let pulled = 0;
  let failed = 0;
  let deleted = 0;

  const recentlyClearedMs = lastClearedAt ? Date.now() - new Date(lastClearedAt).getTime() : Infinity;
  if (recentlyClearedMs < 5_000) {
    return { pushed: 0, pulled: 0, failed: 0, deleted: 0, ...emptySyncDetails() };
  }

  // Offline clear recovery: delete remote data that predates the clear timestamp
  if (lastClearedAt && entries.length === 0 && exits.length === 0 && queue.length === 0) {
    const { data: staleEntries } = await supabase
      .from("stock_entries")
      .select("id")
      .lte("created_at", lastClearedAt);
    const { data: staleExits } = await supabase
      .from("stock_exits")
      .select("id")
      .lte("created_at", lastClearedAt);

    for (const r of (staleExits ?? [])) {
      await supabase.from("stock_exits").delete().eq("id", r.id);
    }
    for (const r of (staleEntries ?? [])) {
      await supabase.from("stock_entries").delete().eq("id", r.id);
    }
  }

  const { data: remoteEntries } = await supabase.from("stock_entries").select("*");
  const { data: remoteExits } = await supabase.from("stock_exits").select("*");

  const remoteEntryIds = new Set((remoteEntries ?? []).map((r) => r.id as string));
  const remoteExitIds = new Set((remoteExits ?? []).map((r) => r.id as string));
  const localEntryIds = new Set(entries.map((e) => e.id));
  const localExitIds = new Set(exits.map((e) => e.id));

  // Only push entries that are in the sync queue (genuinely new, created on this device).
  // Local entries NOT on remote AND NOT in queue = deleted remotely, must not re-push.
  const pendingEntryIds = new Set(
    queue
      .filter((q) => q.table === "stock_entries" && q.status === "pending")
      .map((q) => q.recordId)
  );
  const pendingExitIds = new Set(
    queue
      .filter((q) => q.table === "stock_exits" && q.status === "pending")
      .map((q) => q.recordId)
  );

  const localOnlyEntries = entries.filter(
    (e) => !remoteEntryIds.has(e.id) && pendingEntryIds.has(e.id)
  );
  for (const entry of localOnlyEntries) {
    const { error } = await supabase.from("stock_entries").upsert(entryToPayload(entry));
    if (!error) pushed++;
    else failed++;
  }

  const localOnlyExits = exits.filter(
    (e) => !remoteExitIds.has(e.id) && pendingExitIds.has(e.id)
  );
  for (const exit of localOnlyExits) {
    const { error } = await supabase.from("stock_exits").upsert(exitToPayload(exit));
    if (!error) pushed++;
    else failed++;
  }

  if (remoteEntries) {
    for (const row of remoteEntries) {
      if (!row.entered_by_name) {
        const localEntry = entries.find((e) => e.id === row.id);
        if (localEntry?.enteredByName) {
          supabase.from("stock_entries").update({ entered_by_name: localEntry.enteredByName }).eq("id", row.id);
        }
      }
    }
  }

  const newEntries: StockEntry[] = [];
  const updatedEntryIds: string[] = [];
  if (remoteEntries) {
    for (const row of remoteEntries) {
      if (!localEntryIds.has(row.id as string)) {
        newEntries.push(rowToEntry(row));
      }
    }
  }

  const newExits: StockExit[] = [];
  if (remoteExits) {
    for (const row of remoteExits) {
      if (!localExitIds.has(row.id as string)) {
        newExits.push(rowToExit(row));
      }
    }
  }
  pulled = newEntries.length + newExits.length;

  const deletedEntryIds: string[] = [];
  const deletedExitIds: string[] = [];
  if (remoteEntries) {
    for (const localEntry of entries) {
      if (!remoteEntryIds.has(localEntry.id) && !pendingEntryIds.has(localEntry.id)) {
        deletedEntryIds.push(localEntry.id);
        deleted++;
      }
    }
  }
  if (remoteExits) {
    for (const localExit of exits) {
      if (!remoteExitIds.has(localExit.id) && !pendingExitIds.has(localExit.id)) {
        deletedExitIds.push(localExit.id);
        deleted++;
      }
    }
  }

  const syncedEntryIds = localOnlyEntries.filter((_, i) => i < pushed).map((e) => e.id);
  const syncedExitIds = localOnlyExits.map((e) => e.id);

  return {
    pushed,
    pulled,
    failed,
    deleted,
    newEntries,
    newExits,
    syncedEntryIds,
    syncedExitIds,
    failedEntryIds: [],
    failedExitIds: [],
    deletedEntryIds,
    deletedExitIds,
    updatedEntryIds,
  } as FullSyncResult;
}

function emptySyncDetails(): SyncDetails {
  return {
    newEntries: [],
    newExits: [],
    syncedEntryIds: [],
    syncedExitIds: [],
    failedEntryIds: [],
    failedExitIds: [],
    deletedEntryIds: [],
    deletedExitIds: [],
    updatedEntryIds: [],
  };
}

export interface SyncDetails {
  newEntries: StockEntry[];
  newExits: StockExit[];
  syncedEntryIds: string[];
  syncedExitIds: string[];
  failedEntryIds: string[];
  failedExitIds: string[];
  deletedEntryIds: string[];
  deletedExitIds: string[];
  updatedEntryIds: string[];
}

export type FullSyncResult = SyncResult & SyncDetails;
