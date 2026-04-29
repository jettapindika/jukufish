"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { UserRole } from "@/lib/types";

interface BottomNavProps {
  role: UserRole;
}

const IconHome = ({ color = "currentColor" }: { color?: string }) => (
  <svg width="16" height="18" viewBox="0 0 16 18" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M0 18V6L8 0L16 6V18H10V11H6V18H0Z" fill={color} />
  </svg>
);

const IconStok = ({ color = "currentColor" }: { color?: string }) => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3 20C2.45 20 1.97917 19.8042 1.5875 19.4125C1.19583 19.0208 1 18.55 1 18V6.725C0.7 6.54167 0.458333 6.30417 0.275 6.0125C0.0916667 5.72083 0 5.38333 0 5V2C0 1.45 0.195833 0.979167 0.5875 0.5875C0.979167 0.195833 1.45 0 2 0H18C18.55 0 19.0208 0.195833 19.4125 0.5875C19.8042 0.979167 20 1.45 20 2V5C20 5.38333 19.9083 5.72083 19.725 6.0125C19.5417 6.30417 19.3 6.54167 19 6.725V18C19 18.55 18.8042 19.0208 18.4125 19.4125C18.0208 19.8042 17.55 20 17 20H3ZM3 7V18H17V7H3ZM2 5H18V2H2V5ZM7 12H13V10H7V12Z" fill={color} />
  </svg>
);

const IconMasuk = ({ color = "currentColor" }: { color?: string }) => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M8 14H10V10H14V8H10V4H8V8H4V10H8V14ZM2 18C1.45 18 0.979167 17.8042 0.5875 17.4125C0.195833 17.0208 0 16.55 0 16V2C0 1.45 0.195833 0.979167 0.5875 0.5875C0.979167 0.195833 1.45 0 2 0H16C16.55 0 17.0208 0.195833 17.4125 0.5875C17.8042 0.979167 18 1.45 18 2V16C18 16.55 17.8042 17.0208 17.4125 17.4125C17.0208 17.8042 16.55 18 16 18H2ZM2 16H16V2H2V16ZM2 2V16V2Z" fill={color} />
  </svg>
);

const IconKeluar = ({ color = "currentColor" }: { color?: string }) => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M8 11V6.85L6.4 8.45L5 7L9 3L13 7L11.6 8.45L10 6.85V11H8ZM2 18C1.45 18 0.979167 17.8042 0.5875 17.4125C0.195833 17.0208 0 16.55 0 16V2C0 1.45 0.195833 0.979167 0.5875 0.5875C0.979167 0.195833 1.45 0 2 0H16C16.55 0 17.0208 0.195833 17.4125 0.5875C17.8042 0.979167 18 1.45 18 2V16C18 16.55 17.8042 17.0208 17.4125 17.4125C17.0208 17.8042 16.55 18 16 18H2ZM2 16H16V13H13C12.5 13.6333 11.9042 14.125 11.2125 14.475C10.5208 14.825 9.78333 15 9 15C8.21667 15 7.47917 14.825 6.7875 14.475C6.09583 14.125 5.5 13.6333 5 13H2V16ZM9 13C9.63333 13 10.2083 12.8167 10.725 12.45C11.2417 12.0833 11.6 11.6 11.8 11H16V2H2V11H6.2C6.4 11.6 6.75833 12.0833 7.275 12.45C7.79167 12.8167 8.36667 13 9 13ZM2 16H5C5.5 16 6.09583 16 6.7875 16C7.47917 16 8.21667 16 9 16C9.78333 16 10.5208 16 11.2125 16C11.9042 16 12.5 16 13 16H16H2Z" fill={color} />
  </svg>
);

const IconScan = ({ color = "currentColor" }: { color?: string }) => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M0 5V0H5V2H2V5H0ZM0 20V15H2V18H5V20H0ZM15 20V18H18V15H20V20H15ZM18 5V2H15V0H20V5H18ZM15.5 15.5H17V17H15.5V15.5ZM15.5 12.5H17V14H15.5V12.5ZM14 14H15.5V15.5H14V14ZM12.5 15.5H14V17H12.5V15.5ZM11 14H12.5V15.5H11V14ZM14 11H15.5V12.5H14V11ZM12.5 12.5H14V14H12.5V12.5ZM11 11H12.5V12.5H11V11ZM17 3V9H11V3H17ZM9 11V17H3V11H9ZM9 3V9H3V3H9ZM7.5 15.5V12.5H4.5V15.5H7.5ZM7.5 7.5V4.5H4.5V7.5H7.5ZM15.5 7.5V4.5H12.5V7.5H15.5Z" fill={color} />
  </svg>
);

