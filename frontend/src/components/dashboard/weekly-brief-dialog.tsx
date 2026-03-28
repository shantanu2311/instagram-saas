"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { CalendarHeart, Loader2, Sparkles } from "lucide-react";

interface WeeklyBriefDialogProps {
  brandId: string;
  weekStart: string; // ISO date string for Monday
  existingBrief?: {
    launches?: string;
    events?: string;
    trendingTopics?: string;
  } | null;
  onSave?: () => void;
}

export function WeeklyBriefDialog({
  brandId,
  weekStart,
  existingBrief,
  onSave,
}: WeeklyBriefDialogProps) {
  const [open, setOpen] = useState(false);
  const [launches, setLaunches] = useState(existingBrief?.launches || "");
  const [events, setEvents] = useState(existingBrief?.events || "");
  const [trendingTopics, setTrendingTopics] = useState(existingBrief?.trendingTopics || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const hasExisting = !!(existingBrief?.launches || existingBrief?.events || existingBrief?.trendingTopics);

  async function handleSave() {
    setSaving(true);
    setError("");

    try {
      const res = await fetch("/api/briefs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brandId,
          weekStartDate: weekStart,
          launches: launches.trim() || null,
          events: events.trim() || null,
          trendingTopics: trendingTopics.trim() || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save brief");
      }

      setOpen(false);
      onSave?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="outline" className="gap-2" />
        }
      >
        <CalendarHeart className="h-4 w-4" />
        {hasExisting ? "Edit Brief" : "Set Weekly Brief"}
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-ig-pink" />
            Weekly Content Brief
          </DialogTitle>
          <DialogDescription>
            Tell the AI what&apos;s happening this week so your content stays relevant.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div>
            <label
              htmlFor="brief-launches"
              className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider"
            >
              Anything launching this week?
            </label>
            <textarea
              id="brief-launches"
              value={launches}
              onChange={(e) => setLaunches(e.target.value)}
              placeholder="New product, collection drop, feature release..."
              className="mt-1.5 w-full rounded-lg border border-border/50 bg-muted/30 p-3 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-ig-pink/30"
              rows={2}
            />
          </div>

          <div>
            <label
              htmlFor="brief-events"
              className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider"
            >
              Any events or important dates?
            </label>
            <textarea
              id="brief-events"
              value={events}
              onChange={(e) => setEvents(e.target.value)}
              placeholder="Pop-up shop, webinar, holiday sale, collaboration..."
              className="mt-1.5 w-full rounded-lg border border-border/50 bg-muted/30 p-3 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-ig-pink/30"
              rows={2}
            />
          </div>

          <div>
            <label
              htmlFor="brief-trends"
              className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider"
            >
              Trending topics to leverage?
            </label>
            <textarea
              id="brief-trends"
              value={trendingTopics}
              onChange={(e) => setTrendingTopics(e.target.value)}
              placeholder="Viral audio, meme format, industry news..."
              className="mt-1.5 w-full rounded-lg border border-border/50 bg-muted/30 p-3 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-ig-pink/30"
              rows={2}
            />
          </div>

          {error && (
            <p className="text-xs text-red-500">{error}</p>
          )}
        </div>

        <DialogFooter>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="gap-2"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            {saving ? "Saving..." : "Save Brief"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
