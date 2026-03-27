"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageTransition } from "@/components/page-transition";
import { useStrategyStore } from "@/lib/stores/strategy-store";

const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

type CalendarView = "month" | "week" | "list";

const dotColor: Record<string, string> = {
  image: "bg-ig-pink",
  reel: "bg-blue-500",
  carousel: "bg-ig-orange",
};

const pillarColorMap: Record<string, string> = {
  Education: "bg-ig-pink",
  Entertainment: "bg-blue-500",
  Promotion: "bg-ig-orange",
  Community: "bg-emerald-500",
  Inspiration: "bg-amber-500",
};

export default function CalendarPage() {
  const [view, setView] = useState<CalendarView>("month");
  const { calendar } = useStrategyStore();
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const year = viewYear;
  const month = viewMonth;
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthName = new Date(year, month).toLocaleString("default", { month: "long" });

  const goToPrevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(viewYear - 1); }
    else setViewMonth(viewMonth - 1);
  };
  const goToNextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(viewYear + 1); }
    else setViewMonth(viewMonth + 1);
  };

  // Build slot lookup from strategy calendar
  const slotMap = useMemo(() => {
    const map: Record<number, any> = {};
    if (calendar?.slots) {
      calendar.slots.forEach((s) => {
        map[s.day] = s;
      });
    }
    return map;
  }, [calendar]);

  const hasSlots = calendar?.slots && calendar.slots.length > 0;

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  // Get current week days
  const currentDayOfWeek = today.getDay();
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - currentDayOfWeek);

  const weekDays: { date: number; name: string; isToday: boolean }[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    weekDays.push({
      date: d.getDate(),
      name: dayNames[i],
      isToday: d.getDate() === today.getDate() && d.getMonth() === today.getMonth(),
    });
  }

  // Empty state component
  const EmptyState = () => (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="h-12 w-12 rounded-full bg-ig-pink/10 flex items-center justify-center mb-4">
        <Calendar className="h-6 w-6 text-ig-pink" />
      </div>
      <p className="text-sm font-medium">No posts scheduled</p>
      <p className="text-xs text-muted-foreground mt-1">
        Create your content strategy to populate your calendar with posts.
      </p>
      <Link href="/strategy" className="mt-4">
        <Button variant="outline" size="sm" className="gap-1.5">
          <Sparkles className="h-3.5 w-3.5" />
          Set Up Strategy
        </Button>
      </Link>
    </div>
  );

  return (
    <PageTransition>
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Content Calendar</h1>
          <p className="text-sm text-muted-foreground">
            Plan and schedule your Instagram posts.
          </p>
        </div>
        {/* View toggle */}
        <div className="flex items-center gap-1 rounded-lg border border-border/40 p-1">
          {(["month", "week", "list"] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                view === v
                  ? "bg-ig-pink/10 text-ig-pink"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {v.charAt(0).toUpperCase() + v.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <div className="h-2 w-2 rounded-full bg-ig-pink" />
          Image
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-2 w-2 rounded-full bg-blue-500" />
          Reel
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-2 w-2 rounded-full bg-ig-orange" />
          Carousel
        </div>
      </div>

      {/* Month View */}
      {view === "month" && (
        <Card className="border-border/40">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                {monthName} {year}
              </CardTitle>
              <div className="flex gap-1">
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={goToPrevMonth}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={goToNextMonth}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-1">
              {dayNames.map((d) => (
                <div
                  key={d}
                  className="text-center text-[10px] font-medium text-muted-foreground py-2"
                >
                  {d}
                </div>
              ))}
              {cells.map((day, i) => {
                const slot = day ? slotMap[day] : null;
                return (
                  <div
                    key={i}
                    className={`min-h-[80px] rounded-lg border p-2 transition-colors ${
                      day === today.getDate()
                        ? "border-ig-pink/50 bg-ig-pink/5"
                        : day
                        ? "border-border/30 hover:border-ig-pink/20"
                        : "border-transparent"
                    }`}
                  >
                    {day && (
                      <>
                        <span
                          className={`text-xs ${
                            day === today.getDate()
                              ? "text-ig-pink font-bold"
                              : "text-muted-foreground"
                          }`}
                        >
                          {day}
                        </span>
                        {slot && (
                          <div className="mt-1 space-y-0.5">
                            <div className="flex items-center gap-1">
                              <span
                                className={`h-2 w-2 rounded-full shrink-0 ${
                                  pillarColorMap[slot.pillar] ?? "bg-ig-pink"
                                }`}
                              />
                              <span className={`h-2 w-2 rounded-full shrink-0 ${
                                dotColor[slot.contentType] ?? "bg-ig-pink"
                              }`} />
                            </div>
                            <p className="text-[10px] leading-tight line-clamp-2">
                              {slot.topic}
                            </p>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                );
              })}
            </div>
            {!hasSlots && <EmptyState />}
          </CardContent>
        </Card>
      )}

      {/* Week View */}
      {view === "week" && (
        <Card className="border-border/40">
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              This Week
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-2">
              {weekDays.map((wd) => {
                const slot = slotMap[wd.date];
                return (
                  <div
                    key={wd.name}
                    className={`rounded-lg border p-3 min-h-[160px] ${
                      wd.isToday
                        ? "border-ig-pink/50 bg-ig-pink/5"
                        : "border-border/30"
                    }`}
                  >
                    <div className="text-center mb-2">
                      <p className="text-[10px] text-muted-foreground">
                        {wd.name}
                      </p>
                      <p
                        className={`text-sm font-medium ${
                          wd.isToday ? "text-ig-pink" : ""
                        }`}
                      >
                        {wd.date}
                      </p>
                    </div>
                    {slot ? (
                      <div className="space-y-1">
                        <div className="flex items-center gap-1 justify-center">
                          <span className={`h-2 w-2 rounded-full ${pillarColorMap[slot.pillar] ?? "bg-ig-pink"}`} />
                          <span className={`h-2 w-2 rounded-full ${dotColor[slot.contentType] ?? "bg-ig-pink"}`} />
                        </div>
                        <p className="text-[10px] text-center leading-tight line-clamp-3">{slot.topic}</p>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-16">
                        <span className="text-[10px] text-muted-foreground/40">
                          No posts
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            {!hasSlots && <EmptyState />}
          </CardContent>
        </Card>
      )}

      {/* List View */}
      {view === "list" && (
        <Card className="border-border/40">
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Scheduled Posts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <EmptyState />
          </CardContent>
        </Card>
      )}
    </div>
    </PageTransition>
  );
}
