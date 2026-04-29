"use client";

import { useMemo } from "react";
import { useFishStore } from "@/lib/store";
import { getAllCategories, getAllFish, DEFAULT_FISH, DEFAULT_CATEGORIES } from "@/lib/fish-data";

export function useFishData() {
  const customCategories = useFishStore((s) => s.customCategories);
  const customFish = useFishStore((s) => s.customFish);

  const categories = useMemo(
    () => getAllCategories(customCategories),
    [customCategories]
  );

  const allFish = useMemo(
    () => getAllFish(customFish),
    [customFish]
  );

  const getFishByCategory = useMemo(
    () => (category: string) => allFish.filter((f) => f.category === category),
    [allFish]
  );

  const getFishById = useMemo(
    () => (id: string) => allFish.find((f) => f.id === id),
    [allFish]
  );

  return { categories, allFish, getFishByCategory, getFishById };
}

export { DEFAULT_FISH, DEFAULT_CATEGORIES };
