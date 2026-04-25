"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Wifi } from "lucide-react";
import { useFishStore } from "@/lib/store";
import { useOnlineStatus } from "@/hooks/use-online-status";
import { SyncProvider } from "@/components/sync-provider";
import { BottomNav } from "@/components/bottom-nav";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const currentUser = useFishStore((s) => s.currentUser);
  const isOnline = useOnlineStatus();
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const unsub = useFishStore.persist.onFinishHydration(() => {
      setHydrated(true);
    });
    if (useFishStore.persist.hasHydrated()) {
      setHydrated(true);
    }
    return unsub;
  }, []);

  useEffect(() => {
    if (hydrated && !currentUser) {
      router.replace("/");
    }
  }, [hydrated, currentUser, router]);

  if (!hydrated || !currentUser) {
    return (
      <div
        className="flex min-h-dvh items-center justify-center"
        style={{ backgroundColor: "#FDF8F8" }}
      >
        <div className="h-1 w-16 overflow-hidden rounded-full bg-[var(--color-border)]">
          <div className="h-full w-1/2 animate-pulse rounded-full bg-[#242424]" />
        </div>
      </div>
    );
  }

  return (
    <SyncProvider>
      <div
        className="relative min-h-dvh"
        style={{ backgroundColor: "#FDF8F8" }}
      >
        <header
          className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between"
          style={{
            height: 64,
            paddingLeft: 16,
            paddingRight: 16,
            backgroundColor: "#FDF8F8",
          }}
        >
          <span
            style={{
              fontFamily: '"Cal Sans", system-ui, sans-serif',
              fontSize: 24,
              fontWeight: 700,
              color: "#1C1B1B",
            }}
          >
            JUKU
          </span>

          <div className="flex items-center" style={{ gap: 12 }}>
            <div className="flex items-center" style={{ gap: 4 }}>
              <Wifi
                size={16}
                color={isOnline ? "#10B981" : "#898989"}
                strokeWidth={2}
              />
              <span
                style={{
                  fontSize: 16,
                  fontWeight: 400,
                  color: isOnline ? "#10B981" : "#898989",
                }}
              >
                {isOnline ? "Online" : "Offline"}
              </span>
            </div>

            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 12,
                backgroundColor: "#DFE0E0",
                flexShrink: 0,
              }}
            />
          </div>
        </header>

        <main
          style={{
            paddingTop: 80,
            paddingBottom: 100,
            paddingLeft: 16,
            paddingRight: 16,
          }}
        >
          {children}
        </main>

        <BottomNav />
      </div>
    </SyncProvider>
  );
}
