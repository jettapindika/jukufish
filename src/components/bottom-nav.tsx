"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Home, ClipboardList, PlusSquare, LogOut, QrCode } from "lucide-react";

const NAV_ITEMS = [
  { href: "/dashboard", label: "BERANDA", icon: Home },
  { href: "/dashboard/stok", label: "STOK", icon: ClipboardList },
  { href: "/dashboard/masuk", label: "MASUK", icon: PlusSquare },
  { href: "/dashboard/keluar", label: "KELUAR", icon: LogOut },
  { href: "/dashboard/scan", label: "SCAN", icon: QrCode },
] as const;

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around bg-white"
      style={{
        height: 80,
        paddingLeft: 11,
        paddingRight: 11,
        boxShadow: "0 -1px 3px rgba(0,0,0,0.06)",
      }}
    >
      {NAV_ITEMS.map((item) => {
        const isActive = pathname === item.href;
        const Icon = item.icon;

        if (isActive) {
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center justify-center"
              style={{
                backgroundColor: "#242424",
                borderRadius: 8,
                padding: 8,
                gap: 2,
              }}
            >
              <Icon size={20} color="#FDF8F8" strokeWidth={2} />
              <span
                style={{
                  fontSize: 8,
                  fontWeight: 700,
                  color: "#FDF8F8",
                  lineHeight: 1,
                }}
              >
                {item.label}
              </span>
            </Link>
          );
        }

        return (
          <Link
            key={item.href}
            href={item.href}
            className="flex flex-col items-center justify-center"
            style={{ gap: 2, padding: 8 }}
          >
            <Icon size={20} color="#444748" strokeWidth={2} />
            <span
              style={{
                fontSize: 8,
                fontWeight: 700,
                color: "#444748",
                lineHeight: 1,
              }}
            >
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
