"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Check, LogOut, X } from "lucide-react";
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
  const setSyncToast = useFishStore((s) => s.setSyncToast);
  const [isHydrated, setIsHydrated] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

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

  const userInitial = currentUser.name?.charAt(0)?.toUpperCase() ?? "U";

  return (
    <div className="flex min-h-dvh flex-col bg-[var(--color-background)]">
      <header
        className="fixed top-0 left-0 right-0 z-40 flex h-[64px] w-full items-center justify-between bg-[var(--color-surface)] px-4 md:px-8 lg:px-12"
        style={{ boxShadow: "0px 1px 2px rgba(0,0,0,0.05), 0px 4px 8px rgba(0,0,0,0.05), 0px 10px 20px rgba(0,0,0,0.03)" }}
      >
        <div className="flex items-center">
          <span
            className="text-2xl font-bold tracking-[2.4px] text-[#1C1B1B]"
            style={{ fontFamily: "Helvetica, Arial, sans-serif" }}
          >
            JUKU
          </span>
        </div>
        <div className="flex items-center gap-2 md:gap-3">
          <OnlineBadge />
          <button
            onClick={() => setShowLogoutConfirm(true)}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-[#DFE0E0] active:scale-90 transition-transform"
            aria-label="Logout"
          >
            <LogOut size={16} className="text-[#444748]" />
          </button>
        </div>
      </header>

      <SyncProvider>
        <main className="mx-auto flex-1 w-full max-w-[430px] md:max-w-none pt-[64px] pb-[100px] md:pb-[116px] md:px-8 lg:px-12">
          {children}
        </main>
      </SyncProvider>

      {isToastVisible && syncToast && (
        <div className="fixed bottom-24 left-4 right-4 md:left-1/2 md:right-auto md:-translate-x-1/2 md:max-w-md md:w-[calc(100%-2rem)] z-50 flex items-center gap-2 rounded-xl bg-[#10B981] p-3 shadow-lg">
          <Check size={16} className="shrink-0 text-white" />
          <span className="text-sm font-semibold text-white">{syncToast.message}</span>
        </div>
      )}

      <BottomNav role={currentRole} />

      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center">
          <div
            className="absolute inset-0 bg-black/40 transition-opacity duration-200"
            onClick={() => setShowLogoutConfirm(false)}
          />
          <div className="relative mx-4 mb-6 w-full max-w-[398px] rounded-2xl bg-white p-6 shadow-xl transition-all duration-300 animate-[slideUp_0.3s_ease-out]">
            <button
              onClick={() => setShowLogoutConfirm(false)}
              className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-[#F5F5F5] active:scale-90 transition-transform"
            >
              <X size={16} className="text-[#444748]" />
            </button>

            <div className="flex flex-col items-center gap-3 pt-2">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#FEE2E2]">
                <LogOut size={22} className="text-[#BA1A1A]" />
              </div>
              <h3 className="text-lg font-bold text-[#1C1B1B]">Keluar dari akun?</h3>
              <p className="text-sm text-[#444748] text-center">
                Kamu akan keluar dari akun ini. Data lokal tetap tersimpan.
              </p>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => {
                  useFishStore.getState().logout();
                  router.replace("/");
                }}
                className="flex-1 rounded-xl border border-[#E5E2E1] bg-white py-3 text-sm font-bold text-[#1C1B1B] active:scale-[0.97] transition-transform"
              >
                Ya, Keluar
              </button>
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 rounded-xl bg-[#BA1A1A] py-3 text-sm font-bold text-white active:scale-[0.97] transition-transform"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
