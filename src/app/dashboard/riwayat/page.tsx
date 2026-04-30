"use client";

import { useMemo, useState } from "react";
import { useFishStore } from "@/lib/store";
import { getFishById } from "@/lib/fish-data";
import { StockEntry, StockExit } from "@/lib/types";
import { Search, SlidersHorizontal, Trash2, Download, AlertTriangle, History } from "lucide-react";

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

function generateTrxId(index: number): string {
  return `TRX-${String(index + 1).padStart(3, "0")}`;
}

const IconMasukBox = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M8 14H10V10H14V8H10V4H8V8H4V10H8V14ZM2 18C1.45 18 0.979167 17.8042 0.5875 17.4125C0.195833 17.0208 0 16.55 0 16V2C0 1.45 0.195833 0.979167 0.5875 0.5875C0.979167 0.195833 1.45 0 2 0H16C16.55 0 17.0208 0.195833 17.4125 0.5875C17.8042 0.979167 18 1.45 18 2V16C18 16.55 17.8042 17.0208 17.4125 17.4125C17.0208 17.8042 16.55 18 16 18H2ZM2 16H16V2H2V16ZM2 2V16V2Z" fill="#1C1B1B" />
  </svg>
);

const IconKeluarBox = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M8 11V6.85L6.4 8.45L5 7L9 3L13 7L11.6 8.45L10 6.85V11H8ZM2 18C1.45 18 0.979167 17.8042 0.5875 17.4125C0.195833 17.0208 0 16.55 0 16V2C0 1.45 0.195833 0.979167 0.5875 0.5875C0.979167 0.195833 1.45 0 2 0H16C16.55 0 17.0208 0.195833 17.4125 0.5875C17.8042 0.979167 18 1.45 18 2V16C18 16.55 17.8042 17.0208 17.4125 17.4125C17.0208 17.8042 16.55 18 16 18H2ZM2 16H16V13H13C12.5 13.6333 11.9042 14.125 11.2125 14.475C10.5208 14.825 9.78333 15 9 15C8.21667 15 7.47917 14.825 6.7875 14.475C6.09583 14.125 5.5 13.6333 5 13H2V16ZM9 13C9.63333 13 10.2083 12.8167 10.725 12.45C11.2417 12.0833 11.6 11.6 11.8 11H16V2H2V11H6.2C6.4 11.6 6.75833 12.0833 7.275 12.45C7.79167 12.8167 8.36667 13 9 13Z" fill="#1C1B1B" />
  </svg>
);

