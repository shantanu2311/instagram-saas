"use client";

import { cn } from "@/lib/utils";

interface IPhoneMockupProps {
  children: React.ReactNode;
  className?: string;
}

export function IPhoneMockup({ children, className }: IPhoneMockupProps) {
  return (
    <div
      className={cn(
        "relative rounded-[36px] border-[8px] border-neutral-800 bg-black overflow-hidden shadow-2xl",
        className
      )}
    >
      {/* Notch */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 z-10 w-[120px] h-[28px] bg-neutral-800 rounded-b-2xl flex items-center justify-center">
        <div className="w-[60px] h-[4px] rounded-full bg-neutral-700" />
      </div>
      {/* Screen content */}
      <div className="relative aspect-[9/19.5] overflow-hidden">{children}</div>
      {/* Home indicator */}
      <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-[100px] h-[4px] rounded-full bg-neutral-600" />
    </div>
  );
}
