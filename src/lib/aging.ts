import { getFishById } from "./fish-data";
import { StockEntry } from "./types";

export type FreshnessStatus = "fresh" | "warning" | "critical";

export interface AgingInfo {
  percentage: number;
  status: FreshnessStatus;
  color: string;
  elapsedHours: number;
  remainingHours: number;
  label: string;
}

export function calculateAging(entry: StockEntry, shelfLifeOverride?: number): AgingInfo {
  const fish = getFishById(entry.fishId);
  const shelfLife = shelfLifeOverride ?? fish?.defaultShelfLifeHours ?? 24;

  const now = Date.now();
  const enteredAt = new Date(entry.enteredAt).getTime();
  const elapsedMs = now - enteredAt;
  const elapsedHours = elapsedMs / (1000 * 60 * 60);
  const percentage = Math.min((elapsedHours / shelfLife) * 100, 100);
  const remainingHours = Math.max(shelfLife - elapsedHours, 0);

  let status: FreshnessStatus;
  let color: string;
  let label: string;

  if (percentage < 50) {
    status = "fresh";
    color = "#22C55E";
    label = "Segar";
  } else if (percentage < 80) {
    status = "warning";
    color = "#F59E0B";
    label = "Perhatian";
  } else {
    status = "critical";
    color = "#EF4444";
    label = "Kritis";
  }

  return { percentage, status, color, elapsedHours, remainingHours, label };
}

export function formatElapsed(hours: number): string {
  if (hours < 1) {
    const mins = Math.floor(hours * 60);
    return `${mins} menit`;
  }
  if (hours < 24) {
    return `${Math.floor(hours)} jam`;
  }
  const days = Math.floor(hours / 24);
  const remainingHrs = Math.floor(hours % 24);
  if (remainingHrs === 0) return `${days} hari`;
  return `${days} hari ${remainingHrs} jam`;
}
