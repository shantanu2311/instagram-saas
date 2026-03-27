"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronUp, RotateCcw } from "lucide-react";

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

const mockDrafts: DraftItem[] = [
  {
    id: "1",
    caption:
      "Sleep deprivation costs the US economy $411 billion annually. Here are 5 science-backed tips to improve your sleep quality tonight...",
    pillar: "Facts",
    pillarColor: "text-ig-pink",
    gradientFrom: "from-ig-pink/40",
    gradientTo: "to-ig-orange/30",
    qualityScore: 92,
    date: "2h ago",
  },
  {
    id: "2",
    caption:
      "The morning routine that changed everything. I used to hit snooze 5 times before dragging myself out of bed...",
    pillar: "Behind-the-Scenes",
    pillarColor: "text-amber-500",
    gradientFrom: "from-amber-500/40",
    gradientTo: "to-orange-400/30",
    qualityScore: 87,
    date: "5h ago",
  },
  {
    id: "3",
    caption:
      "What productivity hack has made the biggest difference in your life? Drop your answer below...",
    pillar: "Engagement",
    pillarColor: "text-emerald-500",
    gradientFrom: "from-emerald-500/40",
    gradientTo: "to-teal-400/30",
    qualityScore: 84,
    date: "Yesterday",
  },
  {
    id: "4",
    caption:
      "3 tools every creator needs in 2026: Content scheduling, AI caption writing, and analytics tracking. Here is why...",
    pillar: "Education",
    pillarColor: "text-blue-500",
    gradientFrom: "from-blue-500/40",
    gradientTo: "to-indigo-400/30",
    qualityScore: 90,
    date: "2 days ago",
  },
];

interface DraftHistoryProps {
  onLoad?: (draft: { caption: string; pillar: string }) => void;
}

export function DraftHistory({ onLoad }: DraftHistoryProps) {
  const [expanded, setExpanded] = useState(false);

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
            {mockDrafts.length}
          </Badge>
          {expanded ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </button>

      {/* Draft cards */}
      {expanded && (
        <div className="border-t border-border/40 divide-y divide-border/40">
          {mockDrafts.map((draft) => (
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
  );
}
