"use client";

import { useState, useCallback } from "react";
import { Delete } from "lucide-react";

interface PinPadProps {
  onComplete: (pin: string) => void;
}

const KEYS = [
  "1", "2", "3",
  "4", "5", "6",
  "7", "8", "9",
  "",  "0", "back",
] as const;

export function PinPad({ onComplete }: PinPadProps) {
  const [digits, setDigits] = useState<string[]>([]);

  const handlePress = useCallback(
    (key: string) => {
      if (key === "back") {
        setDigits((prev) => prev.slice(0, -1));
        return;
      }
      if (key === "") return;

      setDigits((prev) => {
        if (prev.length >= 4) return prev;
        const next = [...prev, key];
        if (next.length === 4) {
          setTimeout(() => onComplete(next.join("")), 120);
        }
        return next;
      });
    },
    [onComplete]
  );

  return (
    <div className="flex flex-col items-center gap-8">
      <div className="flex gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className={`w-4 h-4 rounded-full transition-all duration-200 ${
              i < digits.length
                ? "bg-[var(--color-primary)] scale-110"
                : "bg-[var(--color-border)]"
            }`}
          />
        ))}
      </div>

      <div className="grid grid-cols-3 gap-4">
        {KEYS.map((key, i) => {
          if (key === "") {
            return <div key={i} className="w-16 h-16" />;
          }

          if (key === "back") {
            return (
              <button
                key={i}
                type="button"
                onClick={() => handlePress("back")}
                className="flex items-center justify-center w-16 h-16 rounded-[var(--radius)] bg-[var(--color-surface)] text-[var(--color-muted)] active:scale-95 active:bg-[var(--color-border)] transition-all duration-100"
              >
                <Delete className="w-6 h-6" />
              </button>
            );
          }

          return (
            <button
              key={i}
              type="button"
              onClick={() => handlePress(key)}
              className="flex items-center justify-center w-16 h-16 rounded-[var(--radius)] bg-[var(--color-surface)] text-[var(--color-foreground)] text-2xl font-bold shadow-sm active:scale-95 active:bg-[var(--color-primary)] active:text-[var(--color-on-primary)] transition-all duration-100"
            >
              {key}
            </button>
          );
        })}
      </div>
    </div>
  );
}
