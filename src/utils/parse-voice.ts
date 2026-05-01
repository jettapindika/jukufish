/**
 * parse-voice.ts
 * Mengekstrak data stok ikan dari teks transkripsi suara dengan tingkat akurasi maksimal.
 * Terintegrasi dengan kosa kata lokal, STT error handling, dan NLP sederhana.
 */

import type { Grade } from "@/lib/types";

export interface ParsedVoiceData {
  fishKeywords: string[];
  weightKg: number | null;
  grade: Grade | null;
  rawText: string;
}

// ─── KAMUS ANGKA ─────────────────────────────────────────────────────────

const SATUAN: Record<string, number> = {
  nol: 0, kosong: 0,
  satu: 1, sa: 1,
  dua: 2,
  tiga: 3,
  empat: 4,
  lima: 5,
  enam: 6,
  tujuh: 7,
  delapan: 8, lapan: 8,
  sembilan: 9, semilan: 9,
  sepuluh: 10,
  sebelas: 11,
};

const BELASAN: Record<string, number> = {
  sebelas: 11, sebeles: 11,
  duabelas: 12, "dua belas": 12,
  tigabelas: 13, "tiga belas": 13,
  empatbelas: 14, "empat belas": 14,
  limabelas: 15, "lima belas": 15,
  enambelas: 16, "enam belas": 16,
  tujuhbelas: 17, "tujuh belas": 17,
  delapanbelas: 18, "delapan belas": 18, lapanbelas: 18,
  sembilanbelas: 19, "sembilan belas": 19, semilanbelas: 19,
};

const PULUHAN: Record<string, number> = {
  dua: 20, tiga: 30, empat: 40, lima: 50,
  enam: 60, tujuh: 70, delapan: 80, lapan: 80,
  sembilan: 90, semilan: 90,
};

const STT_NUMBER_ALIAS: Record<string, string> = {
  "2": "dua", "3": "tiga", "4": "empat", "5": "lima",
  "6": "enam", "7": "tujuh", "8": "delapan", "9": "sembilan",
  "10": "sepuluh", "11": "sebelas", "12": "dua belas",
  "20": "dua puluh", "25": "dua puluh lima", "30": "tiga puluh",
  "50": "lima puluh", "100": "seratus",
  "duapuluh": "dua puluh", "tigapuluh": "tiga puluh",
  "empatpuluh": "empat puluh", "limapuluh": "lima puluh",
  "enampuluh": "enam puluh", "tujuhpuluh": "tujuh puluh",
  "delapanpuluh": "delapan puluh", "sembilanpuluh": "sembilan puluh",
  "coma": "koma",
};

// ─── FUNGSI PARSER ANGKA ────────────────────────────────────────────────

function normalizeNumberText(text: string): string {
  let t = text.toLowerCase().trim();
  for (const [alias, canonical] of Object.entries(STT_NUMBER_ALIAS)) {
    t = t.replace(new RegExp(`\\b${alias}\\b`, "g"), canonical);
  }
  return t;
}

function parseIndonesianNumber(rawText: string): number | null {
  const t = normalizeNumberText(rawText);

  const directMatch = t.match(/^\d+(?:[.,]\d+)?$/);
  if (directMatch) return parseFloat(directMatch[0].replace(",", "."));

  if (t === "sekilo" || t === "se kilo" || t === "seton" || t === "sekuintal") return 1;
  if (t === "setengah" || t === "seperdua" || t === "half") return 0.5;
  if (t === "seperempat") return 0.25;
  if (t === "tigaperempat" || t === "tiga perempat") return 0.75;

  const setengahMatch = t.match(/^(.+?)\s+setengah$/);
  if (setengahMatch) {
    const base = parseIndonesianNumber(setengahMatch[1]);
    if (base !== null) return base + 0.5;
  }
  const seperempatMatch = t.match(/^(.+?)\s+seperempat$/);
  if (seperempatMatch) {
    const base = parseIndonesianNumber(seperempatMatch[1]);
    if (base !== null) return base + 0.25;
  }

  const komaMatch = t.match(/^(.+?)\s+koma\s+(.+)$/);
  if (komaMatch) {
    const intPart = parseIndonesianNumber(komaMatch[1]);
    const decStr = komaMatch[2].trim();
    const decDirect = decStr.match(/^\d+$/);
    if (intPart !== null) {
      if (decDirect) return parseFloat(`${intPart}.${decDirect[0]}`);
      const decWord = parseIndonesianNumber(decStr);
      if (decWord !== null) return parseFloat(`${intPart}.${decWord}`);
    }
  }

  const words = t.split(/\s+/);
  let result = 0;
  let hasResult = false;
  let i = 0;

  if (words[0] === "seratus") { result += 100; i++; hasResult = true; }
  else if (words[0] === "seribu") { result += 1000; i++; hasResult = true; }

  while (i < words.length) {
    const w = words[i];

    if (w === "ratus" && hasResult) { result *= 100; i++; continue; }
    if (w === "ribu" && hasResult) { result *= 1000; i++; continue; }
    if (w === "puluh") { i++; continue; }

    if (i + 1 < words.length) {
      const twoWord = `${w} ${words[i + 1]}`;
      if (twoWord in BELASAN) {
        result += BELASAN[twoWord];
        i += 2; hasResult = true; continue;
      }
    }

    const joined = words.slice(i, i + 2).join("");
    if (joined in BELASAN) {
      result += BELASAN[joined];
      i += 2; hasResult = true; continue;
    }
    if (w in BELASAN) {
      result += BELASAN[w];
      i++; hasResult = true; continue;
    }

    if (w in SATUAN) {
      if (words[i + 1] === "puluh") {
        result += PULUHAN[w] ?? 0;
        i += 2; hasResult = true; continue;
      }
      result += SATUAN[w];
      hasResult = true; i++; continue;
    }

    const digitMatch = w.match(/^(\d+)(?:[.,](\d+))?$/);
    if (digitMatch) {
      result += parseFloat(digitMatch[0].replace(",", "."));
      hasResult = true; i++; continue;
    }

    i++;
  }

  return hasResult ? result : null;
}

