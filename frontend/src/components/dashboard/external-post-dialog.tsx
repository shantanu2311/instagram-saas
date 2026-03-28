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
import {
  Upload,
  Loader2,
  Image as ImageIcon,
  Layers,
  Video,
} from "lucide-react";

interface ExternalPostDialogProps {
  onLogged?: () => void;
}

const CONTENT_TYPES = [
  { value: "image", label: "Image", icon: ImageIcon },
  { value: "carousel", label: "Carousel", icon: Layers },
  { value: "reel", label: "Reel", icon: Video },
] as const;

export function ExternalPostDialog({ onLogged }: ExternalPostDialogProps) {
  const [open, setOpen] = useState(false);
  const [caption, setCaption] = useState("");
  const [contentType, setContentType] = useState("image");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSave() {
    setSaving(true);
    setError("");

    try {
      const res = await fetch("/api/instagram/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          caption: caption.trim() || null,
          mediaType: contentType,
          timestamp: new Date(date).toISOString(),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to log post");
      }

      setOpen(false);
      setCaption("");
      setContentType("image");
      setDate(new Date().toISOString().slice(0, 10));
      onLogged?.();
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
        Log External Post
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Log External Post</DialogTitle>
          <DialogDescription>
            Manually log a post you created outside the app to keep your
            content history complete.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          {/* Content type pills */}
          <div>
            <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
              Content Type
            </label>
            <div className="flex gap-2 mt-1.5">
              {CONTENT_TYPES.map((ct) => (
                <button
                  key={ct.value}
                  type="button"
                  onClick={() => setContentType(ct.value)}
                  className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition-colors ${
                    contentType === ct.value
                      ? "border-border bg-muted/60 text-foreground shadow-sm"
                      : "border-transparent text-muted-foreground/60 hover:text-muted-foreground"
                  }`}
                >
                  <ct.icon className="h-3.5 w-3.5" />
                  {ct.label}
                </button>
              ))}
            </div>
          </div>

          {/* Caption */}
          <div>
            <label
              htmlFor="ext-post-caption"
              className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider"
            >
              Caption (optional)
            </label>
            <textarea
              id="ext-post-caption"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Paste your caption here..."
              className="mt-1.5 w-full rounded-lg border border-border/50 bg-muted/30 p-3 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-ig-pink/30"
              rows={4}
            />
          </div>

          {/* Date */}
          <div>
            <label
              htmlFor="ext-post-date"
              className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider"
            >
              Date Posted
            </label>
            <input
              id="ext-post-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-border/50 bg-muted/30 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ig-pink/30"
            />
          </div>

          {error && <p className="text-xs text-red-500">{error}</p>}
        </div>

        <DialogFooter>
          <Button onClick={handleSave} disabled={saving} className="gap-2">
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
            {saving ? "Saving..." : "Log Post"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
