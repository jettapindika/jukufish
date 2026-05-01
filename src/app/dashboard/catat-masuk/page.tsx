"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import { useFishStore } from "@/lib/store";
import { FishCategory, Grade } from "@/lib/types";
import { useFishData } from "@/hooks/use-fish-data";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Fish,
  ChevronLeft,
  Check,
  ScanLine,
  PlusCircle,
  Home,
  Mic,
  ClipboardList,
  ChevronRight,
  AlertCircle,
  RefreshCcw,
  Pencil,
} from "lucide-react";
import { SwipeConfirm } from "@/components/swipe-confirm";
import { QrScanner } from "@/components/qr-scanner";
import { VoiceRecorder } from "@/components/voice-recorder";
import { parseVoiceTranscript, matchFishFromKeywords } from "@/utils/parse-voice";

// ─── Konstanta ───────────────────────────────────────────────────────────────

const TOTAL_STEPS = 5;
const VOICE_API_URL = process.env.NEXT_PUBLIC_VOICE_API_URL ?? "http://localhost:8000/transcribe";

// ─── Tipe mode input ─────────────────────────────────────────────────────────

type InputMode = "manual" | "voice";

// ─── Tipe state hasil voice ───────────────────────────────────────────────────

interface VoiceResult {
  transcript: string;
  fishKeywords: string[];
  weightKg: number | null;
  grade: Grade | null;
  matchedFishId: string | null;
  matchedFishName: string | null;
  ambiguous: boolean; // lebih dari 1 candidate dengan skor sama
}

// ─── Komponen utama ───────────────────────────────────────────────────────────

