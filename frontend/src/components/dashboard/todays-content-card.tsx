"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Sparkles,
  Wand2,
  Image as ImageIcon,
  Film,
  LayoutGrid,
  Clock,
  CheckCircle2,
  SkipForward,
  AlertCircle,
} from "lucide-react";
import { MarkDoneDialog } from "@/components/dashboard/mark-done-dialog";

interface CalendarSlotData {
  id: string;
  date: string;
  pillar: string;
  contentType: string;
  topic: string;
  headline: string;
  suggestedTime: string;
  status: string;
}

const contentTypeIcon: Record<string, typeof ImageIcon> = {
  image: ImageIcon,
  reel: Film,
  carousel: LayoutGrid,
};

const pillarColor: Record<string, string> = {
  Education: "bg-ig-pink/10 text-ig-pink",
  Entertainment: "bg-blue-500/10 text-blue-500",
  Promotion: "bg-ig-orange/10 text-ig-orange",
  Community: "bg-emerald-500/10 text-emerald-500",
  Inspiration: "bg-amber-500/10 text-amber-500",
};

const statusConfig: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  pending: { label: "Not started", color: "text-muted-foreground", icon: Clock },
  created: { label: "Content ready", color: "text-emerald-500", icon: CheckCircle2 },
  uploaded: { label: "Uploaded", color: "text-emerald-500", icon: CheckCircle2 },
  skipped: { label: "Skipped", color: "text-amber-500", icon: SkipForward },
  missed: { label: "Missed", color: "text-red-400", icon: AlertCircle },
};

export function TodaysContentCard({ slot, onSlotUpdated }: { slot: CalendarSlotData | null; onSlotUpdated?: () => void }) {
  // No calendar slot for today
  if (!slot) {
    return (
      <Card className="border-border/40 bg-gradient-to-br from-ig-pink/5 via-ig-orange/5 to-transparent">
        <CardContent className="pt-6 pb-6">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            <div className="h-14 w-14 rounded-2xl ig-gradient flex items-center justify-center shrink-0">
              <Sparkles className="h-7 w-7 text-white" />
            </div>
            <div className="flex-1 space-y-2">
              <h2 className="text-lg font-semibold">No content planned for today</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Generate your content calendar to see daily topics, or head to the Studio to create something new.
              </p>
            </div>
            <Link href="/studio">
              <Button>
                <Wand2 className="h-4 w-4 mr-2" />
                Create Content
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  const ContentIcon = contentTypeIcon[slot.contentType] || ImageIcon;
  const pillColor = pillarColor[slot.pillar] || "bg-muted text-muted-foreground";
  const status = statusConfig[slot.status] || statusConfig.pending;
  const StatusIcon = status.icon;

  // Build studio link with pre-populated params
  const studioParams = new URLSearchParams({
    topic: slot.topic,
    pillar: slot.pillar,
    contentType: slot.contentType,
    calendarSlotId: slot.id,
    ...(slot.headline ? { headline: slot.headline } : {}),
  });

  const isCompleted = slot.status === "created" || slot.status === "uploaded" || slot.status === "skipped" || slot.status === "missed";

  return (
    <Card className="border-border/40 bg-gradient-to-br from-ig-pink/5 via-ig-orange/5 to-transparent overflow-hidden">
      <CardContent className="pt-6 pb-6">
        <div className="flex items-start gap-1 mb-1">
          <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
            Today&apos;s Content
          </p>
          <div className={`flex items-center gap-1 ml-auto text-[11px] font-medium ${status.color}`}>
            <StatusIcon className="h-3.5 w-3.5" />
            {status.label}
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-start md:items-center gap-5 mt-3">
          {/* Icon */}
          <div className="h-14 w-14 rounded-2xl ig-gradient flex items-center justify-center shrink-0">
            <ContentIcon className="h-7 w-7 text-white" />
          </div>

          {/* Content info */}
          <div className="flex-1 space-y-2 min-w-0">
            <h2 className="text-lg font-semibold leading-tight">{slot.topic}</h2>
            <div className="flex flex-wrap items-center gap-2">
              <span className={`text-[11px] font-medium rounded-full px-2.5 py-0.5 ${pillColor}`}>
                {slot.pillar}
              </span>
              <span className="text-[11px] text-muted-foreground capitalize flex items-center gap-1">
                <ContentIcon className="h-3 w-3" />
                {slot.contentType}
              </span>
              {slot.suggestedTime && (
                <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {slot.suggestedTime}
                </span>
              )}
            </div>
          </div>

          {/* CTAs */}
          {!isCompleted && (
            <div className="flex items-center gap-2 shrink-0">
              <Link href={`/studio?${studioParams.toString()}`}>
                <Button className="gap-2">
                  <Wand2 className="h-4 w-4" />
                  Create This Post
                </Button>
              </Link>
              <MarkDoneDialog
                slotId={slot.id}
                topic={slot.topic}
                contentType={slot.contentType}
                onMarkedDone={onSlotUpdated}
              />
            </div>
          )}
          {isCompleted && (
            <div className="flex items-center gap-2 shrink-0">
              <Link href="/queue">
                <Button variant="outline" className="gap-2">
                  View in Queue
                </Button>
              </Link>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
