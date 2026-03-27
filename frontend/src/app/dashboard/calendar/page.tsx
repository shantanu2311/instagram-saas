"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "lucide-react";

const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function CalendarPage() {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthName = today.toLocaleString("default", { month: "long" });

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Content Calendar</h1>
        <p className="text-sm text-muted-foreground">
          Plan and schedule your Instagram posts.
        </p>
      </div>

      <Card className="border-border/40">
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            {monthName} {year}
          </CardTitle>
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
            {cells.map((day, i) => (
              <div
                key={i}
                className={`min-h-[80px] rounded-lg border p-2 ${
                  day === today.getDate()
                    ? "border-ig-pink/50 bg-ig-pink/5"
                    : day
                    ? "border-border/30 hover:border-ig-pink/20"
                    : "border-transparent"
                }`}
              >
                {day && (
                  <span
                    className={`text-xs ${
                      day === today.getDate()
                        ? "text-ig-pink font-bold"
                        : "text-muted-foreground"
                    }`}
                  >
                    {day}
                  </span>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
