"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Mic, MicOff, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";

interface VoiceRecorderProps {
  onTranscribed: (text: string) => void;
  onError?: (error: string) => void;
  apiUrl?: string;
}

type RecorderState = "idle" | "recording" | "processing" | "done" | "error";

export function VoiceRecorder({
  onTranscribed,
  onError,
  apiUrl = "http://localhost:8000/transcribe",
}: VoiceRecorderProps) {
  const [state, setState] = useState<RecorderState>("idle");
  const [transcript, setTranscript] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [elapsed, setElapsed] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const stopAll = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }, []);

  useEffect(() => () => stopAll(), [stopAll]);

  const trackAudioLevel = (stream: MediaStream) => {
    const ctx = new AudioContext();
    const src = ctx.createMediaStreamSource(stream);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 256;
    src.connect(analyser);
    analyserRef.current = analyser;

    const data = new Uint8Array(analyser.frequencyBinCount);
    const tick = () => {
      analyser.getByteFrequencyData(data);
      const avg = data.reduce((a, b) => a + b, 0) / data.length;
      setAudioLevel(Math.min(100, (avg / 128) * 100));
      animFrameRef.current = requestAnimationFrame(tick);
    };
    tick();
  };

  const startRecording = async () => {
    setErrorMsg("");
    setTranscript("");
    setElapsed(0);
    chunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      trackAudioLevel(stream);

      const mr = new MediaRecorder(stream, { mimeType: "audio/webm;codecs=opus" });
      mediaRecorderRef.current = mr;

      mr.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mr.onstop = async () => {
        stopAll();
        setState("processing");
        setAudioLevel(0);

        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const wavBlob = await convertToWav(blob);

        const form = new FormData();
        form.append("file", wavBlob, "audio.wav");

        try {
          const res = await fetch(apiUrl, { method: "POST", body: form });
          if (!res.ok) throw new Error(`Server error: ${res.status}`);
          const data = await res.json();

          if (data.error) throw new Error(data.error);

          setTranscript(data.text);
          setState("done");
          onTranscribed(data.text);
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : "Gagal menghubungi server";
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
    } catch {
      setErrorMsg("Mikrofon tidak bisa diakses. Pastikan izin mikrofon sudah diberikan.");
      setState("error");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    if (timerRef.current) clearInterval(timerRef.current);
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
  };

  const reset = () => {
    stopAll();
    setState("idle");
    setTranscript("");
    setErrorMsg("");
    setElapsed(0);
    setAudioLevel(0);
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
          <p className="text-sm font-semibold text-[var(--color-primary)]">
            Memproses suara...
          </p>
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

/**
 * Konversi Blob WebM/Opus → WAV sederhana via AudioContext decode + encode PCM.
 * Ini dibutuhkan karena model Whisper di HuggingFace pipeline-nya expect .wav
 */
async function convertToWav(blob: Blob): Promise<Blob> {
  const arrayBuffer = await blob.arrayBuffer();
  const ctx = new AudioContext({ sampleRate: 16000 });
  const decoded = await ctx.decodeAudioData(arrayBuffer);

  const numChannels = 1; // mono
  const sampleRate = 16000;
  const samples = decoded.getChannelData(0); // ambil channel pertama
  const length = samples.length;

  const wavBuffer = new ArrayBuffer(44 + length * 2);
  const view = new DataView(wavBuffer);

  const writeStr = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
  };

  writeStr(0, "RIFF");
  view.setUint32(4, 36 + length * 2, true);
  writeStr(8, "WAVE");
  writeStr(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * numChannels * 2, true);
  view.setUint16(32, numChannels * 2, true);
  view.setUint16(34, 16, true);
  writeStr(36, "data");
  view.setUint32(40, length * 2, true);

  let offset = 44;
  for (let i = 0; i < length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    offset += 2;
  }

  await ctx.close();
  return new Blob([wavBuffer], { type: "audio/wav" });
}