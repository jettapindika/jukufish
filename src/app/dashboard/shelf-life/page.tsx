"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft, RotateCcw, Plus, Minus } from "lucide-react";
import { useFishStore } from "@/lib/store";
import { useFishData } from "@/hooks/use-fish-data";
import type { FishCategory } from "@/lib/types";

export default function PengaturanPage() {
  const router = useRouter();
  const shelfLifeOverrides = useFishStore((s) => s.shelfLifeOverrides);
  const setShelfLifeOverride = useFishStore((s) => s.setShelfLifeOverride);
  const removeShelfLifeOverride = useFishStore((s) => s.removeShelfLifeOverride);
  const getShelfLifeHours = useFishStore((s) => s.getShelfLifeHours);
  const { categories: categoryMap, getFishByCategory } = useFishData();

  const categories = Object.entries(categoryMap) as [FishCategory, string][];

  return (
    <div className="flex flex-col px-4 md:px-0 pt-4 pb-8 md:max-w-[700px]">
      <div className="mb-4 flex items-center gap-3">
        <button
          onClick={() => router.push("/dashboard")}
          className="flex h-12 w-12 items-center justify-center rounded-[var(--radius)] bg-[var(--color-surface)] shadow-sm active:scale-95 transition-transform"
        >
          <ChevronLeft className="h-5 w-5 text-[var(--color-foreground)]" />
        </button>
        <h1 className="text-lg font-bold text-[var(--color-foreground)]">
          Pengaturan Shelf Life
        </h1>
      </div>

      <div className="flex flex-col gap-6">
        {categories.map(([catKey, catLabel]) => {
          const fishInCat = getFishByCategory(catKey);
          if (fishInCat.length === 0) return null;

          return (
            <div key={catKey}>
              <h2 className="mb-2 text-xs font-bold uppercase tracking-wider text-[var(--color-muted)]">
                {catLabel}
              </h2>
              <div className="rounded-[var(--radius)] bg-[var(--color-surface)] shadow-sm overflow-hidden">
                {fishInCat.map((fish, i) => {
                  const currentHours = getShelfLifeHours(fish.id, fish.defaultShelfLifeHours);
                  const hasOverride = shelfLifeOverrides.some((o) => o.fishId === fish.id);

                  return (
                    <div
                      key={fish.id}
                      className={`flex items-center justify-between px-4 py-3 ${i < fishInCat.length - 1 ? "border-b border-[var(--color-border)]" : ""}`}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-[var(--color-foreground)] truncate">
                          {fish.localName}
                        </p>
                        <p className="text-xs text-[var(--color-muted)] truncate">{fish.name}</p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setShelfLifeOverride(fish.id, Math.max(1, currentHours - 1))}
                          className="flex h-12 w-12 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--color-background)] active:scale-95 transition-transform"
                        >
                          <Minus className="h-4 w-4 text-[var(--color-foreground)]" />
                        </button>

                        <span className={`min-w-[48px] text-center text-sm font-bold ${hasOverride ? "text-[var(--color-primary)]" : "text-[var(--color-foreground)]"}`}>
                          {currentHours}j
                        </span>

                        <button
                          onClick={() => setShelfLifeOverride(fish.id, currentHours + 1)}
                          className="flex h-12 w-12 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--color-background)] active:scale-95 transition-transform"
                        >
                          <Plus className="h-4 w-4 text-[var(--color-foreground)]" />
                        </button>

                        {hasOverride && (
                          <button
                            onClick={() => removeShelfLifeOverride(fish.id)}
                            className="flex h-12 w-12 items-center justify-center rounded-[var(--radius-sm)] text-[var(--color-muted)] active:scale-95 transition-transform"
                          >
                            <RotateCcw className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
