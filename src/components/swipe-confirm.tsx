"use client";

import { useRef, useState, useCallback } from "react";
import { ChevronRight } from "lucide-react";

interface SwipeConfirmProps {
  onConfirm: () => void;
  label?: string;
}

export function SwipeConfirm({
  onConfirm,
  label = "Geser untuk konfirmasi",
}: SwipeConfirmProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [offsetX, setOffsetX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startXRef = useRef(0);
  const confirmedRef = useRef(false);

  const THUMB_SIZE = 56;
  const THRESHOLD = 0.8;

  const getMaxTravel = useCallback(() => {
    if (!trackRef.current) return 200;
    return trackRef.current.offsetWidth - THUMB_SIZE;
  }, []);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    confirmedRef.current = false;
    startXRef.current = e.touches[0].clientX;
    setIsDragging(true);
  }, []);

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!isDragging) return;
      const delta = e.touches[0].clientX - startXRef.current;
      const max = getMaxTravel();
      setOffsetX(Math.max(0, Math.min(delta, max)));
    },
    [isDragging, getMaxTravel]
  );

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
    const max = getMaxTravel();
    if (offsetX >= max * THRESHOLD && !confirmedRef.current) {
      confirmedRef.current = true;
      setOffsetX(max);
      onConfirm();
    } else {
      setOffsetX(0);
    }
  }, [offsetX, getMaxTravel, onConfirm]);

  return (
    <div
      ref={trackRef}
      className="relative h-16 w-full rounded-full bg-gray-200 overflow-hidden select-none"
    >
      <span className="absolute inset-0 flex items-center justify-center text-sm font-semibold text-[var(--color-muted)] pointer-events-none">
        {label}
      </span>

      <div
        className={`absolute top-1 left-1 flex items-center justify-center rounded-full bg-[var(--color-primary)] text-[var(--color-on-primary)] ${
          isDragging ? "" : "transition-transform duration-300 ease-out"
        }`}
        style={{
          width: THUMB_SIZE - 8,
          height: THUMB_SIZE - 8,
          transform: `translateX(${offsetX}px)`,
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <ChevronRight className="w-6 h-6" />
      </div>
    </div>
  );
}
