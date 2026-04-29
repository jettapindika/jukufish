"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useFishStore } from "@/lib/store";
import { calculateAging, formatElapsed } from "@/lib/aging";
import { getFishById } from "@/lib/fish-data";
import { StockEntry } from "@/lib/types";
import Link from "next/link";
import { Package, Clock, ArrowDown, X, PlusCircle } from "lucide-react";
import { SwipeConfirm } from "@/components/swipe-confirm";

function FreshnessBar({ percentage, color }: { percentage: number; color: string }) {
  return (
    <div className="h-2 w-full rounded-full bg-[var(--color-border)] overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{ width: `${Math.max(100 - Math.min(percentage, 100), 0)}%`, backgroundColor: color }}
      />
    </div>
  );
}

export default function CatatKeluarPage() {
  const router = useRouter();
  const [selectedEntry, setSelectedEntry] = useState<StockEntry | null>(null);
  const [, setTick] = useState(0);

  const getActiveEntries = useFishStore((s) => s.getActiveEntries);
  const addExit = useFishStore((s) => s.addExit);
  const currentRole = useFishStore((s) => s.currentRole);

  useEffect(() => {
    if (currentRole === "pemilik") {
      router.replace("/dashboard");
    }
  }, [currentRole, router]);

  const allEntries = useFishStore((s) => s.entries);
  const rawActive = getActiveEntries();
  const activeEntries = [...rawActive].sort((a, b) => {
    if (a.markedForExit && !b.markedForExit) return -1;
    if (!a.markedForExit && b.markedForExit) return 1;
    return 0;
  });

  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 60_000);
    return () => clearInterval(interval);
  }, []);

  const handleConfirmExit = () => {
    if (!selectedEntry) return;
    addExit({
      stockEntryId: selectedEntry.id,
      exitedBy: currentRole ?? "admin_gudang",
      reason: "FIFO - stok terlama",
    });
    setSelectedEntry(null);
  };

  if (activeEntries.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-20 md:max-w-md md:mx-auto">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[var(--color-border)]">
          <Package className="h-10 w-10 text-[var(--color-muted)]" />
        </div>
        <p className="text-center text-lg font-semibold text-[var(--color-muted)]">
          Belum ada stok, Baso. Ikan baru masuk? Catat sekarang.
        </p>
        <Link
          href="/dashboard/catat-masuk"
          className="flex h-14 w-full max-w-xs items-center justify-center gap-2 rounded-[var(--radius)] bg-[var(--color-primary)] font-bold text-white shadow-lg active:scale-[0.97] transition-all"
        >
          <PlusCircle className="h-5 w-5" />
          Catat Ikan Masuk
        </Link>
    </div>
  );
}

function MarkedBadge({ entryId }: { entryId: string }) {
  const isMarked = useFishStore((s) => s.entries.find((e) => e.id === entryId)?.markedForExit ?? false);
  if (!isMarked) return null;
  return (
    <span className="mb-1 inline-block rounded-[var(--radius-sm)] bg-[var(--color-warning)]/15 px-2 py-0.5 text-xs font-bold text-[var(--color-warning)]">
      Ditandai Pemilik
    </span>
  );
}

  return (
    <div className="flex flex-col gap-3 px-4 md:px-0 pb-28 pt-4">
      <div className="flex items-center gap-2 px-1 pb-2">
        <ArrowDown className="h-5 w-5 text-[var(--color-primary)]" />
        <h1 className="text-xl font-bold text-[var(--color-foreground)]">Catat Keluar</h1>
        <span className="ml-auto rounded-full bg-[var(--color-primary)]/10 px-3 py-1 text-xs font-semibold text-[var(--color-primary)]">
          {activeEntries.length} stok
        </span>
      </div>

      {activeEntries.map((entry) => {
        const fish = getFishById(entry.fishId);
        const aging = calculateAging(entry);
        const isCritical = aging.status === "critical";
        const isSelected = selectedEntry?.id === entry.id;

        return (
          <div key={entry.id}>
            <button
              type="button"
              onClick={() => setSelectedEntry(isSelected ? null : entry)}
              className={`w-full text-left rounded-[var(--radius)] bg-[var(--color-surface)] p-4 shadow-sm transition-all duration-150 active:scale-[0.98] ${
                isCritical
                  ? "border-l-4 border-l-[var(--color-critical)] border border-[var(--color-critical)]/20"
                  : "border border-[var(--color-border)]"
              } ${isSelected ? "ring-2 ring-[var(--color-primary)]" : ""}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <MarkedBadge entryId={entry.id} />
                  <div className="flex items-center gap-2">
                    <span className="text-base font-bold text-[var(--color-foreground)] truncate">
                      {fish?.localName ?? entry.fishId}
                    </span>
                    <span
                      className="shrink-0 rounded-[var(--radius-sm)] px-2 py-0.5 text-xs font-bold text-white"
                      style={{ backgroundColor: aging.color }}
                    >
                      {aging.label}
                    </span>
                  </div>
                  <p className="mt-0.5 text-sm text-[var(--color-muted)]">
                    {fish?.name}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-lg font-bold text-[var(--color-foreground)]">
                    {entry.weightKg.toFixed(1)} kg
                  </p>
                  <p className="text-xs font-semibold text-[var(--color-muted)]">
                    Grade {entry.grade}
                  </p>
                </div>
              </div>

              <div className="mt-3">
                <FreshnessBar percentage={aging.percentage} color={aging.color} />
              </div>

              <div className="mt-2 flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-[var(--color-muted)]" />
                <span className="text-xs text-[var(--color-muted)]">
                  {formatElapsed(aging.elapsedHours)} lalu
                </span>
                <span className="ml-auto text-xs text-[var(--color-muted)]">
                  Sisa {formatElapsed(aging.remainingHours)}
                </span>
              </div>
            </button>

            {isSelected && (
              <div className="mt-2 rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-md animate-in slide-in-from-top-2 duration-200">
                <div className="mb-4 space-y-2">
                  <p className="text-sm font-bold text-[var(--color-foreground)]">
                    Keluarkan Ikan Ini?
                  </p>
                  <div className="rounded-[var(--radius-sm)] bg-[var(--color-background)] p-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-[var(--color-muted)]">Ikan</span>
                      <span className="font-semibold text-[var(--color-foreground)]">
                        {fish?.localName}
                      </span>
                    </div>
                    <div className="mt-1 flex justify-between">
                      <span className="text-[var(--color-muted)]">Berat</span>
                      <span className="font-semibold text-[var(--color-foreground)]">
                        {entry.weightKg.toFixed(1)} kg
                      </span>
                    </div>
                    <div className="mt-1 flex justify-between">
                      <span className="text-[var(--color-muted)]">Grade</span>
                      <span className="font-semibold text-[var(--color-foreground)]">
                        {entry.grade}
                      </span>
                    </div>
                    <div className="mt-1 flex justify-between">
                      <span className="text-[var(--color-muted)]">Alasan</span>
                      <span className="font-semibold text-[var(--color-primary)]">
                        FIFO - stok terlama
                      </span>
                    </div>
                  </div>
                </div>

                <SwipeConfirm
                  onConfirm={() => {
                    handleConfirmExit();
                  }}
                  label="Geser untuk keluarkan"
                />
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedEntry(null);
                  }}
                  className="mt-3 flex h-12 w-full items-center justify-center rounded-[var(--radius)] bg-[var(--color-border)] font-semibold text-[var(--color-foreground)] transition-all active:scale-95"
                >
                  Batal
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
