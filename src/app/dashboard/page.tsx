"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, Plus, ArrowRight } from "lucide-react";
import { useFishStore } from "@/lib/store";
import { calculateAging, formatElapsed } from "@/lib/aging";
import { getFishById } from "@/lib/fish-data";
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
    let todayKg = 0;

    for (const entry of activeEntries) {
      totalKg += entry.weightKg;
      const aging = calculateAging(entry);
      if (aging.status === "fresh") fresh++;
      else if (aging.status === "warning") warning++;
      else critical++;
      if (new Date(entry.enteredAt).toDateString() === today) {
        todayCount++;
        todayKg += entry.weightKg;
      }
    }

    return { totalKg, fresh, warning, critical, todayCount, todayKg, total: activeEntries.length };
  }, [activeEntries]);

  const userName = currentUser?.name?.split(" ")[0] ?? "User";

  if (currentRole === "admin_gudang") {
    return <AdminDashboard stats={stats} markedCount={markedCount} userName={userName} activeEntries={activeEntries} />;
  }

  return (
    <OwnerDashboard stats={stats} activeEntries={activeEntries} userName={userName} />
  );
}

interface Stats {
  totalKg: number;
  fresh: number;
  warning: number;
  critical: number;
  todayCount: number;
  todayKg: number;
  total: number;
}

function getTimeGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Pagi";
  if (hour < 17) return "Siang";
  return "Malam";
}

