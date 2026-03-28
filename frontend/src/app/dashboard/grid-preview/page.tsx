"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import {
  Image as ImageIcon,
  Layers,
  Video,
  Clock,
  RefreshCw,
  Grid3x3,
  Plus,
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { IPhoneMockup } from "@/components/landing/iphone-mockup";

interface GridPost {
  id: string;
  contentType: string;
  caption: string | null;
  mediaUrls: string[];
  postedAt?: string;
  scheduledFor?: string;
  qualityScore?: number;
  igMediaId?: string;
}

const typeIcon: Record<string, typeof ImageIcon> = {
  image: ImageIcon,
  carousel: Layers,
  reel: Video,
};

const typeColor: Record<string, string> = {
  image: "bg-blue-500",
  carousel: "bg-purple-500",
  reel: "bg-ig-pink",
};

function GridCell({
  post,
  isUpcoming,
}: {
  post: GridPost;
  isUpcoming: boolean;
}) {
  const Icon = typeIcon[post.contentType] || ImageIcon;
  const color = typeColor[post.contentType] || "bg-gray-500";
  const hasImage =
    post.mediaUrls && post.mediaUrls.length > 0 && post.mediaUrls[0];

  return (
    <div className="aspect-square relative overflow-hidden bg-muted/30 group">
      {hasImage ? (
        <img
          src={post.mediaUrls[0]}
          alt=""
          className="w-full h-full object-cover"
        />
      ) : (
        <div
          className={`w-full h-full flex items-center justify-center ${color}/10`}
        >
          <Icon className={`h-6 w-6 ${color.replace("bg-", "text-")}/60`} />
        </div>
      )}

      {/* Content type indicator */}
      {post.contentType !== "image" && (
        <div className="absolute top-1 right-1">
          <Icon className="h-3 w-3 text-white drop-shadow-md" />
        </div>
      )}

      {/* Upcoming overlay */}
      {isUpcoming && (
        <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
          <div className="flex items-center gap-1 bg-black/60 rounded-full px-2 py-0.5">
            <Clock className="h-2.5 w-2.5 text-white" />
            <span className="text-[9px] font-medium text-white">
              Scheduled
            </span>
          </div>
        </div>
      )}

      {/* Hover overlay with caption */}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
        <p className="text-[9px] text-white px-1.5 text-center line-clamp-3">
          {post.caption?.slice(0, 80) || "No caption"}
        </p>
      </div>
    </div>
  );
}

