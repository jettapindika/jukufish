"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Moon, Sun, Check, LogOut } from "lucide-react";
import { useFishStore } from "@/lib/store";
import { BottomNav } from "@/components/bottom-nav";
import { OnlineBadge } from "@/components/online-badge";
import { SyncProvider } from "@/components/sync-provider";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const currentUser = useFishStore((s) => s.currentUser);
  const currentRole = useFishStore((s) => s.currentRole);
  const darkMode = useFishStore((s) => s.darkMode);
  const syncToast = useFishStore((s) => s.syncToast);
  const toggleDarkMode = useFishStore((s) => s.toggleDarkMode);
  const logout = useFishStore((s) => s.logout);
  const setSyncToast = useFishStore((s) => s.setSyncToast);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    const unsub = useFishStore.persist.onFinishHydration(() => {
      setIsHydrated(true);
    });
    if (useFishStore.persist.hasHydrated()) {
      setIsHydrated(true);
    }
    return () => { unsub(); };
  }, []);

  useEffect(() => {
    if (isHydrated && !currentUser) {
      router.replace("/");
    }
  }, [isHydrated, currentUser, router]);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
  }, [darkMode]);

  const isToastVisible = syncToast !== null && Date.now() - syncToast.timestamp < 5000;

  const dismissToast = useCallback(() => {
    setSyncToast(null);
  }, [setSyncToast]);

  useEffect(() => {
    if (!syncToast) return;
    const timer = setTimeout(dismissToast, 5000);
    return () => clearTimeout(timer);
  }, [syncToast, dismissToast]);

  if (!isHydrated) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-[var(--color-background)]">
        <div className="h-8 w-8 animate-spin rounded-full border-3 border-[var(--color-border)] border-t-[var(--color-primary)]" />
      </div>
    );
  }

  if (!currentUser || !currentRole) return null;

  return (
    <div className="flex min-h-dvh flex-col bg-[var(--color-background)] font-sans">
      <header className="fixed top-0 left-0 right-0 z-40 flex h-14 items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-surface)] px-4">
        <div className="flex items-center gap-2">
          <span className="text-lg font-extrabold text-[var(--color-primary)]" style={{ fontFamily: '"Cal Sans", var(--font-inter)' }}>
            Juku
          </span>
          {currentUser && (
            <span className="text-xs text-[var(--color-muted)] font-medium hidden sm:inline">
              {currentUser.name}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleDarkMode}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-background)] text-[var(--color-foreground)] transition-colors"
            aria-label={darkMode ? "Aktifkan mode terang" : "Aktifkan mode gelap"}
          >
            {darkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <OnlineBadge />
          <button
            type="button"
            onClick={() => { logout(); router.replace("/"); }}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-background)] text-[var(--color-muted)] transition-colors"
            aria-label="Keluar"
          >
            <LogOut size={16} />
          </button>
        </div>
      </header>

      <SyncProvider>
        <main className="flex-1 pt-14 pb-20">
          {children}
        </main>
      </SyncProvider>

      {isToastVisible && syncToast && (
        <div className="fixed bottom-20 left-4 right-4 z-50 flex items-center gap-2 rounded-xl bg-[var(--color-fresh)] p-3 shadow-lg">
          <Check size={16} className="shrink-0 text-white" />
          <span className="text-sm font-semibold text-white">{syncToast.message}</span>
        </div>
      )}

      <BottomNav role={currentRole} />
    </div>
  );
}
