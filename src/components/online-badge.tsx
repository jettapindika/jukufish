"use client";

import { useOnlineStatus } from "@/hooks/use-online-status";
import { useFishStore } from "@/lib/store";
import { RefreshCw } from "lucide-react";

export function OnlineBadge() {
  const isOnline = useOnlineStatus();
  const syncState = useFishStore((s) => s.syncState);
  const pendingCount = useFishStore((s) => s.getPendingCount());

  if (!isOnline) {
    return (
      <div className="flex items-center gap-1.5">
        <div className="w-2 h-2 rounded-full bg-gray-400" />
        <span className="text-xs font-medium text-gray-500">
          Offline{pendingCount > 0 ? ` · ${pendingCount} tertunda` : ""}
        </span>
      </div>
    );
  }

  if (syncState === "syncing") {
    return (
      <div className="flex items-center gap-1.5">
        <RefreshCw className="w-3 h-3 text-[var(--color-primary)] animate-spin" />
        <span className="text-xs font-medium text-[var(--color-primary)]">Menyinkronkan...</span>
      </div>
    );
  }

  if (syncState === "error") {
    return (
      <div className="flex items-center gap-1.5">
        <div className="w-2 h-2 rounded-full bg-[var(--color-warning)]" />
        <span className="text-xs font-medium text-[var(--color-warning)]">
          Gagal sync{pendingCount > 0 ? ` · ${pendingCount} tertunda` : ""}
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5">
      <div className="w-2 h-2 rounded-full bg-[var(--color-fresh)]" />
      <span className="text-xs font-medium text-gray-500">
        {pendingCount > 0 ? `${pendingCount} tertunda` : "Tersinkronisasi"}
      </span>
    </div>
  );
}
