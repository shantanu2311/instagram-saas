"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { PageTransition } from "@/components/page-transition";
import {
  Upload,
  Image as ImageIcon,
  Film,
  Trash2,
  Search,
  Sparkles,
  Globe,
  Loader2,
  FolderOpen,
} from "lucide-react";

interface MediaAsset {
  id: string;
  filename: string;
  url: string;
  thumbnailUrl: string | null;
  mimeType: string;
  sizeBytes: number;
  source: string;
  tags: string[];
  createdAt: string;
}

type SourceFilter = "all" | "upload" | "ai-generated" | "instagram-sync";

const SOURCE_FILTERS: { value: SourceFilter; label: string; icon: React.ReactNode }[] = [
  { value: "all", label: "All", icon: null },
  { value: "upload", label: "Uploads", icon: <Upload className="h-3 w-3" /> },
  { value: "ai-generated", label: "AI-Generated", icon: <Sparkles className="h-3 w-3" /> },
  { value: "instagram-sync", label: "Instagram", icon: <Globe className="h-3 w-3" /> },
];

function sourceBadgeVariant(source: string) {
  switch (source) {
    case "upload":
      return "secondary";
    case "ai-generated":
      return "default";
    case "instagram-sync":
      return "outline";
    default:
      return "secondary";
  }
}

function sourceLabel(source: string) {
  switch (source) {
    case "upload":
      return "Upload";
    case "ai-generated":
      return "AI";
    case "instagram-sync":
      return "Instagram";
    default:
      return source;
  }
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function MediaCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <Skeleton className="aspect-square w-full" />
      <CardContent className="p-3">
        <Skeleton className="h-4 w-3/4 mb-2" />
        <Skeleton className="h-3 w-1/2" />
      </CardContent>
    </Card>
  );
}

export default function MediaLibraryPage() {
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchAssets = async (source: SourceFilter) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (source !== "all") params.set("source", source);
      params.set("limit", "100");
      const res = await fetch(`/api/media/library?${params}`);
      if (res.ok) {
        const data = await res.json();
        setAssets(data.assets || []);
        setTotal(data.total || 0);
      }
    } catch (err) {
      console.error("Failed to fetch media:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssets(sourceFilter);
  }, [sourceFilter]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/media/upload", {
        method: "POST",
        body: formData,
      });
      if (res.ok) {
        await fetchAssets(sourceFilter);
      } else {
        const data = await res.json();
        alert(data.error || "Upload failed");
      }
    } catch (err) {
      console.error("Upload error:", err);
      alert("Upload failed. Please try again.");
    } finally {
      setUploading(false);
      // Reset file input so the same file can be re-selected
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/media/library/${id}`, { method: "DELETE" });
      if (res.ok) {
        setAssets((prev) => prev.filter((a) => a.id !== id));
        setTotal((prev) => prev - 1);
      }
    } catch (err) {
      console.error("Delete error:", err);
    } finally {
      setDeletingId(null);
    }
  };

  // Client-side filename search
  const filteredAssets = searchQuery.trim()
    ? assets.filter((a) =>
        a.filename.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : assets;

  return (
    <PageTransition>
      <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Media Library</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {total} {total === 1 ? "asset" : "assets"} total
            </p>
          </div>
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,video/mp4"
              className="hidden"
              onChange={handleUpload}
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Upload className="h-4 w-4 mr-2" />
              )}
              {uploading ? "Uploading..." : "Upload"}
            </Button>
          </div>
        </div>

        {/* Filter pills + Search */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex gap-1.5 flex-wrap">
            {SOURCE_FILTERS.map((filter) => (
              <button
                key={filter.value}
                onClick={() => setSourceFilter(filter.value)}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                  sourceFilter === filter.value
                    ? "border-border bg-muted/60 text-foreground shadow-sm"
                    : "border-transparent text-muted-foreground/60 hover:text-muted-foreground hover:bg-muted/30"
                }`}
              >
                {filter.icon}
                {filter.label}
              </button>
            ))}
          </div>
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/50" />
            <input
              type="text"
              placeholder="Search files..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-border bg-background pl-9 pr-3 py-1.5 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring/20"
            />
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <MediaCardSkeleton key={i} />
            ))}
          </div>
        ) : filteredAssets.length === 0 ? (
          <EmptyState
            icon={FolderOpen}
            title={searchQuery ? "No results found" : "No media yet"}
            description={
              searchQuery
                ? "Try a different search term."
                : "Upload images or videos to get started. AI-generated and Instagram content will appear here too."
            }
            actionLabel={searchQuery ? undefined : "Upload File"}
            onAction={searchQuery ? undefined : () => fileInputRef.current?.click()}
          />
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {filteredAssets.map((asset) => (
              <Card
                key={asset.id}
                className="group overflow-hidden transition-shadow hover:shadow-md"
              >
                {/* Thumbnail */}
                <div className="relative aspect-square bg-muted/30">
                  {asset.mimeType.startsWith("video/") ? (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Film className="h-10 w-10 text-muted-foreground/30" />
                    </div>
                  ) : (
                    <img
                      src={asset.thumbnailUrl || asset.url}
                      alt={asset.filename}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  )}

                  {/* Source badge overlay */}
                  <div className="absolute top-2 left-2">
                    <Badge
                      variant={sourceBadgeVariant(asset.source) as any}
                      className="text-[10px] px-1.5 py-0"
                    >
                      {sourceLabel(asset.source)}
                    </Badge>
                  </div>

                  {/* Delete button on hover */}
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleDelete(asset.id)}
                      disabled={deletingId === asset.id}
                      className="h-7 w-7 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center text-destructive hover:bg-destructive hover:text-destructive-foreground transition-colors"
                    >
                      {deletingId === asset.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Info */}
                <CardContent className="p-3">
                  <p className="text-xs font-medium truncate" title={asset.filename}>
                    {asset.filename}
                  </p>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-[10px] text-muted-foreground">
                      {formatDate(asset.createdAt)}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {formatFileSize(asset.sizeBytes)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </PageTransition>
  );
}