// ─── SATUAN BERAT & KONVERSI ─────────────────────────────────────────────

const KG_UNITS = new Set(["kg", "kilo", "kilogram", "kkg", "kilo gram", "kilo-gram", "kelos", "kilos"]);
const GRAM_UNITS = new Set(["gram", "gr", "grm", "g"]);
const TON_UNITS = new Set(["ton", "ton ikan"]);
const KUINTAL_UNITS = new Set(["kuintal", "kwintal", "kintal", "kuwintal", "kwental", "quintal"]);
const ONS_UNITS = new Set(["ons"]);

function getMultiplier(unit: string): number {
  if (GRAM_UNITS.has(unit)) return 0.001;
  if (TON_UNITS.has(unit)) return 1000;
  if (KUINTAL_UNITS.has(unit)) return 100;
  if (ONS_UNITS.has(unit)) return 0.1;
  return 1; // Default KG
}

// ─── GRADE MAPPING ──────────────────────────────────────

const GRADE_ALIASES: Record<string, Grade> = {
  a: "A", "grade a": "A", "kualitas a": "A", "kelas a": "A", "gred a": "A",
  "super": "A", "premium": "A", "terbaik": "A", "grade satu": "A",
  b: "B", "grade b": "B", "kualitas b": "B", "kelas b": "B", "gred b": "B",
  "biasa": "B", "standar": "B", "sedang": "B", "medium": "B", "grade dua": "B",
  c: "C", "grade c": "C", "kualitas c": "C", "kelas c": "C", "gred c": "C",
  "rijek": "C", "ekonomi": "C", "grade tiga": "C"
};

// ─── STOPWORDS & NORMALISASI IKAN ────────────────────────────────────────

const STOPWORDS = new Set([
  "ikan", "dan", "dengan", "di", "ke", "dari", "untuk", "yang", "ini", "itu", "ada",
  "mau", "saya", "aku", "kita", "dong",
  
  "daeng", "iye", "bos", "bosku", "pak", "maki", 
  "siang", "malam", "pagi", "sore", "barusan", "sekarang", "tadi", "baru", "belasu",
  
  "masuk", "keluarkan", "ambil", "simpan", "tambah", "catat", 
  "tolong", "cepat", "langsung", "input", "update", "perbarui", 
  "total", "jumlah", "berat", "sebanyak", "sebesar", "sejumlah",
  
  "kotak", "boks", "keranjang", "ember", "coolbox",
  
  ...KG_UNITS, ...GRAM_UNITS, ...TON_UNITS, ...KUINTAL_UNITS, ...ONS_UNITS,
  "grade", "gred", "kualitas", "kelas", "kategori", "mutu",
  "super", "biasa", "rijek", "premium", "standar", "ekonomi",
  ...Object.keys(SATUAN), ...Object.keys(PULUHAN), ...Object.keys(BELASAN),
  "puluh", "ratus", "ribu", "koma", "setengah", "seperdua", "seperempat", "tigaperempat"
]);


