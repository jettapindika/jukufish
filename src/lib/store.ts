import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import localforage from "localforage";
import { StockEntry, StockExit, UserRole, SyncQueueItem, ShelfLifeOverride, FishType, CustomCategory, UserProfile, InviteCode } from "./types";

export type SyncState = "idle" | "syncing" | "synced" | "error";

interface SyncToast {
  message: string;
  timestamp: number;
}

interface FishStore {
  currentUser: UserProfile | null;
  currentRole: UserRole | null;
  users: UserProfile[];
  inviteCodes: InviteCode[];
  entries: StockEntry[];
  exits: StockExit[];
  syncQueue: SyncQueueItem[];
  syncState: SyncState;
  lastSyncAt: string | null;
  lastClearedAt: string | null;
  clearInProgress: boolean;
  syncToast: SyncToast | null;
  darkMode: boolean;
  shelfLifeOverrides: ShelfLifeOverride[];

  setRole: (role: UserRole) => void;
  logout: () => void;
  registerUser: (name: string, email: string, role: UserRole, pin: string) => UserProfile;
  loginUser: (email: string, pin: string) => UserProfile | null;
  setCurrentUser: (user: UserProfile) => void;
  approveUser: (userId: string) => void;
  rejectUser: (userId: string) => void;
  generateInviteCode: (role: UserRole) => string;
  resetInviteCode: () => string;
  validateInviteCode: (code: string) => InviteCode | null;
  useInviteCode: (code: string, userId: string) => void;
  getPendingUsers: () => UserProfile[];

  addEntry: (entry: Omit<StockEntry, "id" | "enteredAt" | "qrCode" | "markedForExit" | "markedBy" | "enteredByName"> & { qrCode?: string; enteredByName?: string }) => string;
  editEntry: (id: string, updates: Partial<Pick<StockEntry, "weightKg" | "grade">>) => void;
  deleteEntry: (id: string) => void;
  addExit: (exit: Omit<StockExit, "id" | "exitedAt">) => void;
  markForExit: (entryId: string, markedBy: UserRole) => void;
  unmarkForExit: (entryId: string) => void;

  getActiveEntries: () => StockEntry[];
  getExitedEntryIds: () => Set<string>;
  getMarkedEntries: () => StockEntry[];
  getPendingCount: () => number;
  clearHistory: () => Promise<void>;
  resetAllData: () => Promise<void>;

  setSyncState: (state: SyncState) => void;
  setSyncToast: (toast: SyncToast | null) => void;
  markSynced: (recordIds: string[]) => void;
  markFailed: (recordIds: string[]) => void;
  mergeRemoteEntries: (entries: StockEntry[]) => void;
  mergeRemoteExits: (exits: StockExit[]) => void;
  setLastSyncAt: (date: string) => void;

  toggleDarkMode: () => void;
  setShelfLifeOverride: (fishId: string, hours: number) => void;
  removeShelfLifeOverride: (fishId: string) => void;
  getShelfLifeHours: (fishId: string, defaultHours: number) => number;

  customCategories: CustomCategory[];
  customFish: FishType[];
  addCategory: (id: string, label: string) => void;
  editCategory: (id: string, label: string) => void;
  deleteCategory: (id: string) => void;
  addFish: (fish: FishType) => void;
  editFish: (id: string, updates: Partial<Omit<FishType, "id">>) => void;
  deleteFish: (id: string) => void;
}

const storage = {
  getItem: async (name: string): Promise<string | null> => {
    const value = await localforage.getItem<string>(name);
    return value || null;
  },
  setItem: async (name: string, value: string): Promise<void> => {
    await localforage.setItem(name, value);
  },
  removeItem: async (name: string): Promise<void> => {
    await localforage.removeItem(name);
  },
};

