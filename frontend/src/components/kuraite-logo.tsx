import { cn } from "@/lib/utils";

interface KuraiteIconProps {
  size?: number;
  className?: string;
}

/**
 * Kuraite icon — three gradient bars descending in width.
 * Renders as inline SVG for crisp display at any size.
 */
export function KuraiteIcon({ size = 32, className }: KuraiteIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 64 64"
      width={size}
      height={size}
      className={className}
    >
      <defs>
        <linearGradient id="ki-bar1" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#FEDA75" />
          <stop offset="100%" stopColor="#F58529" />
        </linearGradient>
        <linearGradient id="ki-bar2" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#F58529" />
          <stop offset="100%" stopColor="#DD2A7B" />
        </linearGradient>
        <linearGradient id="ki-bar3" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#DD2A7B" />
          <stop offset="100%" stopColor="#8134AF" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="16" fill="#14142a" />
      <g transform="translate(12, 12)">
        <rect x="0" y="2" width="40" height="8" rx="4" fill="url(#ki-bar1)" />
        <rect x="0" y="16" width="30" height="8" rx="4" fill="url(#ki-bar2)" />
        <rect x="0" y="30" width="20" height="8" rx="4" fill="url(#ki-bar3)" />
      </g>
    </svg>
  );
}

interface KuraiteWordmarkProps {
  className?: string;
}

/**
 * Kuraite wordmark — "Kuraite" text styled per brand spec.
 * Use alongside KuraiteIcon for the full logo.
 */
export function KuraiteWordmark({ className }: KuraiteWordmarkProps) {
  return (
    <span
      className={cn(
        "font-semibold text-lg tracking-tight",
        className
      )}
      style={{ letterSpacing: "-0.3px" }}
    >
      Kuraite
    </span>
  );
}
