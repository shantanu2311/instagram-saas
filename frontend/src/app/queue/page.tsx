"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageTransition } from "@/components/page-transition";
import { useQueueStore, type QueueItem } from "@/lib/stores/queue-store";
import { useBrand } from "@/lib/hooks/use-brand";
import {
  CheckCircle2,
  XCircle,
  Send,
  Clock,
  Image as ImageIcon,
  Layers,
  Video,
  Loader2,
  CheckCheck,
  Sparkles,
  AlertCircle,
  Replace,
  Pencil,
  ArrowLeft,
  LayoutDashboard,
} from "lucide-react";

const contentTypeIcons = {
  image: ImageIcon,
  carousel: Layers,
  reel: Video,
};

const statusColors: Record<QueueItem["status"], string> = {
  generating: "bg-blue-500/10 text-blue-500 border-blue-500/30",
  pending_approval: "bg-amber-500/10 text-amber-500 border-amber-500/30",
  approved: "bg-emerald-500/10 text-emerald-500 border-emerald-500/30",
  posted: "bg-ig-pink/10 text-ig-pink border-ig-pink/30",
  rejected: "bg-red-500/10 text-red-500 border-red-500/30",
  failed: "bg-red-500/10 text-red-500 border-red-500/30",
};

const statusLabels: Record<QueueItem["status"], string> = {
  generating: "Generating...",
  pending_approval: "Awaiting Approval",
  approved: "Approved",
  posted: "Posted",
  rejected: "Rejected",
  failed: "Failed",
};

