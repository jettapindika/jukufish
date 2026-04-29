"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, RefreshCw, LogOut, Check, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { QrScanner } from "@/components/qr-scanner";
import { useFishStore } from "@/lib/store";
import { getFishById, FISH_CATEGORIES } from "@/lib/fish-data";
import { calculateAging, formatElapsed } from "@/lib/aging";
import type { StockEntry } from "@/lib/types";

export default function ScanQrPage() {
  const router = useRouter();
  const [scanning, setScanning] = useState(true);
  const [scannedEntry, setScannedEntry] = useState<StockEntry | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [exitSuccess, setExitSuccess] = useState(false);

  const [scanLoading, setScanLoading] = useState(false);

  async function handleScan(text: string) {
    setError(null);
    setScanLoading(true);

    try {
      const store = useFishStore.getState();

      try {
        const { data: remoteEntries } = await supabase
          .from("stock_entries")
          .select("*")
          .or(`qr_code.eq.${text},id.eq.${text}`);

        const { data: remoteExits } = await supabase
          .from("stock_exits")
          .select("stock_entry_id");

        const remoteExitedIds = new Set((remoteExits ?? []).map((e: { stock_entry_id: string }) => e.stock_entry_id));

        if (remoteEntries && remoteEntries.length > 0) {
          const activeRemote = remoteEntries
            .filter((e: { id: string }) => !remoteExitedIds.has(e.id))
            .sort((a: { entered_at: string }, b: { entered_at: string }) =>
              new Date(b.entered_at).getTime() - new Date(a.entered_at).getTime()
            )[0];

          if (activeRemote) {
            const mapped: StockEntry = {
              id: activeRemote.id,
              fishId: activeRemote.fish_type_id,
              grade: activeRemote.grade,
              weightKg: activeRemote.weight_kg,
              enteredAt: activeRemote.entered_at,
              enteredBy: activeRemote.entered_by,
              enteredByName: activeRemote.entered_by_name,
              qrCode: activeRemote.qr_code || text,
              markedForExit: activeRemote.marked_for_exit ?? false,
              markedBy: activeRemote.marked_by,
            };

            store.mergeRemoteEntries([mapped]);
            setScannedEntry(mapped);
            setScanning(false);
            return;
          }

          setError("Stok dengan QR ini sudah dikeluarkan. Daftarkan ulang di Catat Masuk.");
          return;
        }

        setError("QR belum terdaftar. Daftarkan di Catat Masuk.");
        return;
      } catch {
        /* offline — fallback to local */
      }

      const exitedIds = store.getExitedEntryIds();
      const localActive = store.entries
        .filter((e) => e.qrCode === text && !exitedIds.has(e.id))
        .sort((a, b) => new Date(b.enteredAt).getTime() - new Date(a.enteredAt).getTime())[0];

      if (localActive) {
        setScannedEntry(localActive);
        setScanning(false);
        return;
      }

      const anyLocal = store.entries.some((e) => e.qrCode === text);
      if (anyLocal) {
        setError("Stok dengan QR ini sudah dikeluarkan. Daftarkan ulang di Catat Masuk.");
      } else {
        setError("QR belum terdaftar. Daftarkan di Catat Masuk.");
      }
    } finally {
      setScanLoading(false);
    }
  }

  function handleExitStock() {
    if (!scannedEntry) return;
    const store = useFishStore.getState();
    store.addExit({
      stockEntryId: scannedEntry.id,
      exitedBy: store.currentRole ?? "admin_gudang",
      reason: "Scan QR - keluarkan langsung",
    });
    setExitSuccess(true);
  }

  function resetScan() {
    setScanning(true);
    setScannedEntry(null);
    setError(null);
    setExitSuccess(false);
  }

  if (scanLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-7.5rem)] md:max-w-2xl md:mx-auto md:w-full">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--color-primary)]" />
        <p className="mt-3 text-sm text-[var(--color-muted)]">Mencari data stok...</p>
      </div>
    );
  }

  if (scanning) {
    return (
      <div className="fixed inset-0 top-[64px] bottom-[80px] md:bottom-[88px] z-30 overflow-hidden">
        <QrScanner onScan={handleScan} scanning={scanning && !scanLoading} />

        {error && (
          <div className="absolute bottom-6 left-4 right-4 flex flex-col items-center z-40">
            <div className="w-full max-w-sm">
              <div className="bg-[var(--color-critical)]/10 border border-[var(--color-critical)]/20 rounded-[var(--radius)] p-4 text-center backdrop-blur-sm">
                <p className="text-[var(--color-critical)] font-semibold text-sm">
                  {error}
                </p>
              </div>
              <button
                onClick={resetScan}
                className="mt-4 w-full h-12 flex items-center justify-center gap-2 rounded-[var(--radius)] bg-[var(--color-primary)] text-[var(--color-on-primary)] font-semibold text-sm active:scale-[0.98] transition-transform"
              >
                <RefreshCw className="w-5 h-5" />
                Scan Ulang
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (!scannedEntry) return null;

  const fish = getFishById(scannedEntry.fishId);
  const aging = calculateAging(scannedEntry);
  const categoryLabel =
    fish?.category && fish.category in FISH_CATEGORIES
      ? FISH_CATEGORIES[fish.category as keyof typeof FISH_CATEGORIES]
      : "Tidak diketahui";
  const roleLabel = scannedEntry.enteredBy === "admin_gudang" ? "Admin Gudang" : "Pemilik";
  const roleName = scannedEntry.enteredByName
    ? `${scannedEntry.enteredByName} (${roleLabel})`
    : roleLabel;
  const entryDate = new Date(scannedEntry.enteredAt);
  const formattedDate = entryDate.toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const formattedTime = entryDate.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="flex flex-col min-h-[calc(100vh-8rem)] px-4 md:px-0 pt-4 pb-20 md:max-w-2xl md:mx-auto md:w-full">
      <div className="bg-[var(--color-surface)] rounded-2xl p-6 shadow-sm border border-[var(--color-border)]">
        <h2 className="text-2xl font-bold text-[var(--color-foreground)]">
          {fish?.localName ?? scannedEntry.fishId}
        </h2>
        <p className="text-sm text-[var(--color-muted)] mt-1">
          {scannedEntry.qrCode}
        </p>
        
        <div className="mt-8 mb-6">
          <p className="text-5xl font-extrabold text-[var(--color-foreground)] tracking-tight">
            {scannedEntry.weightKg.toFixed(1)} <span className="text-2xl font-bold text-[var(--color-muted)]">kg</span>
          </p>
        </div>

        <div className="h-px bg-[var(--color-border)] my-4" />

        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-[var(--color-muted)] font-medium uppercase tracking-wide">
              Tanggal Masuk
            </p>
            <p className="text-sm font-semibold text-[var(--color-foreground)] mt-1">
              {formattedDate}
            </p>
            <p className="text-xs text-[var(--color-muted)]">
              {formattedTime}
            </p>
          </div>
          <div>
            <p className="text-xs text-[var(--color-muted)] font-medium uppercase tracking-wide">
              Dicatat Oleh
            </p>
            <p className="text-sm font-semibold text-[var(--color-foreground)] mt-1">
              {roleName}
            </p>
            <div className="mt-2 inline-block">
              <span className="inline-flex items-center justify-center px-3 py-1 rounded-[var(--radius-sm)] bg-[var(--color-primary)] text-white text-sm font-bold">
                Grade {scannedEntry.grade}
              </span>
            </div>
          </div>
        </div>

        <div className="h-px bg-[var(--color-border)] my-4" />

        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-[var(--color-muted)] font-medium uppercase tracking-wide">
              Kesegaran
            </p>
            <span
              className="text-xs font-bold px-3 py-1 rounded-full"
              style={{
                color: aging.color,
                backgroundColor: `${aging.color}1A`,
              }}
            >
              {aging.label}
            </span>
          </div>
          <div className="h-3 rounded-full bg-[var(--color-border)] overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${Math.max(100 - aging.percentage, 0)}%`,
                backgroundColor: aging.color,
              }}
            />
          </div>
          <div className="flex justify-between mt-2">
            <p className="text-xs font-medium text-[var(--color-muted)]">
              Berlalu: {formatElapsed(aging.elapsedHours)}
            </p>
            <p className="text-xs font-medium text-[var(--color-muted)]">
              Sisa: {formatElapsed(aging.remainingHours)}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-auto pt-6 space-y-3">
        {exitSuccess ? (
          <div className="flex items-center justify-center gap-2 h-14 rounded-2xl bg-[var(--color-fresh)] text-white font-bold">
            <Check className="w-5 h-5" />
            Stok berhasil dikeluarkan!
          </div>
        ) : (
          <button
            onClick={handleExitStock}
            className="w-full h-14 flex items-center justify-center gap-2 rounded-2xl bg-[var(--color-critical)] text-white font-bold text-base active:scale-[0.98] transition-transform"
          >
            <LogOut className="w-5 h-5" />
            Keluarkan Stok Ini
          </button>
        )}
        <div className="flex gap-3">
          <button
            onClick={resetScan}
            className="flex-1 h-12 flex items-center justify-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-foreground)] font-semibold text-sm active:scale-[0.98] transition-transform"
          >
            <RefreshCw className="w-5 h-5" />
            Scan Lagi
          </button>
          <button
            onClick={() => router.push("/dashboard")}
            className="flex-1 h-12 flex items-center justify-center gap-2 rounded-xl bg-[#242424] text-white font-semibold text-sm active:scale-[0.98] transition-transform"
          >
            <ArrowLeft className="w-5 h-5" />
            Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
