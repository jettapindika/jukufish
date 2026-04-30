"use client";

import { useState, useMemo, useEffect } from "react";
import { useFishStore } from "@/lib/store";
import { calculateAging } from "@/lib/aging";
import { useFishData } from "@/hooks/use-fish-data";
import type { StockEntry } from "@/lib/types";

type FilterStatus = "all" | "fresh" | "warning" | "critical";
type SortMode = "newest" | "oldest" | "weight" | "freshness";

const IconBox = () => (
  <svg width="22" height="19" viewBox="0 0 22 19" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3 19C2.45 19 1.979 18.804 1.588 18.413C1.196 18.021 1 17.55 1 17V6.725C0.7 6.542 0.458 6.304 0.275 6.013C0.092 5.721 0 5.383 0 5V2C0 1.45 0.196 0.979 0.588 0.588C0.979 0.196 1.45 0 2 0H20C20.55 0 21.021 0.196 21.413 0.588C21.804 0.979 22 1.45 22 2V5C22 5.383 21.908 5.721 21.725 6.013C21.542 6.304 21.3 6.542 21 6.725V17C21 17.55 20.804 18.021 20.413 18.413C20.021 18.804 19.55 19 19 19H3ZM3 7V17H19V7H3ZM2 5H20V2H2V5ZM8 12H14V10H8V12Z" fill="#444748" />
  </svg>
);

const IconFish = () => (
  <svg width="20" height="11" viewBox="0 0 20 11" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M14.5 0C12.76 0 11.09 0.81 10 2.09C8.91 0.81 7.24 0 5.5 0C2.42 0 0 2.42 0 5.5C0 8.58 2.42 11 5.5 11C7.24 11 8.91 10.19 10 8.91C11.09 10.19 12.76 11 14.5 11C17.58 11 20 8.58 20 5.5C20 2.42 17.58 0 14.5 0ZM5.5 9C3.52 9 2 7.48 2 5.5C2 3.52 3.52 2 5.5 2C7.48 2 9 3.52 9 5.5C9 7.48 7.48 9 5.5 9ZM14.5 9C12.52 9 11 7.48 11 5.5C11 3.52 12.52 2 14.5 2C16.48 2 18 3.52 18 5.5C18 7.48 16.48 9 14.5 9Z" fill="#444748" />
  </svg>
);

const IconSort = () => (
  <svg width="14" height="9" viewBox="0 0 14 9" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M0 9V7.5H4.5V9H0ZM0 5.25V3.75H9V5.25H0ZM0 1.5V0H13.5V1.5H0Z" fill="#444748" />
  </svg>
);