export default function GridPreviewPage() {
  const [publishedPosts, setPublishedPosts] = useState<GridPost[]>([]);
  const [upcomingPosts, setUpcomingPosts] = useState<GridPost[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchGrid = useCallback(() => {
    setLoading(true);
    fetch("/api/grid-preview")
      .then((r) => (r.ok ? r.json() : { publishedPosts: [], upcomingPosts: [] }))
      .then((data) => {
        setPublishedPosts(data.publishedPosts || []);
        setUpcomingPosts(data.upcomingPosts || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchGrid();
  }, [fetchGrid]);

  const allPosts = useMemo(
    () =>
      [
        ...upcomingPosts.map((p) => ({ ...p, isUpcoming: true })),
        ...publishedPosts.map((p) => ({ ...p, isUpcoming: false })),
      ].slice(0, 9),
    [upcomingPosts, publishedPosts]
  );

  const isEmpty = !loading && allPosts.length === 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Grid Preview</h1>
          <p className="text-sm text-muted-foreground mt-1">
            See how your next posts will look on your Instagram profile
          </p>
        </div>
        <button
          onClick={fetchGrid}
          disabled={loading}
          className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground hover:bg-muted/50 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 items-start">
        {/* Phone mockup */}
        <div className="mx-auto lg:mx-0">
          <IPhoneMockup className="w-[280px]">
            {/* Mock profile header */}
            <div className="bg-background px-3 py-3 space-y-2">
              <div className="flex items-center gap-3">
                <div className="h-16 w-16 rounded-full ig-gradient flex items-center justify-center shrink-0">
                  <span className="text-white text-lg font-bold">IG</span>
                </div>
                <div className="flex-1 grid grid-cols-3 text-center">
                  <div>
                    <p className="text-sm font-bold">
                      {publishedPosts.length + upcomingPosts.length}
                    </p>
                    <p className="text-[9px] text-muted-foreground">Posts</p>
                  </div>
                  <div>
                    <p className="text-sm font-bold">—</p>
                    <p className="text-[9px] text-muted-foreground">Followers</p>
                  </div>
                  <div>
                    <p className="text-sm font-bold">—</p>
                    <p className="text-[9px] text-muted-foreground">Following</p>
                  </div>
                </div>
              </div>
              <p className="text-[10px] font-medium">Your Brand</p>
              <p className="text-[9px] text-muted-foreground">
                Content preview — scheduled posts shown with overlay
              </p>

              {/* Grid/Reels/Tagged tabs */}
              <div className="flex border-t border-border/40 pt-1">
                <div className="flex-1 flex justify-center py-1.5 border-b-2 border-foreground">
                  <Grid3x3 className="h-4 w-4" />
                </div>
                <div className="flex-1 flex justify-center py-1.5 text-muted-foreground/40">
                  <Video className="h-4 w-4" />
                </div>
                <div className="flex-1 flex justify-center py-1.5 text-muted-foreground/40">
                  <Layers className="h-4 w-4" />
                </div>
              </div>
            </div>

            {/* Grid */}
            {loading ? (
              <div className="grid grid-cols-3 gap-0.5">
                {Array.from({ length: 9 }).map((_, i) => (
                  <div
                    key={i}
                    className="aspect-square bg-muted/30 animate-pulse"
                  />
                ))}
              </div>
            ) : isEmpty ? (
              <div className="flex flex-col items-center justify-center py-12 text-center px-4">
                <Grid3x3 className="h-8 w-8 text-muted-foreground/30 mb-2" />
                <p className="text-[10px] text-muted-foreground">
                  No posts yet
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-0.5">
                {allPosts.map((post) => (
                  <GridCell
                    key={post.id}
                    post={post}
                    isUpcoming={post.isUpcoming}
                  />
                ))}
                {/* Fill remaining cells to complete 3x3 */}
                {allPosts.length < 9 &&
                  Array.from({ length: 9 - allPosts.length }).map((_, i) => (
                    <div
                      key={`empty-${i}`}
                      className="aspect-square bg-muted/10 flex items-center justify-center"
                    >
                      <Plus className="h-4 w-4 text-muted-foreground/20" />
                    </div>
                  ))}
              </div>
            )}
          </IPhoneMockup>
        </div>

        {/* Legend / details */}
        <div className="flex-1 space-y-4 w-full">
          {upcomingPosts.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <Clock className="h-4 w-4 text-ig-orange" />
                  Upcoming Posts ({upcomingPosts.length})
                </h3>
              </CardHeader>
              <CardContent className="pt-0 space-y-2">
                {upcomingPosts.map((post, i) => (
                  <div
                    key={post.id}
                    className="flex items-center gap-3 py-2 border-b border-border/30 last:border-0"
                  >
                    <span className="text-xs font-mono text-muted-foreground w-5">
                      {i + 1}
                    </span>
                    <Badge variant="outline" className="text-[10px] shrink-0">
                      {post.contentType}
                    </Badge>
                    <p className="text-xs text-muted-foreground truncate flex-1">
                      {post.caption?.slice(0, 60) || "No caption"}
                    </p>
                    {post.scheduledFor && (
                      <span className="text-[10px] text-muted-foreground shrink-0">
                        {new Date(post.scheduledFor).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {publishedPosts.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <ImageIcon className="h-4 w-4 text-emerald-500" />
                  Published Posts ({publishedPosts.length})
                </h3>
              </CardHeader>
              <CardContent className="pt-0 space-y-2">
                {publishedPosts.map((post) => (
                  <div
                    key={post.id}
                    className="flex items-center gap-3 py-2 border-b border-border/30 last:border-0"
                  >
                    <Badge variant="outline" className="text-[10px] shrink-0">
                      {post.contentType}
                    </Badge>
                    <p className="text-xs text-muted-foreground truncate flex-1">
                      {post.caption?.slice(0, 60) || "No caption"}
                    </p>
                    {post.postedAt && (
                      <span className="text-[10px] text-muted-foreground shrink-0">
                        {new Date(post.postedAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {isEmpty && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <Grid3x3 className="h-12 w-12 text-muted-foreground/30 mb-4" />
                <h3 className="text-lg font-semibold mb-1">No posts yet</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Create content in the Studio to see your grid preview
                </p>
                <Link
                  href="/studio"
                  className="rounded-lg ig-gradient px-4 py-2 text-sm font-medium text-white"
                >
                  Go to Studio
                </Link>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
