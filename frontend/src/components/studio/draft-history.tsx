"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronUp, RotateCcw, Wand2 } from "lucide-react";

interface DraftItem {
  id: string;
  caption: string;
  pillar: string;
  pillarColor: string;
  gradientFrom: string;
  gradientTo: string;
  qualityScore: number;
  date: string;
}

interface DraftHistoryProps {
  onLoad?: (draft: { caption: string; pillar: string }) => void;
}

export function DraftHistory({ onLoad }: DraftHistoryProps) {
  const [expanded, setExpanded] = useState(false);
  const [drafts, setDrafts] = useState<DraftItem[]>([]);

  useEffect(() => {
    fetch("/api/studio/drafts")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setDrafts(data);
      })
      .catch(() => {});
  }, []);

  return (
    <div className="border border-border/40 rounded-lg overflow-hidden">
      {/* Header / toggle */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium hover:bg-muted/30 transition-colors"
      >
        <span>Recent Generations</span>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-[10px]">
            {drafts.length}
          </Badge>
          {expanded ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </button>

      {/* Draft cards or empty state */}
      {expanded && (
        <div className="border-t border-border/40">
          {drafts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="h-10 w-10 rounded-full bg-muted/50 flex items-center justify-center mb-3">
                <Wand2 className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium">No recent generations</p>
              <p className="text-xs text-muted-foreground mt-1">
                Your generated posts will appear here.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border/40">
              {drafts.map((draft) => (
                <div
                  key={draft.id}
                  className="flex items-start gap-3 px-4 py-3 hover:bg-muted/20 transition-colors"
                >
                  {/* Thumbnail */}
                  <div
                    className={`h-12 w-12 rounded-lg bg-gradient-to-br ${draft.gradientFrom} ${draft.gradientTo} flex-shrink-0`}
                  />

                  {/* Content */}
                  <div className="flex-1 min-w-0 space-y-1">
                    <p className="text-xs leading-snug line-clamp-2">
                      {draft.caption}
                    </p>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-medium ${draft.pillarColor}`}>
                        {draft.pillar}
                      </span>
                      <Badge
                        variant="outline"
                        className="text-[9px] px-1.5 py-0 text-emerald-500 border-emerald-500/30"
                      >
                        {draft.qualityScore}/100
                      </Badge>
                      <span className="text-[10px] text-muted-foreground">
                        {draft.date}
                      </span>
                    </div>
                  </div>

                  {/* Load button */}
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 px-2 text-xs flex-shrink-0"
                    onClick={() =>
                      onLoad?.({ caption: draft.caption, pillar: draft.pillar.toLowerCase() })
                    }
                  >
                    <RotateCcw className="h-3 w-3 mr-1" />
                    Load
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