export default function StokPage() {
  const getActiveEntries = useFishStore((s) => s.getActiveEntries);
  const entries = useFishStore((s) => s.entries);
  const [filter, setFilter] = useState<FilterStatus>("all");
  const [sortMode, setSortMode] = useState<SortMode>("newest");
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [, setTick] = useState(0);
  const { getFishById } = useFishData();

  const activeEntries = useMemo(() => getActiveEntries(), [getActiveEntries, entries]);

  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 30_000);
    return () => clearInterval(interval);
  }, []);

  const filtered = useMemo(() => {
    if (filter === "all") return activeEntries;
    return activeEntries.filter((e) => calculateAging(e).status === filter);
  }, [activeEntries, filter]);

  const sorted = useMemo(() => {
    const arr = [...filtered];
    switch (sortMode) {
      case "newest":
        return arr.sort((a, b) => new Date(b.enteredAt).getTime() - new Date(a.enteredAt).getTime());
      case "oldest":
        return arr.sort((a, b) => new Date(a.enteredAt).getTime() - new Date(b.enteredAt).getTime());
      case "weight":
        return arr.sort((a, b) => b.weightKg - a.weightKg);
      case "freshness":
        return arr.sort((a, b) => calculateAging(a).percentage - calculateAging(b).percentage);
      default:
        return arr;
    }
  }, [filtered, sortMode]);

  const byFish = useMemo(() => {
    const map: Record<string, { fishId: string; name: string; totalKg: number; count: number }> = {};
    for (const entry of activeEntries) {
      const fish = getFishById(entry.fishId);
      const name = fish?.localName ?? entry.fishId;
      if (!map[entry.fishId]) map[entry.fishId] = { fishId: entry.fishId, name, totalKg: 0, count: 0 };
      map[entry.fishId].totalKg += entry.weightKg;
      map[entry.fishId].count++;
    }
    return Object.values(map).sort((a, b) => b.totalKg - a.totalKg);
  }, [activeEntries, getFishById]);

  const filters: { key: FilterStatus; label: string }[] = [
    { key: "all", label: "Semua" },
    { key: "fresh", label: "Segar" },
    { key: "warning", label: "Perhatian" },
    { key: "critical", label: "Kritis" },
  ];

  if (activeEntries.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-20">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#E5E2E1]">
          <IconBox />
        </div>
        <p className="text-center text-lg font-bold text-[#1C1B1B]">
          Belum ada stok di cold storage
        </p>
        <p className="text-center text-sm text-[#444748]">
          Mulai catat ikan masuk untuk melihat stok.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col px-4 md:px-0 pt-4 pb-24 gap-4">
      <h1
        className="text-[32px] font-bold text-[#1C1B1B] leading-[38.4px] tracking-[-0.8px]"
        style={{ fontFamily: "Helvetica, Arial, sans-serif" }}
      >
        Stok Cold Storage
      </h1>

      <div className="flex gap-2 overflow-x-auto hide-scrollbar py-2">
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`shrink-0 h-10 px-4 rounded-xl text-sm font-bold tracking-[0.28px] transition-all ${
              filter === f.key
                ? "bg-[#0E0F0F] text-white"
                : "bg-[#EBE7E7] text-[#444748]"
            }`}
            style={{
              fontFamily: "Helvetica, Arial, sans-serif",
              boxShadow: filter === f.key
                ? "0px 2px 2px rgba(0,0,0,0.1), 0px 8px 8px rgba(0,0,0,0.08), 0px 15px 17.5px rgba(0,0,0,0.05)"
                : "0px 1px 1px rgba(0,0,0,0.05), 0px 4px 4px rgba(0,0,0,0.05), 0px 10px 10px rgba(0,0,0,0.03)",
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4 pt-2">
        {byFish.slice(0, 4).map(({ fishId, name, totalKg }, idx) => (
          <SummaryCard
            key={fishId}
            name={name}
            totalKg={totalKg}
            icon={idx % 2 === 0 ? "box" : "fish"}
          />
        ))}
      </div>

      <div className="flex items-center justify-between pt-4">
        <h2
          className="text-2xl font-bold text-[#1C1B1B] leading-[28.8px] tracking-[-0.24px]"
          style={{ fontFamily: "Helvetica, Arial, sans-serif" }}
        >
          Detail Inventaris
        </h2>
        <div className="relative">
          <button
            onClick={() => setShowSortMenu(!showSortMenu)}
            className="flex items-center gap-1 text-sm font-bold text-[#444748] tracking-[0.28px]"
            style={{ fontFamily: "Helvetica, Arial, sans-serif" }}
          >
            Urutkan
            <IconSort />
          </button>
          {showSortMenu && (
            <div
              className="absolute right-0 top-8 z-10 bg-white rounded-lg py-1 min-w-[160px]"
              style={{ boxShadow: "0px 4px 12px rgba(0,0,0,0.12), 0px 1px 3px rgba(0,0,0,0.08)" }}
            >
              {([
                { key: "newest", label: "Terbaru" },
                { key: "oldest", label: "Terlama" },
                { key: "weight", label: "Berat" },
                { key: "freshness", label: "Kesegaran" },
              ] as { key: SortMode; label: string }[]).map((s) => (
                <button
                  key={s.key}
                  onClick={() => { setSortMode(s.key); setShowSortMenu(false); }}
                  className={`w-full text-left px-4 py-2.5 text-sm ${
                    sortMode === s.key ? "font-bold text-[#1C1B1B] bg-[#F5F3F2]" : "text-[#444748]"
                  }`}
                  style={{ fontFamily: "Helvetica, Arial, sans-serif" }}
                >
                  {s.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-4 md:grid md:grid-cols-2 lg:grid-cols-3">
        {sorted.map((entry) => (
          <InventoryCard key={entry.id} entry={entry} getFishById={getFishById} />
        ))}
      </div>
    </div>
  );
}

function SummaryCard({ name, totalKg, icon }: { name: string; totalKg: number; icon: "box" | "fish" }) {
  return (
    <div
      className="bg-white rounded-lg p-4 flex flex-col justify-between min-h-[163px]"
      style={{ boxShadow: "0px 1px 1px rgba(0,0,0,0.05), 0px 4px 4px rgba(0,0,0,0.05), 0px 10px 10px rgba(0,0,0,0.03)" }}
    >
      <div className="flex items-start justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F1EDEC]">
          {icon === "box" ? <IconBox /> : <IconFish />}
        </div>
        <span
          className="text-xs text-[#444748] bg-[#F1EDEC] px-2 py-[3.5px]"
          style={{ fontFamily: "Helvetica, Arial, sans-serif" }}
        >
          {name}
        </span>
      </div>
      <div className="flex flex-col gap-1">
        <p
          className="text-[32px] font-bold text-[#1C1B1B] leading-[38.4px] tracking-[-0.64px]"
          style={{ fontFamily: "Helvetica, Arial, sans-serif" }}
        >
          {Math.round(totalKg)}
        </p>
        <p
          className="text-xs text-[#444748] uppercase tracking-[0.6px] leading-[14.4px]"
          style={{ fontFamily: "Helvetica, Arial, sans-serif" }}
        >
          KG
        </p>
      </div>
    </div>
  );
}

function InventoryCard({
  entry,
  getFishById,
}: {
  entry: StockEntry;
  getFishById: (id: string) => { localName: string; category: string } | undefined;
}) {
  const [expanded, setExpanded] = useState(false);
  const fish = getFishById(entry.fishId);
  const aging = calculateAging(entry);
  const currentRole = useFishStore((s) => s.currentRole);
  const markForExit = useFishStore((s) => s.markForExit);
  const unmarkForExit = useFishStore((s) => s.unmarkForExit);

  const statusConfig = {
    fresh: { label: "OPTIMAL", badgeBg: "#0E0F0F", badgeText: "#FFFFFF", barBg: "#F1EDEC", barColor: "#0E0F0F", tempColor: "#444748", tempWeight: "normal" as const },
    warning: { label: "PERHATIAN", badgeBg: "#E5E2E1", badgeText: "#444748", barBg: "#F1EDEC", barColor: "#747878", tempColor: "#444748", tempWeight: "normal" as const },
    critical: { label: "KRITIS", badgeBg: "#BA1A1A", badgeText: "#FFFFFF", barBg: "#FFDAD6", barColor: "#BA1A1A", tempColor: "#BA1A1A", tempWeight: "bold" as const },
  };
  const config = statusConfig[aging.status];

  const freshnessPercent = Math.max(100 - aging.percentage, 0);
  const isCritical = aging.status === "critical";

  const entryDate = new Date(entry.enteredAt);
  const formattedDate = entryDate.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });

  const handleToggleMark = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (entry.markedForExit) {
      unmarkForExit(entry.id);
    } else if (currentRole) {
      markForExit(entry.id, currentRole);
    }
  };

  return (
    <div
      onClick={() => currentRole === "pemilik" && setExpanded(!expanded)}
      className={`w-full bg-white rounded p-4 flex flex-col gap-3 ${
        isCritical ? "border-l-4 border-l-[#BA1A1A] pl-5" : ""
      } ${currentRole === "pemilik" ? "cursor-pointer active:scale-[0.99] transition-transform" : ""}`}
      style={{ boxShadow: "0px 1px 1px rgba(0,0,0,0.05), 0px 4px 4px rgba(0,0,0,0.05), 0px 10px 10px rgba(0,0,0,0.03)" }}
    >
      <div className="flex justify-between items-start">
        <div className="flex flex-col gap-1">
          <p
            className="text-xl font-bold text-[#1C1B1B] leading-[25px]"
            style={{ fontFamily: "Helvetica, Arial, sans-serif" }}
          >
            {fish?.localName ?? entry.fishId} Grade {entry.grade}
          </p>
          <p
            className="text-xs text-[#444748] leading-[14.4px]"
            style={{ fontFamily: "Helvetica, Arial, sans-serif" }}
          >
            {entry.qrCode} • {entry.enteredByName || (entry.enteredBy === "admin_gudang" ? "Admin" : "Pemilik")}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span
            className="shrink-0 px-2 py-1 text-[10px] font-bold uppercase tracking-[1px] leading-[15px]"
            style={{
              backgroundColor: config.badgeBg,
              color: config.badgeText,
              boxShadow: "0px 1px 1px rgba(0,0,0,0.05)",
            }}
          >
            {config.label}
          </span>
          {entry.markedForExit && (
            <span className="text-[10px] font-bold text-[#F59E0B] uppercase tracking-[0.5px]">
              DITANDAI
            </span>
          )}
        </div>
      </div>

      <div className="flex justify-between items-end h-[29px]">
        <div className="flex items-end gap-1 tracking-[-0.24px] pb-px">
          <span
            className="text-2xl font-bold text-[#1C1B1B] leading-[28.8px]"
            style={{ fontFamily: "Helvetica, Arial, sans-serif" }}
          >
            {entry.weightKg.toFixed(1)}
          </span>
          <span
            className="text-base text-[#444748] leading-6"
            style={{ fontFamily: "Helvetica, Arial, sans-serif" }}
          >
            KG
          </span>
        </div>
        <div className="pb-1 text-right">
          <p
            className="text-xs leading-[14.4px]"
            style={{
              fontFamily: "Helvetica, Arial, sans-serif",
              color: config.tempColor,
              fontWeight: config.tempWeight,
            }}
          >
            {formattedDate}
          </p>
        </div>
      </div>

      <div className="pt-1">
        <div
          className="w-full h-2 overflow-hidden rounded-xl"
          style={{ backgroundColor: config.barBg }}
        >
          <div
            className={`h-full rounded-xl transition-all duration-500 ${isCritical ? "freshness-critical" : ""}`}
            style={{
              width: `${Math.max(freshnessPercent, 2)}%`,
              backgroundColor: config.barColor,
            }}
          />
        </div>
      </div>

      {currentRole === "pemilik" && (
        <div
          className="grid transition-all duration-300 ease-in-out"
          style={{ gridTemplateRows: expanded ? "1fr" : "0fr" }}
        >
          <div className="overflow-hidden">
            <button
              onClick={handleToggleMark}
              className={`w-full py-2.5 mt-1 rounded-lg text-[13px] font-bold text-white transition-all duration-200 active:scale-[0.97] ${
                entry.markedForExit
                  ? "bg-[#BA1A1A]"
                  : "bg-[#F59E0B]"
              }`}
            >
              {entry.markedForExit ? "Batalkan Tandai" : "Tandai Untuk Dikeluarkan"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
