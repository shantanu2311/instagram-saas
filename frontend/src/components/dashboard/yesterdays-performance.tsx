"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Heart, MessageCircle, Bookmark, Share2, TrendingUp, TrendingDown } from "lucide-react";

interface YesterdayPostData {
  id: string;
  contentType: string;
  caption: string | null;
  thumbnailUrl: string | null;
  qualityScore: number | null;
  analytics: {
    likes: number;
    comments: number;
    saves: number;
    shares: number;
    engagement: number;
  } | null;
}

export function YesterdaysPerformance({
  post,
  avgEngagement,
}: {
  post: YesterdayPostData | null;
  avgEngagement?: number;
}) {
  if (!post) return null;

  const metrics = post.analytics;
  const engagementDelta = metrics && avgEngagement
    ? ((metrics.engagement - avgEngagement) / avgEngagement) * 100
    : null;
  const isUp = engagementDelta !== null && engagementDelta > 0;

  return (
    <Card className="border-border/40">
      <CardContent className="pt-5 pb-5">
        <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-3">
          Yesterday&apos;s Post
        </p>

        <div className="flex items-start gap-4">
          {/* Thumbnail */}
          <div className="h-16 w-16 rounded-lg bg-muted/50 flex items-center justify-center shrink-0 overflow-hidden">
            {post.thumbnailUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={post.thumbnailUrl}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="text-[10px] uppercase font-medium text-muted-foreground">
                {post.contentType}
              </span>
            )}
          </div>

          {/* Caption preview */}
          <div className="flex-1 min-w-0">
            <p className="text-sm line-clamp-2">
              {post.caption?.slice(0, 100) || "No caption"}
            </p>
          </div>
        </div>

        {/* Metrics */}
        {metrics ? (
          <div className="mt-4 grid grid-cols-4 gap-3">
            <div className="text-center">
              <Heart className="h-3.5 w-3.5 mx-auto text-red-400 mb-1" />
              <p className="text-sm font-semibold">{metrics.likes.toLocaleString()}</p>
              <p className="text-[10px] text-muted-foreground">Likes</p>
            </div>
            <div className="text-center">
              <MessageCircle className="h-3.5 w-3.5 mx-auto text-blue-400 mb-1" />
              <p className="text-sm font-semibold">{metrics.comments.toLocaleString()}</p>
              <p className="text-[10px] text-muted-foreground">Comments</p>
            </div>
            <div className="text-center">
              <Bookmark className="h-3.5 w-3.5 mx-auto text-amber-400 mb-1" />
              <p className="text-sm font-semibold">{metrics.saves.toLocaleString()}</p>
              <p className="text-[10px] text-muted-foreground">Saves</p>
            </div>
            <div className="text-center">
              <Share2 className="h-3.5 w-3.5 mx-auto text-emerald-400 mb-1" />
              <p className="text-sm font-semibold">{metrics.shares.toLocaleString()}</p>
              <p className="text-[10px] text-muted-foreground">Shares</p>
            </div>
          </div>
        ) : (
          <p className="mt-3 text-xs text-muted-foreground">
            Connect Instagram to see engagement metrics.
          </p>
        )}

        {/* Engagement trend */}
        {engagementDelta !== null && (
          <div className={`mt-3 flex items-center gap-1.5 text-[11px] font-medium ${isUp ? "text-emerald-500" : "text-red-400"}`}>
            {isUp ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
            {Math.abs(engagementDelta).toFixed(0)}% {isUp ? "above" : "below"} your average engagement
          </div>
        )}
      </CardContent>
    </Card>
  );
}
