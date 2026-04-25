"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { AlertTriangle, ChevronDown } from "lucide-react";
import { useFishStore } from "@/lib/store";
import { calculateAging } from "@/lib/aging";
import { getFishById } from "@/lib/fish-data";
import type { StockEntry } from "@/lib/types";
import type { FreshnessStatus } from "@/lib/aging";

const STATUS_COLORS: Record<FreshnessStatus, string> = {
  fresh: "#10B981",
  warning: "#F59E0B",
  critical: "#BA1A1A",
};

const STATUS_LABELS: Record<FreshnessStatus, string> = {
  fresh: "SEGAR",
  warning: "PERHATIAN",
  critical: "KRITIS",
};

const FILTER_OPTIONS: { key: "all" | FreshnessStatus; label: string }[] = [
  { key: "all", label: "Semua" },
  { key: "fresh", label: "Segar" },
  { key: "warning", label: "Perhatian" },
  { key: "critical", label: "Kritis" },
];

export default function DashboardPage() {
  const entries = useFishStore((s) => s.entries);
  const getActiveEntries = useFishStore((s) => s.getActiveEntries);
  const markForExit = useFishStore((s) => s.markForExit);
  const unmarkForExit = useFishStore((s) => s.unmarkForExit);
  const currentRole = useFishStore((s) => s.currentRole);
  const shelfLifeOverrides = useFishStore((s) => s.shelfLifeOverrides);
  const getShelfLifeHours = useFishStore((s) => s.getShelfLifeHours);
  const customFish = useFishStore((s) => s.customFish);

  const [filter, setFilter] = useState<"all" | FreshnessStatus>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 60_000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const { supabase } = await import("@/lib/supabase");
        const { data } = await supabase
          .from("stock_entries")
          .select("id, marked_for_exit, marked_by");
        if (data) {
          const store = useFishStore.getState();
          let updated = false;
          const updatedEntries = store.entries.map((e) => {
            const remote = data.find(
              (r: { id: string }) => r.id === e.id
            );
            if (
              remote &&
              remote.marked_for_exit !== (e.markedForExit ?? false)
            ) {
              updated = true;
              return {
                ...e,
                markedForExit: remote.marked_for_exit,
                markedBy: remote.marked_by,
              };
            }
            return e;
          });
          if (updated) useFishStore.setState({ entries: updatedEntries });
        }
      } catch {
      }
    })();
  }, []);

  const activeEntries = useMemo(() => getActiveEntries(), [entries, getActiveEntries]);

  const stats = useMemo(() => {
    let totalKg = 0;
    let freshCount = 0;
    let warningCount = 0;
    let criticalCount = 0;

    for (const entry of activeEntries) {
      const fish = getFishById(entry.fishId, customFish);
      const override = fish
        ? getShelfLifeHours(fish.id, fish.defaultShelfLifeHours)
        : undefined;
      const aging = calculateAging(entry, override);
      totalKg += entry.weightKg;
      if (aging.status === "fresh") freshCount++;
      else if (aging.status === "warning") warningCount++;
      else criticalCount++;
    }

    return {
      totalStok: activeEntries.length,
      totalKg: Math.round(totalKg * 10) / 10,
      fresh: freshCount,
      warning: warningCount,
      critical: criticalCount,
    };
  }, [activeEntries, customFish, getShelfLifeHours, tick]);

  const filteredEntries = useMemo(() => {
    if (filter === "all") return activeEntries;
    return activeEntries.filter((entry) => {
      const fish = getFishById(entry.fishId, customFish);
      const override = fish
        ? getShelfLifeHours(fish.id, fish.defaultShelfLifeHours)
        : undefined;
      const aging = calculateAging(entry, override);
      return aging.status === filter;
    });
  }, [activeEntries, filter, customFish, getShelfLifeHours, tick]);

  const handleToggleExpand = useCallback((id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  }, []);

  const handleMarkForExit = useCallback(
    (entryId: string) => {
      if (currentRole) markForExit(entryId, currentRole);
    },
    [currentRole, markForExit]
  );

  return (
    <div className="flex flex-col" style={{ gap: 8 }}>
      {stats.critical > 0 && (
        <div
          className="flex items-start"
          style={{
            backgroundColor: "#BA1A1A",
            borderRadius: 8,
            padding: 16,
            gap: 21,
          }}
        >
          <AlertTriangle
            size={22}
            color="#FFFFFF"
            strokeWidth={2}
            style={{ flexShrink: 0, marginTop: 1 }}
          />
          <div className="flex flex-col" style={{ gap: 2 }}>
            <span
              style={{
                fontSize: 14,
                fontWeight: 700,
                color: "#FFFFFF",
              }}
            >
              Peringatan! Ada stok kritis.
            </span>
            <span
              style={{
                fontSize: 12,
                fontWeight: 400,
                color: "#FFFFFF",
              }}
            >
              Ada stok kritis, segera ambil tindakan secepatnya!
            </span>
          </div>
        </div>
      )}

      <div
        className="grid grid-cols-2"
        style={{ gap: 8 }}
      >
        <StatCard
          label="Total Stok"
          value={stats.totalStok}
          borderColor="#1C1B1B"
        />
        <StatCard
          label="Segar"
          value={stats.fresh}
          borderColor="#10B981"
        />
        <StatCard
          label="Perhatian"
          value={stats.warning}
          borderColor="#F59E0B"
        />
        <StatCard
          label="Kritis"
          value={stats.critical}
          borderColor="#BA1A1A"
          isCritical
        />
      </div>

      <div
        className="flex overflow-x-auto"
        style={{
          gap: 8,
          paddingBottom: 2,
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        }}
      >
        {FILTER_OPTIONS.map((opt) => (
          <button
            key={opt.key}
            type="button"
            onClick={() => setFilter(opt.key)}
            className="flex-shrink-0"
            style={{
              backgroundColor: filter === opt.key ? "#0E0F0F" : "#FFFFFF",
              color: filter === opt.key ? "#FFFFFF" : "#0E0F0F",
              borderRadius: 12,
              paddingTop: filter === opt.key ? 8.5 : 8,
              paddingBottom: filter === opt.key ? 9.3 : 8,
              paddingLeft: 16,
              paddingRight: 16,
              fontSize: 14,
              fontWeight: 700,
              border: "none",
              boxShadow:
                filter === opt.key
                  ? "none"
                  : "rgba(34,42,53,0.08) 0px 0px 0px 1px, rgba(34,42,53,0.05) 0px 2px 4px 0px",
            }}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <div style={{ marginTop: 8 }}>
        <h2
          style={{
            fontSize: 20,
            fontWeight: 700,
            color: "#1C1B1B",
            marginBottom: 4,
          }}
        >
          Ringkasan Stok
        </h2>
      </div>

      <div className="flex flex-col" style={{ gap: 8 }}>
        {filteredEntries.map((entry) => (
          <StockCard
            key={entry.id}
            entry={entry}
            customFish={customFish}
            getShelfLifeHours={getShelfLifeHours}
            expanded={expandedId === entry.id}
            onToggle={handleToggleExpand}
            onMark={handleMarkForExit}
            onUnmark={unmarkForExit}
          />
        ))}

        {filteredEntries.length === 0 && (
          <div
            className="flex items-center justify-center"
            style={{
              padding: 32,
              color: "#5D5F5F",
              fontSize: 14,
            }}
          >
            {filter === "all"
              ? "Belum ada stok tercatat."
              : `Tidak ada stok dengan status "${FILTER_OPTIONS.find((o) => o.key === filter)?.label}".`}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  borderColor,
  isCritical,
}: {
  label: string;
  value: number;
  borderColor: string;
  isCritical?: boolean;
}) {
  return (
    <div
      style={{
        backgroundColor: "#FFFFFF",
        padding: 16,
        borderLeft: `4px solid ${borderColor}`,
        boxShadow:
          "rgba(34,42,53,0.08) 0px 0px 0px 1px, rgba(34,42,53,0.05) 0px 2px 4px 0px",
      }}
    >
      <div className="flex flex-col" style={{ gap: 4 }}>
        <span
          style={{
            fontSize: 12,
            fontWeight: 400,
            color: isCritical ? "#BA1A1A" : "#5D5F5F",
          }}
        >
          {label}
        </span>
        <span
          style={{
            fontSize: 32,
            fontWeight: 700,
            color: isCritical ? "#BA1A1A" : "#1C1B1B",
            lineHeight: 1,
          }}
        >
          {value}
        </span>
      </div>
    </div>
  );
}

function StockCard({
  entry,
  customFish,
  getShelfLifeHours,
  expanded,
  onToggle,
  onMark,
  onUnmark,
}: {
  entry: StockEntry;
  customFish: import("@/lib/types").FishType[];
  getShelfLifeHours: (fishId: string, defaultHours: number) => number;
  expanded: boolean;
  onToggle: (id: string) => void;
  onMark: (id: string) => void;
  onUnmark: (id: string) => void;
}) {
  const fish = getFishById(entry.fishId, customFish);
  const override = fish
    ? getShelfLifeHours(fish.id, fish.defaultShelfLifeHours)
    : undefined;
  const aging = calculateAging(entry, override);
  const statusColor = STATUS_COLORS[aging.status];
  const statusLabel = STATUS_LABELS[aging.status];
  const fishName = fish?.localName ?? entry.fishId;
  const batchId = entry.id.slice(-4).toUpperCase();
  const remainingLabel = formatRemaining(aging.remainingHours);
  const barPercent = Math.max(0, Math.min(100, 100 - aging.percentage));

  return (
    <div
      style={{
        backgroundColor: "#FFFFFF",
        padding: 16,
        borderLeft: `4px solid ${statusColor}`,
        boxShadow:
          "rgba(34,42,53,0.08) 0px 0px 0px 1px, rgba(34,42,53,0.05) 0px 2px 4px 0px",
      }}
    >
      <div className="flex flex-col" style={{ gap: 12 }}>
        <div className="flex items-start justify-between">
          <div className="flex flex-col" style={{ gap: 4 }}>
            <div className="flex items-center" style={{ gap: 8 }}>
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  backgroundColor: statusColor,
                  flexShrink: 0,
                }}
              />
              <span
                style={{
                  fontSize: 20,
                  fontWeight: 700,
                  color: "#1C1B1B",
                }}
              >
                {fishName}
              </span>
            </div>
            <span
              style={{
                fontSize: 12,
                fontWeight: 400,
                color: "#5D5F5F",
                paddingLeft: 16,
              }}
            >
              Batch: #TL-{batchId} &middot; Grade {entry.grade}
            </span>
          </div>

          <span
            style={{
              backgroundColor: statusColor,
              color: "#FFFFFF",
              fontSize: 12,
              fontWeight: 700,
              paddingTop: 3.5,
              paddingBottom: 3.5,
              paddingLeft: 8,
              paddingRight: 8,
              borderRadius: 4,
              flexShrink: 0,
              textTransform: "uppercase",
            }}
          >
            {statusLabel}
          </span>
        </div>

        <div className="flex flex-col" style={{ gap: 4 }}>
          <div className="flex items-center justify-between">
            <span
              style={{
                fontSize: 12,
                fontWeight: 400,
                color: "#5D5F5F",
              }}
            >
              Sisa Waktu Segar
            </span>
            <span
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: statusColor,
              }}
            >
              {remainingLabel}
            </span>
          </div>
          <div
            style={{
              height: 8,
              backgroundColor: "#E5E2E1",
              borderRadius: 12,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${barPercent}%`,
                backgroundColor: statusColor,
                borderRadius: 12,
                transition: "width 0.3s ease",
              }}
            />
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span
            style={{
              fontSize: 20,
              fontWeight: 700,
              color: "#1C1B1B",
            }}
          >
            {entry.weightKg} KG
          </span>

          <button
            type="button"
            onClick={() => onToggle(entry.id)}
            style={{
              backgroundColor: "#0E0F0F",
              color: "#FFFFFF",
              fontSize: 12,
              fontWeight: 700,
              paddingTop: 8,
              paddingBottom: 8,
              paddingLeft: 16,
              paddingRight: 16,
              borderRadius: 4,
              border: "none",
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            Tindakan
            <ChevronDown
              size={14}
              color="#FFFFFF"
              strokeWidth={2}
              style={{
                transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
                transition: "transform 0.2s ease",
              }}
            />
          </button>
        </div>

        {expanded && (
          <div
            className="flex flex-col"
            style={{
              gap: 8,
              paddingTop: 8,
              borderTop: "1px solid #E5E2E1",
            }}
          >
            <div
              className="flex items-center justify-between"
              style={{ fontSize: 12, color: "#5D5F5F" }}
            >
              <span>Masuk: {formatDate(entry.enteredAt)}</span>
              {entry.enteredByName && (
                <span>Oleh: {entry.enteredByName}</span>
              )}
            </div>

            {entry.markedForExit ? (
              <button
                type="button"
                onClick={() => onUnmark(entry.id)}
                style={{
                  width: "100%",
                  padding: "10px 16px",
                  backgroundColor: "#FFFFFF",
                  color: "#BA1A1A",
                  fontSize: 12,
                  fontWeight: 700,
                  borderRadius: 4,
                  border: "1px solid #BA1A1A",
                }}
              >
                Batalkan Tandai Keluar
              </button>
            ) : (
              <button
                type="button"
                onClick={() => onMark(entry.id)}
                style={{
                  width: "100%",
                  padding: "10px 16px",
                  backgroundColor: "#BA1A1A",
                  color: "#FFFFFF",
                  fontSize: 12,
                  fontWeight: 700,
                  borderRadius: 4,
                  border: "none",
                }}
              >
                Tandai untuk Keluar
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function formatRemaining(hours: number): string {
  if (hours <= 0) return "Habis";
  if (hours < 1) {
    const mins = Math.floor(hours * 60);
    return `${mins} Menit`;
  }
  if (hours < 24) {
    return `${Math.floor(hours)} Jam`;
  }
  const days = Math.floor(hours / 24);
  const rem = Math.floor(hours % 24);
  if (rem === 0) return `${days} Hari`;
  return `${days} Hari ${rem} Jam`;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  const day = d.getDate().toString().padStart(2, "0");
  const month = (d.getMonth() + 1).toString().padStart(2, "0");
  const year = d.getFullYear();
  const hours = d.getHours().toString().padStart(2, "0");
  const minutes = d.getMinutes().toString().padStart(2, "0");
  return `${day}/${month}/${year} ${hours}:${minutes}`;
}