export default function RiwayatPage() {
  const entries = useFishStore((s) => s.entries);
  const exits = useFishStore((s) => s.exits);
  const clearHistory = useFishStore((s) => s.clearHistory);
  const customFish = useFishStore((s) => s.customFish);
  const [showConfirm, setShowConfirm] = useState(false);
  const [deleted, setDeleted] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | "masuk" | "keluar">("all");
  const [showFilter, setShowFilter] = useState(false);

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

    const filtered = items.filter((item) => {
      if (filterType !== "all" && item.type !== filterType) return false;

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const entry = item.type === "masuk" ? item.entry : item.entry;
        const fish = entry ? getFishById(entry.fishId, customFish) : null;
        const fishName = fish?.localName?.toLowerCase() ?? "";
        const fishFullName = fish?.name?.toLowerCase() ?? "";
        const weight = entry?.weightKg?.toString() ?? "";
        return fishName.includes(query) || fishFullName.includes(query) || weight.includes(query) || item.type.includes(query);
      }

      return true;
    });

    const groups: { label: string; items: HistoryItem[] }[] = [];
    let currentLabel = "";

    for (const item of filtered) {
      const label = getDateLabel(item.timestamp);
      if (label !== currentLabel) {
        currentLabel = label;
        groups.push({ label, items: [] });
      }
      groups[groups.length - 1].items.push(item);
    }

    return groups;
  }, [entries, exits, searchQuery, filterType, customFish]);

  let globalIndex = 0;

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
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#F1EDEC]">
          <History className="h-10 w-10 text-[#444748]" />
        </div>
        <p className="text-center text-lg font-bold text-[#1C1B1B]">
          {deleted ? "Riwayat berhasil dihapus" : "Belum ada riwayat"}
        </p>
        <p className="text-center text-sm text-[#444748]">
          {deleted ? "Backup CSV sudah didownload" : "Aktivitas masuk dan keluar stok akan tercatat di sini"}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 px-4 md:px-0 pb-28 pt-4">
      <div className="flex items-center justify-between">
        <h1
          className="text-2xl font-bold text-[#1C1B1B] tracking-[-0.24px]"
          style={{ fontFamily: "Helvetica, Arial, sans-serif" }}
        >
          Riwayat
        </h1>
        <button
          onClick={() => setShowConfirm(true)}
          className="flex h-12 items-center gap-1 px-2 active:scale-95 transition-transform"
        >
          <Trash2 className="h-[13.5px] w-3 text-[#BA1A1A]" />
          <span
            className="text-sm font-bold text-[#BA1A1A] tracking-[0.28px]"
            style={{ fontFamily: "Helvetica, Arial, sans-serif" }}
          >
            Hapus
          </span>
        </button>
      </div>

      <div
        className="flex h-12 items-center gap-0 rounded bg-white px-4"
        style={{ boxShadow: "0px 1px 1px rgba(0,0,0,0.05), 0px 4px 4px rgba(0,0,0,0.05), 0px 10px 10px rgba(0,0,0,0.03)" }}
      >
        <Search className="h-[18px] w-[18px] shrink-0 text-[#747878]" />
        <input
          type="text"
          placeholder="Cari transaksi..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 bg-transparent px-3 text-base text-[#1C1B1B] placeholder:text-[#747878] outline-none"
          style={{ fontFamily: "Helvetica, Arial, sans-serif" }}
        />
        <button
          onClick={() => setShowFilter(!showFilter)}
          className="shrink-0 p-1 active:scale-90 transition-transform"
        >
          <SlidersHorizontal className="h-3 w-3 text-[#444748]" />
        </button>
      </div>

      {showFilter && (
        <div
          className="flex gap-2 -mt-3"
        >
          {(["all", "masuk", "keluar"] as const).map((type) => (
            <button
              key={type}
              onClick={() => { setFilterType(type); setShowFilter(false); }}
              className={`rounded px-3 py-1.5 text-xs font-bold uppercase tracking-wide transition-all ${
                filterType === type
                  ? type === "masuk"
                    ? "bg-[#16A34A] text-white"
                    : type === "keluar"
                    ? "bg-[#BA1A1A] text-white"
                    : "bg-[#242424] text-white"
                  : "bg-[#F1EDEC] text-[#444748]"
              }`}
            >
              {type === "all" ? "Semua" : type}
            </button>
          ))}
        </div>
      )}

      {showConfirm && (
        <div className="rounded-xl border border-[#BA1A1A]/30 bg-[#BA1A1A]/5 p-4">
          <div className="flex items-start gap-3 mb-3">
            <AlertTriangle className="h-5 w-5 shrink-0 text-[#BA1A1A] mt-0.5" />
            <div>
              <p className="text-sm font-bold text-[#1C1B1B]">
                Hapus semua riwayat?
              </p>
              <p className="text-xs text-[#444748] mt-1">
                File CSV backup akan otomatis didownload sebelum data dihapus.
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={exportAndDelete}
              className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-[#BA1A1A] text-sm font-bold text-white active:scale-[0.97] transition-transform"
            >
              <Download className="h-4 w-4" />
              Export & Hapus
            </button>
            <button
              onClick={() => setShowConfirm(false)}
              className="flex h-12 flex-1 items-center justify-center rounded-xl bg-white border border-[#E5E2E1] text-sm font-bold text-[#444748] active:scale-[0.97] transition-transform"
            >
              Batal
            </button>
          </div>
        </div>
      )}

      {grouped.map((group) => (
        <div key={group.label} className="flex flex-col gap-3">
          <h2
            className="text-sm font-bold uppercase tracking-[0.7px] text-[#444748] pt-2"
            style={{ fontFamily: "Helvetica, Arial, sans-serif" }}
          >
            {group.label}
          </h2>

          <div className="flex flex-col gap-3">
            {group.items.map((item) => {
              const isMasuk = item.type === "masuk";
              const entry = isMasuk ? item.entry : item.entry;
              const fish = entry ? getFishById(entry.fishId, customFish) : null;
              const currentIndex = globalIndex++;

              return (
                <div
                  key={`${item.type}-${isMasuk ? item.entry.id : item.exit.id}`}
                  className="flex items-center justify-between rounded bg-white p-4"
                  style={{ boxShadow: "0px 1px 1px rgba(0,0,0,0.05), 0px 4px 4px rgba(0,0,0,0.05), 0px 10px 10px rgba(0,0,0,0.03)" }}
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F1EDEC]">
                      {isMasuk ? <IconMasukBox /> : <IconKeluarBox />}
                    </div>

                    <div className="flex flex-col gap-1">
                      <span
                        className="text-base font-bold text-[#1C1B1B] leading-6"
                        style={{ fontFamily: "Helvetica, Arial, sans-serif" }}
                      >
                        {fish?.localName ?? "Ikan"}
                      </span>
                      <span
                        className="text-xs text-[#444748] leading-[14.4px]"
                        style={{ fontFamily: "Helvetica, Arial, sans-serif" }}
                      >
                        {generateTrxId(currentIndex)} • {formatTime(item.timestamp)}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1">
                    <span
                      className="text-xl font-bold text-[#0E0F0F] leading-[26px] text-right"
                      style={{ fontFamily: "Helvetica, Arial, sans-serif" }}
                    >
                      {entry ? `${Math.round(entry.weightKg)}KG` : "—"}
                    </span>
                    <span
                      className={`rounded-sm px-2 py-0.5 text-[10px] font-bold uppercase leading-[15px] text-right text-white tracking-wide ${
                        isMasuk ? "bg-[#16A34A]" : "bg-[#BA1A1A]"
                      }`}
                      style={{ fontFamily: "Helvetica, Arial, sans-serif" }}
                    >
                      {isMasuk ? "MASUK" : "KELUAR"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {grouped.length === 0 && (entries.length > 0 || exits.length > 0) && (
        <div className="flex flex-col items-center justify-center gap-3 py-16">
          <Search className="h-10 w-10 text-[#747878]" />
          <p className="text-sm font-bold text-[#444748]">Tidak ada hasil</p>
          <p className="text-xs text-[#747878]">Coba kata kunci lain</p>
        </div>
      )}
    </div>
  );
}