const FISH_NAME_NORMALIZE: Record<string, string> = {
  // Dialek / STT Error
  "tona": "tuna", "tongkos": "tongkol", "yellowfin": "tuna sirip kuning", 
  "karapu": "kerapu", "krapu": "kerapu", "kakab": "kakap", "banding": "bandeng",
  "vanami": "udang vaname", "vaname": "udang vaname", "cumicumi": "cumi", "sotong": "cumi",
  "kepiteng": "kepiting", "octopus": "gurita", "nilam": "nila", "tengiri": "tenggiri",
  
  "bolu": "bandeng",
  "sunu": "kerapu",
  "katombo": "kembung",
  "mairo": "teri",
  "lure": "teri",
  "eja": "kakap merah",
  "doang": "udang",
  "buntala": "buntal"
};

function normalizeFishName(text: string): string {
  let t = text.toLowerCase();
  for (const [alias, canonical] of Object.entries(FISH_NAME_NORMALIZE)) {
    t = t.replace(new RegExp(`\\b${alias}\\b`, "g"), canonical);
  }
  return t;
}

// ─── FUNGSI UTAMA (MAIN PARSER) ──────────────────────────────────────────

export function parseVoiceTranscript(text: string): ParsedVoiceData {
  const rawText = text;

  let normalized = text.toLowerCase()
    .replace(/[.,!?;:]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  normalized = normalizeFishName(normalized);

  let grade: Grade | null = null;
  const gradeAliasesSorted = Object.keys(GRADE_ALIASES).sort((a, b) => b.length - a.length);
  for (const alias of gradeAliasesSorted) {
    if (normalized.includes(alias)) {
      grade = GRADE_ALIASES[alias];
      break;
    }
  }

  let weightKg: number | null = null;
  
  const allUnitsPattern = [...KG_UNITS, ...GRAM_UNITS, ...TON_UNITS, ...KUINTAL_UNITS, ...ONS_UNITS].join("|");
  const digitRegex = new RegExp(`(\\d+(?:[.,]\\d+)?)\\s*(?:${allUnitsPattern})\\b`);
  const digitMatch = normalized.match(digitRegex);

  if (digitMatch) {
    const val = parseFloat(digitMatch[1].replace(",", "."));
    const matchedUnit = normalized.match(new RegExp(`\\b(?:${allUnitsPattern})\\b`));
    const multiplier = matchedUnit ? getMultiplier(matchedUnit[0]) : 1;
    weightKg = val * multiplier;
  }

  if (weightKg === null) {
    const words = normalized.split(" ");
    const unitIdx = words.findIndex((w) => 
      KG_UNITS.has(w) || GRAM_UNITS.has(w) || TON_UNITS.has(w) || KUINTAL_UNITS.has(w) || ONS_UNITS.has(w)
    );

    if (unitIdx > 0) {
      const slice = words.slice(Math.max(0, unitIdx - 8), unitIdx).join(" ");
      const parsed = parseIndonesianNumber(slice);
      if (parsed !== null) {
        weightKg = parsed * getMultiplier(words[unitIdx]);
      }
    }
  }
  
  if (weightKg === null) {
    const words = normalized.split(" ");
    for (let i = 0; i < words.length; i++) {
       const possibleNumber = parseIndonesianNumber(words.slice(i, i+3).join(" "));
       if (possibleNumber !== null && weightKg === null) {
          weightKg = possibleNumber;
       }
    }
  }

  const words = normalized.split(" ");
  const fishKeywords = words.filter((w) => {
    if (STOPWORDS.has(w)) return false;
    if (/^\d+$/.test(w)) return false;
    if (w.length < 3) return false;
    if (w === "wav" || w === "mp3") return false; 
    return true;
  });

  const uniqueKeywords = [...new Set(fishKeywords)];

  return {
    fishKeywords: uniqueKeywords,
    weightKg: weightKg !== null ? Number(weightKg.toFixed(3)) : null,
    grade,
    rawText,
  };
}

// ─── FUNGSI PENCOCOKAN KE DATABASE (HELPER) ──────────────────────────────

export interface FishOption {
  id: string;
  localName: string;
  name: string;
  category: string;
}

export function matchFishFromKeywords(
  keywords: string[],
  fishList: FishOption[]
): Array<{ fish: FishOption; score: number }> {
  if (keywords.length === 0) return [];

  const scored = fishList.map((fish) => {
    const localLower = fish.localName.toLowerCase();
    const nameLower = fish.name.toLowerCase();
    let score = 0;

    for (const kw of keywords) {
      const inLocal = localLower.includes(kw);
      const inName = nameLower.includes(kw);

      if (inLocal || inName) {
        score += kw.length >= 5 ? 3 : kw.length >= 4 ? 2 : 1;
        if (inLocal && inName) score += 1;
        if (localLower.startsWith(kw) || nameLower.startsWith(kw)) score += 2;
      }
    }
    return { fish, score };
  });

  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score); 
}