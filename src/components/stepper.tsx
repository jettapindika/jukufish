"use client";

import { Minus, Plus } from "lucide-react";

interface StepperProps {
  value: number;
  onChange: (val: number) => void;
  step?: number;
  min?: number;
  unit?: string;
}

export function Stepper({
  value,
  onChange,
  step = 0.5,
  min = 0,
  unit = "kg",
}: StepperProps) {
  const decrement = () => {
    const next = Math.round((value - step) * 100) / 100;
    if (next >= min) onChange(next);
  };

  const increment = () => {
    const next = Math.round((value + step) * 100) / 100;
    onChange(next);
  };

  return (
    <div className="flex items-center justify-center gap-6">
      <button
        type="button"
        onClick={decrement}
        disabled={value <= min}
        className="flex items-center justify-center w-14 h-14 rounded-[var(--radius)] bg-gray-200 text-[var(--color-foreground)] active:scale-95 transition-all duration-100 disabled:opacity-40"
      >
        <Minus className="w-6 h-6" strokeWidth={2.5} />
      </button>

      <div className="flex items-baseline gap-1 min-w-[100px] justify-center">
        <span className="text-4xl font-bold text-[var(--color-foreground)] tabular-nums">
          {value.toFixed(1)}
        </span>
        <span className="text-lg font-medium text-[var(--color-muted)]">{unit}</span>
      </div>

      <button
        type="button"
        onClick={increment}
        className="flex items-center justify-center w-14 h-14 rounded-[var(--radius)] bg-[var(--color-primary)] text-[var(--color-on-primary)] active:scale-95 transition-all duration-100"
      >
        <Plus className="w-6 h-6" strokeWidth={2.5} />
      </button>
    </div>
  );
}
