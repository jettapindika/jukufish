import type { FreshnessStatus } from "@/lib/aging";

interface FreshnessBarProps {
  percentage: number;
  status: FreshnessStatus;
  color: string;
}

export function FreshnessBar({ percentage, color, status }: FreshnessBarProps) {
  return (
    <div className="h-2 w-full rounded-full bg-gray-200 overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-500 ease-out${status === "critical" ? " freshness-critical" : ""}`}
        style={{ width: `${Math.max(100 - Math.min(percentage, 100), 0)}%`, backgroundColor: color }}
      />
    </div>
  );
}
