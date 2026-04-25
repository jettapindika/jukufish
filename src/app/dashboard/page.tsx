"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { PlusCircle, AlertTriangle, Settings } from "lucide-react";
import { useFishStore } from "@/lib/store";
import { calculateAging, formatElapsed } from "@/lib/aging";
import { getFishById } from "@/lib/fish-data";
import { FreshnessBar } from "@/components/freshness-bar";
import type { StockEntry } from "@/lib/types";

export default function DashboardHome() {
  const currentUser = useFishStore((s) => s.currentUser);
  const currentRole = useFishStore((s) => s.currentRole);
  const getActiveEntries = useFishStore((s) => s.getActiveEntries);
  const getMarkedEntries = useFishStore((s) => s.getMarkedEntries);
  const entries = useFishStore((s) => s.entries);

  useEffect(() => {
    import("@/lib/supabase").then(({ supabase }) => {
      supabase.from("stock_entries").select("id, marked_for_exit, marked_by").then(({ data }) => {
        if (!data) return;
        const store = useFishStore.getState();
        let changed = false;
        const updated = store.entries.map((e) => {
          const remote = data.find((r: { id: string }) => r.id === e.id);
          if (remote && remote.marked_for_exit !== (e.markedForExit ?? false)) {
            changed = true;
            return { ...e, markedForExit: remote.marked_for_exit, markedBy: remote.marked_by };
          }
          return e;
        });
        if (changed) useFishStore.setState({ entries: updated });
      });
    }).catch(() => {});
  }, []);

  const activeEntries = useMemo(() => getActiveEntries(), [getActiveEntries, entries]);
  const markedCount = useMemo(() => getMarkedEntries().length, [getMarkedEntries, entries]);

  const stats = useMemo(() => {
    let totalKg = 0;
    let fresh = 0;
    let warning = 0;
    let critical = 0;
    const today = new Date().toDateString();
    let todayCount = 0;

    for (const entry of activeEntries) {
      totalKg += entry.weightKg;
      const aging = calculateAging(entry);
      if (aging.status === "fresh") fresh++;
      else if (aging.status === "warning") warning++;
      else critical++;
      if (new Date(entry.enteredAt).toDateString() === today) todayCount++;
    }

    return { totalKg, fresh, warning, critical, todayCount, total: activeEntries.length };
  }, [activeEntries]);

  const userName = currentUser?.name?.split(" ")[0] ?? "User";

  if (currentRole === "admin_gudang") {
    return <BasoView stats={stats} markedCount={markedCount} userName={userName} />;
  }

  return (
    <DaengView stats={stats} activeEntries={activeEntries} userName={userName} />
  );
}

interface Stats {
  totalKg: number;
  fresh: number;
  warning: number;
  critical: number;
  todayCount: number;
  total: number;
}

function getTimeGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Pagi";
  if (hour < 17) return "Siang";
  return "Malam";
}

function BasoView({ stats, markedCount, userName }: { stats: Stats; markedCount: number; userName: string }) {
  return (
    <div className="flex flex-col items-center px-4 pt-6">
      <p className="mb-1 text-sm font-semibold text-[var(--color-muted)]">
        {getTimeGreeting()}, {userName}!
      </p>

      <div className="mt-8 w-full max-w-sm">
        <Link
          href="/dashboard/catat-masuk"
          className="flex h-20 w-full items-center justify-center gap-3 rounded-2xl bg-[var(--color-primary)] text-xl font-bold text-white shadow-lg active:scale-[0.97] active:shadow-md transition-all duration-150"
        >
          <PlusCircle className="h-7 w-7" />
          Catat Ikan Masuk
        </Link>
      </div>

      <p className="mt-6 text-sm text-[var(--color-muted)]">
        <span className="font-bold text-[var(--color-foreground)]">{stats.total}</span> ikan di cold storage
      </p>

      {markedCount > 0 && (
        <Link
          href="/dashboard/catat-keluar"
          className="mt-4 flex w-full max-w-sm items-center gap-3 rounded-[var(--radius)] bg-[var(--color-warning)]/10 px-4 py-3 transition-all active:scale-[0.98]"
        >
          <AlertTriangle className="h-5 w-5 shrink-0 text-[var(--color-warning)]" />
          <p className="text-sm font-bold text-[var(--color-warning)]">
            Daeng menandai {markedCount} ikan untuk dikeluarkan
          </p>
        </Link>
      )}
    </div>
  );
}

