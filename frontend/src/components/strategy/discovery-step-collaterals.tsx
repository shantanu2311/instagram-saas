"use client";

import { useState, useEffect, useCallback } from "react";
import { useStrategyStore } from "@/lib/stores/strategy-store";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Upload,
  FileText,
  Image as ImageIcon,
  Table2,
  File,
  X,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Link as LinkIcon,
} from "lucide-react";

interface CollateralItem {
  id: string;
  filename: string;
  fileType: string;
  status: string;
  aiSummary?: string | null;
  autoPopulated?: {
    products?: number;
    moments?: number;
    inspiration?: number;
  } | null;
  sizeBytes: number;
  isNew?: boolean; // Just uploaded in this session
}

const fileTypeIcon: Record<string, typeof FileText> = {
  pdf: FileText,
  spreadsheet: Table2,
  document: FileText,
  image: ImageIcon,
  link: LinkIcon,
  other: File,
};

const ACCEPTED_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel",
  "text/csv",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
  "text/markdown",
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
].join(",");

export function DiscoveryStepCollaterals() {
  const { nextDiscoveryStep, prevDiscoveryStep, profile } = useStrategyStore();
  const [items, setItems] = useState<CollateralItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [brandId, setBrandId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch brandId and existing collaterals
  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const brandsRes = await fetch("/api/brands");
        if (!brandsRes.ok) { if (mounted) setLoading(false); return; }
        const brandsData = await brandsRes.json();
        // GET /api/brands returns a flat array (not wrapped in { brands: [] })
        const brandsArr = Array.isArray(brandsData) ? brandsData : brandsData?.brands;
        let bid = brandsArr?.[0]?.id;

        // Auto-create brand from profile if none exists yet (step 10 runs before brand creation in step 11)
        if (!bid) {
          try {
            const createRes = await fetch("/api/brands", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                niche: profile.niche || profile.productService || "General",
                brandHashtag: profile.instagramHandle || profile.businessName || "",
                primaryColor: profile.primaryColor,
                secondaryColor: profile.secondaryColor,
                accentColor: profile.accentColor,
                fontHeadline: profile.fontHeadline,
                fontBody: profile.fontBody,
              }),
            });
            if (createRes.ok) {
              const createData = await createRes.json();
              // POST /api/brands returns { id, name, niche } (not wrapped in { brand: {} })
              bid = createData?.id;
            }
          } catch {
            // Ignore — upload will show "brand not ready" if bid is still null
          }
        }

        if (mounted && bid) setBrandId(bid);

        if (bid) {
          const colRes = await fetch("/api/collaterals");
          if (colRes.ok && mounted) {
            const colData = await colRes.json();
            setItems(
              (colData.collaterals || []).map((c: CollateralItem) => ({
                ...c,
                isNew: false,
              }))
            );
          }
        }
      } catch {
        // Ignore
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleUpload = useCallback(
    async (files: FileList) => {
      // If no brand yet, try to auto-create one now
      let bid = brandId;
      if (!bid) {
        try {
          const createRes = await fetch("/api/brands", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              niche: profile.niche || profile.productService || "General",
              brandHashtag: profile.instagramHandle || profile.businessName || "",
              primaryColor: profile.primaryColor || "#8b5cf6",
              secondaryColor: profile.secondaryColor || "#ec4899",
              accentColor: profile.accentColor || "#f59e0b",
              fontHeadline: profile.fontHeadline || "Inter",
              fontBody: profile.fontBody || "Inter",
            }),
          });
          if (createRes.ok) {
            const data = await createRes.json();
            bid = data?.id;
            if (bid) setBrandId(bid);
          }
        } catch {
          // Fall through to error below
        }
      }
      if (!bid) {
        setError("Could not create brand. Please go back and fill in your business name, then try again.");
        return;
      }
      setError(null);
      setUploading(true);

      const newItems: CollateralItem[] = [];
      const toProcess: string[] = [];

      for (const file of Array.from(files)) {
        try {
          const formData = new FormData();
          formData.append("file", file);
          formData.append("brandId", bid!);

          const res = await fetch("/api/collaterals/upload", {
            method: "POST",
            body: formData,
          });

          if (!res.ok) {
            const err = await res.json().catch(() => ({ error: "Upload failed" }));
            setError(err.error || "Upload failed");
            continue;
          }

          const data = await res.json();
          const item: CollateralItem = {
            id: data.id,
            filename: data.filename,
            fileType: data.fileType,
            status: data.status,
            sizeBytes: file.size,
            isNew: true,
          };
          newItems.push(item);

          // Queue for AI processing if text was extracted
          if (data.hasExtractedText && !data.isImage) {
            toProcess.push(data.id);
          }

          if (data.message) {
            setError(data.message);
          }
        } catch {
          setError("Upload failed. Please try again.");
        }
      }

      setItems((prev) => [...newItems, ...prev]);
      setUploading(false);

      // Process files with AI in background
      for (const id of toProcess) {
        setProcessing((prev) => new Set(prev).add(id));
        fetch("/api/collaterals/process", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ collateralId: id }),
        })
          .then(async (res) => {
            if (res.ok) {
              const data = await res.json();
              setItems((prev) =>
                prev.map((item) =>
                  item.id === id
                    ? {
                        ...item,
                        status: "processed",
                        aiSummary: data.summary,
                        autoPopulated: data.autoPopulated,
                      }
                    : item
                )
              );
            } else {
              setItems((prev) =>
                prev.map((item) =>
                  item.id === id ? { ...item, status: "failed" } : item
                )
              );
            }
          })
          .catch(() => {
            setItems((prev) =>
              prev.map((item) =>
                item.id === id ? { ...item, status: "failed" } : item
              )
            );
          })
          .finally(() => {
            setProcessing((prev) => {
              const next = new Set(prev);
              next.delete(id);
              return next;
            });
          });
      }
    },
    [brandId]
  );

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/collaterals/${id}`, { method: "DELETE" });
      setItems((prev) => prev.filter((item) => item.id !== id));
    } catch {
      setError("Failed to delete file.");
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files.length > 0) {
      handleUpload(e.dataTransfer.files);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-xl mx-auto">
      <div className="text-center space-y-2">
        <div className="mx-auto h-12 w-12 rounded-xl ig-gradient flex items-center justify-center mb-4">
          <Upload className="h-6 w-6 text-white" />
        </div>
        <h2 className="text-2xl font-bold">Upload Business Materials</h2>
        <p className="text-muted-foreground">
          Share any documents that help us understand your brand better — product
          catalogs, pitch decks, spreadsheets, or inspiration images. AI will
          extract key info to enrich your strategy.
        </p>
      </div>

      {/* Drop zone */}
      <Card>
        <CardContent className="pt-2">
          <div
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            className="border-2 border-dashed border-border/60 rounded-lg p-8 text-center hover:border-ig-pink/40 hover:bg-ig-pink/5 transition-colors cursor-pointer"
            onClick={() => {
              const input = document.createElement("input");
              input.type = "file";
              input.multiple = true;
              input.accept = ACCEPTED_TYPES;
              input.onchange = () => input.files && handleUpload(input.files);
              input.click();
            }}
          >
            {uploading ? (
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="h-8 w-8 animate-spin text-ig-pink" />
                <span className="text-sm text-muted-foreground">Uploading...</span>
              </div>
            ) : (
              <>
                <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm font-medium">
                  Drop files here or click to browse
                </p>
                <p className="text-[11px] text-muted-foreground mt-1">
                  PDF, DOCX, XLSX, CSV, images (max 10MB each, up to 20 files)
                </p>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 text-xs text-amber-500 bg-amber-500/10 rounded-lg px-3 py-2">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          {error}
        </div>
      )}

      {/* Uploaded files list */}
      {items.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-muted-foreground">
            Uploaded Files ({items.length})
          </h3>
          {items.map((item) => {
            const Icon = fileTypeIcon[item.fileType] || File;
            const isProc = processing.has(item.id);

            return (
              <div
                key={item.id}
                className="flex items-start gap-3 rounded-lg border border-border/40 p-3"
              >
                <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium truncate">
                      {item.filename}
                    </span>
                    <span className="text-[10px] text-muted-foreground shrink-0">
                      {formatSize(item.sizeBytes)}
                    </span>
                  </div>

                  {/* Status */}
                  {isProc ? (
                    <div className="flex items-center gap-1.5 mt-1">
                      <Loader2 className="h-3 w-3 animate-spin text-ig-pink" />
                      <span className="text-[11px] text-ig-pink">
                        AI is analyzing...
                      </span>
                    </div>
                  ) : item.status === "processed" && item.aiSummary ? (
                    <div className="mt-1 space-y-1">
                      <div className="flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                        <span className="text-[11px] text-emerald-500">
                          Processed
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground line-clamp-2">
                        {item.aiSummary}
                      </p>
                      {item.autoPopulated && (
                        <div className="flex gap-2 mt-0.5">
                          {(item.autoPopulated as { products?: number })?.products ? (
                            <span className="text-[10px] bg-ig-pink/10 text-ig-pink rounded-full px-2 py-0.5">
                              <Sparkles className="h-2.5 w-2.5 inline mr-0.5" />
                              {(item.autoPopulated as { products: number }).products} products
                            </span>
                          ) : null}
                          {(item.autoPopulated as { moments?: number })?.moments ? (
                            <span className="text-[10px] bg-blue-500/10 text-blue-500 rounded-full px-2 py-0.5">
                              {(item.autoPopulated as { moments: number }).moments} moments
                            </span>
                          ) : null}
                          {(item.autoPopulated as { inspiration?: number })?.inspiration ? (
                            <span className="text-[10px] bg-amber-500/10 text-amber-500 rounded-full px-2 py-0.5">
                              {(item.autoPopulated as { inspiration: number }).inspiration} ideas
                            </span>
                          ) : null}
                        </div>
                      )}
                    </div>
                  ) : item.status === "failed" ? (
                    <div className="flex items-center gap-1 mt-1">
                      <AlertCircle className="h-3 w-3 text-red-400" />
                      <span className="text-[11px] text-red-400">
                        Could not process
                      </span>
                    </div>
                  ) : item.fileType === "image" ? (
                    <div className="flex items-center gap-1 mt-1">
                      <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                      <span className="text-[11px] text-muted-foreground">
                        Added to media library
                      </span>
                    </div>
                  ) : null}
                </div>

                <button
                  onClick={() => handleDelete(item.id)}
                  className="p-1 hover:bg-muted rounded-md shrink-0"
                >
                  <X className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-center gap-3">
        <Button variant="outline" onClick={prevDiscoveryStep} size="lg">
          Back
        </Button>
        <Button
          onClick={nextDiscoveryStep}
          size="lg"
          className="px-12"
        >
          {items.length > 0
            ? processing.size > 0
              ? "Processing..."
              : "Continue"
            : "Skip"}
        </Button>
      </div>

      <p className="text-center text-[11px] text-muted-foreground">
        This step is optional — you can always upload materials later from
        Products, Moments, or Media Library.
      </p>
    </div>
  );
}
