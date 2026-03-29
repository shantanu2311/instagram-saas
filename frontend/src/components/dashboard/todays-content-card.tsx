"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
  Loader2,
  Pencil,
  Send,
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

const contentTypeOptions = [
  { value: "image", label: "Image", icon: ImageIcon },
  { value: "carousel", label: "Carousel", icon: LayoutGrid },
  { value: "reel", label: "Reel", icon: Film },
];

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
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [editTopic, setEditTopic] = useState("");
  const [editHeadline, setEditHeadline] = useState("");
  const [editContentType, setEditContentType] = useState("");
  const [generatedCaption, setGeneratedCaption] = useState<string | null>(null);
  const [generatedHashtags, setGeneratedHashtags] = useState<string[]>([]);
  const [generateError, setGenerateError] = useState<string | null>(null);

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

  const isCompleted = slot.status === "created" || slot.status === "uploaded" || slot.status === "skipped" || slot.status === "missed";

  const startEditing = () => {
    setEditTopic(slot.topic);
    setEditHeadline(slot.headline || "");
    setEditContentType(slot.contentType);
    setIsEditing(true);
    setGeneratedCaption(null);
    setGeneratedHashtags([]);
    setGenerateError(null);
  };

  const handleGenerate = async () => {
    setGenerating(true);
    setGenerateError(null);
    try {
      const res = await fetch("/api/studio/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: editTopic || slot.topic,
          contentType: editContentType || slot.contentType,
          pillar: slot.pillar,
          headline: editHeadline || slot.headline,
          calendarSlotId: slot.id,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Generation failed" }));
        throw new Error(err.error || "Generation failed");
      }
      const data = await res.json();
      setGeneratedCaption(data.caption || "");
      setGeneratedHashtags(data.hashtags || []);
    } catch (err) {
      setGenerateError(err instanceof Error ? err.message : "Generation failed. Try again.");
    } finally {
      setGenerating(false);
    }
  };

  const handleSaveAndApprove = async () => {
    if (!generatedCaption) return;
    setGenerating(true);
    try {
      // Save to drafts
      await fetch("/api/studio/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          caption: generatedCaption,
          hashtags: generatedHashtags,
          contentType: editContentType || slot.contentType,
          pillar: slot.pillar,
          topic: editTopic || slot.topic,
          calendarSlotId: slot.id,
          status: "draft",
        }),
      });

      // Update calendar slot status
      await fetch(`/api/calendar/slots/${slot.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "created" }),
      });

      setIsEditing(false);
      setGeneratedCaption(null);
      onSlotUpdated?.();
    } catch {
      setGenerateError("Failed to save. Try again.");
    } finally {
      setGenerating(false);
    }
  };

  // Build studio link with pre-populated params
  const studioParams = new URLSearchParams({
    topic: slot.topic,
    pillar: slot.pillar,
    contentType: slot.contentType,
    calendarSlotId: slot.id,
    ...(slot.headline ? { headline: slot.headline } : {}),
  });

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

        {/* Editing / Generation Mode */}
        {isEditing && !isCompleted ? (
          <div className="mt-3 space-y-4">
            {/* Editable fields */}
            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1 block">
                  Topic
                </label>
                <input
                  type="text"
                  value={editTopic}
                  onChange={(e) => setEditTopic(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ig-pink/30"
                  placeholder="What's this post about?"
                />
              </div>
              <div>
                <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1 block">
                  Headline
                </label>
                <input
                  type="text"
                  value={editHeadline}
                  onChange={(e) => setEditHeadline(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ig-pink/30"
                  placeholder="Draft headline for the post"
                />
              </div>
              <div>
                <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1 block">
                  Content Type
                </label>
                <div className="flex gap-2">
                  {contentTypeOptions.map((opt) => {
                    const OptIcon = opt.icon;
                    return (
                      <button
                        key={opt.value}
                        onClick={() => setEditContentType(opt.value)}
                        className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${
                          editContentType === opt.value
                            ? "border-ig-pink bg-ig-pink/10 text-ig-pink"
                            : "border-border text-muted-foreground hover:border-ig-pink/40"
                        }`}
                      >
                        <OptIcon className="h-3 w-3" />
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Generated content preview */}
            {generatedCaption && (
              <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-4 space-y-2">
                <p className="text-[11px] font-medium text-emerald-500 uppercase tracking-wider">
                  Generated Content
                </p>
                <p className="text-sm whitespace-pre-line leading-relaxed">{generatedCaption}</p>
                {generatedHashtags.length > 0 && (
                  <p className="text-xs text-muted-foreground">{generatedHashtags.join(" ")}</p>
                )}
              </div>
            )}

            {/* Error */}
            {generateError && (
              <div className="flex items-center gap-2 text-xs text-red-500">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                {generateError}
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-2 pt-1">
              {!generatedCaption ? (
                <Button onClick={handleGenerate} disabled={generating || !editTopic.trim()} className="gap-2">
                  {generating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4" />
                  )}
                  {generating ? "Generating..." : "Generate Content"}
                </Button>
              ) : (
                <>
                  <Button onClick={handleSaveAndApprove} disabled={generating} className="gap-2">
                    {generating ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                    Approve & Save
                  </Button>
                  <Button onClick={handleGenerate} disabled={generating} variant="outline" className="gap-2">
                    <Sparkles className="h-4 w-4" />
                    Regenerate
                  </Button>
                </>
              )}
              <Button variant="ghost" onClick={() => setIsEditing(false)} disabled={generating}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          /* Default display mode */
          <div className="flex flex-col md:flex-row items-start md:items-center gap-5 mt-3">
            {/* Icon */}
            <div className="h-14 w-14 rounded-2xl ig-gradient flex items-center justify-center shrink-0">
              <ContentIcon className="h-7 w-7 text-white" />
            </div>

            {/* Content info */}
            <div className="flex-1 space-y-2 min-w-0">
              <h2 className="text-lg font-semibold leading-tight">{slot.topic}</h2>
              {slot.headline && (
                <p className="text-sm text-muted-foreground">{slot.headline}</p>
              )}
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
                <Button onClick={startEditing} className="gap-2">
                  <Pencil className="h-4 w-4" />
                  Work on This
                </Button>
                <Link href={`/studio?${studioParams.toString()}`}>
                  <Button variant="outline" className="gap-2">
                    <Wand2 className="h-4 w-4" />
                    Open in Studio
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
        )}
      </CardContent>
    </Card>
  );
}