export const useFishStore = create<FishStore>()(
  persist(
    (set, get) => ({
      currentUser: null,
      currentRole: null,
      users: [],
      inviteCodes: [],
      entries: [],
      exits: [],
      syncQueue: [],
      syncState: "idle" as SyncState,
      lastSyncAt: null,
      lastClearedAt: null,
      clearInProgress: false,
      syncToast: null,
      darkMode: false,
      shelfLifeOverrides: [],
      customCategories: [],
      customFish: [],

      setRole: (role) => set({ currentRole: role }),
      logout: () => set({ currentUser: null, currentRole: null }),

      registerUser: (name, email, role, pin) => {
        const isFirstUser = get().users.length === 0;
        const user: UserProfile = {
          id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
          name,
          email: email.toLowerCase(),
          role,
          pin,
          createdAt: new Date().toISOString(),
          approved: role === "pemilik" || isFirstUser,
        };
        set((state) => ({ users: [...state.users, user] }));
        return user;
      },

      loginUser: (email, pin) => {
        const user = get().users.find(
          (u) => u.email.toLowerCase() === email.toLowerCase() && u.pin === pin
        );
        if (!user) return null;
        if (user.approved === false) return null;
        return user;
      },

      setCurrentUser: (user) => set({ currentUser: user, currentRole: user.role }),

      approveUser: (userId) => {
        set((state) => ({
          users: state.users.map((u) =>
            u.id === userId ? { ...u, approved: true } : u
          ),
        }));
      },

      rejectUser: (userId) => {
        set((state) => ({
          users: state.users.filter((u) => u.id !== userId),
        }));
      },

      generateInviteCode: (role) => {
        const code = Math.random().toString(36).substr(2, 8).toUpperCase();
        const inviteCode: InviteCode = {
          code,
          createdBy: get().currentUser?.id ?? "system",
          role,
          usedBy: [],
          active: true,
        };
        set({ inviteCodes: [inviteCode] });
        return code;
      },

      resetInviteCode: () => {
        const code = Math.random().toString(36).substr(2, 8).toUpperCase();
        const inviteCode: InviteCode = {
          code,
          createdBy: get().currentUser?.id ?? "system",
          role: "admin_gudang",
          usedBy: [],
          active: true,
        };
        set({ inviteCodes: [inviteCode] });
        return code;
      },

      validateInviteCode: (code) => {
        const codes = get().inviteCodes;
        if (codes.length === 0) return null;
        const current = codes[codes.length - 1];
        const cleaned = code.trim().toUpperCase();
        if (current.code === cleaned) return current;
        return null;
      },

      useInviteCode: (code, userId) => {
        set((state) => ({
          inviteCodes: state.inviteCodes.map((c) =>
            c.code === code.toUpperCase() ? { ...c, usedBy: [...c.usedBy, userId] } : c
          ),
        }));
      },

      getPendingUsers: () => {
        return get().users.filter((u) => !u.approved);
      },

      addEntry: (entry) => {
        const id = `entry-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const currentUser = get().currentUser;
        const newEntry: StockEntry = {
          ...entry,
          id,
          qrCode: entry.qrCode || `JUKU-${id}`,
          enteredByName: entry.enteredByName || currentUser?.name,
          enteredAt: new Date().toISOString(),
        };
        const queueItem: SyncQueueItem = {
          id: `sync-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          table: "stock_entries",
          recordId: id,
          status: "pending",
          retries: 0,
          createdAt: new Date().toISOString(),
        };
        set((state) => ({
          entries: [...state.entries, newEntry],
          syncQueue: [...state.syncQueue, queueItem],
        }));
        return id;
      },

      editEntry: (id, updates) => {
        set((state) => ({
          entries: state.entries.map((e) =>
            e.id === id ? { ...e, ...updates } : e
          ),
        }));
      },

      deleteEntry: (id) => {
        set((state) => ({
          entries: state.entries.filter((e) => e.id !== id),
        }));
      },

      addExit: (exit) => {
        const id = `exit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const newExit: StockExit = {
          ...exit,
          id,
          exitedAt: new Date().toISOString(),
        };
        const queueItem: SyncQueueItem = {
          id: `sync-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          table: "stock_exits",
          recordId: id,
          status: "pending",
          retries: 0,
          createdAt: new Date().toISOString(),
        };
        set((state) => ({
          exits: [...state.exits, newExit],
          syncQueue: [...state.syncQueue, queueItem],
        }));
      },

      markForExit: (entryId, markedBy) => {
        set((state) => ({
          entries: state.entries.map((e) =>
            e.id === entryId ? { ...e, markedForExit: true, markedBy } : e
          ),
        }));
        import("./supabase").then(({ supabase }) => {
          supabase.from("stock_entries").update({ marked_for_exit: true, marked_by: markedBy }).eq("id", entryId);
        }).catch(() => {});
      },

      unmarkForExit: (entryId) => {
        set((state) => ({
          entries: state.entries.map((e) =>
            e.id === entryId ? { ...e, markedForExit: false, markedBy: undefined } : e
          ),
        }));
        import("./supabase").then(({ supabase }) => {
          supabase.from("stock_entries").update({ marked_for_exit: false, marked_by: null }).eq("id", entryId);
        }).catch(() => {});
      },

      getActiveEntries: () => {
        const { entries, exits } = get();
        const exitedIds = new Set(exits.map((e) => e.stockEntryId));
        return entries
          .filter((e) => !exitedIds.has(e.id))
          .sort(
            (a, b) =>
              new Date(a.enteredAt).getTime() - new Date(b.enteredAt).getTime()
          );
      },

      getExitedEntryIds: () => {
        return new Set(get().exits.map((e) => e.stockEntryId));
      },

      getMarkedEntries: () => {
        const active = get().getActiveEntries();
        return active.filter((e) => e.markedForExit);
      },

      getPendingCount: () => {
        return get().syncQueue.filter((q) => q.status === "pending").length;
      },

      clearHistory: async () => {
        const now = new Date().toISOString();
        set({ clearInProgress: true, entries: [], exits: [], syncQueue: [], lastClearedAt: now });

        try {
          const { supabase } = await import("./supabase");
          await supabase.from("stock_exits").delete().neq("id", "");
          await supabase.from("stock_entries").delete().neq("id", "");
        } catch {
          // offline — will be cleaned up on next sync via lastClearedAt
        }

        set({ clearInProgress: false });
      },

      resetAllData: async () => {
        const now = new Date().toISOString();

        set({
          currentUser: null,
          currentRole: null,
          users: [],
          inviteCodes: [],
          entries: [],
          exits: [],
          syncQueue: [],
          syncState: "idle",
          lastSyncAt: null,
          lastClearedAt: now,
          clearInProgress: true,
          syncToast: null,
          shelfLifeOverrides: [],
          customCategories: [],
          customFish: [],
        });

        try {
          const { supabase } = await import("./supabase");
          await supabase.from("stock_exits").delete().neq("id", "");
          await supabase.from("stock_entries").delete().neq("id", "");
          await supabase.from("invite_codes").delete().neq("code", "");
          await supabase.from("users").delete().neq("id", "");
        } catch {
          // offline — will be cleaned up on next sync via lastClearedAt
        }

        set({ clearInProgress: false });

        try {
          const localforage = (await import("localforage")).default;
          await localforage.removeItem("juku-fish-storage");
        } catch {
          // ignore
        }
      },

      setSyncState: (state) => set({ syncState: state }),
      setSyncToast: (toast) => set({ syncToast: toast }),

      markSynced: (recordIds) => {
        const idSet = new Set(recordIds);
        set((state) => ({
          syncQueue: state.syncQueue.filter((q) => !idSet.has(q.recordId)),
        }));
      },

      markFailed: (recordIds) => {
        const idSet = new Set(recordIds);
        set((state) => ({
          syncQueue: state.syncQueue.map((q) =>
            idSet.has(q.recordId)
              ? { ...q, status: "failed" as const, retries: q.retries + 1 }
              : q
          ),
        }));
      },

      mergeRemoteEntries: (newEntries) => {
        if (newEntries.length === 0) return;
        set((state) => {
          if (state.clearInProgress) return {};
          const existingIds = new Set(state.entries.map((e) => e.id));
          const toAdd = newEntries.filter((e) => !existingIds.has(e.id));
          if (toAdd.length === 0) return {};
          return { entries: [...state.entries, ...toAdd] };
        });
      },

      mergeRemoteExits: (newExits) => {
        if (newExits.length === 0) return;
        set((state) => {
          if (state.clearInProgress) return {};
          const existingIds = new Set(state.exits.map((e) => e.id));
          const toAdd = newExits.filter((e) => !existingIds.has(e.id));
          if (toAdd.length === 0) return {};
          return { exits: [...state.exits, ...toAdd] };
        });
      },

      setLastSyncAt: (date) => set({ lastSyncAt: date }),

      toggleDarkMode: () => set((state) => ({ darkMode: !state.darkMode })),

      setShelfLifeOverride: (fishId, hours) => {
        set((state) => {
          const filtered = state.shelfLifeOverrides.filter((o) => o.fishId !== fishId);
          return { shelfLifeOverrides: [...filtered, { fishId, hours }] };
        });
      },

      removeShelfLifeOverride: (fishId) => {
        set((state) => ({
          shelfLifeOverrides: state.shelfLifeOverrides.filter((o) => o.fishId !== fishId),
        }));
      },

      getShelfLifeHours: (fishId, defaultHours) => {
        const override = get().shelfLifeOverrides.find((o) => o.fishId === fishId);
        return override ? override.hours : defaultHours;
      },

      addCategory: (id, label) => {
        set((state) => ({
          customCategories: [...state.customCategories, { id, label }],
        }));
      },

      editCategory: (id, label) => {
        set((state) => ({
          customCategories: state.customCategories.map((c) =>
            c.id === id ? { ...c, label } : c
          ),
        }));
      },

      deleteCategory: (id) => {
        set((state) => ({
          customCategories: state.customCategories.filter((c) => c.id !== id),
          customFish: state.customFish.filter((f) => f.category !== id),
        }));
      },

      addFish: (fish) => {
        set((state) => ({
          customFish: [...state.customFish, { ...fish, isCustom: true }],
        }));
      },

      editFish: (id, updates) => {
        set((state) => ({
          customFish: state.customFish.map((f) =>
            f.id === id ? { ...f, ...updates } : f
          ),
        }));
      },

      deleteFish: (id) => {
        set((state) => ({
          customFish: state.customFish.filter((f) => f.id !== id),
        }));
      },
    }),
    {
      name: "juku-fish-storage",
      storage: createJSONStorage(() => storage),
      onRehydrateStorage: () => (state) => {
        if (state?.inviteCodes && state.inviteCodes.length > 1) {
          const last = state.inviteCodes[state.inviteCodes.length - 1];
          useFishStore.setState({ inviteCodes: [{ ...last, active: true }] });
        }
        if (state?.users) {
          const needsFix = state.users.some((u) => u.approved === undefined);
          if (needsFix) {
            useFishStore.setState({
              users: state.users.map((u) => ({ ...u, approved: u.approved ?? true })),
            });
          }
        }
      },
      partialize: (state) => ({
        currentUser: state.currentUser,
        currentRole: state.currentRole,
        users: state.users,
        inviteCodes: state.inviteCodes,
        entries: state.entries,
        exits: state.exits,
        syncQueue: state.syncQueue,
        lastSyncAt: state.lastSyncAt,
        lastClearedAt: state.lastClearedAt,
        darkMode: state.darkMode,
        shelfLifeOverrides: state.shelfLifeOverrides,
        customCategories: state.customCategories,
        customFish: state.customFish,
      }),
    }
  )
);