function QueueItemCard({
  item,
  onApprove,
  onReject,
  onPost,
  onReplace,
  expanded,
  onToggle,
}: {
  item: QueueItem;
  onApprove: () => void;
  onReject: () => void;
  onPost: () => void;
  onReplace: () => void;
  expanded: boolean;
  onToggle: () => void;
}) {
  const Icon = contentTypeIcons[item.contentType] || ImageIcon;

  return (
    <Card
      className={`border-border/40 transition-all ${
        item.status === "pending_approval" ? "ring-1 ring-amber-500/20" : ""
      }`}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* Content type icon */}
          <div className="flex-shrink-0 mt-0.5">
            <div className="h-9 w-9 rounded-lg bg-muted/60 flex items-center justify-center">
              <Icon className="h-4 w-4 text-muted-foreground" />
            </div>
          </div>

          {/* Main content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3
                className="text-sm font-medium truncate cursor-pointer hover:text-ig-pink transition-colors"
                onClick={onToggle}
              >
                {item.headline || item.topic}
              </h3>
              <Badge
                variant="outline"
                className={`text-[10px] flex-shrink-0 ${statusColors[item.status]}`}
              >
                {item.status === "generating" && (
                  <Loader2 className="h-2.5 w-2.5 mr-1 animate-spin" />
                )}
                {statusLabels[item.status]}
              </Badge>
            </div>

            <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {item.calendarSlotDate} at {item.suggestedTime}
              </span>
              <span>{item.pillar}</span>
              {item.qualityScore > 0 && (
                <span className="flex items-center gap-1">
                  <Sparkles className="h-3 w-3" />
                  {item.qualityScore}/100
                </span>
              )}
            </div>

            {/* Expanded view — caption + hashtags */}
            {expanded && (
              <div className="mt-3 space-y-2">
                <div className="rounded-lg border border-border/40 p-3 bg-muted/20">
                  <p className="text-sm whitespace-pre-line leading-relaxed">
                    {item.caption}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {item.hashtags.join(" ")}
                  </p>
                </div>
                {item.error && (
                  <div className="flex items-center gap-2 text-xs text-red-500">
                    <AlertCircle className="h-3.5 w-3.5" />
                    {item.error}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex-shrink-0 flex items-center gap-1.5">
            {(item.status === "pending_approval" || item.status === "approved") && (
              <Button
                size="sm"
                variant="ghost"
                className="h-8 w-8 p-0 text-muted-foreground hover:text-ig-orange hover:bg-ig-orange/10"
                onClick={onReplace}
                title="Replace with custom post"
              >
                <Pencil className="h-4 w-4" />
              </Button>
            )}
            {item.status === "pending_approval" && (
              <>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 w-8 p-0 text-emerald-500 hover:text-emerald-600 hover:bg-emerald-500/10"
                  onClick={onApprove}
                  title="Approve"
                >
                  <CheckCircle2 className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-500/10"
                  onClick={onReject}
                  title="Reject"
                >
                  <XCircle className="h-4 w-4" />
                </Button>
              </>
            )}
            {item.status === "approved" && (
              <Button
                size="sm"
                variant="ghost"
                className="h-8 w-8 p-0 text-ig-pink hover:text-ig-pink/80 hover:bg-ig-pink/10"
                onClick={onPost}
                title="Post Now"
              >
                <Send className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function QueuePage() {
  const router = useRouter();
  const { items, approveItem, rejectItem, approveAll, batchProgress, clearPosted, resetStuck, reset } =
    useQueueStore();
  const { brand } = useBrand();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [posting, setPosting] = useState<string | null>(null);

  const handleReplace = (item: QueueItem) => {
    // Navigate to Studio with the queue item's topic pre-filled + a replaceId param
    const params = new URLSearchParams({
      topic: item.topic,
      pillar: item.pillar,
      replaceId: item.id,
    });
    router.push(`/studio?${params.toString()}`);
  };

  const pendingItems = items.filter((i) => i.status === "pending_approval");
  const approvedItems = items.filter((i) => i.status === "approved");
  const generatingItems = items.filter((i) => i.status === "generating");
  const postedItems = items.filter((i) => i.status === "posted");
  const failedItems = items.filter((i) => i.status === "failed" || i.status === "rejected");

  // Sync status change to backend DB (fire-and-forget)
  const syncStatus = (id: string, status: string) => {
    fetch("/api/queue/status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    }).catch(() => {}); // Non-blocking
  };

  const handleApprove = (id: string) => {
    approveItem(id);
    syncStatus(id, "approved");
  };

  const handleReject = (id: string) => {
    rejectItem(id);
    syncStatus(id, "rejected");
  };

  const handlePost = async (item: QueueItem) => {
    setPosting(item.id);
    try {
      const res = await fetch("/api/posts/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          caption: item.caption,
          hashtags: item.hashtags,
        }),
      });
      const data = res.ok ? await res.json() : null;
      useQueueStore.getState().updateItem(item.id, { status: "posted" });
      syncStatus(item.id, "published");
      if (data?.ig_media_id) {
        fetch("/api/queue/status", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: item.id, status: "published", igMediaId: data.ig_media_id }),
        }).catch(() => {});
      }
    } catch {
      useQueueStore.getState().updateItem(item.id, {
        status: "failed",
        error: "Failed to publish. Connect Instagram in Settings.",
      });
      syncStatus(item.id, "failed");
    }
    setPosting(null);
  };

  return (
    <PageTransition>
      <div className="p-6 space-y-6 max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0"
              onClick={() => router.push("/dashboard")}
              title="Back to Dashboard"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Content Queue</h1>
              <p className="text-sm text-muted-foreground">
                Review and approve generated content before posting.
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            {pendingItems.length > 0 && (
              <Button size="sm" onClick={approveAll}>
                <CheckCheck className="h-4 w-4 mr-1.5" />
                Approve All ({pendingItems.length})
              </Button>
            )}
            {postedItems.length > 0 && (
              <Button size="sm" variant="outline" onClick={clearPosted}>
                Clear Posted
              </Button>
            )}
          </div>
        </div>

        {/* Batch progress */}
        {batchProgress && batchProgress.inProgress && (
          <Card className="border-blue-500/30 bg-blue-500/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
                <div className="flex-1">
                  <p className="text-sm font-medium">
                    Generating content... {batchProgress.completed}/{batchProgress.total}
                  </p>
                  <div className="mt-1.5 h-1.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-blue-500 transition-all"
                      style={{
                        width: `${(batchProgress.completed / batchProgress.total) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Empty state */}
        {items.length === 0 && (
          <Card className="border-border/40">
            <CardContent className="py-16 text-center">
              <Sparkles className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
              <h3 className="text-sm font-medium mb-1">No content in queue</h3>
              <p className="text-xs text-muted-foreground mb-4">
                Create content from your daily calendar or head to the Studio.
              </p>
              <div className="flex items-center justify-center gap-3">
                <Button size="sm" onClick={() => router.push("/dashboard")}>
                  <LayoutDashboard className="h-4 w-4 mr-1.5" />
                  Dashboard
                </Button>
                <Button size="sm" variant="outline" onClick={() => router.push("/studio")}>
                  Create in Studio
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Generating */}
        {generatingItems.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Generating ({generatingItems.length})
              </h2>
              {!batchProgress?.inProgress && (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs"
                    onClick={resetStuck}
                  >
                    <AlertCircle className="h-3 w-3 mr-1" />
                    Mark as Failed
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 text-xs text-red-500 hover:text-red-600"
                    onClick={reset}
                  >
                    <XCircle className="h-3 w-3 mr-1" />
                    Clear All
                  </Button>
                </div>
              )}
            </div>
            {generatingItems.map((item) => (
              <QueueItemCard
                key={item.id}
                item={item}
                onApprove={() => {}}
                onReject={() => {}}
                onPost={() => {}}
                onReplace={() => handleReplace(item)}
                expanded={expandedId === item.id}
                onToggle={() => setExpandedId(expandedId === item.id ? null : item.id)}
              />
            ))}
          </div>
        )}

        {/* Pending approval */}
        {pendingItems.length > 0 && (
          <div className="space-y-2">
            <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Awaiting Approval ({pendingItems.length})
            </h2>
            {pendingItems.map((item) => (
              <QueueItemCard
                key={item.id}
                item={item}
                onApprove={() => handleApprove(item.id)}
                onReject={() => handleReject(item.id)}
                onPost={() => {}}
                onReplace={() => handleReplace(item)}
                expanded={expandedId === item.id}
                onToggle={() => setExpandedId(expandedId === item.id ? null : item.id)}
              />
            ))}
          </div>
        )}

        {/* Approved — ready to post */}
        {approvedItems.length > 0 && (
          <div className="space-y-2">
            <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Ready to Post ({approvedItems.length})
            </h2>
            {approvedItems.map((item) => (
              <QueueItemCard
                key={item.id}
                item={item}
                onApprove={() => {}}
                onReject={() => {}}
                onPost={() => handlePost(item)}
                onReplace={() => handleReplace(item)}
                expanded={expandedId === item.id}
                onToggle={() => setExpandedId(expandedId === item.id ? null : item.id)}
              />
            ))}
          </div>
        )}

        {/* Posted */}
        {postedItems.length > 0 && (
          <div className="space-y-2">
            <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Posted ({postedItems.length})
            </h2>
            {postedItems.map((item) => (
              <QueueItemCard
                key={item.id}
                item={item}
                onApprove={() => {}}
                onReject={() => {}}
                onPost={() => {}}
                onReplace={() => handleReplace(item)}
                expanded={expandedId === item.id}
                onToggle={() => setExpandedId(expandedId === item.id ? null : item.id)}
              />
            ))}
          </div>
        )}

        {/* Failed/Rejected */}
        {failedItems.length > 0 && (
          <div className="space-y-2">
            <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Failed / Rejected ({failedItems.length})
            </h2>
            {failedItems.map((item) => (
              <QueueItemCard
                key={item.id}
                item={item}
                onApprove={() => {}}
                onReject={() => {}}
                onPost={() => {}}
                onReplace={() => handleReplace(item)}
                expanded={expandedId === item.id}
                onToggle={() => setExpandedId(expandedId === item.id ? null : item.id)}
              />
            ))}
          </div>
        )}
      </div>
    </PageTransition>
  );
}
