"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, RefreshCw, LogOut, Check, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { QrScanner } from "@/components/qr-scanner";
import { useFishStore } from "@/lib/store";
import { getFishById } from "@/lib/fish-data";
import { calculateAging } from "@/lib/aging";
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
  const entryDate = new Date(scannedEntry.enteredAt);
  const formattedDate = entryDate.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const formattedTime = entryDate.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  const freshnessPercent = Math.max(100 - aging.percentage, 0);
  const elapsedDays = Math.max(1, Math.ceil(aging.elapsedHours / 24));
  const totalDays = Math.ceil((aging.elapsedHours + aging.remainingHours) / 24);

  return (
    <div className="flex flex-col min-h-[calc(100vh-8rem)] px-4 md:px-0 pt-4 pb-24 md:max-w-2xl md:mx-auto md:w-full">
      <div className="flex items-center gap-3 mb-4">
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
          <circle cx="16" cy="16" r="16" fill="#22C55E" />
          <path d="M13.5 20.5L9.5 16.5L10.91 15.09L13.5 17.67L21.09 10.09L22.5 11.5L13.5 20.5Z" fill="white" />
        </svg>
        <h1 className="text-2xl font-bold text-[var(--color-foreground)]">
          Scan Berhasil
        </h1>
      </div>

      <div className="rounded-2xl overflow-hidden border border-[var(--color-border)]">
        <div className="flex items-center gap-4 bg-[#242424] px-4 py-4">
          <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-600 shrink-0">
            <div className="w-full h-full bg-gradient-to-br from-gray-500 to-gray-700" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-white/60 truncate">
              ID QR: #{scannedEntry.qrCode}
            </p>
            <p className="text-lg font-bold text-white truncate">
              {fish?.localName ?? scannedEntry.fishId}
            </p>
          </div>
        </div>

        <div className="bg-[var(--color-surface)] px-4 py-4">
          <div className="grid grid-cols-2 gap-y-5">
            <div>
              <p className="text-xs text-[var(--color-muted)]">Weight</p>
              <p className="text-xl font-bold text-[var(--color-foreground)] mt-1">
                {scannedEntry.weightKg.toFixed(1)} kg
              </p>
            </div>
            <div>
              <p className="text-xs text-[var(--color-muted)]">Grade</p>
              <p className="text-xl font-bold text-[var(--color-foreground)] mt-1">
                {scannedEntry.grade.repeat(3 - scannedEntry.grade.length + 1)}
              </p>
            </div>
            <div>
              <p className="text-xs text-[var(--color-muted)]">Date Received</p>
              <p className="text-xl font-bold text-[var(--color-foreground)] mt-1">
                {formattedDate}
              </p>
            </div>
            <div>
              <p className="text-xs text-[var(--color-muted)]">Time</p>
              <p className="text-xl font-bold text-[var(--color-foreground)] mt-1">
                {formattedTime}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-4">
        <div className="flex items-center justify-between mb-4">
          <p className="text-base font-bold text-[var(--color-foreground)]">
            Status Kesegaran
          </p>
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold"
            style={{
              color: aging.color,
              backgroundColor: `${aging.color}1A`,
            }}
          >
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: aging.color }}
            />
            {aging.label}
          </span>
        </div>
        <div className="h-3 rounded-full bg-[var(--color-border)] overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${freshnessPercent}%`,
              backgroundColor: aging.color,
            }}
          />
        </div>
        <div className="flex justify-between mt-3">
          <p className="text-xs text-[var(--color-muted)]">
            Hari ke-{elapsedDays}
          </p>
          <p className="text-xs text-[var(--color-muted)]">
            Est. {totalDays} Hari
          </p>
        </div>
      </div>

      <div className="mt-auto pt-6 space-y-3">
        {exitSuccess ? (
          <div className="flex items-center justify-center gap-2 h-14 rounded-xl bg-[var(--color-fresh)] text-white font-bold text-sm tracking-wide uppercase">
            <Check className="w-[18px] h-[18px]" />
            Stok berhasil dikeluarkan!
          </div>
        ) : (
          <button
            onClick={handleExitStock}
            className="w-full h-14 flex items-center justify-center gap-2 rounded-xl bg-[#BA1A1A] text-white font-bold text-sm tracking-wide uppercase active:scale-[0.98] transition-transform"
          >
            <LogOut className="w-[18px] h-[18px]" />
            KELUARKAN STOK INI
          </button>
        )}
        <div className="flex gap-3">
          <button
            onClick={resetScan}
            className="flex-1 h-14 flex items-center justify-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-foreground)] font-bold text-sm tracking-wide uppercase active:scale-[0.98] transition-transform"
          >
            <RefreshCw className="w-6 h-6" />
            SCAN ULANG
          </button>
          <button
            onClick={() => router.push("/dashboard")}
            className="flex-1 h-14 flex items-center justify-center gap-2 rounded-xl bg-[#242424] text-white font-bold text-sm tracking-wide uppercase active:scale-[0.98] transition-transform"
          >
            <ArrowLeft className="w-4 h-4" />
            DASHBOARD
          </button>
        </div>
      </div>
    </div>
  );
}
