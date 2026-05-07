"use client";

import type { StockEntry } from "@/lib/types";
import { calculateAging, formatElapsed } from "@/lib/aging";
import { getFishById } from "@/lib/fish-data";
import { FreshnessBar } from "./freshness-bar";

interface FishCardProps {
  entry: StockEntry;
}

const BORDER_COLOR: Record<string, string> = {
  fresh: "var(--color-fresh)",
  warning: "var(--color-warning)",
  critical: "var(--color-critical)",
};

export function FishCard({ entry }: FishCardProps) {
  const fish = getFishById(entry.fishId);
  const aging = calculateAging(entry);

  return (
    <div
      className="rounded-[var(--radius)] bg-[var(--color-surface)] p-4 shadow-sm border-l-4"
      style={{ borderLeftColor: BORDER_COLOR[aging.status] }}
    >
      <div className="flex items-start justify-between mb-2">
        <div>
          <p className="text-base font-bold text-[var(--color-foreground)]">
            {fish?.localName ?? entry.fishId}
          </p>
          <p className="text-sm text-[var(--color-muted)]">{fish?.name}</p>
        </div>
        <span
          className="text-xs font-bold px-2 py-0.5 rounded-[var(--radius-sm)]"
          style={{ backgroundColor: aging.color + "1A", color: aging.color }}
        >
          {aging.label}
        </span>
      </div>

      <div className="flex items-center gap-3 text-sm text-[var(--color-muted)] mb-3">
        <span className="font-semibold text-[var(--color-foreground)]">
          {entry.weightKg} kg
        </span>
        <span className="w-px h-3 bg-[var(--color-border)]" />
        <span>Grade {entry.grade}</span>
        <span className="w-px h-3 bg-[var(--color-border)]" />
        <span>{formatElapsed(aging.elapsedHours)}</span>
      </div>

      <FreshnessBar
        percentage={aging.percentage}
        status={aging.status}
        color={aging.color}
      />
    </div>
  );
}
