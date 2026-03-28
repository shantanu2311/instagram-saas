"use client";

import Link from "next/link";
import {
  CheckCircle2,
  Circle,
  AlertCircle,
  Image as ImageIcon,
  Film,
  LayoutGrid,
} from "lucide-react";

interface WeekSlot {
  id: string;
  date: string;
  pillar: string;
  contentType: string;
  topic: string;
  status: string;
}

const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const pillarDot: Record<string, string> = {
  Education: "bg-ig-pink",
  Entertainment: "bg-blue-500",
  Promotion: "bg-ig-orange",
  Community: "bg-emerald-500",
  Inspiration: "bg-amber-500",
};

const contentTypeIcon: Record<string, typeof ImageIcon> = {
  image: ImageIcon,
  reel: Film,
  carousel: LayoutGrid,
};

function getWeekDates(): Date[] {
  const today = new Date();
  const day = today.getDay();
  const dates: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - day + i);
    d.setHours(0, 0, 0, 0);
    dates.push(d);
  }
  return dates;
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
}

export function WeeklyStrip({ slots }: { slots: WeekSlot[] }) {
  const weekDates = getWeekDates();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Build lookup by date string (YYYY-MM-DD) using UTC to match server dates
  const slotMap = new Map<string, WeekSlot>();
  for (const slot of slots) {
    const d = new Date(slot.date);
    const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
    slotMap.set(key, slot);
  }

  // Count completed
  const completed = slots.filter(
    (s) => s.status === "created" || s.status === "uploaded"
  ).length;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
          This Week
        </p>
        <p className="text-[11px] text-muted-foreground">
          {completed} of {slots.length} posts done
        </p>
      </div>

      <div className="grid grid-cols-7 gap-1.5">
        {weekDates.map((date, i) => {
          const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
          const slot = slotMap.get(key);
          const isToday = isSameDay(date, today);
          const isPast = date < today && !isToday;
          const isMissed = isPast && slot && slot.status === "pending";
          const isDone = slot && (slot.status === "created" || slot.status === "uploaded");
          const ContentIcon = slot ? contentTypeIcon[slot.contentType] || Circle : Circle;

          return (
            <Link
              key={i}
              href={slot ? `/studio?calendarSlotId=${slot.id}&topic=${encodeURIComponent(slot.topic)}&pillar=${encodeURIComponent(slot.pillar)}&contentType=${slot.contentType}` : "/dashboard/calendar"}
              className={`
                rounded-xl border p-2.5 text-center transition-all hover:border-ig-pink/30
                ${isToday ? "border-ig-pink/50 bg-ig-pink/5 ring-1 ring-ig-pink/20" : "border-border/30"}
                ${isPast && !slot ? "opacity-40" : ""}
              `}
            >
              {/* Day label */}
              <p className={`text-[10px] font-medium ${isToday ? "text-ig-pink" : "text-muted-foreground"}`}>
                {dayLabels[i]}
              </p>
              {/* Date */}
              <p className={`text-sm font-semibold ${isToday ? "text-ig-pink" : ""}`}>
                {date.getDate()}
              </p>

              {/* Status indicator */}
              <div className="mt-1.5 flex flex-col items-center gap-1">
                {slot ? (
                  <>
                    <div className="flex items-center gap-0.5">
                      <span className={`h-1.5 w-1.5 rounded-full ${pillarDot[slot.pillar] || "bg-muted-foreground"}`} />
                      <ContentIcon className="h-3 w-3 text-muted-foreground" />
                    </div>
                    {isDone && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />}
                    {isMissed && <AlertCircle className="h-3.5 w-3.5 text-red-500" />}
                    {!isDone && !isMissed && isToday && (
                      <div className="h-1.5 w-1.5 rounded-full bg-ig-pink animate-pulse" />
                    )}
                  </>
                ) : (
                  <span className="text-[9px] text-muted-foreground/40">—</span>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
