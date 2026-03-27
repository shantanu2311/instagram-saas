"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Circle, ArrowRight } from "lucide-react";

interface Step {
  label: string;
  done: boolean;
  href: string;
}

const steps: Step[] = [
  { label: "Create account", done: true, href: "#" },
  { label: "Connect Instagram", done: false, href: "/settings" },
  { label: "Set up brand", done: false, href: "/settings" },
  { label: "Create strategy", done: false, href: "/strategy" },
  { label: "Create first post", done: false, href: "/studio" },
];

export function OnboardingChecklist() {
  const completed = steps.filter((s) => s.done).length;
  const progress = (completed / steps.length) * 100;

  return (
    <Card className="border-border/40">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">Getting Started</CardTitle>
        <div className="flex items-center gap-3 mt-2">
          <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full ig-gradient transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-xs text-muted-foreground font-medium whitespace-nowrap">
            {completed}/{steps.length} complete
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-1">
        {steps.map((step) => (
          <Link
            key={step.label}
            href={step.done ? "#" : step.href}
            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors group ${
              step.done
                ? "text-muted-foreground"
                : "hover:bg-muted/50 text-foreground"
            }`}
          >
            {step.done ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
            ) : (
              <Circle className="h-4 w-4 text-muted-foreground/40 shrink-0" />
            )}
            <span className={step.done ? "line-through" : ""}>
              {step.label}
            </span>
            {!step.done && (
              <ArrowRight className="h-3.5 w-3.5 ml-auto text-muted-foreground/40 group-hover:text-ig-pink transition-colors" />
            )}
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}