function AdminDashboard({ stats, markedCount, userName, activeEntries }: { stats: Stats; markedCount: number; userName: string; activeEntries: StockEntry[] }) {
  const recentEntries = useMemo(() => {
    return [...activeEntries]
      .sort((a, b) => new Date(b.enteredAt).getTime() - new Date(a.enteredAt).getTime())
      .slice(0, 5);
  }, [activeEntries]);

  return (
    <div className="flex flex-col px-4 pt-[23px] pb-4 gap-6">
      <div>
        <h2 className="text-2xl font-bold text-[#1C1B1B]">
          {getTimeGreeting()}, {userName}!
        </h2>
        <p className="text-base font-normal text-[#444748] mt-1">
          Ringkasan operasional gudang.
        </p>
      </div>

      {stats.critical > 0 && (
        <div className="flex items-center gap-5 rounded-[8px] bg-[#BA1A1A] p-4 h-[82px]">
          <svg width="22" height="20" viewBox="0 0 22 20" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
            <path d="M11 0L0.5 19H21.5L11 0ZM10 16V14H12V16H10ZM10 12V8H12V12H10Z" fill="white"/>
          </svg>
          <div>
            <p className="font-bold text-white leading-tight" style={{fontSize: '14px'}}>
              Peringatan! Ada stok kritis.
            </p>
            <p className="text-white mt-0.5" style={{fontSize: '11px'}}>
              Ada {stats.critical} stok butuh tindakan segera.
            </p>
          </div>
        </div>
      )}

      <Link
        href="/dashboard/catat-masuk"
        className="flex h-14 w-full items-center justify-center gap-2 rounded-[12px] bg-[#0E0F0F] text-sm font-bold text-[#FDF8F8] active:scale-[0.98] transition-all"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M6 8H0V6H6V0H8V6H14V8H8V14H6V8Z" fill="#FDF8F8"/>
        </svg>
        Catat Ikan Masuk
      </Link>

      <div className="grid grid-cols-2 gap-2">
        <BentoCard label="TOTAL STOK" value={(stats.totalKg / 1000).toFixed(1)} unit="Ton" />
        <BentoCard label="MASUK HARI INI" value={String(stats.todayKg)} unit="Kg" />
      </div>

      <div
        className="flex items-center justify-between rounded-lg bg-white p-4 h-[76px] shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]"
      >
        <div>
          <p className="text-xs font-normal text-[#444748] uppercase">Stok perlu dikeluarkan</p>
          <p className="text-lg font-bold text-[#1C1B1B] mt-1">{markedCount} Pengiriman</p>
        </div>
        <Link
          href="/dashboard/catat-keluar"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-[#E5E2E1]"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12.175 9H0V7H12.175L6.575 1.4L8 0L16 8L8 16L6.575 14.6L12.175 9Z" fill="#1C1B1B"/>
          </svg>
        </Link>
      </div>

      <div className="flex flex-col gap-3">
        <p className="text-xs font-normal text-[#444748] uppercase tracking-wider">
          AKTIVITAS TERAKHIR
        </p>

        {recentEntries.length === 0 ? (
          <p className="py-4 text-center text-sm text-[#444748]">Belum ada aktivitas</p>
        ) : (
          recentEntries.map((entry) => {
            const fish = getFishById(entry.fishId);
            const isIncoming = entry.type === 'entry';
            return (
              <ActivityItem
                key={entry.id}
                name={fish?.localName ?? entry.fishId}
                detail={`Batch #${entry.qrCode?.slice(-3) ?? "000"} • ${isIncoming ? "Masuk" : "Keluar"}`}
                weight={`${isIncoming ? "+" : "-"}${entry.weightKg} Kg`}
                iconType={isIncoming ? "masuk" : "keluar"}
              />
            );
          })
        )}
      </div>
    </div>
  );
}

function BentoCard({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <div
      className="rounded-lg bg-white p-4 h-[94px] flex flex-col justify-between shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]"
    >
      <p className="text-xs font-normal text-[#444748] uppercase">{label}</p>
      <div className="flex items-baseline gap-1">
        <span className="text-[32px] font-bold leading-none text-[#1C1B1B]">{value}</span>
        <span className="text-base font-normal text-[#444748]">{unit}</span>
      </div>
    </div>
  );
}

function ActivityItem({ name, detail, weight, iconType }: { name: string; detail: string; weight: string; iconType: "masuk" | "keluar" }) {
  return (
    <div
      className="flex items-center gap-4 rounded-lg bg-white p-4 h-20 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]"
    >
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#E5E2E1]">
        {iconType === "masuk" ? (
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3 20C2.45 20 1.97917 19.8042 1.5875 19.4125C1.19583 19.0208 1 18.55 1 18V6.725C0.7 6.54167 0.458333 6.30417 0.275 6.0125C0.0916667 5.72083 0 5.38333 0 5V2C0 1.45 0.195833 0.979167 0.5875 0.5875C0.979167 0.195833 1.45 0 2 0H18C18.55 0 19.0208 0.195833 19.4125 0.5875C19.8042 0.979167 20 1.45 20 2V5C20 5.38333 19.9083 5.72083 19.725 6.0125C19.5417 6.30417 19.3 6.54167 19 6.725V18C19 18.55 18.8042 19.0208 18.4125 19.4125C18.0208 19.8042 17.55 20 17 20H3ZM3 7V18H17V7H3ZM2 5H18V2H2V5ZM7 12H13V10H7V12Z" fill="#444748"/>
          </svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M8 11V6.85L6.4 8.45L5 7L9 3L13 7L11.6 8.45L10 6.85V11H8ZM2 17C1.45 17 0.979167 16.8042 0.5875 16.4125C0.195833 16.0208 0 15.55 0 15V2C0 1.45 0.195833 0.979167 0.5875 0.5875C0.979167 0.195833 1.45 0 2 0H16C16.55 0 17.0208 0.195833 17.4125 0.5875C17.8042 0.979167 18 1.45 18 2V15C18 15.55 17.8042 16.0208 17.4125 16.4125C17.0208 16.8042 16.55 17 16 17H2ZM2 15H16V12H13C12.5 12.6333 11.9042 13.125 11.2125 13.475C10.5208 13.825 9.78333 14 9 14C8.21667 14 7.47917 13.825 6.7875 13.475C6.09583 13.125 5.5 12.6333 5 12H2V15Z" fill="#444748"/>
          </svg>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-[#1C1B1B]">{name}</p>
        <p className="text-xs font-normal text-[#444748]">{detail}</p>
      </div>
      <p className="text-sm font-bold text-[#1C1B1B] shrink-0">{weight}</p>
    </div>
  );
}

function OwnerDashboard({ stats, activeEntries, userName }: { stats: Stats; activeEntries: StockEntry[]; userName: string }) {
  const [activeFilter, setActiveFilter] = useState<"all" | "fresh" | "warning" | "critical">("all");
  const markForExit = useFishStore((s) => s.markForExit);
  const unmarkForExit = useFishStore((s) => s.unmarkForExit);
  const currentRole = useFishStore((s) => s.currentRole);

  const filteredEntries = useMemo(() => {
    if (activeFilter === "all") return activeEntries;
    return activeEntries.filter((entry) => calculateAging(entry).status === activeFilter);
  }, [activeEntries, activeFilter]);

  return (
    <div className="p-4 min-h-full">
      <div className="space-y-4">
        {stats.critical > 0 && <AlertCard />}
        <StatGrid stats={stats} />
        <FilterChips activeFilter={activeFilter} setActiveFilter={setActiveFilter} />

        <div>
          <h2 className="text-xl font-bold text-[#1C1B1B] mt-2 mb-3">
            Ringkasan Stok
          </h2>
          <div className="flex flex-col gap-2">
            {filteredEntries.length > 0 ? (
              filteredEntries.map((entry) => {
                const fish = getFishById(entry.fishId);
                const aging = calculateAging(entry);
                return (
                  <NewStockCard
                    key={entry.id}
                    name={fish?.localName ?? entry.fishId}
                    batchInfo={`Batch: ${entry.qrCode ?? "#000"} • Rak 3`}
                    status={aging.status as 'fresh' | 'warning' | 'critical'}
                    timeRemaining={formatElapsed(aging.remainingHours)}
                    freshnessPercent={100 - aging.percentage}
                    weightKg={entry.weightKg}
                    enteredAt={entry.enteredAt}
                    enteredByName={entry.enteredByName}
                    isMarked={entry.markedForExit}
                    onToggleMark={() => {
                      if (entry.markedForExit) {
                        unmarkForExit(entry.id);
                      } else if (currentRole) {
                        markForExit(entry.id, currentRole);
                      }
                    }}
                  />
                );
              })
            ) : (
              <p className="py-10 text-center text-sm text-gray-500">Tidak ada stok untuk filter ini.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const StatGrid = ({ stats }: { stats: Stats }) => (
  <div className="grid grid-cols-2 gap-2 w-full">
    <StatCard label="Total Stok" value={String(stats.total)} borderColor="#242424" labelColor="#444748" valueColor="#1C1B1B" />
    <StatCard label="Segar" value={String(stats.fresh)} borderColor="#10B981" labelColor="#10B981" valueColor="#10B981" />
    <StatCard label="Perhatian" value={String(stats.warning)} borderColor="#F59E0B" labelColor="#F59E0B" valueColor="#F59E0B" />
    <StatCard label="Kritis" value={String(stats.critical)} borderColor="#BA1A1A" labelColor="#BA1A1A" valueColor="#BA1A1A" />
  </div>
);

const FilterChips = ({ activeFilter, setActiveFilter }: { activeFilter: string; setActiveFilter: (filter: "all" | "fresh" | "warning" | "critical") => void; }) => {
  const statusFilters = [
    { label: "Semua", value: "all" as const },
    { label: "Segar", value: "fresh" as const },
    { label: "Perhatian", value: "warning" as const },
    { label: "Kritis", value: "critical" as const },
  ];

  return (
    <div className="flex gap-2 overflow-x-auto hide-scrollbar py-3">
      {statusFilters.map((filter) => (
        <button
          key={filter.value}
          onClick={() => setActiveFilter(filter.value)}
          className={`shrink-0 rounded-xl text-sm font-bold transition-colors ${activeFilter === filter.value ? "bg-[#0E0F0F] text-white px-4 py-[8.5px]" : "bg-white text-[#1C1B1B] border border-[#E5E2E1] px-[17px] py-[9px]"}`}>
          {filter.label}
        </button>
      ))}
    </div>
  );
};

const StatCard = ({ label, value, borderColor, labelColor, valueColor }: { label: string; value: string; borderColor: string; labelColor?: string; valueColor?: string }) => (
  <div
    className="h-[90px] bg-white shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] pl-5 pt-4"
    style={{ borderLeft: `3px solid ${borderColor}` }}
  >
    <p className="text-xs font-normal" style={{ color: labelColor ?? "#444748" }}>{label}</p>
    <p className="text-[32px] font-bold leading-none mt-[3px]" style={{ color: valueColor ?? "#1C1B1B" }}>{value}</p>
  </div>
);

const AlertCard = () => (
  <div className="w-full h-[82px] bg-[#BA1A1A] rounded-lg flex items-center px-6 gap-5">
    <svg width="22" height="20" viewBox="0 0 22 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M11 0L0 19.5H22L11 0ZM10 16.5V14H12V16.5H10ZM10 12V7H12V12H10Z" fill="white"/>
    </svg>
    <div>
      <p className="font-bold text-sm text-white">Peringatan! Ada stok kritis.</p>
      <p className="text-xs text-white">Ada stok kritis, segera ambil tindakan secepatnya!</p>
    </div>
  </div>
);

const NewStockCard = ({ name, batchInfo, status, timeRemaining, freshnessPercent, weightKg, enteredAt, enteredByName, isMarked, onToggleMark }: {
  name: string;
  batchInfo: string;
  status: 'fresh' | 'warning' | 'critical';
  timeRemaining: string;
  freshnessPercent: number;
  weightKg: number;
  enteredAt?: string;
  enteredByName?: string;
  isMarked?: boolean;
  onToggleMark?: () => void;
}) => {
  const [expanded, setExpanded] = useState(false);
  const statusConfig = {
    fresh: { dot: '#10B981', bar: '#10B981', badgeBg: '#10B981', label: 'SEGAR' },
    warning: { dot: '#F59E0B', bar: '#F59E0B', badgeBg: '#F59E0B', label: 'PERHATIAN' },
    critical: { dot: '#EF4444', bar: '#EF4444', badgeBg: '#BA1A1A', label: 'KRITIS' },
  };
  const config = statusConfig[status];

  const formattedDate = enteredAt
    ? new Date(enteredAt).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })
    : "-";

  return (
    <div className="w-full bg-white rounded-lg shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] p-4 flex flex-col gap-3">
      <div className="flex justify-between items-start">
        <div className="flex items-start gap-2">
          <div className="w-3 h-3 rounded-full mt-[7px] shrink-0" style={{ backgroundColor: config.dot }} />
          <div>
            <h3 className="text-lg font-bold text-[#1C1B1B] leading-tight">{name}</h3>
            <p className="text-xs text-[#444748] mt-[2px]">{batchInfo}</p>
          </div>
        </div>
        <div className="shrink-0 rounded px-2 py-1 text-xs font-bold text-white" style={{ backgroundColor: config.badgeBg }}>
          {config.label}
        </div>
      </div>

      <div>
        <div className="flex justify-between text-xs mb-1">
          <span className="text-[#444748]">Sisa Waktu Segar</span>
          <span className="font-medium" style={{ color: config.bar }}>{timeRemaining}</span>
        </div>
        <div className="w-full bg-[#E5E2E1] rounded-full h-2">
          <div className="h-2 rounded-full transition-all" style={{ width: `${Math.max(freshnessPercent, 2)}%`, backgroundColor: config.bar }} />
        </div>
      </div>

      <div className="flex justify-between items-center">
        <span className="text-xl font-bold text-[#1C1B1B]">{weightKg} KG</span>
        <button
          onClick={() => setExpanded(!expanded)}
          className="bg-[#0E0F0F] text-white text-sm font-bold py-2 px-4 rounded-lg active:scale-95 transition-transform"
        >
          {expanded ? "Lebih Sedikit" : "Lebih Banyak"}
        </button>
      </div>

      <div
        className="grid transition-all duration-300 ease-in-out"
        style={{ gridTemplateRows: expanded ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
          <div className="flex flex-col gap-3 pt-3 border-t border-[#E5E2E1] mt-1">
            <div className="flex flex-col gap-[2px]">
              <div>
                <p className="text-base font-bold text-[#1C1B1B]">Tanggal Masuk:</p>
                <p className="text-xs text-[#444748]">{formattedDate}</p>
              </div>
              <div className="mt-1">
                <p className="text-base font-bold text-[#1C1B1B]">Admin</p>
                <p className="text-xs text-[#444748]">{enteredByName ?? "-"}</p>
              </div>
            </div>
            <button
              onClick={onToggleMark}
              className="w-full py-2 rounded-lg text-sm font-bold text-white transition-all duration-300 ease-in-out active:scale-[0.97]"
              style={{ backgroundColor: isMarked ? "#BA1A1A" : "#F59E0B" }}
            >
              {isMarked ? "Batalkan Tandai" : "Tandai Untuk Keluarkan Dari Stok"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
