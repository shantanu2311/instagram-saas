"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useStrategyStore } from "@/lib/stores/strategy-store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Film,
  Image,
  LayoutGrid,
  TrendingUp,
  Clock,
  Sparkles,
} from "lucide-react";

const pillarColorMap: Record<string, string> = {
  Education: "bg-ig-pink",
  Entertainment: "bg-blue-500",
  Promotion: "bg-ig-orange",
  Community: "bg-emerald-500",
  Inspiration: "bg-amber-500",
};

const typeIconMap: Record<string, any> = {
  reel: Film,
  carousel: LayoutGrid,
  image: Image,
};

const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function CalendarPage() {
  const router = useRouter();
  const { calendar } = useStrategyStore();

  const [viewYear, setViewYear] = useState(new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState(new Date().getMonth());
  const [selectedSlot, setSelectedSlot] = useState<any | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  // If no calendar, redirect to strategy hub
  useEffect(() => {
    if (!calendar) {
      router.push("/strategy");
    }
  }, [calendar, router]);

  // Build calendar grid
  const grid = useMemo(() => {
    if (!calendar) return [];

    const firstDay = new Date(viewYear, viewMonth, 1).getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const slots = calendar.slots ?? [];

    // Build slot lookup by day number
    const slotMap: Record<number, any> = {};
    slots.forEach((s: any) => {
      slotMap[s.day] = s;
    });

    const cells: Array<{ day: number | null; slot: any | null }> = [];

    // Empty cells for days before the 1st
    for (let i = 0; i < firstDay; i++) {
      cells.push({ day: null, slot: null });
    }

    // Days of the month
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push({ day: d, slot: slotMap[d] ?? null });
    }

    // Pad to fill the last week
    while (cells.length % 7 !== 0) {
      cells.push({ day: null, slot: null });
    }

    return cells;
  }, [calendar, viewYear, viewMonth]);

  if (!calendar) return null;

  const monthName = new Date(viewYear, viewMonth).toLocaleString("default", {
    month: "long",
  });

  const goToPrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const goToNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  const handleCellClick = (slot: any) => {
    if (slot) {
      setSelectedSlot(slot);
      setDialogOpen(true);
    }
  };

  const handleGenerateContent = () => {
    if (!selectedSlot) return;
    const params = new URLSearchParams({
      topic: selectedSlot.topic,
      pillar: selectedSlot.pillar,
      type: selectedSlot.contentType,
    });
    router.push(`/studio?${params.toString()}`);
  };

  const TypeIcon = selectedSlot
    ? typeIconMap[selectedSlot.contentType] ?? Image
    : Image;

  return (
    <div className="p-6 max-w-5xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <CalendarIcon className="h-6 w-6 text-ig-pink" />
            Content Calendar
          </h1>
          <p className="text-sm text-muted-foreground">
            Your monthly content plan. Click a slot to see details.
          </p>
        </div>
      </div>

      {/* Month navigation */}
      <div className="flex items-center justify-between">
        <Button variant="outline" size="sm" onClick={goToPrevMonth}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h2 className="text-lg font-semibold">
          {monthName} {viewYear}
        </h2>
        <Button variant="outline" size="sm" onClick={goToNextMonth}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Calendar Grid */}
      <Card>
        <CardContent className="p-0">
          {/* Day headers */}
          <div className="grid grid-cols-7 border-b border-border/40">
            {dayNames.map((d) => (
              <div
                key={d}
                className="py-2 text-center text-xs font-medium text-muted-foreground"
              >
                {d}
              </div>
            ))}
          </div>

          {/* Grid cells */}
          <div className="grid grid-cols-7">
            {grid.map((cell, i) => (
              <div
                key={i}
                onClick={() => handleCellClick(cell.slot)}
                className={`min-h-[100px] border-b border-r border-border/20 p-1.5 transition-colors ${
                  cell.day === null
                    ? "bg-muted/20"
                    : cell.slot
                      ? "hover:bg-ig-pink/5 cursor-pointer"
                      : ""
                }`}
              >
                {cell.day !== null && (
                  <>
                    <span className="text-xs text-muted-foreground">
                      {cell.day}
                    </span>
                    {cell.slot && (
                      <div className="mt-1 space-y-1">
                        <div className="flex items-center gap-1">
                          <span
                            className={`h-2 w-2 rounded-full shrink-0 ${
                              pillarColorMap[cell.slot.pillar] ?? "bg-ig-pink"
                            }`}
                          />
                          {(() => {
                            const Icon =
                              typeIconMap[cell.slot.contentType] ?? Image;
                            return (
                              <Icon className="h-3 w-3 text-muted-foreground shrink-0" />
                            );
                          })()}
                        </div>
                        <p className="text-[10px] leading-tight line-clamp-2">
                          {cell.slot.topic}
                        </p>
                        {cell.slot.isTrendBased && (
                          <span className="inline-flex items-center gap-0.5 text-[9px] text-ig-orange">
                            <TrendingUp className="h-2.5 w-2.5" />
                            Trend
                          </span>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Pillar Legend */}
      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
        {Object.entries(pillarColorMap).map(([name, color]) => (
          <span key={name} className="flex items-center gap-1.5">
            <span className={`h-2 w-2 rounded-full ${color}`} />
            {name}
          </span>
        ))}
      </div>

      {/* Slot Detail Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <TypeIcon className="h-5 w-5 text-ig-pink" />
              {selectedSlot?.topic}
            </DialogTitle>
            <DialogDescription>
              {selectedSlot?.dayOfWeek}, {monthName} {selectedSlot?.day}
            </DialogDescription>
          </DialogHeader>

          {selectedSlot && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Content Type</p>
                  <p className="font-medium capitalize">
                    {selectedSlot.contentType}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Pillar</p>
                  <p className="font-medium">{selectedSlot.pillar}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">
                    Suggested Time
                  </p>
                  <p className="font-medium flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {selectedSlot.suggestedTime}
                  </p>
                </div>
                {selectedSlot.isTrendBased && (
                  <div>
                    <p className="text-xs text-muted-foreground">Type</p>
                    <Badge className="bg-ig-orange/10 text-ig-orange border-ig-orange/20 text-[10px]">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      Trend-based
                    </Badge>
                  </div>
                )}
              </div>

              {selectedSlot.headline && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">
                    Headline Draft
                  </p>
                  <p className="text-sm border-l-2 border-ig-pink/40 pl-3 italic">
                    {selectedSlot.headline}
                  </p>
                </div>
              )}

              <Button
                onClick={handleGenerateContent}
                className="w-full gap-2"
              >
                <Sparkles className="h-4 w-4" />
                Generate This Content
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
