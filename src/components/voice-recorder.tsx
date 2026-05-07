"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Mic, MicOff, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import type { WorkerMessage } from "@/utils/whisper-worker";

interface VoiceRecorderProps {
  onTranscribed: (text: string) => void;
  onError?: (error: string) => void;
}

type RecorderState = "idle" | "recording" | "processing" | "done" | "error";

export function VoiceRecorder({
  onTranscribed,
  onError,
}: VoiceRecorderProps) {
  const [state, setState] = useState<RecorderState>("idle");
  const [transcript, setTranscript] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [elapsed, setElapsed] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0);
  const [modelProgress, setModelProgress] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const workerRef = useRef<Worker | null>(null);

  useEffect(() => {
    try {
      const worker = new Worker(
        new URL("@/utils/whisper-worker.ts", import.meta.url),
        { type: "module" },
      );
      worker.onerror = (e) => {
        console.error("Whisper worker error:", e);
        setErrorMsg("Gagal memuat model AI. Coba refresh halaman.");
        setState("error");
      };
      workerRef.current = worker;
      return () => worker.terminate();
    } catch {
      setErrorMsg("Browser tidak mendukung fitur voice AI.");
      setState("error");
    }
  }, []);

  const stopAll = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close().catch(() => {});
      audioCtxRef.current = null;
    }
  }, []);

  useEffect(() => () => stopAll(), [stopAll]);

  const trackAudioLevel = (stream: MediaStream) => {
    const ctx = new AudioContext();
    audioCtxRef.current = ctx;
    const src = ctx.createMediaStreamSource(stream);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 256;
    src.connect(analyser);

    const data = new Uint8Array(analyser.frequencyBinCount);
    const tick = () => {
      analyser.getByteFrequencyData(data);
      const avg = data.reduce((a, b) => a + b, 0) / data.length;
      setAudioLevel(Math.min(100, (avg / 128) * 100));
      animFrameRef.current = requestAnimationFrame(tick);
    };
    tick();
  };

  const processAudio = async (blob: Blob) => {
    const arrayBuffer = await blob.arrayBuffer();
    const audioCtx = new AudioContext();
    const decoded = await audioCtx.decodeAudioData(arrayBuffer);

    const TARGET_SR = 16000;
    let float32: Float32Array;

    if (decoded.sampleRate === TARGET_SR) {
      float32 = decoded.getChannelData(0);
    } else {
      const offlineCtx = new OfflineAudioContext(
        1,
        Math.ceil(decoded.duration * TARGET_SR),
        TARGET_SR,
      );
      const src = offlineCtx.createBufferSource();
      src.buffer = decoded;
      src.connect(offlineCtx.destination);
      src.start();
      const resampled = await offlineCtx.startRendering();
      float32 = resampled.getChannelData(0);
    }

    await audioCtx.close();
    return float32;
  };

  const startRecording = async () => {
    setErrorMsg("");
    setTranscript("");
    setElapsed(0);
    setModelProgress(null);
    chunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      trackAudioLevel(stream);

      // Safari doesn't support WebM — pick a supported mime type
      const mimeType = [
        "audio/webm;codecs=opus",
        "audio/webm",
        "audio/mp4",
        "audio/aac",
        "",
      ].find((t) => t === "" || MediaRecorder.isTypeSupported(t)) ?? "";

      const mr = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);
      mediaRecorderRef.current = mr;

      mr.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mr.onstop = async () => {
        stopAll();
        setState("processing");
        setAudioLevel(0);

        try {
          const blob = new Blob(chunksRef.current, { type: mr.mimeType || "audio/mp4" });
          const audio = await processAudio(blob);

          const worker = workerRef.current;
          if (!worker) throw new Error("Worker not initialized");

          worker.onmessage = (e: MessageEvent<WorkerMessage>) => {
            const msg = e.data;
            if (!msg.status) return;

            if (msg.status === "loading") {
              setModelProgress("Memuat model Whisper...");
            } else if (msg.status === "download" && "progress" in msg) {
              setModelProgress(
                `Mengunduh model: ${Math.round(msg.progress as number)}%`,
              );
            } else if (msg.status === "ready") {
              setModelProgress("Mentranskrip audio...");
            } else if (msg.status === "complete" && "text" in msg) {
              setModelProgress(null);
              const text = msg.text as string;
              if (text) {
                setTranscript(text);
                setState("done");
                onTranscribed(text);
              } else {
                setErrorMsg("Tidak ada suara terdeteksi. Coba bicara lebih jelas.");
                setState("error");
              }
            } else if (msg.status === "error" && "error" in msg) {
              setModelProgress(null);
              const errText = msg.error as string;
              setErrorMsg(errText);
              setState("error");
              onError?.(errText);
            }
          };

          worker.postMessage({ audio });
        } catch (err) {
          const msg = err instanceof Error ? err.message : "Gagal memproses audio";
          setErrorMsg(msg);
          setState("error");
          onError?.(msg);
        }
      };

      mr.start(100);
      setState("recording");

      timerRef.current = setInterval(() => {
        setElapsed((e) => {
          if (e >= 30) {
            stopRecording();
            return e;
          }
          return e + 1;
        });
      }, 1000);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMsg(`Mikrofon gagal: ${msg}`);
      setState("error");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
  };

  const reset = () => {
    stopAll();
    setState("idle");
    setTranscript("");
    setErrorMsg("");
    setElapsed(0);
    setAudioLevel(0);
    setModelProgress(null);
  };

  const bars = Array.from({ length: 20 }, (_, i) => i);

  return (
    <div className="flex flex-col items-center gap-5">
      {/* Waveform visualizer */}
      <div className="flex items-center justify-center gap-[3px] h-12">
        {bars.map((i) => {
          const isActive = state === "recording";
          const height = isActive
            ? Math.max(4, Math.random() * audioLevel * 0.4 + 4)
            : 4;
          return (
            <div
              key={i}
              className="rounded-full transition-all duration-75"
              style={{
                width: 3,
                height: isActive ? `${height}px` : "4px",
                backgroundColor:
                  state === "recording"
                    ? `hsl(${210 + i * 3}, 80%, ${50 + i}%)`
                    : state === "done"
                    ? "var(--color-fresh, #22c55e)"
                    : state === "error"
                    ? "#ef4444"
                    : "#d1d5db",
                transform: isActive ? `scaleY(${0.5 + Math.random() * 0.5})` : "scaleY(1)",
              }}
            />
          );
        })}
      </div>

      {/* Main mic button */}
      <button
        onClick={state === "recording" ? stopRecording : state === "idle" || state === "done" || state === "error" ? startRecording : undefined}
        disabled={state === "processing"}
        className={`relative w-24 h-24 rounded-full flex items-center justify-center transition-all duration-200 active:scale-95 shadow-lg
          ${state === "recording"
            ? "bg-red-500 shadow-red-200 scale-110"
            : state === "done"
            ? "bg-[var(--color-fresh,#22c55e)] shadow-green-200"
            : state === "error"
            ? "bg-red-100"
            : state === "processing"
            ? "bg-gray-100 cursor-not-allowed"
            : "bg-[var(--color-primary)] shadow-blue-200 hover:scale-105"
          }`}
      >
        {/* Pulse ring saat recording */}
        {state === "recording" && (
          <>
            <span className="absolute inset-0 rounded-full bg-red-400 animate-ping opacity-30" />
            <span className="absolute inset-[-6px] rounded-full border-2 border-red-300 animate-pulse" />
          </>
        )}

        {state === "processing" ? (
          <Loader2 className="w-10 h-10 text-[var(--color-primary)] animate-spin" />
        ) : state === "done" ? (
          <CheckCircle2 className="w-10 h-10 text-white" />
        ) : state === "error" ? (
          <AlertCircle className="w-10 h-10 text-red-500" />
        ) : state === "recording" ? (
          <MicOff className="w-10 h-10 text-white" />
        ) : (
          <Mic className="w-10 h-10 text-white" />
        )}
      </button>

      {/* Status label */}
      <div className="text-center">
        {state === "idle" && (
          <p className="text-sm font-semibold text-gray-600">Tekan untuk mulai rekam</p>
        )}
        {state === "recording" && (
          <div>
            <p className="text-sm font-bold text-red-500">
              Merekam... {elapsed}s / 30s
            </p>
            <p className="text-xs text-gray-400 mt-0.5">Tekan lagi untuk berhenti</p>
          </div>
        )}
        {state === "processing" && (
          <div>
            <p className="text-sm font-semibold text-[var(--color-primary)]">
              Memproses suara...
            </p>
            {modelProgress && (
              <p className="text-xs text-gray-400 mt-1">{modelProgress}</p>
            )}
          </div>
        )}
        {state === "done" && transcript && (
          <div className="text-center max-w-xs">
            <p className="text-xs font-semibold text-gray-500 mb-1">Hasil transkripsi:</p>
            <p className="text-sm font-bold text-gray-800 bg-gray-50 rounded-lg px-3 py-2 border border-gray-200">
              &ldquo;{transcript}&rdquo;
            </p>
          </div>
        )}
        {state === "error" && (
          <div className="text-center max-w-xs">
            <p className="text-sm text-red-500 font-semibold">{errorMsg}</p>
          </div>
        )}
      </div>

      {/* Actions */}
      {(state === "done" || state === "error") && (
        <button
          onClick={reset}
          className="text-xs font-semibold text-[var(--color-primary)] underline underline-offset-2"
        >
          Rekam ulang
        </button>
      )}
    </div>
  );
}
