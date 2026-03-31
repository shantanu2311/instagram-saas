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
      {/* Screen content */}
      <div className="relative aspect-[9/19.5] overflow-hidden">{children}</div>
      {/* Home indicator */}
      <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-[100px] h-[4px] rounded-full bg-neutral-600" />
    </div>
  );
}
