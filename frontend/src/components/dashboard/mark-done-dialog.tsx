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
import { Upload, CheckCircle2, Loader2 } from "lucide-react";

interface MarkDoneDialogProps {
  slotId: string;
  topic: string;
  contentType: string;
  onMarkedDone?: () => void;
}

export function MarkDoneDialog({
  slotId,
  topic,
  contentType,
  onMarkedDone,
}: MarkDoneDialogProps) {
  const [open, setOpen] = useState(false);
  const [caption, setCaption] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleMarkDone() {
    setSaving(true);
    setError("");

    try {
      // 1. Save content to DB if caption provided
      let contentId: string | null = null;
      if (caption.trim()) {
        const saveRes = await fetch("/api/studio/save", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contentType,
            caption: caption.trim(),
            hashtags: [],
            mediaUrls: [],
            topic,
          }),
        });

        if (saveRes.ok) {
          const saveData = await saveRes.json();
          contentId = saveData.id;
        }
      }

      // 2. Update calendar slot status to "uploaded"
      const patchRes = await fetch(`/api/calendar/slots/${slotId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "uploaded",
          ...(contentId ? { contentId } : {}),
        }),
      });

      if (!patchRes.ok) {
        const data = await patchRes.json();
        throw new Error(data.error || "Failed to update slot");
      }

      setOpen(false);
      setCaption("");
      onMarkedDone?.();
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
        <Upload className="h-4 w-4" />
        I Already Made This
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Mark as Done</DialogTitle>
          <DialogDescription>
            Already created this {contentType} about &ldquo;{topic}&rdquo;? Mark it as done to keep your calendar on track.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <div>
            <label
              htmlFor="mark-done-caption"
              className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider"
            >
              Caption (optional)
            </label>
            <textarea
              id="mark-done-caption"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Paste your caption here to save it..."
              className="mt-1.5 w-full rounded-lg border border-border/50 bg-muted/30 p-3 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-ig-pink/30"
              rows={4}
            />
          </div>

          {error && (
            <p className="text-xs text-red-500">{error}</p>
          )}
        </div>

        <DialogFooter>
          <Button
            onClick={handleMarkDone}
            disabled={saving}
            className="gap-2"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle2 className="h-4 w-4" />
            )}
            {saving ? "Saving..." : "Mark as Done"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
