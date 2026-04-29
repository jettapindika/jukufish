"use client";

import { useOnlineStatus } from "@/hooks/use-online-status";
import { useFishStore } from "@/lib/store";
import { RefreshCw, Wifi } from "lucide-react";

export function OnlineBadge() {
  const isOnline = useOnlineStatus();
  const syncState = useFishStore((s) => s.syncState);
  const pendingCount = useFishStore((s) => s.getPendingCount());

  if (!isOnline) {
    return (
      <div className="flex items-center gap-1">
        <div className="w-2 h-2 rounded-full bg-gray-400" />
        <span className="text-sm font-normal text-gray-500">
          Offline{pendingCount > 0 ? ` · ${pendingCount}` : ""}
        </span>
      </div>
    );
  }

  if (syncState === "syncing") {
    return (
      <div className="flex items-center gap-1">
        <RefreshCw className="w-4 h-4 text-[#10B981] animate-spin" />
        <span className="text-base font-normal text-[#10B981]">Syncing...</span>
      </div>
    );
  }

  if (syncState === "error") {
    return (
      <div className="flex items-center gap-1">
        <div className="w-2 h-2 rounded-full bg-[var(--color-warning)]" />
        <span className="text-sm font-normal text-[var(--color-warning)]">
          Error{pendingCount > 0 ? ` · ${pendingCount}` : ""}
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <Wifi className="w-4 h-4 text-[#10B981]" />
      <span className="text-base font-normal text-[#10B981]">
        Online
      </span>
    </div>
  );
}
