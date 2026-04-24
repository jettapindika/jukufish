"use client";

import { useState, useEffect } from "react";
import { Fish } from "lucide-react";
import { useFishStore } from "@/lib/store";

function PrimaryButton({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="h-14 w-full rounded-[4px] bg-[#242424] text-sm font-bold text-white transition-all active:scale-[0.98]"
      style={{ boxShadow: "var(--shadow-inset), var(--shadow-button)" }}
    >
      {children}
    </button>
  );
}

function GhostButton({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="h-14 w-full rounded-[4px] bg-white text-sm font-bold text-[#0e0f0f] transition-all active:scale-[0.98]"
      style={{ boxShadow: "rgba(19,19,22,0.7) 0px 1px 5px -4px, rgba(34,42,53,0.08) 0px 0px 0px 1px, rgba(34,42,53,0.05) 0px 4px 8px 0px" }}
    >
      {children}
    </button>
  );
}

function Logo() {
  return (
    <div className="flex flex-col items-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-[#242424]" style={{ marginBottom: 24 }}>
        <Fish className="h-7 w-7 text-white" />
      </div>
      <h1 className="text-[32px] font-bold text-[#0e0f0f] tracking-tight" style={{ fontFamily: '"Cal Sans", system-ui, sans-serif', marginBottom: 4 }}>
        Juku
      </h1>
      <p className="text-base text-[#8c8b8b]">Inventori Ikan Paotere</p>
    </div>
  );
}

export default function WelcomePage() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const unsub = useFishStore.persist.onFinishHydration(() => {
      setReady(true);
    });
    if (useFishStore.persist.hasHydrated()) {
      setReady(true);
    }
    return unsub;
  }, []);

  if (!ready) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-[var(--color-background)]">
        <div className="flex flex-col items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--color-primary)]">
            <Fish className="h-6 w-6 text-[var(--color-on-primary)]" />
          </div>
          <div className="h-1 w-16 overflow-hidden rounded-full bg-[var(--color-border)]">
            <div className="h-full w-1/2 animate-pulse rounded-full bg-[var(--color-primary)]" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col justify-between bg-white" style={{ padding: "52px 16px" }}>
      <div className="flex flex-col items-center" style={{ marginBottom: 32 }}>
        <Logo />
      </div>
      <div className="flex w-full flex-col items-center" style={{ gap: 8 }}>
        <div className="w-full" style={{ maxWidth: 358 }}>
          <PrimaryButton>
            Masuk
          </PrimaryButton>
        </div>
        <div className="w-full" style={{ maxWidth: 358 }}>
          <GhostButton onClick={() => {}}>
            Daftar Baru
          </GhostButton>
        </div>
      </div>
    </div>
  );
}
