"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft, Download, FileSpreadsheet } from "lucide-react";
import { useFishStore } from "@/lib/store";
import { getFishById } from "@/lib/fish-data";

function downloadCsv(filename: string, csvContent: string) {
  const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export default function ExportPage() {
  const router = useRouter();
  const getActiveEntries = useFishStore((s) => s.getActiveEntries);
  const entries = useFishStore((s) => s.entries);
  const exits = useFishStore((s) => s.exits);

  const handleExportActive = () => {
    const active = getActiveEntries();
    const header = "Jenis Ikan,Nama Lokal,Berat (kg),Grade,Tanggal Masuk,Dicatat Oleh,QR Code";
    const rows = active.map((e) => {
      const fish = getFishById(e.fishId);
      return [
        fish?.name ?? e.fishId,
        fish?.localName ?? "",
        e.weightKg,
        e.grade,
        new Date(e.enteredAt).toLocaleString("id-ID"),
        e.enteredBy === "admin_gudang" ? "Admin Gudang" : "Pemilik",
        e.qrCode,
      ].join(",");
    });
    downloadCsv(`stok-aktif-${new Date().toISOString().slice(0, 10)}.csv`, [header, ...rows].join("\n"));
  };

  const handleExportHistory = () => {
    const exitMap = new Map(exits.map((ex) => [ex.stockEntryId, ex]));
    const header = "Tipe,Jenis Ikan,Nama Lokal,Berat (kg),Grade,Tanggal,Dicatat Oleh";
    const rows: string[] = [];

    for (const e of entries) {
      const fish = getFishById(e.fishId);
      rows.push(
        [
          "MASUK",
          fish?.name ?? e.fishId,
          fish?.localName ?? "",
          e.weightKg,
          e.grade,
          new Date(e.enteredAt).toLocaleString("id-ID"),
          e.enteredBy === "admin_gudang" ? "Admin Gudang" : "Pemilik",
        ].join(",")
      );

      const exit = exitMap.get(e.id);
      if (exit) {
        rows.push(
          [
            "KELUAR",
            fish?.name ?? e.fishId,
            fish?.localName ?? "",
            e.weightKg,
            e.grade,
            new Date(exit.exitedAt).toLocaleString("id-ID"),
            exit.exitedBy === "admin_gudang" ? "Admin Gudang" : "Pemilik",
          ].join(",")
        );
      }
    }

    downloadCsv(`riwayat-lengkap-${new Date().toISOString().slice(0, 10)}.csv`, [header, ...rows].join("\n"));
  };

  return (
    <div className="flex flex-col px-4 md:px-0 pt-4 pb-8">
      <div className="mb-6 flex items-center gap-3">
        <button
          onClick={() => router.push("/dashboard")}
          className="flex h-12 w-12 items-center justify-center rounded-[var(--radius)] bg-[var(--color-surface)] shadow-sm active:scale-95 transition-transform"
        >
          <ChevronLeft className="h-5 w-5 text-[var(--color-foreground)]" />
        </button>
        <h1 className="text-lg font-bold text-[var(--color-foreground)]">
          Export Laporan
        </h1>
      </div>

      <div className="flex flex-col gap-4 md:grid md:grid-cols-2">
        <div className="rounded-[var(--radius)] bg-[var(--color-surface)] p-5 shadow-sm">
          <div className="mb-3 flex items-center gap-3">
            <FileSpreadsheet className="h-6 w-6 text-[var(--color-primary)]" />
            <h2 className="text-base font-bold text-[var(--color-foreground)]">
              Export Stok Aktif
            </h2>
          </div>
          <p className="mb-4 text-sm text-[var(--color-muted)]">
            Download CSV berisi semua ikan yang masih ada di cold storage saat ini.
          </p>
          <button
            onClick={handleExportActive}
            className="flex h-14 w-full items-center justify-center gap-2 rounded-[var(--radius)] bg-[var(--color-primary)] text-sm font-bold text-white active:scale-[0.97] transition-transform"
          >
            <Download className="h-5 w-5" />
            Download Stok Aktif
          </button>
        </div>

        <div className="rounded-[var(--radius)] bg-[var(--color-surface)] p-5 shadow-sm">
          <div className="mb-3 flex items-center gap-3">
            <FileSpreadsheet className="h-6 w-6 text-[var(--color-warning)]" />
            <h2 className="text-base font-bold text-[var(--color-foreground)]">
              Export Riwayat Lengkap
            </h2>
          </div>
          <p className="mb-4 text-sm text-[var(--color-muted)]">
            Download CSV berisi semua riwayat masuk dan keluar ikan dari awal.
          </p>
          <button
            onClick={handleExportHistory}
            className="flex h-14 w-full items-center justify-center gap-2 rounded-[var(--radius)] bg-[var(--color-primary)] text-sm font-bold text-white active:scale-[0.97] transition-transform"
          >
            <Download className="h-5 w-5" />
            Download Riwayat Lengkap
          </button>
        </div>
      </div>
    </div>
  );
}
