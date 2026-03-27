"use client";

import { cn } from "@/lib/utils";

interface QualityRingProps {
  score: number;
  size?: number;
  className?: string;
}

export function QualityRing({ score, size = 64, className }: QualityRingProps) {
  const radius = (size - 8) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;
  const strokeDashoffset = circumference - progress;

  const color =
    score >= 80
      ? "text-emerald-500"
      : score >= 60
      ? "text-amber-500"
      : "text-red-500";

  const strokeColor =
    score >= 80 ? "#10b981" : score >= 60 ? "#f59e0b" : "#ef4444";

  return (
    <div className={cn("relative inline-flex items-center justify-center", className)}>
      <svg width={size} height={size} className="-rotate-90">
        {/* Background ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={4}
          className="text-muted/50"
        />
        {/* Progress ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={strokeColor}
          strokeWidth={4}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <span
        className={cn(
          "absolute text-xs font-bold",
          color
        )}
      >
        {score}
      </span>
    </div>
  );
}
