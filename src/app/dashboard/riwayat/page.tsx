"use client";

import { useMemo, useState } from "react";
import { useFishStore } from "@/lib/store";
import { getFishById } from "@/lib/fish-data";
import { StockEntry, StockExit } from "@/lib/types";
import { History, ArrowUp, ArrowDown, Trash2, Download, AlertTriangle } from "lucide-react";

type HistoryItem =
  | { type: "masuk"; entry: StockEntry; timestamp: string }
  | { type: "keluar"; exit: StockExit; entry: StockEntry | undefined; timestamp: string };

function getDateLabel(dateStr: string): string {
  const date = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  const toDateKey = (d: Date) => d.toLocaleDateString("id-ID", { year: "numeric", month: "long", day: "numeric" });

  if (toDateKey(date) === toDateKey(today)) return "Hari Ini";
  if (toDateKey(date) === toDateKey(yesterday)) return "Kemarin";
  return toDateKey(date);
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", hour12: false });
}

export default function RiwayatPage() {
  const entries = useFishStore((s) => s.entries);
  const exits = useFishStore((s) => s.exits);
  const clearHistory = useFishStore((s) => s.clearHistory);
  const customFish = useFishStore((s) => s.customFish);
  const [showConfirm, setShowConfirm] = useState(false);
  const [deleted, setDeleted] = useState(false);

  const grouped = useMemo(() => {
    const entryMap = new Map(entries.map((e) => [e.id, e]));

    const items: HistoryItem[] = [
      ...entries.map((entry): HistoryItem => ({
        type: "masuk",
        entry,
        timestamp: entry.enteredAt,
      })),
      ...exits.map((exit): HistoryItem => ({
        type: "keluar",
        exit,
        entry: entryMap.get(exit.stockEntryId),
        timestamp: exit.exitedAt,
      })),
    ];

    items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    const groups: { label: string; items: HistoryItem[] }[] = [];
    let currentLabel = "";

    for (const item of items) {
      const label = getDateLabel(item.timestamp);
      if (label !== currentLabel) {
        currentLabel = label;
        groups.push({ label, items: [] });
      }
      groups[groups.length - 1].items.push(item);
    }

    return groups;
  }, [entries, exits]);

  function exportAndDelete() {
    const bom = "\uFEFF";
    const header = "Tipe,Nama Lokal,Nama Indonesia,Berat (kg),Grade,Tanggal,Dicatat Oleh,QR Code";

    const entryRows = entries.map((e) => {
      const fish = getFishById(e.fishId, customFish);
      return [
        "MASUK",
        fish?.localName ?? e.fishId,
        fish?.name ?? "",
        e.weightKg.toFixed(1),
        e.grade,
        new Date(e.enteredAt).toLocaleString("id-ID"),
        e.enteredBy === "admin_gudang" ? "Admin" : "Pemilik",
        e.qrCode,
      ].join(",");
    });

    const exitRows = exits.map((ex) => {
      const entry = entries.find((e) => e.id === ex.stockEntryId);
      const fish = entry ? getFishById(entry.fishId, customFish) : null;
      return [
        "KELUAR",
        fish?.localName ?? ex.stockEntryId,
        fish?.name ?? "",
        entry?.weightKg.toFixed(1) ?? "",
        entry?.grade ?? "",
        new Date(ex.exitedAt).toLocaleString("id-ID"),
        ex.exitedBy === "admin_gudang" ? "Admin" : "Pemilik",
        entry?.qrCode ?? "",
      ].join(",");
    });

    const csv = [header, ...entryRows, ...exitRows].join("\n");
    const blob = new Blob([bom + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `backup-riwayat-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    setTimeout(async () => {
      await clearHistory();
      setShowConfirm(false);
      setDeleted(true);
      setTimeout(() => setDeleted(false), 3000);
    }, 500);
  }

  if (entries.length === 0 && exits.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-20">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[var(--color-border)]">
          <History className="h-10 w-10 text-[var(--color-muted)]" />
        </div>
        <p className="text-center text-lg font-semibold text-[var(--color-muted)]">
          {deleted ? "Riwayat berhasil dihapus" : "Belum ada riwayat"}
        </p>
        <p className="text-center text-sm text-[var(--color-muted)]">
          {deleted ? "Backup CSV sudah didownload" : "Aktivitas masuk dan keluar stok akan tercatat di sini"}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 px-4 pb-28 pt-4">
      <div className="flex items-center justify-between px-1 pb-1">
        <div className="flex items-center gap-2">
          <History className="h-5 w-5 text-[var(--color-primary)]" />
          <h1 className="text-xl font-bold text-[var(--color-foreground)]">Riwayat</h1>
        </div>
        <button
          onClick={() => setShowConfirm(true)}
          className="flex h-10 items-center gap-1.5 rounded-xl bg-[var(--color-critical)]/10 px-3 text-xs font-bold text-[var(--color-critical)] active:scale-95 transition-transform"
        >
          <Trash2 className="h-4 w-4" />
          Hapus
        </button>
      </div>

      {showConfirm && (
        <div className="rounded-xl border border-[var(--color-critical)]/30 bg-[var(--color-critical)]/5 p-4">
          <div className="flex items-start gap-3 mb-3">
            <AlertTriangle className="h-5 w-5 shrink-0 text-[var(--color-critical)] mt-0.5" />
            <div>
              <p className="text-sm font-bold text-[var(--color-foreground)]">
                Hapus semua riwayat?
              </p>
              <p className="text-xs text-[var(--color-muted)] mt-1">
                File CSV backup akan otomatis didownload sebelum data dihapus. Pastikan file tersimpan sebelum melanjutkan.
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={exportAndDelete}
              className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-[var(--color-critical)] text-sm font-bold text-white active:scale-[0.97] transition-transform"
            >
              <Download className="h-4 w-4" />
              Export &amp; Hapus
            </button>
            <button
              onClick={() => setShowConfirm(false)}
              className="flex h-12 flex-1 items-center justify-center rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] text-sm font-bold text-[var(--color-muted)] active:scale-[0.97] transition-transform"
            >
              Batal
            </button>
          </div>
        </div>
      )}

      {grouped.map((group) => (
        <div key={group.label}>
          <div className="sticky top-0 z-10 mb-2 px-1">
            <span className="inline-block rounded-full bg-[var(--color-primary)]/10 px-3 py-1 text-xs font-bold text-[var(--color-primary)]">
              {group.label}
            </span>
          </div>

          <div className="flex flex-col gap-2">
            {group.items.map((item) => {
              const isMasuk = item.type === "masuk";
              const entry = isMasuk ? item.entry : item.entry;
              const fish = entry ? getFishById(entry.fishId, customFish) : null;

              return (
                <div
                  key={`${item.type}-${isMasuk ? item.entry.id : item.exit.id}`}
                  className="flex items-center gap-3 rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3.5 shadow-sm"
                >
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                      isMasuk
                        ? "bg-[var(--color-primary)]/15"
                        : "bg-[var(--color-warning)]/15"
                    }`}
                  >
                    {isMasuk ? (
                      <ArrowUp className="h-5 w-5 text-[var(--color-primary)]" />
                    ) : (
                      <ArrowDown className="h-5 w-5 text-[var(--color-warning)]" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className={`shrink-0 rounded-[var(--radius-sm)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white ${
                          isMasuk ? "bg-[var(--color-primary)]" : "bg-[var(--color-warning)]"
                        }`}
                      >
                        {isMasuk ? "Masuk" : "Keluar"}
                      </span>
                      <span className="truncate text-sm font-bold text-[var(--color-foreground)]">
                        {fish?.localName ?? "—"}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-[var(--color-muted)]">
                      {fish?.name ?? "—"} · {entry?.weightKg.toFixed(1)} kg · Grade {entry?.grade}
                    </p>
                  </div>

                  <span className="shrink-0 text-sm font-semibold tabular-nums text-[var(--color-muted)]">
                    {formatTime(item.timestamp)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
