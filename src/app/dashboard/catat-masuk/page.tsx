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
import { Fish, ChevronLeft, Check, ScanLine, PlusCircle, Home } from "lucide-react";
import { SwipeConfirm } from "@/components/swipe-confirm";
import { QrScanner } from "@/components/qr-scanner";

const TOTAL_STEPS = 5;

export default function CatatMasukPage() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<FishCategory | "">("");
  const [selectedFishId, setSelectedFishId] = useState("");
  const [weight, setWeight] = useState(0);
  const [grade, setGrade] = useState<Grade>("A");
  const [scannedQr, setScannedQr] = useState("");
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [savedEntryId, setSavedEntryId] = useState<string | null>(null);

  const addEntry = useFishStore((s) => s.addEntry);
  const currentRole = useFishStore((s) => s.currentRole);
  const entries = useFishStore((s) => s.entries);
  const { categories: FISH_CATEGORIES, getFishByCategory, getFishById, allFish } = useFishData();

  useEffect(() => {
    if (currentRole === "pemilik") {
      router.replace("/dashboard");
    }
  }, [currentRole, router]);

  const filteredFish = selectedCategory ? getFishByCategory(selectedCategory) : [];
  const selectedFish = allFish.find((f) => f.id === selectedFishId);

  const savedEntry = useMemo(
    () => (savedEntryId ? entries.find((e) => e.id === savedEntryId) : null),
    [savedEntryId, entries]
  );

  const handleFishSelect = (fishId: string) => {
    setSelectedFishId(fishId);
    setStep(2);
  };

  const handleWeightConfirm = () => {
    if (weight > 0) setStep(3);
  };

  const handleGradeConfirm = () => {
    setStep(4);
  };

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
  };

  const handleBack = () => {
    if (step === 1) {
      router.push("/dashboard");
    } else {
      setStep((s) => (s - 1) as 1 | 2 | 3 | 4 | 5);
    }
  };

  if (savedEntryId && savedEntry) {
    const fish = getFishById(savedEntry.fishId);
    const enteredDate = new Date(savedEntry.enteredAt);

    return (
      <div className="flex flex-col min-h-[calc(100vh-128px)] px-4 py-6">
        <div className="flex flex-col items-center mb-6">
          <div className="w-16 h-16 rounded-full bg-[var(--color-fresh)] flex items-center justify-center mb-3">
            <Check className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-xl font-bold text-gray-900">
            Berhasil dicatat!
          </h1>
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
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-500 text-sm">Kategori</span>
              <span className="font-semibold text-sm">
                {fish ? FISH_CATEGORIES[fish.category] : "-"}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-500 text-sm">Berat</span>
              <span className="font-bold text-lg">{savedEntry.weightKg.toFixed(1)} kg</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-500 text-sm">Grade</span>
              <span className="font-bold px-3 py-1 bg-[var(--color-primary)] text-white rounded-lg">
                {savedEntry.grade}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-500 text-sm">Tanggal Masuk</span>
              <span className="font-semibold text-sm">
                {enteredDate.toLocaleDateString("id-ID", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-500 text-sm">Jam</span>
              <span className="font-semibold text-sm">
                {enteredDate.toLocaleTimeString("id-ID", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-gray-500 text-sm">Dicatat oleh</span>
              <span className="font-semibold text-sm">
                {savedEntry.enteredByName || (savedEntry.enteredBy === "admin_gudang" ? "Admin Gudang" : "Pemilik")}
              </span>
            </div>
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

  return (
    <div className="flex flex-col min-h-[calc(100vh-128px)]">
      <div className="flex items-center gap-3 px-4 py-3">
        <button
          onClick={handleBack}
          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 active:scale-95 transition-all"
        >
          <ChevronLeft className="w-6 h-6 text-gray-700" />
        </button>
        <div>
          <h1 className="text-lg font-bold text-gray-900">Catat Masuk</h1>
          <p className="text-xs text-gray-500">Langkah {step} dari {TOTAL_STEPS}</p>
        </div>
      </div>

      <div className="flex gap-1 px-4 mb-4">
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

      <div className="flex-1 px-4 pb-4">
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
                <div className="grid grid-cols-2 gap-3">
                  {filteredFish.map((fish) => (
                    <button
                      key={fish.id}
                      onClick={() => handleFishSelect(fish.id)}
                      className="flex flex-col items-center justify-center p-4 bg-white border-2 border-gray-200 rounded-xl hover:border-[var(--color-primary)] hover:bg-blue-50 transition-all active:scale-95 min-h-[100px] shadow-sm"
                    >
                      <Fish className="w-7 h-7 text-[var(--color-primary)] mb-2" />
                      <span className="text-sm font-bold text-gray-900 text-center leading-tight">
                        {fish.localName}
                      </span>
                      <span className="text-xs text-gray-500 text-center mt-1">
                        {fish.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

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
              <label className="block text-sm font-semibold text-gray-700 mb-4">
                Berat (kg)
              </label>
              <div className="text-5xl font-extrabold text-gray-900 text-center tabular-nums mb-5">
                {weight.toFixed(1)}
              </div>
              <div className="mb-4">
                <p className="text-xs font-semibold text-gray-500 text-center mb-2">Puluhan</p>
                <div className="flex items-center justify-center gap-3">
                  <button
                    onClick={() => setWeight(Math.max(0, Math.round((weight - 10) * 10) / 10))}
                    className="flex-1 max-w-[80px] h-12 bg-gray-200 rounded-xl text-sm font-bold hover:bg-gray-300 active:scale-95 transition-all"
                  >
                    −10
                  </button>
                  <button
                    onClick={() => setWeight(Math.max(0, Math.round((weight - 1) * 10) / 10))}
                    className="flex-1 max-w-[80px] h-12 bg-gray-200 rounded-xl text-sm font-bold hover:bg-gray-300 active:scale-95 transition-all"
                  >
                    −1
                  </button>
                  <button
                    onClick={() => setWeight(Math.round((weight + 1) * 10) / 10)}
                    className="flex-1 max-w-[80px] h-12 bg-[var(--color-primary)] rounded-xl text-sm font-bold text-white hover:bg-[var(--color-primary-dark)] active:scale-95 transition-all"
                  >
                    +1
                  </button>
                  <button
                    onClick={() => setWeight(Math.round((weight + 10) * 10) / 10)}
                    className="flex-1 max-w-[80px] h-12 bg-[var(--color-primary)] rounded-xl text-sm font-bold text-white hover:bg-[var(--color-primary-dark)] active:scale-95 transition-all"
                  >
                    +10
                  </button>
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 text-center mb-2">Satuan</p>
                <div className="flex items-center justify-center gap-3">
                  <button
                    onClick={() => setWeight(Math.max(0, Math.round((weight - 0.5) * 10) / 10))}
                    className="flex-1 max-w-[80px] h-12 bg-gray-200 rounded-xl text-sm font-bold hover:bg-gray-300 active:scale-95 transition-all"
                  >
                    −0.5
                  </button>
                  <button
                    onClick={() => setWeight(Math.max(0, Math.round((weight - 0.1) * 10) / 10))}
                    className="flex-1 max-w-[80px] h-12 bg-gray-200 rounded-xl text-sm font-bold hover:bg-gray-300 active:scale-95 transition-all"
                  >
                    −0.1
                  </button>
                  <button
                    onClick={() => setWeight(Math.round((weight + 0.1) * 10) / 10)}
                    className="flex-1 max-w-[80px] h-12 bg-[var(--color-primary)] rounded-xl text-sm font-bold text-white hover:bg-[var(--color-primary-dark)] active:scale-95 transition-all"
                  >
                    +0.1
                  </button>
                  <button
                    onClick={() => setWeight(Math.round((weight + 0.5) * 10) / 10)}
                    className="flex-1 max-w-[80px] h-12 bg-[var(--color-primary)] rounded-xl text-sm font-bold text-white hover:bg-[var(--color-primary-dark)] active:scale-95 transition-all"
                  >
                    +0.5
                  </button>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-auto pt-4">
              <button
                onClick={() => setStep(1)}
                className="flex-1 h-14 bg-gray-100 rounded-xl font-semibold text-gray-700 hover:bg-gray-200 active:scale-[0.98] transition-all"
              >
                Kembali
              </button>
              <button
                onClick={handleWeightConfirm}
                disabled={weight === 0}
                className="flex-1 h-14 bg-[var(--color-primary)] text-white rounded-xl font-semibold hover:bg-[var(--color-primary-dark)] disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98] transition-all"
              >
                Lanjut
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Fish className="w-5 h-5 text-[var(--color-primary)]" />
                  <span className="font-semibold">{selectedFish?.localName}</span>
                </div>
                <span className="text-sm text-gray-500">{weight.toFixed(1)} kg</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Pilih Grade Kualitas
              </label>
              <div className="grid grid-cols-3 gap-3">
                {(["A", "B", "C"] as Grade[]).map((g) => (
                  <button
                    key={g}
                    onClick={() => setGrade(g)}
                    className={`h-20 rounded-xl font-bold text-xl transition-all active:scale-95 ${
                      grade === g
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
              <button
                onClick={() => setStep(2)}
                className="flex-1 h-14 bg-gray-100 rounded-xl font-semibold text-gray-700 hover:bg-gray-200 active:scale-[0.98] transition-all"
              >
                Kembali
              </button>
              <button
                onClick={handleGradeConfirm}
                className="flex-1 h-14 bg-[var(--color-primary)] text-white rounded-xl font-semibold hover:bg-[var(--color-primary-dark)] active:scale-[0.98] transition-all"
              >
                Lanjut
              </button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-5">
            <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Fish className="w-5 h-5 text-[var(--color-primary)]" />
                  <span className="font-semibold">{selectedFish?.localName}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">{weight.toFixed(1)} kg</span>
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
              <p className="text-sm text-gray-500 mt-1">
                Scan QR code pada boks ikan untuk menautkan data
              </p>
            </div>

            {!scannedQr ? (
              <div className="rounded-2xl overflow-hidden border border-gray-200">
                <QrScanner
                  onScan={handleQrScanned}
                  scanning={step === 4 && !scannedQr}
                />
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
                <button
                  onClick={handleSkipQr}
                  className="w-full h-14 bg-[var(--color-primary)] text-white rounded-xl font-semibold hover:bg-[var(--color-primary-dark)] active:scale-[0.98] transition-all"
                >
                  Lewati — Lanjut Tanpa QR
                </button>
              )}
              {scannedQr && (
                <button
                  onClick={() => setStep(5)}
                  className="w-full h-14 bg-[var(--color-primary)] text-white rounded-xl font-semibold hover:bg-[var(--color-primary-dark)] active:scale-[0.98] transition-all"
                >
                  Lanjut ke Konfirmasi
                </button>
              )}
              <button
                onClick={() => {
                  setScannedQr("");
                  setStep(3);
                }}
                className="w-full h-12 bg-gray-100 rounded-xl font-semibold text-gray-700 hover:bg-gray-200 active:scale-[0.98] transition-all text-sm"
              >
                Kembali
              </button>
            </div>
          </div>
        )}

        {step === 5 && selectedFish && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm space-y-4">
              <h2 className="text-lg font-bold text-gray-900">Konfirmasi Data</h2>

              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-500 text-sm">Jenis Ikan</span>
                  <span className="font-bold">{selectedFish.localName}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-500 text-sm">Nama Indonesia</span>
                  <span className="font-semibold text-sm">{selectedFish.name}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-500 text-sm">Kategori</span>
                  <span className="font-semibold text-sm">{FISH_CATEGORIES[selectedFish.category]}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-500 text-sm">Berat</span>
                  <span className="font-bold text-lg">{weight.toFixed(1)} kg</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-500 text-sm">Grade</span>
                  <span className="font-bold text-lg px-3 py-1 bg-[var(--color-primary)] text-white rounded-lg">
                    {grade}
                  </span>
                </div>
                {scannedQr && (
                  <div className="flex justify-between items-center py-2">
                    <span className="text-gray-500 text-sm">QR Boks</span>
                    <span className="font-mono text-xs text-[var(--color-primary)]">{scannedQr}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-3 mt-auto pt-4">
              <SwipeConfirm
                onConfirm={handleFinalConfirm}
                label="Geser untuk simpan"
              />
              <button
                onClick={() => setStep(4)}
                className="w-full h-12 bg-gray-100 rounded-xl font-semibold text-gray-700 hover:bg-gray-200 active:scale-[0.98] transition-all text-sm"
              >
                Kembali
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
