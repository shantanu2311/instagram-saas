"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lightbulb, ArrowRight, Target, Sparkles } from "lucide-react";

interface StrategySummaryCardProps {
  hasStrategy?: boolean;
  pillars?: string[];
  nextMilestone?: string;
}

export function StrategySummaryCard({
  hasStrategy = false,
  pillars = [],
  nextMilestone,
}: StrategySummaryCardProps) {
  if (!hasStrategy) {
    return (
      <Card className="border-border/40">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-ig-pink" />
            Strategy
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">
                Not configured
              </p>
              <p className="text-xs text-muted-foreground">
                Set up your content strategy to unlock smart scheduling
              </p>
            </div>
            <Link href="/strategy">
              <Button variant="outline" size="sm" className="gap-1.5 shrink-0">
                Set Up
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/40">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Target className="h-4 w-4 text-ig-pink" />
            Active Strategy
          </CardTitle>
          <Link href="/strategy">
            <Button variant="ghost" size="sm" className="text-xs h-7 px-2">
              View
              <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap gap-1.5">
          {pillars.map((p) => (
            <span
              key={p}
              className="text-[10px] bg-ig-pink/10 text-ig-pink rounded-full px-2.5 py-0.5 font-medium"
            >
              {p}
            </span>
          ))}
        </div>
        {nextMilestone && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Sparkles className="h-3 w-3 text-ig-orange" />
            Next milestone: {nextMilestone}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