export default function CatatMasukPage() {
  const router = useRouter();

  // ── Mode ──
  const [inputMode, setInputMode] = useState<InputMode | null>(null);

  // ── State form (shared manual & voice) ──
  const [selectedCategory, setSelectedCategory] = useState<FishCategory | "">("");
  const [selectedFishId, setSelectedFishId] = useState("");
  const [weight, setWeight] = useState(0);
  const [grade, setGrade] = useState<Grade>("A");
  const [scannedQr, setScannedQr] = useState("");
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [savedEntryId, setSavedEntryId] = useState<string | null>(null);

  // ── State voice ──
  const [voiceResult, setVoiceResult] = useState<VoiceResult | null>(null);
  const [voicePhase, setVoicePhase] = useState<"record" | "review" | "confirm">("record");
  const [voiceError, setVoiceError] = useState<string>("");

  const addEntry = useFishStore((s) => s.addEntry);
  const currentRole = useFishStore((s) => s.currentRole);
  const entries = useFishStore((s) => s.entries);
  const { categories: FISH_CATEGORIES, getFishByCategory, getFishById, allFish } = useFishData();

  useEffect(() => {
    if (currentRole === "pemilik") router.replace("/dashboard");
  }, [currentRole, router]);

  const filteredFish = selectedCategory ? getFishByCategory(selectedCategory) : [];
  const selectedFish = allFish.find((f) => f.id === selectedFishId);

  const savedEntry = useMemo(
    () => (savedEntryId ? entries.find((e) => e.id === savedEntryId) : null),
    [savedEntryId, entries]
  );

  // ─── Handlers manual ──────────────────────────────────────────────────────

  const handleFishSelect = (fishId: string) => {
    setSelectedFishId(fishId);
    setStep(2);
  };

  const handleWeightConfirm = () => {
    if (weight > 0) setStep(3);
  };

  const handleGradeConfirm = () => setStep(4);

  const handleQrScanned = (text: string) => {
    setScannedQr(text);
    setStep(5);
  };

  const handleSkipQr = () => {
    setScannedQr("");
    setStep(5);
  };

  const handleFinalConfirm = () => {
    if (!selectedFishId || weight <= 0) return;
    const entryId = addEntry({
      fishId: selectedFishId,
      weightKg: weight,
      grade,
      enteredBy: currentRole ?? "admin_gudang",
      ...(scannedQr ? { qrCode: scannedQr } : {}),
    });
    setSavedEntryId(entryId);
  };

  const handleReset = () => {
    setSelectedCategory("");
    setSelectedFishId("");
    setWeight(0);
    setGrade("A");
    setScannedQr("");
    setStep(1);
    setSavedEntryId(null);
    setInputMode(null);
    setVoiceResult(null);
    setVoicePhase("record");
    setVoiceError("");
  };

  const handleBack = () => {
    if (inputMode === null) {
      router.push("/dashboard");
    } else if (inputMode === "manual") {
      if (step === 1) setInputMode(null);
      else setStep((s) => (s - 1) as 1 | 2 | 3 | 4 | 5);
    } else {
      // voice mode
      if (voicePhase === "record") setInputMode(null);
      else if (voicePhase === "review") setVoicePhase("record");
      else setVoicePhase("review");
    }
  };

  // ─── Handler voice ────────────────────────────────────────────────────────

  const handleTranscribed = (text: string) => {
    const parsed = parseVoiceTranscript(text);

    // Cari ikan
    const matches = matchFishFromKeywords(parsed.fishKeywords, allFish);
    const top = matches[0] ?? null;
    const ambiguous =
      matches.length > 1 && matches[0].score === matches[1].score;

    const result: VoiceResult = {
      transcript: text,
      fishKeywords: parsed.fishKeywords,
      weightKg: parsed.weightKg,
      grade: parsed.grade,
      matchedFishId: top?.fish.id ?? null,
      matchedFishName: top?.fish.localName ?? null,
      ambiguous,
    };

    setVoiceResult(result);
    setVoicePhase("review");
  };

  const handleVoiceConfirm = () => {
    if (!voiceResult) return;

    // Terapkan hasil voice ke state form
    if (voiceResult.matchedFishId) {
      setSelectedFishId(voiceResult.matchedFishId);
      const fish = allFish.find((f) => f.id === voiceResult.matchedFishId);
      if (fish) setSelectedCategory(fish.category as FishCategory);
    }
    if (voiceResult.weightKg !== null) setWeight(voiceResult.weightKg);
    if (voiceResult.grade !== null) setGrade(voiceResult.grade);

    // Langsung ke step QR (step 4), data sudah terisi
    setVoicePhase("confirm");
    setStep(4);
  };

  const handleSwitchToManual = () => {
    // Kalau ada hasil voice, pre-fill dulu, lalu ke manual mode
    if (voiceResult) {
      if (voiceResult.matchedFishId) {
        setSelectedFishId(voiceResult.matchedFishId);
        const fish = allFish.find((f) => f.id === voiceResult.matchedFishId);
        if (fish) setSelectedCategory(fish.category as FishCategory);
      }
      if (voiceResult.weightKg !== null) setWeight(voiceResult.weightKg);
      if (voiceResult.grade !== null) setGrade(voiceResult.grade);
    }
    setInputMode("manual");
    setStep(1);
  };

  // ─── Hasil sukses ─────────────────────────────────────────────────────────

  if (savedEntryId && savedEntry) {
    const fish = getFishById(savedEntry.fishId);
    const enteredDate = new Date(savedEntry.enteredAt);

    return (
      <div className="flex flex-col min-h-[calc(100vh-128px)] px-4 md:px-0 py-6 md:max-w-2xl md:mx-auto md:w-full">
        <div className="flex flex-col items-center mb-6">
          <div className="w-16 h-16 rounded-full bg-[var(--color-fresh)] flex items-center justify-center mb-3">
            <Check className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-xl font-bold text-gray-900">Berhasil dicatat!</h1>
          {inputMode === "voice" && (
            <span className="mt-1 text-xs font-semibold text-[var(--color-primary)] bg-blue-50 px-2 py-0.5 rounded-full flex items-center gap-1">
              <Mic className="w-3 h-3" /> Diisi via suara
            </span>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden mb-4">
          <div className="bg-[var(--color-primary)] px-5 py-4 flex items-center gap-3">
            <Fish className="w-6 h-6 text-white" />
            <div>
              <p className="text-white font-bold text-lg">{fish?.localName}</p>
              <p className="text-blue-100 text-sm">{fish?.name}</p>
            </div>
          </div>

          <div className="p-5 space-y-3">
            {[
              { label: "Kategori", value: fish ? FISH_CATEGORIES[fish.category] : "-" },
              { label: "Berat", value: `${savedEntry.weightKg.toFixed(1)} kg`, bold: true },
              { label: "Grade", value: savedEntry.grade, badge: true },
              {
                label: "Tanggal Masuk",
                value: enteredDate.toLocaleDateString("id-ID", {
                  day: "numeric", month: "long", year: "numeric",
                }),
              },
              {
                label: "Jam",
                value: enteredDate.toLocaleTimeString("id-ID", {
                  hour: "2-digit", minute: "2-digit",
                }),
              },
              {
                label: "Dicatat oleh",
                value: savedEntry.enteredByName ?? (savedEntry.enteredBy === "admin_gudang" ? "Admin Gudang" : "Pemilik"),
              },
            ].map(({ label, value, bold, badge }) => (
              <div key={label} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                <span className="text-gray-500 text-sm">{label}</span>
                {badge ? (
                  <span className="font-bold px-3 py-1 bg-[var(--color-primary)] text-white rounded-lg">
                    {value}
                  </span>
                ) : (
                  <span className={`${bold ? "font-bold text-lg" : "font-semibold text-sm"}`}>{value}</span>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col items-center bg-white rounded-2xl border border-gray-200 shadow-sm p-5 mb-6">
          <p className="text-sm font-semibold text-gray-700 mb-3">QR Code Stok</p>
          <QRCodeSVG
            value={savedEntry.qrCode}
            size={180}
            level="H"
            fgColor="var(--color-primary)"
            bgColor="#ffffff"
            includeMargin
          />
          <p className="text-xs text-gray-400 mt-2 font-mono">{savedEntry.qrCode}</p>
        </div>

        <div className="space-y-3 mt-auto">
          <button
            onClick={handleReset}
            className="w-full h-14 bg-[var(--color-primary)] text-white rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-[var(--color-primary-dark)] active:scale-[0.98] transition-all"
          >
            <PlusCircle className="w-5 h-5" />
            Tambahkan Stok Baru
          </button>
          <button
            onClick={() => router.push("/dashboard")}
            className="w-full h-14 bg-gray-100 text-gray-700 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-gray-200 active:scale-[0.98] transition-all"
          >
            <Home className="w-5 h-5" />
            Kembali ke Dashboard
          </button>
        </div>
      </div>
    );
  }

  // ─── Header shared ────────────────────────────────────────────────────────

  const getHeaderTitle = () => {
    if (!inputMode) return "Catat Masuk";
    if (inputMode === "voice") return "Catat via Suara";
    return "Catat Manual";
  };

  const getHeaderSub = () => {
    if (!inputMode) return "Pilih metode pencatatan";
    if (inputMode === "voice") {
      if (voicePhase === "record") return "Ucapkan detail stok ikan";
      if (voicePhase === "review") return "Periksa hasil transkripsi";
      return `Langkah ${step} dari ${TOTAL_STEPS}`;
    }
    return `Langkah ${step} dari ${TOTAL_STEPS}`;
  };

  const showProgress = (inputMode === "manual") ||
    (inputMode === "voice" && voicePhase === "confirm");

  return (
    <div className="flex flex-col min-h-[calc(100vh-128px)] md:max-w-2xl md:mx-auto md:w-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 md:px-0 py-3">
        <button
          onClick={handleBack}
          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 active:scale-95 transition-all"
        >
          <ChevronLeft className="w-6 h-6 text-gray-700" />
        </button>
        <div>
          <h1 className="text-lg font-bold text-gray-900">{getHeaderTitle()}</h1>
          <p className="text-xs text-gray-500">{getHeaderSub()}</p>
        </div>
      </div>

      {/* Progress bar (hanya di mode manual atau voice phase confirm) */}
      {showProgress && (
        <div className="flex gap-1 px-4 md:px-0 mb-4">
          {Array.from({ length: TOTAL_STEPS }, (_, i) => i + 1).map((s) => (
            <div
              key={s}
              className="flex-1 h-1 rounded-full transition-all duration-300"
              style={{
                backgroundColor: s <= step ? "var(--color-primary)" : "var(--color-border)",
              }}
            />
          ))}
        </div>
      )}

      <div className="flex-1 px-4 md:px-0 pb-4">

        {/* ═══ MODE SELECTION ════════════════════════════════════════════════ */}
        {inputMode === null && (
          <div className="space-y-4 pt-2">
            <p className="text-sm text-gray-500 mb-6">
              Pilih cara pencatatan stok ikan yang masuk ke gudang.
            </p>

            {/* Voice Card */}
            <button
              onClick={() => { setInputMode("voice"); setVoicePhase("record"); }}
              className="w-full flex items-center gap-4 p-5 bg-white border-2 border-gray-200 rounded-2xl shadow-sm hover:border-gray-300 hover:bg-gray-50 active:scale-[0.98] transition-all group"
            >
              <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <Mic className="w-7 h-7 text-gray-600" />
              </div>
              <div className="flex-1 text-left">
                <p className="font-bold text-gray-900 text-base">Catat via Suara</p>
                <p className="text-sm text-gray-500 mt-0.5 leading-snug">
                  Ucapkan nama ikan, berat, dan grade — AI akan mengisi otomatis
                </p>
                <span className="inline-block mt-2 text-xs font-semibold text-[var(--color-primary)] bg-blue-50 px-2 py-0.5 rounded-full">
                  ✦ Lebih cepat
                </span>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400 shrink-0" />
            </button>

            {/* Manual Card */}
            <button
              onClick={() => setInputMode("manual")}
              className="w-full flex items-center gap-4 p-5 bg-white border-2 border-gray-200 rounded-2xl shadow-sm hover:border-gray-300 hover:bg-gray-50 active:scale-[0.98] transition-all group"
            >
              <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <ClipboardList className="w-7 h-7 text-gray-600" />
              </div>
              <div className="flex-1 text-left">
                <p className="font-bold text-gray-900 text-base">Catat Manual</p>
                <p className="text-sm text-gray-500 mt-0.5 leading-snug">
                  Isi data stok langkah demi langkah secara manual
                </p>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400 shrink-0" />
            </button>
          </div>
        )}

        {/* ═══ VOICE MODE ════════════════════════════════════════════════════ */}

        {inputMode === "voice" && voicePhase === "record" && (
          <div className="space-y-6 pt-2">
            {/* Panduan ucapan */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <p className="text-xs font-bold text-blue-700 mb-2 uppercase tracking-wide">Contoh ucapan</p>
              <p className="text-sm font-semibold text-blue-900 italic">
                &ldquo;Ikan tuna sirip kuning dua puluh lima kilo grade A&rdquo;
              </p>
              <p className="text-xs text-blue-600 mt-2">
                Sebutkan: <span className="font-semibold">nama ikan</span> →{" "}
                <span className="font-semibold">berat</span> (angka + kilo) →{" "}
                <span className="font-semibold">grade A/B/C</span>
              </p>
            </div>

            <VoiceRecorder
              onTranscribed={handleTranscribed}
              onError={(e) => setVoiceError(e)}
              apiUrl={VOICE_API_URL}
            />

            {voiceError && (
              <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl p-3">
                <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                <p className="text-sm text-red-600">{voiceError}</p>
              </div>
            )}

            <div className="pt-2">
              <p className="text-center text-xs text-gray-400 mb-3">atau</p>
              <button
                onClick={() => setInputMode("manual")}
                className="w-full h-12 bg-gray-100 rounded-xl font-semibold text-gray-600 hover:bg-gray-200 active:scale-[0.98] transition-all text-sm flex items-center justify-center gap-2"
              >
                <ClipboardList className="w-4 h-4" />
                Isi Manual Saja
              </button>
            </div>
          </div>
        )}

        {/* ── Voice: Review hasil ── */}
        {inputMode === "voice" && voicePhase === "review" && voiceResult && (
          <div className="space-y-4 pt-2">
            <p className="text-sm text-gray-500">
              Periksa hasil transkripsi dan pastikan data sudah benar.
            </p>

            {/* Transkripsi */}
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Hasil Transkripsi</p>
              <p className="text-sm font-medium text-gray-800 italic">&ldquo;{voiceResult.transcript}&rdquo;</p>
            </div>

            {/* Hasil ekstraksi */}
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
              <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
                <p className="text-xs font-bold text-gray-600 uppercase tracking-wide">Data yang Diekstrak</p>
              </div>

              <div className="p-4 space-y-3">
                {/* Ikan */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500 flex items-center gap-1.5">
                    <Fish className="w-4 h-4" /> Jenis Ikan
                  </span>
                  {voiceResult.matchedFishId ? (
                    <div className="flex items-center gap-2">
                      {voiceResult.ambiguous && (
                        <span className="text-xs text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded font-medium">
                          Perlu dicek
                        </span>
                      )}
                      <span className="font-semibold text-sm">{voiceResult.matchedFishName}</span>
                      <Check className="w-4 h-4 text-[var(--color-fresh)]" />
                    </div>
                  ) : (
                    <span className="text-xs text-red-500 font-semibold flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" /> Tidak terdeteksi
                    </span>
                  )}
                </div>

                {/* Berat */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Berat</span>
                  {voiceResult.weightKg !== null ? (
                    <span className="font-bold text-base flex items-center gap-2">
                      {voiceResult.weightKg.toFixed(1)} kg
                      <Check className="w-4 h-4 text-[var(--color-fresh)]" />
                    </span>
                  ) : (
                    <span className="text-xs text-red-500 font-semibold flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" /> Tidak terdeteksi
                    </span>
                  )}
                </div>

                {/* Grade */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Grade</span>
                  {voiceResult.grade ? (
                    <span className="font-bold px-3 py-1 bg-[var(--color-primary)] text-white rounded-lg flex items-center gap-2">
                      {voiceResult.grade}
                      <Check className="w-3.5 h-3.5" />
                    </span>
                  ) : (
                    <span className="text-xs text-amber-600 font-semibold flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" /> Akan pakai default A
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Warning jika ada data tidak terdeteksi */}
            {(!voiceResult.matchedFishId || voiceResult.weightKg === null || voiceResult.ambiguous) && (
              <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl p-3">
                <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                <p className="text-xs text-amber-700">
                  Beberapa data tidak terdeteksi dengan akurat. Kamu bisa lanjut dan edit manual, atau rekam ulang.
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="space-y-3 pt-2">
              <button
                onClick={handleVoiceConfirm}
                className="w-full h-14 bg-[var(--color-primary)] text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-[var(--color-primary-dark)] active:scale-[0.98] transition-all"
              >
                <Check className="w-5 h-5" />
                Konfirmasi & Lanjut ke QR
              </button>

              <button
                onClick={handleSwitchToManual}
                className="w-full h-12 bg-gray-100 rounded-xl font-semibold text-gray-600 hover:bg-gray-200 active:scale-[0.98] transition-all text-sm flex items-center justify-center gap-2"
              >
                <Pencil className="w-4 h-4" />
                Edit Manual (data sudah terisi)
              </button>

              <button
                onClick={() => { setVoiceResult(null); setVoicePhase("record"); }}
                className="w-full h-12 rounded-xl font-semibold text-gray-500 hover:bg-gray-50 active:scale-[0.98] transition-all text-sm flex items-center justify-center gap-2"
              >
                <RefreshCcw className="w-4 h-4" />
                Rekam Ulang
              </button>
            </div>
          </div>
        )}

        {/* ═══ MANUAL STEPS ═ */}

        {(inputMode === "manual" || (inputMode === "voice" && voicePhase === "confirm")) && (
          <>
            {/* Step 1 – Pilih ikan */}
            {step === 1 && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Kategori Ikan
                  </label>
                  <Select
                    value={selectedCategory}
                    onValueChange={(v) => {
                      setSelectedCategory(v as FishCategory);
                      setSelectedFishId("");
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih kategori..." />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(FISH_CATEGORIES).map(([key, label]) => (
                        <SelectItem key={key} value={key}>
                          {label} ({getFishByCategory(key).length})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedCategory && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Pilih Jenis — {FISH_CATEGORIES[selectedCategory]}
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {filteredFish.map((fish) => (
                        <button
                          key={fish.id}
                          onClick={() => handleFishSelect(fish.id)}
                          className={`flex flex-col items-center justify-center p-4 bg-white border-2 rounded-xl hover:border-[var(--color-primary)] hover:bg-blue-50 transition-all active:scale-95 min-h-[100px] shadow-sm
                            ${selectedFishId === fish.id ? "border-[var(--color-primary)] bg-blue-50" : "border-gray-200"}`}
                        >
                          <Fish className="w-7 h-7 text-[var(--color-primary)] mb-2" />
                          <span className="text-sm font-bold text-gray-900 text-center leading-tight">
                            {fish.localName}
                          </span>
                          <span className="text-xs text-gray-500 text-center mt-1">{fish.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Step 2 – Berat */}
            {step === 2 && selectedFish && (
              <div className="space-y-6">
                <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center">
                      <Fish className="w-6 h-6 text-[var(--color-primary)]" />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">{selectedFish.localName}</p>
                      <p className="text-sm text-gray-500">{selectedFish.name}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-4">Berat (kg)</label>
                  <div className="text-5xl font-extrabold text-gray-900 text-center tabular-nums mb-5">
                    {Number.isInteger(weight) ? weight : weight.toFixed(1)}
                  </div>
                  {[
                    { label: "Puluhan", items: [-10, -1, +1, +10] },
                    { label: "Satuan", items: [-0.5, -0.1, +0.1, +0.5] },
                  ].map(({ label, items }) => (
                    <div key={label} className="mb-4">
                      <p className="text-xs font-semibold text-gray-500 text-center mb-2">{label}</p>
                      <div className="flex items-center justify-center gap-3">
                        {items.map((delta) => (
                          <button
                            key={delta}
                            onClick={() => setWeight(Math.max(0, Math.round((weight + delta) * 10) / 10))}
                            className={`flex-1 max-w-[80px] h-12 rounded-xl text-sm font-bold active:scale-95 transition-all
                              ${delta > 0
                                ? "bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-dark)]"
                                : "bg-gray-200 hover:bg-gray-300"}`}
                          >
                            {delta > 0 ? `+${delta}` : delta}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex gap-3 mt-auto pt-4">
                  <button onClick={() => setStep(1)} className="flex-1 h-14 bg-gray-100 rounded-xl font-semibold text-gray-700 hover:bg-gray-200 active:scale-[0.98] transition-all">
                    Kembali
                  </button>
                  <button onClick={handleWeightConfirm} disabled={weight === 0} className="flex-1 h-14 bg-[var(--color-primary)] text-white rounded-xl font-semibold hover:bg-[var(--color-primary-dark)] disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98] transition-all">
                    Lanjut
                  </button>
                </div>
              </div>
            )}

            {/* Step 3 – Grade */}
            {step === 3 && (
              <div className="space-y-6">
                <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Fish className="w-5 h-5 text-[var(--color-primary)]" />
                      <span className="font-semibold">{selectedFish?.localName}</span>
                    </div>
                    <span className="text-sm text-gray-500">
                      {Number.isInteger(weight) ? weight : weight.toFixed(1)} kg
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">Pilih Grade Kualitas</label>
                  <div className="grid grid-cols-3 gap-3">
                    {(["A", "B", "C"] as Grade[]).map((g) => (
                      <button
                        key={g}
                        onClick={() => setGrade(g)}
                        className={`h-20 rounded-xl font-bold text-xl transition-all active:scale-95
                          ${grade === g
                            ? "bg-[var(--color-primary)] text-white shadow-lg shadow-blue-200"
                            : "bg-white border-2 border-gray-200 text-gray-700 hover:border-[var(--color-primary)]"
                          }`}
                      >
                        <span className="text-2xl">{g}</span>
                        <p className="text-xs font-normal mt-1 opacity-80">
                          {g === "A" ? "Premium" : g === "B" ? "Standar" : "Ekonomi"}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3 mt-auto pt-4">
                  <button onClick={() => setStep(2)} className="flex-1 h-14 bg-gray-100 rounded-xl font-semibold text-gray-700 hover:bg-gray-200 active:scale-[0.98] transition-all">
                    Kembali
                  </button>
                  <button onClick={handleGradeConfirm} className="flex-1 h-14 bg-[var(--color-primary)] text-white rounded-xl font-semibold hover:bg-[var(--color-primary-dark)] active:scale-[0.98] transition-all">
                    Lanjut
                  </button>
                </div>
              </div>
            )}

            {/* Step 4 – QR Scan */}
            {step === 4 && (
              <div className="space-y-5">
                <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Fish className="w-5 h-5 text-[var(--color-primary)]" />
                      <span className="font-semibold">{selectedFish?.localName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500">
                        {Number.isInteger(weight) ? weight : weight.toFixed(1)} kg
                      </span>
                      <span className="text-xs px-2 py-0.5 bg-[var(--color-primary)] text-white rounded font-bold">
                        {grade}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-14 h-14 bg-blue-50 rounded-full mb-3">
                    <ScanLine className="w-7 h-7 text-[var(--color-primary)]" />
                  </div>
                  <h2 className="text-lg font-bold text-gray-900">Scan QR Code Boks</h2>
                  <p className="text-sm text-gray-500 mt-1">Scan QR code pada boks ikan untuk menautkan data</p>
                </div>

                {!scannedQr ? (
                  <div className="rounded-2xl overflow-hidden border border-gray-200">
                    <QrScanner onScan={handleQrScanned} scanning={step === 4 && !scannedQr} />
                  </div>
                ) : (
                  <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
                    <Check className="w-6 h-6 text-[var(--color-fresh)] shrink-0" />
                    <div>
                      <p className="font-semibold text-green-800 text-sm">QR Berhasil Discan</p>
                      <p className="text-xs text-green-600 font-mono mt-0.5">{scannedQr}</p>
                    </div>
                  </div>
                )}

                <div className="space-y-3 mt-auto pt-2">
                  {!scannedQr && (
                    <button onClick={handleSkipQr} className="w-full h-14 bg-[var(--color-primary)] text-white rounded-xl font-semibold hover:bg-[var(--color-primary-dark)] active:scale-[0.98] transition-all">
                      Lewati — Lanjut Tanpa QR
                    </button>
                  )}
                  {scannedQr && (
                    <button onClick={() => setStep(5)} className="w-full h-14 bg-[var(--color-primary)] text-white rounded-xl font-semibold hover:bg-[var(--color-primary-dark)] active:scale-[0.98] transition-all">
                      Lanjut ke Konfirmasi
                    </button>
                  )}
                  <button
                    onClick={() => { setScannedQr(""); setStep(3); }}
                    className="w-full h-12 bg-gray-100 rounded-xl font-semibold text-gray-700 hover:bg-gray-200 active:scale-[0.98] transition-all text-sm"
                  >
                    Kembali
                  </button>
                </div>
              </div>
            )}

            {/* Step 5 – Konfirmasi */}
            {step === 5 && selectedFish && (
              <div className="space-y-6">
                {inputMode === "voice" && (
                  <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-xl px-4 py-2">
                    <Mic className="w-4 h-4 text-[var(--color-primary)] shrink-0" />
                    <p className="text-xs text-blue-700 font-medium">Data diisi via suara. Periksa kembali sebelum menyimpan.</p>
                  </div>
                )}

                <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm space-y-4">
                  <h2 className="text-lg font-bold text-gray-900">Konfirmasi Data</h2>
                  <div className="space-y-3">
                    {[
                      { label: "Jenis Ikan", value: selectedFish.localName, bold: true },
                      { label: "Nama Indonesia", value: selectedFish.name },
                      { label: "Kategori", value: FISH_CATEGORIES[selectedFish.category] },
                      { label: "Berat", value: `${Number.isInteger(weight) ? weight : weight.toFixed(1)} kg`, large: true },
                      { label: "Grade", value: grade, badge: true },
                      ...(scannedQr ? [{ label: "QR Boks", value: scannedQr, mono: true }] : []),
                    ].map(({ label, value, bold, large, badge, mono }) => (
                      <div key={label} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                        <span className="text-gray-500 text-sm">{label}</span>
                        {badge ? (
                          <span className="font-bold text-lg px-3 py-1 bg-[var(--color-primary)] text-white rounded-lg">
                            {value}
                          </span>
                        ) : (
                          <span className={`${large ? "font-bold text-lg" : bold ? "font-bold" : "font-semibold text-sm"} ${mono ? "font-mono text-xs text-[var(--color-primary)]" : ""}`}>
                            {value}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-3 mt-auto pt-4">
                  <SwipeConfirm onConfirm={handleFinalConfirm} label="Geser untuk simpan" />
                  <button onClick={() => setStep(4)} className="w-full h-12 bg-gray-100 rounded-xl font-semibold text-gray-700 hover:bg-gray-200 active:scale-[0.98] transition-all text-sm">
                    Kembali
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}