"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageTransition } from "@/components/page-transition";

const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

type CalendarView = "month" | "week" | "list";

// Mock scheduled posts for demo
const mockPosts: Record<string, { type: "image" | "reel" | "carousel"; title: string }[]> = {
  "3": [{ type: "image", title: "Morning routine tips" }],
  "7": [{ type: "reel", title: "Behind the scenes" }],
  "10": [{ type: "carousel", title: "5 productivity hacks" }],
  "14": [{ type: "image", title: "Motivational quote" }],
  "18": [{ type: "reel", title: "Tutorial: photo editing" }],
  "21": [{ type: "image", title: "Industry stats" }, { type: "carousel", title: "Weekly roundup" }],
  "25": [{ type: "reel", title: "Q&A session" }],
  "28": [{ type: "image", title: "Brand story" }],
};

const dotColor: Record<string, string> = {
  image: "bg-ig-pink",
  reel: "bg-blue-500",
  carousel: "bg-ig-orange",
};

export default function CalendarPage() {
  const [view, setView] = useState<CalendarView>("month");
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthName = today.toLocaleString("default", { month: "long" });

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

  // All mock posts as list
  const listItems = Object.entries(mockPosts)
    .sort(([a], [b]) => Number(a) - Number(b))
    .flatMap(([day, posts]) =>
      posts.map((p) => ({ ...p, day: Number(day) }))
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
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0" disabled>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0" disabled>
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
                const posts = day ? mockPosts[String(day)] : undefined;
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
                        {posts && (
                          <div className="mt-1 space-y-0.5">
                            {posts.map((p, j) => (
                              <div key={j} className="flex items-center gap-1">
                                <div
                                  className={`h-1.5 w-1.5 rounded-full shrink-0 ${dotColor[p.type]}`}
                                />
                                <span className="text-[9px] text-muted-foreground truncate">
                                  {p.title}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                );
              })}
            </div>
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
                const posts = mockPosts[String(wd.date)];
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
                    {posts ? (
                      <div className="space-y-1.5">
                        {posts.map((p, j) => (
                          <div
                            key={j}
                            className="rounded-md bg-muted/50 p-1.5"
                          >
                            <div className="flex items-center gap-1">
                              <div
                                className={`h-1.5 w-1.5 rounded-full shrink-0 ${dotColor[p.type]}`}
                              />
                              <span className="text-[9px] font-medium truncate">
                                {p.title}
                              </span>
                            </div>
                          </div>
                        ))}
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
            <div className="space-y-1">
              {listItems.map((item, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-muted/50 transition-colors"
                >
                  <div
                    className={`h-2.5 w-2.5 rounded-full shrink-0 ${dotColor[item.type]}`}
                  />
                  <span className="text-xs text-muted-foreground font-medium w-20">
                    {monthName} {item.day}
                  </span>
                  <span className="text-xs text-muted-foreground capitalize w-16">
                    {item.type}
                  </span>
                  <span className="text-sm flex-1">{item.title}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
    </PageTransition>
  );
}