const IconRiwayat = ({ color = "currentColor" }: { color?: string }) => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M10 20C7.16667 20 4.75 19.025 2.75 17.075C0.75 15.125 -0.1 12.7333 0.0500001 9.9C0.2 7.06667 1.25 4.66667 3.2 2.7C5.15 0.733333 7.5 -0.166667 10.25 0.0166667C12.6833 0.183333 14.7292 1.09167 16.3875 2.7375C18.0458 4.38333 18.9667 6.41667 19.15 8.8375C19.3333 11.2583 18.7083 13.4 17.275 15.2625C15.8417 17.125 13.9667 18.3333 11.65 18.8875L11.15 16.95C12.9833 16.5167 14.4583 15.5417 15.575 14.025C16.6917 12.5083 17.1667 10.8 17 8.9C16.8333 7 16.0833 5.375 14.75 4.025C13.4167 2.675 11.8 1.91667 9.9 1.75C7.68333 1.55 5.77083 2.2 4.1625 3.7C2.55417 5.2 1.68333 7.06667 1.55 9.3C1.41667 11.5333 2.1 13.4333 3.6 15C5.1 16.5667 6.95 17.3833 9.15 17.45L10 20ZM13.3 14.7L9 10.4V4H11V9.6L14.7 13.3L13.3 14.7Z" fill={color} />
  </svg>
);

const IconKelola = ({ color = "currentColor" }: { color?: string }) => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M7.5 20L7.1 17.15C6.81667 17.05 6.55 16.9208 6.3 16.7625C6.05 16.6042 5.80833 16.4333 5.575 16.25L2.925 17.375L0.425 13.125L2.725 11.375C2.70833 11.2083 2.7 11.0458 2.7 10.8875V9.1125C2.7 8.95417 2.70833 8.79167 2.725 8.625L0.425 6.875L2.925 2.625L5.575 3.75C5.80833 3.56667 6.05417 3.39583 6.3125 3.2375C6.57083 3.07917 6.83333 2.95 7.1 2.85L7.5 0H12.5L12.9 2.85C13.1833 2.95 13.45 3.07917 13.7 3.2375C13.95 3.39583 14.1917 3.56667 14.425 3.75L17.075 2.625L19.575 6.875L17.275 8.625C17.2917 8.79167 17.3 8.95417 17.3 9.1125V10.8875C17.3 11.0458 17.2833 11.2083 17.25 11.375L19.55 13.125L17.05 17.375L14.425 16.25C14.1917 16.4333 13.9458 16.6042 13.6875 16.7625C13.4292 16.9208 13.1667 17.05 12.9 17.15L12.5 20H7.5ZM10 13.5C10.9667 13.5 11.7917 13.1583 12.475 12.475C13.1583 11.7917 13.5 10.9667 13.5 10C13.5 9.03333 13.1583 8.20833 12.475 7.525C11.7917 6.84167 10.9667 6.5 10 6.5C9.03333 6.5 8.20833 6.84167 7.525 7.525C6.84167 8.20833 6.5 9.03333 6.5 10C6.5 10.9667 6.84167 11.7917 7.525 12.475C8.20833 13.1583 9.03333 13.5 10 13.5Z" fill={color} />
  </svg>
);

const NAV_ITEMS = {
  admin_gudang: [
    { href: "/dashboard", label: "BERANDA", icon: IconHome },
    { href: "/dashboard/stok", label: "STOK", icon: IconStok },
    { href: "/dashboard/catat-masuk", label: "MASUK", icon: IconMasuk },
    { href: "/dashboard/catat-keluar", label: "KELUAR", icon: IconKeluar },
    { href: "/dashboard/scan-qr", label: "SCAN", icon: IconScan },
  ],
  pemilik: [
    { href: "/dashboard", label: "BERANDA", icon: IconHome },
    { href: "/dashboard/riwayat", label: "RIWAYAT", icon: IconRiwayat },
    { href: "/dashboard/scan-qr", label: "SCAN", icon: IconScan },
    { href: "/dashboard/stok", label: "STOK", icon: IconStok },
    { href: "/dashboard/kelola", label: "KELOLA", icon: IconKelola },
  ],
} as const;

export function BottomNav({ role }: BottomNavProps) {
  const pathname = usePathname();
  const items = NAV_ITEMS[role];

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-[var(--color-surface)] pb-[env(safe-area-inset-bottom)]"
      style={{ boxShadow: "0px -2px 10px rgba(0,0,0,0.05)" }}
    >
      <div className="mx-auto grid h-[80px] md:h-[88px] w-full max-w-[430px] md:max-w-[600px] grid-cols-5">
        {items.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          const activeColor = "#FDF8F8";
          const inactiveColor = "#444748";

          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center justify-center"
            >
              <div
                className={`flex h-[53px] w-[64px] md:h-[58px] md:w-[80px] lg:w-[100px] flex-col items-center justify-center rounded-[10px] transition-all duration-200 ${
                  isActive ? "bg-[#242424]" : ""
                }`}
              >
                <Icon color={isActive ? activeColor : inactiveColor} />
                <span
                  className="mt-[3px] whitespace-nowrap text-[9px] md:text-[10px] lg:text-xs font-bold tracking-[0.08em] leading-none"
                  style={{ color: isActive ? activeColor : inactiveColor }}
                >
                  {item.label}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
