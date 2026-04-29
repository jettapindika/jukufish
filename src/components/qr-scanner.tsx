"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Camera, AlertCircle, RefreshCw } from "lucide-react";

interface QrScannerProps {
  onScan: (decodedText: string) => void;
  onError?: (error: string) => void;
  scanning?: boolean;
}

const READER_ID = "qr-reader-" + Math.random().toString(36).substr(2, 6);

const SCAN_CONFIG = {
  fps: 10,
  qrbox: { width: 280, height: 280 },
};

export function QrScanner({
  onScan,
  scanning = true,
  onError,
}: QrScannerProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const scannerRef = useRef<any>(null);
  const mountedRef = useRef(true);
  const onScanRef = useRef(onScan);
  onScanRef.current = onScan;
  const [error, setError] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [isReady, setIsReady] = useState(false);

  const killAllCameras = useCallback(() => {
    try {
      const videos = document.querySelectorAll("video");
      videos.forEach((video) => {
        const stream = video.srcObject as MediaStream | null;
        if (stream) {
          stream.getTracks().forEach((track) => track.stop());
          video.srcObject = null;
        }
      });
    } catch {
      // best effort
    }
  }, []);

  const stopScanner = useCallback(async () => {
    const scanner = scannerRef.current;
    if (!scanner) return;
    try {
      const state = scanner.getState();
      if (state === 2) {
        await scanner.stop();
      }
    } catch {
      // already stopped
    }
    killAllCameras();
  }, [killAllCameras]);

  const startScanner = useCallback(async () => {
    if (!mountedRef.current) return;
    setError(null);
    setIsStarting(true);

    try {
      const { Html5Qrcode } = await import("html5-qrcode");

      if (!mountedRef.current) return;

      const el = document.getElementById(READER_ID);
      if (!el) {
        setIsStarting(false);
        return;
      }

      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode(READER_ID);
      }

      await stopScanner();

      await scannerRef.current.start(
        { facingMode: "environment" },
        SCAN_CONFIG,
        (decodedText: string) => {
          stopScanner();
          onScanRef.current(decodedText);
        },
        () => {}
      );
    } catch (err) {
      if (!mountedRef.current) return;
      const message = err instanceof Error ? err.message : String(err);

      if (message.includes("Permission") || message.includes("NotAllowedError")) {
        setError("permission");
      } else if (message.includes("NotFoundError") || message.includes("Requested device not found")) {
        setError("not-found");
      } else {
        setError("unknown");
        onError?.(message);
      }
    } finally {
      if (mountedRef.current) setIsStarting(false);
    }
  }, [onError, stopScanner]);

  useEffect(() => {
    setIsReady(true);
    return () => {
      setIsReady(false);
    };
  }, []);

  useEffect(() => {
    if (!isReady) return;
    mountedRef.current = true;

    if (scanning) {
      const timer = setTimeout(startScanner, 300);
      return () => {
        clearTimeout(timer);
        mountedRef.current = false;
        stopScanner();
      };
    }

    stopScanner();
    return () => {
      mountedRef.current = false;
    };
  }, [scanning, isReady, startScanner, stopScanner]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopScanner();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      mountedRef.current = false;
      if (scannerRef.current) {
        try {
          scannerRef.current.stop().catch(() => {});
        } catch {
          // ignore
        }
        scannerRef.current = null;
      }
      killAllCameras();
    };
  }, [stopScanner, killAllCameras]);

  if (error === "permission") {
    return (
      <div className="flex flex-col items-center gap-4 rounded-2xl bg-white p-8">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
          <AlertCircle className="h-8 w-8 text-[var(--color-critical)]" />
        </div>
        <p className="text-center text-sm font-semibold text-gray-900">
          Izinkan akses kamera untuk scan QR
        </p>
        <button
          type="button"
          onClick={() => {
            setError(null);
            startScanner();
          }}
          className="flex h-12 items-center gap-2 rounded-xl bg-[var(--color-primary)] px-6 text-sm font-bold text-white active:scale-95 transition-all"
        >
          <RefreshCw className="h-5 w-5" />
          Coba Lagi
        </button>
      </div>
    );
  }

  if (error === "not-found") {
    return (
      <div className="flex flex-col items-center gap-4 rounded-2xl bg-white p-8">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
          <Camera className="h-8 w-8 text-gray-400" />
        </div>
        <p className="text-center text-sm font-semibold text-gray-900">
          Kamera tidak tersedia
        </p>
      </div>
    );
  }

  if (error === "unknown") {
    return (
      <div className="flex flex-col items-center gap-4 rounded-2xl bg-white p-8">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-50">
          <AlertCircle className="h-8 w-8 text-[var(--color-warning)]" />
        </div>
        <p className="text-center text-sm font-semibold text-gray-900">
          Gagal membuka kamera
        </p>
        <button
          type="button"
          onClick={() => {
            setError(null);
            startScanner();
          }}
          className="flex h-12 items-center gap-2 rounded-xl bg-[var(--color-primary)] px-6 text-sm font-bold text-white active:scale-95 transition-all"
        >
          <RefreshCw className="h-5 w-5" />
          Coba Lagi
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-2 w-full flex-1 min-h-0">
      <div className="relative w-full flex-1 overflow-hidden rounded-2xl bg-black">
        <div id={READER_ID} className="w-full h-full" />

        {(isStarting || scanning) && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="relative" style={{ width: "70%", maxWidth: 280, aspectRatio: "1" }}>
              <div className="absolute left-0 top-0 h-10 w-10 border-l-4 border-t-4 border-white/80 rounded-tl-lg" />
              <div className="absolute right-0 top-0 h-10 w-10 border-r-4 border-t-4 border-white/80 rounded-tr-lg" />
              <div className="absolute bottom-0 left-0 h-10 w-10 border-b-4 border-l-4 border-white/80 rounded-bl-lg" />
              <div className="absolute bottom-0 right-0 h-10 w-10 border-b-4 border-r-4 border-white/80 rounded-br-lg" />

              <div
                className="absolute left-2 right-2 h-0.5 bg-[var(--color-primary)] shadow-[0_0_8px_var(--color-primary)]"
                style={{ animation: "scanline 2s ease-in-out infinite" }}
              />
            </div>
          </div>
        )}
      </div>

      <p className="text-sm text-gray-500">
        Arahkan kamera ke QR Code
      </p>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes scanline {
          0%, 100% { top: 0; }
          50% { top: calc(100% - 2px); }
        }
        #${READER_ID} video {
          width: 100% !important;
          height: 100% !important;
          object-fit: cover !important;
          border-radius: 0 !important;
        }
        #${READER_ID} img {
          display: none !important;
        }
        #${READER_ID} > div {
          border: none !important;
        }
      ` }} />
    </div>
  );
}
