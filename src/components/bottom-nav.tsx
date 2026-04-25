"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, PlusCircle, MinusCircle, History, ScanLine, FileDown, Settings, Package } from "lucide-react";
import type { UserRole } from "@/lib/types";

interface BottomNavProps {
  role: UserRole;
}

const NAV_ITEMS = {
  admin_gudang: [
    { href: "/dashboard", label: "Beranda", icon: Home },
    { href: "/dashboard/stok", label: "Stok", icon: Package },
    { href: "/dashboard/catat-masuk", label: "Catat Masuk", icon: PlusCircle },
    { href: "/dashboard/catat-keluar", label: "Keluar", icon: MinusCircle },
    { href: "/dashboard/scan-qr", label: "Scan QR", icon: ScanLine },
  ],
  pemilik: [
    { href: "/dashboard", label: "Beranda", icon: Home },
    { href: "/dashboard/stok", label: "Stok", icon: Package },
    { href: "/dashboard/riwayat", label: "Riwayat", icon: History },
    { href: "/dashboard/scan-qr", label: "Scan", icon: ScanLine },
    { href: "/dashboard/kelola", label: "Kelola", icon: Settings },
  ],
} as const;

export function BottomNav({ role }: BottomNavProps) {
  const pathname = usePathname();

  const items = NAV_ITEMS[role];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 h-16 bg-[var(--color-surface)] border-t border-[var(--color-border)] pb-[env(safe-area-inset-bottom)]">
      <div className="flex h-full items-center justify-around">
        {items.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-colors duration-150 ${
                isActive
                  ? "text-[var(--color-primary)]"
                  : "text-[var(--color-muted)]"
              }`}
            >
              <Icon
                className="w-6 h-6"
                fill={isActive ? "var(--color-primary)" : "none"}
                strokeWidth={isActive ? 2.5 : 2}
              />
              <span className={`text-xs ${isActive ? "font-bold" : "font-medium"}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