function DaengView({ stats, activeEntries, userName }: { stats: Stats; activeEntries: StockEntry[]; userName: string }) {
  const [activeFilter, setActiveFilter] = useState<"all" | "fresh" | "warning" | "critical">("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fishBreakdown = useMemo(() => {
    const map = new Map<string, { count: number; totalKg: number }>();
    for (const entry of activeEntries) {
      const existing = map.get(entry.fishId) || { count: 0, totalKg: 0 };
      map.set(entry.fishId, { count: existing.count + 1, totalKg: existing.totalKg + entry.weightKg });
    }
    return Array.from(map.entries())
      .map(([fishId, data]) => ({ fishId, fish: getFishById(fishId), ...data }))
      .sort((a, b) => b.count - a.count);
  }, [activeEntries]);

  const filteredEntries = useMemo(() => {
    if (activeFilter === "all") return activeEntries;
    return activeEntries.filter((entry) => calculateAging(entry).status === activeFilter);
  }, [activeEntries, activeFilter]);

  const filters: { key: typeof activeFilter; label: string }[] = [
    { key: "all", label: "Semua" },
    { key: "fresh", label: "Segar" },
    { key: "warning", label: "Perhatian" },
    { key: "critical", label: "Kritis" },
  ];

  return (
    <div className="flex flex-col px-4 pt-4 pb-4 gap-4">
      <p className="text-sm font-semibold text-[var(--color-muted)]">
        {stats.critical > 0
          ? `${getTimeGreeting()}, ${userName}. Ada ${stats.critical} ikan kritis hari ini.`
          : `${getTimeGreeting()}, ${userName}. Semua stok dalam kondisi baik.`}
      </p>

      {stats.critical > 0 && (
        <div className="flex items-center gap-3 rounded-xl bg-[var(--color-critical)] p-4">
          <AlertTriangle className="h-6 w-6 shrink-0 text-white" />
          <p className="text-sm font-bold text-white">
            {stats.critical} boks harus dikeluarkan sekarang!
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Total Stok" value={stats.total} borderColor="var(--color-primary)" />
        <StatCard label="Segar" value={stats.fresh} borderColor="var(--color-fresh)" />
        <StatCard label="Perhatian" value={stats.warning} borderColor="var(--color-warning)" />
        <StatCard label="Kritis" value={stats.critical} borderColor="var(--color-critical)" />
      </div>

      {fishBreakdown.length > 0 && (
        <div>
          <h2 className="mb-3 text-sm font-bold text-[var(--color-foreground)]">
            Stok per Jenis Ikan
          </h2>
          <div className="rounded-[var(--radius)] bg-[var(--color-surface)] shadow-sm overflow-hidden">
            {fishBreakdown.map((item, i) => (
              <div
                key={item.fishId}
                className={`flex items-center justify-between px-4 py-3 ${i < fishBreakdown.length - 1 ? "border-b border-[var(--color-border)]" : ""}`}
              >
                <span className="text-sm font-semibold text-[var(--color-foreground)]">
                  {item.fish?.localName ?? item.fishId}
                </span>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-[var(--color-muted)]">
                    {item.totalKg.toFixed(1)} kg
                  </span>
                  <span className="min-w-[28px] rounded-[var(--radius-sm)] bg-[var(--color-primary)]/10 px-2 py-0.5 text-center text-xs font-bold text-[var(--color-primary)]">
                    {item.count}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <h2 className="mb-3 text-sm font-bold text-[var(--color-foreground)]">
          Daftar Stok
        </h2>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {filters.map((f) => (
            <button
              key={f.key}
              onClick={() => setActiveFilter(f.key)}
              className={`shrink-0 rounded-full px-4 py-2 text-xs font-bold transition-colors ${
                activeFilter === f.key
                  ? "bg-[var(--color-primary)] text-white"
                  : "bg-[var(--color-surface)] text-[var(--color-muted)]"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {filteredEntries.length === 0 ? (
        <p className="py-8 text-center text-sm text-[var(--color-muted)]">
          Tidak ada stok untuk filter ini
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {filteredEntries.map((entry) => {
            const isExpanded = expandedId === entry.id;
            return (
              <StockDetailCard
                key={entry.id}
                entry={entry}
                isExpanded={isExpanded}
                onToggle={() => setExpandedId(isExpanded ? null : entry.id)}
              />
            );
          })}
        </div>
      )}

      <Link
        href="/dashboard/shelf-life"
        className="mt-2 flex items-center justify-center gap-2 text-sm font-semibold text-[var(--color-primary)]"
      >
        <Settings className="h-4 w-4" />
        Pengaturan Shelf Life
      </Link>
    </div>
  );
}

function StockDetailCard({
  entry,
  isExpanded,
  onToggle,
}: {
  entry: StockEntry;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const fish = getFishById(entry.fishId);
  const aging = calculateAging(entry);

  const isMarked = useFishStore((s) => s.entries.find((e) => e.id === entry.id)?.markedForExit ?? false);
  const handleMark = () => {
    useFishStore.getState().markForExit(entry.id, "pemilik");
  };

  return (
    <div className="rounded-[var(--radius)] bg-[var(--color-surface)] shadow-sm border-l-4" style={{ borderLeftColor: aging.color }}>
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between p-4 text-left"
      >
        <div>
          <p className="text-sm font-bold text-[var(--color-foreground)]">
            {fish?.localName ?? entry.fishId}
          </p>
          <div className="mt-1 flex items-center gap-2 text-xs text-[var(--color-muted)]">
            <span>{entry.weightKg} kg</span>
            <span className="h-3 w-px bg-[var(--color-border)]" />
            <span>Grade {entry.grade}</span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <span
            className="rounded-[var(--radius-sm)] px-2 py-0.5 text-xs font-bold"
            style={{ backgroundColor: aging.color + "1A", color: aging.color }}
          >
            {aging.label}
          </span>
          {isMarked ? (
            <span className="text-[10px] font-semibold text-[var(--color-fresh)]">Sudah ditandai ✓</span>
          ) : (
            <span className="text-[10px] font-medium text-[var(--color-primary)]">Ketuk untuk tandai</span>
          )}
        </div>
      </button>

      {isExpanded && (
        <div className="border-t border-[var(--color-border)] px-4 pb-4 pt-3">
          <div className="flex flex-col gap-2 text-xs text-[var(--color-muted)]">
            <div className="flex justify-between">
              <span>Tanggal masuk</span>
              <span className="font-semibold text-[var(--color-foreground)]">
                {new Date(entry.enteredAt).toLocaleString("id-ID", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Dicatat oleh</span>
              <span className="font-semibold text-[var(--color-foreground)]">
                {entry.enteredByName || (entry.enteredBy === "admin_gudang" ? "Admin Gudang" : "Pemilik")}
              </span>
            </div>
            <div className="flex justify-between">
              <span>QR Code</span>
              <span className="font-mono text-[var(--color-foreground)]">{entry.qrCode}</span>
            </div>
            <div className="flex justify-between">
              <span>Berlalu</span>
              <span className="font-semibold text-[var(--color-foreground)]">
                {formatElapsed(aging.elapsedHours)}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Sisa</span>
              <span className="font-semibold text-[var(--color-foreground)]">
                {formatElapsed(aging.remainingHours)}
              </span>
            </div>
          </div>

          <div className="mt-3">
            <FreshnessBar percentage={aging.percentage} status={aging.status} color={aging.color} />
          </div>

          <div className="mt-4">
            {isMarked ? (
              <button
                disabled
                className="flex h-14 w-full items-center justify-center rounded-[var(--radius)] bg-[var(--color-fresh)] text-sm font-bold text-white opacity-80"
              >
                Sudah Ditandai &#10003;
              </button>
            ) : (
              <button
                onClick={handleMark}
                className="flex h-14 w-full items-center justify-center rounded-[var(--radius)] bg-[var(--color-warning)] text-sm font-bold text-white active:scale-[0.97] transition-transform"
              >
                Tandai untuk Dikeluarkan
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  borderColor,
}: {
  label: string;
  value: number;
  borderColor: string;
}) {
  return (
    <div
      className="rounded-[var(--radius)] border-l-4 bg-[var(--color-surface)] p-4 shadow-sm"
      style={{ borderLeftColor: borderColor }}
    >
      <p className="text-2xl font-extrabold text-[var(--color-foreground)]">{value}</p>
      <p className="text-xs font-semibold text-[var(--color-muted)]">{label}</p>
    </div>
  );
}
