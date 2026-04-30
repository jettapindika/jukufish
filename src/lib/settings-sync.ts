import { supabase } from "./supabase";
import type { CustomCategory, FishType } from "./types";

export async function pushCustomCategories(categories: CustomCategory[]): Promise<boolean> {
  const { error } = await supabase
    .from("app_settings")
    .upsert({
      key: "custom_categories",
      value: categories,
      updated_at: new Date().toISOString(),
    });
  return !error;
}

export async function pushCustomFish(fish: FishType[]): Promise<boolean> {
  const { error } = await supabase
    .from("app_settings")
    .upsert({
      key: "custom_fish",
      value: fish,
      updated_at: new Date().toISOString(),
    });
  return !error;
}

export async function pullCustomCategories(): Promise<CustomCategory[] | null> {
  const { data, error } = await supabase
    .from("app_settings")
    .select("value")
    .eq("key", "custom_categories")
    .single();

  if (error || !data) return null;
  return data.value as CustomCategory[];
}

export async function pullCustomFish(): Promise<FishType[] | null> {
  const { data, error } = await supabase
    .from("app_settings")
    .select("value")
    .eq("key", "custom_fish")
    .single();

  if (error || !data) return null;
  return data.value as FishType[];
}

export async function pullAllSettings(): Promise<{ customCategories: CustomCategory[]; customFish: FishType[] } | null> {
  const { data, error } = await supabase
    .from("app_settings")
    .select("key, value")
    .in("key", ["custom_categories", "custom_fish"]);

  if (error || !data) return null;

  let customCategories: CustomCategory[] = [];
  let customFish: FishType[] = [];

  for (const row of data) {
    if (row.key === "custom_categories") {
      customCategories = row.value as CustomCategory[];
    } else if (row.key === "custom_fish") {
      customFish = row.value as FishType[];
    }
  }

  return { customCategories, customFish };
}
