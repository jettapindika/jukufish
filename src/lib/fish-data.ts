import { FishType } from "./types";

export const DEFAULT_CATEGORIES: Record<string, string> = {
  "air-tawar": "Air Tawar",
  "air-payau": "Air Payau",
  "air-laut": "Air Laut",
  "invertebrata": "Invertebrata Laut",
  "tumbuhan": "Tumbuhan Laut",
};

export const FISH_CATEGORIES = DEFAULT_CATEGORIES;

export const DEFAULT_FISH: FishType[] = [
  { id: "samelang", name: "Ikan Lele", localName: "Samelang", category: "air-tawar", defaultShelfLifeHours: 12 },
  { id: "bulaeng", name: "Ikan Emas", localName: "Bulaeng", category: "air-tawar", defaultShelfLifeHours: 12 },
  { id: "jabiri", name: "Ikan Mujair", localName: "Jabiri'", category: "air-tawar", defaultShelfLifeHours: 12 },
  { id: "balang-balang", name: "Ikan Betik/Betok", localName: "Balang-Balang", category: "air-tawar", defaultShelfLifeHours: 12 },
  { id: "kanjilo", name: "Ikan Gabus", localName: "Kanjilo", category: "air-tawar", defaultShelfLifeHours: 12 },
  { id: "cambang-cambang", name: "Ikan Sepat", localName: "Cambang-Cambang", category: "air-tawar", defaultShelfLifeHours: 12 },
  { id: "bogolo", name: "Ikan Betutu", localName: "Bogolo'", category: "air-tawar", defaultShelfLifeHours: 12 },
  { id: "bitte", name: "Ikan Cupang", localName: "Bitte", category: "air-tawar", defaultShelfLifeHours: 8 },
  { id: "londeng", name: "Belut", localName: "Londeng", category: "air-tawar", defaultShelfLifeHours: 12 },

  { id: "kalengkere", name: "Sidat", localName: "Kalengkere'", category: "air-payau", defaultShelfLifeHours: 18 },
  { id: "bolu", name: "Ikan Bandeng", localName: "Bolu", category: "air-payau", defaultShelfLifeHours: 18 },

  { id: "tuing-tuing", name: "Ikan Terbang", localName: "Tuing-Tuing", category: "air-laut", defaultShelfLifeHours: 24 },
  { id: "mairo", name: "Ikan Teri", localName: "Mairo / Lure", category: "air-laut", defaultShelfLifeHours: 12 },
  { id: "buntala", name: "Ikan Buntal", localName: "Buntala'", category: "air-laut", defaultShelfLifeHours: 18 },
  { id: "katombo", name: "Ikan Kembung", localName: "Katombo", category: "air-laut", defaultShelfLifeHours: 18 },
  { id: "eja", name: "Ikan Kakap Merah", localName: "Eja", category: "air-laut", defaultShelfLifeHours: 24 },
  { id: "sunu", name: "Ikan Kerapu", localName: "Sunu", category: "air-laut", defaultShelfLifeHours: 36 },
  { id: "cakalang", name: "Ikan Cakalang", localName: "Cakalang", category: "air-laut", defaultShelfLifeHours: 24 },
  { id: "baronang", name: "Ikan Baronang", localName: "Baronang", category: "air-laut", defaultShelfLifeHours: 18 },
  { id: "tongkol", name: "Ikan Tongkol", localName: "Tongkol", category: "air-laut", defaultShelfLifeHours: 24 },
  { id: "layang", name: "Ikan Layang", localName: "Layang", category: "air-laut", defaultShelfLifeHours: 18 },

  { id: "cumi-cumi", name: "Cumi-cumi", localName: "Cumi-cumi", category: "invertebrata", defaultShelfLifeHours: 12 },
  { id: "sikuyu", name: "Kepiting", localName: "Sikuyu", category: "invertebrata", defaultShelfLifeHours: 24 },
  { id: "doang", name: "Udang", localName: "Doang", category: "invertebrata", defaultShelfLifeHours: 12 },

  { id: "donge-donge", name: "Rumput laut", localName: "Donge-donge", category: "tumbuhan", defaultShelfLifeHours: 72 },
];

export const FISH_DATA = DEFAULT_FISH;

export function getAllCategories(customCategories: { id: string; label: string }[]): Record<string, string> {
  const merged = { ...DEFAULT_CATEGORIES };
  for (const c of customCategories) {
    merged[c.id] = c.label;
  }
  return merged;
}

export function getAllFish(customFish: FishType[]): FishType[] {
  const customIds = new Set(customFish.map((f) => f.id));
  const defaults = DEFAULT_FISH.filter((f) => !customIds.has(f.id));
  return [...defaults, ...customFish];
}

export function getFishByCategory(category: string, customFish: FishType[] = []) {
  const all = getAllFish(customFish);
  return all.filter((fish) => fish.category === category);
}

export function getFishById(id: string, customFish: FishType[] = []) {
  const all = getAllFish(customFish);
  return all.find((fish) => fish.id === id);
}
