"use client";

import { useState, useMemo, useEffect } from "react";
import { useFishStore } from "@/lib/store";
import { calculateAging, formatElapsed } from "@/lib/aging";
import { useFishData } from "@/hooks/use-fish-data";
import { Package, Clock, Fish, Filter } from "lucide-react";
import type { StockEntry } from "@/lib/types";

type FilterStatus = "all" | "fresh" | "warning" | "critical";

export default function StokPage() {
  const getActiveEntries = useFishStore((s) => s.getActiveEntries);
  const [filter, setFilter] = useState<FilterStatus>("all");
  const [, setTick] = useState(0);
  const { categories, getFishById } = useFishData();

  const activeEntries = useMemo(() => getActiveEntries(), [getActiveEntries]);

  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 30_000);
    return () => clearInterval(interval);
  }, []);

  const stats = useMemo(() => {
    let totalKg = 0;
    let fresh = 0;
    let warning = 0;
    let critical = 0;
    for (const entry of activeEntries) {
      totalKg += entry.weightKg;
      const aging = calculateAging(entry);
      if (aging.status === "fresh") fresh++;
      else if (aging.status === "warning") warning++;
      else critical++;
    }
    return { totalKg, fresh, warning, critical, total: activeEntries.length };
  }, [activeEntries]);

  const filtered = useMemo(() => {
    if (filter === "all") return activeEntries;
    return activeEntries.filter((e) => calculateAging(e).status === filter);
  }, [activeEntries, filter]);

  const byFish = useMemo(() => {
    const map: Record<string, { count: number; kg: number }> = {};
    for (const entry of activeEntries) {
      if (!map[entry.fishId]) map[entry.fishId] = { count: 0, kg: 0 };
      map[entry.fishId].count++;
      map[entry.fishId].kg += entry.weightKg;
    }
    return Object.entries(map)
      .map(([fishId, data]) => ({ fishId, fish: getFishById(fishId), ...data }))
      .sort((a, b) => b.count - a.count);
  }, [activeEntries, getFishById]);

  const filters: { key: FilterStatus; label: string; count: number }[] = [
    { key: "all", label: "Semua", count: stats.total },
    { key: "fresh", label: "Segar", count: stats.fresh },
    { key: "warning", label: "Perhatian", count: stats.warning },
    { key: "critical", label: "Kritis", count: stats.critical },
  ];

  if (activeEntries.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-20">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[var(--color-border)]">
          <Package className="h-10 w-10 text-[var(--color-muted)]" />
        </div>
        <p className="text-center text-lg font-semibold text-[var(--color-foreground)]">
          Belum ada stok di cold storage
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col px-4 md:px-0 pt-4 pb-24 gap-4">
      <div className="flex items-center gap-2">
        <Package className="h-5 w-5 text-[var(--color-primary)]" />
        <h1 className="text-xl font-bold text-[var(--color-foreground)]">Stok Cold Storage</h1>
        <span className="ml-auto text-sm font-bold text-[var(--color-primary)]">
          {stats.total} stok · {stats.totalKg.toFixed(1)} kg
        </span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {byFish.slice(0, 6).map(({ fishId, fish, count, kg }) => (
          <div
            key={fishId}
            className="flex items-center gap-3 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] p-3"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--color-primary)]/10">
              <Fish className="h-5 w-5 text-[var(--color-primary)]" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-[var(--color-foreground)] truncate">
                {fish?.localName ?? fishId}
              </p>
              <p className="text-xs text-[var(--color-muted)]">
                {count} stok · {kg.toFixed(1)} kg
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4 text-[var(--color-muted)]" />
        <div className="flex gap-2 overflow-x-auto">
          {filters.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`shrink-0 h-9 px-3 rounded-lg text-xs font-bold transition-colors ${
                filter === f.key
                  ? "bg-[var(--color-primary)] text-white"
                  : "bg-[var(--color-surface)] text-[var(--color-muted)] border border-[var(--color-border)]"
              }`}
            >
              {f.label} ({f.count})
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-3 md:grid md:grid-cols-2 lg:grid-cols-3">
        {filtered.map((entry) => (
          <StockCard key={entry.id} entry={entry} getFishById={getFishById} categories={categories} />
        ))}
      </div>
    </div>
  );
}

function StockCard({
  entry,
  getFishById,
  categories,
}: {
  entry: StockEntry;
  getFishById: (id: string) => ReturnType<ReturnType<typeof useFishData>["getFishById"]>;
  categories: Record<string, string>;
}) {
  const fish = getFishById(entry.fishId);
  const aging = calculateAging(entry);
  const entryDate = new Date(entry.enteredAt);

  return (
    <div
      className={`rounded-2xl bg-[var(--color-surface)] border p-5 ${
        aging.status === "critical"
          ? "border-[var(--color-critical)] shadow-[0_0_0_1px_var(--color-critical)]"
          : "border-[var(--color-border)] shadow-sm"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          {entry.markedForExit && (
            <span className="mb-2 inline-block rounded-md bg-[var(--color-warning)]/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[var(--color-warning)]">
              Ditandai Keluar
            </span>
          )}
          <h3 className="text-xl font-bold text-[var(--color-foreground)] truncate">
            {fish?.localName ?? entry.fishId}
          </h3>
          <p className="text-sm text-[var(--color-muted)] mt-0.5">
            {entry.qrCode}
          </p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-2xl font-extrabold text-[var(--color-foreground)] tracking-tight">
            {entry.weightKg.toFixed(1)} <span className="text-sm font-bold text-[var(--color-muted)]">kg</span>
          </p>
          <span className="inline-block mt-1 text-xs font-bold px-2 py-0.5 bg-[var(--color-primary)] text-white rounded">
            Grade {entry.grade}
          </span>
        </div>
      </div>

      <div className="mt-5 mb-2 flex items-center justify-between">
        <span
          className="text-xs font-bold px-2 py-1 rounded-full"
          style={{
            color: aging.color,
            backgroundColor: `${aging.color}1A`,
          }}
        >
          {aging.label}
        </span>
        <span className="text-xs font-semibold text-[var(--color-muted)]">
          Sisa {formatElapsed(aging.remainingHours)}
        </span>
      </div>

      <div className="h-2.5 rounded-full bg-[var(--color-border)] overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${aging.status === "critical" ? "freshness-critical" : ""}`}
          style={{ width: `${Math.max(100 - Math.min(aging.percentage, 100), 0)}%`, backgroundColor: aging.color }}
        />
      </div>

      <div className="mt-4 pt-3 border-t border-[var(--color-border)] flex items-center justify-between text-xs text-[var(--color-muted)] font-medium">
        <span>
          {entryDate.toLocaleDateString("id-ID", { day: "numeric", month: "short" })} {entryDate.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
        </span>
        <span>Oleh {entry.enteredByName || (entry.enteredBy === "admin_gudang" ? "Admin" : "Pemilik")}</span>
      </div>
    </div>
  );
}
