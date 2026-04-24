export type FishCategory = string;

export interface FishType {
  id: string;
  name: string;
  localName: string;
  category: FishCategory;
  defaultShelfLifeHours: number;
  isCustom?: boolean;
}

export interface CustomCategory {
  id: string;
  label: string;
}

export type Grade = "A" | "B" | "C";

export type UserRole = "admin_gudang" | "pemilik";

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  pin: string;
  createdAt: string;
  approved: boolean;
}

export interface InviteCode {
  code: string;
  createdBy: string;
  role: UserRole;
  usedBy: string[];
  active: boolean;
}

export interface StockEntry {
  id: string;
  fishId: string;
  weightKg: number;
  grade: Grade;
  enteredAt: string;
  enteredBy: UserRole;
  enteredByName?: string;
  qrCode: string;
  markedForExit?: boolean;
  markedBy?: UserRole;
}

export interface StockExit {
  id: string;
  stockEntryId: string;
  exitedAt: string;
  exitedBy: UserRole;
  reason: string;
}

export type SyncStatus = "pending" | "synced" | "failed";

export interface SyncQueueItem {
  id: string;
  table: "stock_entries" | "stock_exits";
  recordId: string;
  status: SyncStatus;
  retries: number;
  createdAt: string;
}

export interface ShelfLifeOverride {
  fishId: string;
  hours: number;
}
