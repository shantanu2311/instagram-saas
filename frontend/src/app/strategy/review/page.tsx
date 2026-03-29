"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useStrategyStore } from "@/lib/stores/strategy-store";
import { useBrand } from "@/lib/hooks/use-brand";
// Queue store no longer needed — batch generation removed in favor of daily per-item creation
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2,
  XCircle,
  Pencil,
  Target,
  Layout,
  Clock,
  MessageSquare,
  Hash,
  Film,
  Rocket,
  Loader2,
  Sparkles,
  RefreshCw,
} from "lucide-react";
import { motion } from "framer-motion";

type SectionStatus = "pending" | "approved" | "rejected";

// convertTimeToISO removed — no longer needed without batch generation

const sectionDefs = [
  { key: "brandPositioning", label: "Brand Positioning", icon: Target },
  { key: "contentPillars", label: "Content Pillars", icon: Layout },
  { key: "postingCadence", label: "Posting Cadence", icon: Clock },
  { key: "toneAndVoice", label: "Tone & Voice", icon: MessageSquare },
  { key: "hashtagStrategy", label: "Hashtag Strategy", icon: Hash },
  { key: "contentFormats", label: "Content Formats", icon: Film },
  { key: "growthTactics", label: "Growth Tactics", icon: Rocket },
];

export default function ReviewPage() {
  const router = useRouter();
  const { strategy, setStrategy, setCalendar } = useStrategyStore();
  const { brand: savedBrand } = useBrand();
  const [sections, setSections] = useState<Record<string, SectionStatus>>({});
  const [approving, setApproving] = useState(false);
  const [calendarError, setCalendarError] = useState<string | null>(null);
  const [brandId, setBrandId] = useState<string | null>(null);
  const [sectionFeedback, setSectionFeedback] = useState<Record<string, string>>({});
  const [revisingSection, setRevisingSection] = useState<string | null>(null);
  const [revisionError, setRevisionError] = useState<Record<string, string>>({});
  const [revisionCount, setRevisionCount] = useState<Record<string, number>>({});

  // Fetch brandId from DB for calendar persistence
  useEffect(() => {
    fetch("/api/brands")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        const arr = Array.isArray(data) ? data : data?.brands;
        if (arr?.[0]?.id) setBrandId(arr[0].id);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!strategy) {
      router.push("/strategy");
      return;
    }
    const initial: Record<string, SectionStatus> = {};
    sectionDefs.forEach((s) => (initial[s.key] = "pending"));
    setSections(initial);
  }, [strategy, router]);

  if (!strategy) return null;

  const approvedCount = Object.values(sections).filter(
    (s) => s === "approved"
  ).length;
  const totalSections = sectionDefs.length;
  const allApproved = approvedCount === totalSections;

  const toggleSection = (key: string, status: SectionStatus) => {
    setSections((prev) => ({
      ...prev,
      [key]: prev[key] === status ? "pending" : status,
    }));
  };

  const approveAll = () => {
    const updated: Record<string, SectionStatus> = {};
    sectionDefs.forEach((s) => (updated[s.key] = "approved"));
    setSections(updated);
  };

  const updateFeedback = (key: string, value: string) => {
    setSectionFeedback((prev) => ({ ...prev, [key]: value }));
  };

  const MAX_REVISIONS = 5;

  const handleReviseSection = async (sectionKey: string) => {
    const feedback = sectionFeedback[sectionKey]?.trim();
    if (!feedback) return;

    const count = revisionCount[sectionKey] || 0;
    if (count >= MAX_REVISIONS) {
      setRevisionError((prev) => ({
        ...prev,
        [sectionKey]: `You've used all ${MAX_REVISIONS} revisions for this section. Please approve it or edit manually in Settings later.`,
      }));
      return;
    }

    setRevisingSection(sectionKey);
    setRevisionError((prev) => ({ ...prev, [sectionKey]: "" }));

    try {
      const res = await fetch("/api/strategy/revise-section", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sectionKey,
          currentContent: strategy[sectionKey as keyof typeof strategy],
          feedback,
          brandContext: { niche: savedBrand.niche, brandName: savedBrand.brandHashtag },
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Revision failed" }));
        throw new Error(err.error || "Revision failed");
      }

      const data = await res.json();
      // Update strategy in Zustand store with revised section
      setStrategy({ ...strategy, [sectionKey]: data.revised });
      // Increment revision count
      setRevisionCount((prev) => ({ ...prev, [sectionKey]: count + 1 }));
      // Reset feedback and set section back to pending for re-review
      setSectionFeedback((prev) => ({ ...prev, [sectionKey]: "" }));
      setSections((prev) => ({ ...prev, [sectionKey]: "pending" }));
    } catch (err) {
      setRevisionError((prev) => ({
        ...prev,
        [sectionKey]: err instanceof Error ? err.message : "Revision failed. Try again.",
      }));
    } finally {
      setRevisingSection(null);
    }
  };

  const handleGenerateCalendar = async () => {
    setApproving(true);

    try {
      // Persist strategy to DB
      if (brandId) {
        await fetch("/api/strategy/approve", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ brandId, strategy }),
        }).catch(() => {}); // Non-fatal — strategy still lives in Zustand
      }

      // Build brand context for calendar generation
      const brandContext = {
        niche: savedBrand.niche,
        brandName: savedBrand.brandHashtag?.replace("#", "") || "",
        primaryColor: savedBrand.primaryColor,
        secondaryColor: savedBrand.secondaryColor,
        accentColor: savedBrand.accentColor,
        toneFormality: savedBrand.toneFormality,
        toneHumor: savedBrand.toneHumor,
        voiceDescription: savedBrand.voiceDescription,
        sampleCaptions: savedBrand.sampleCaption?.split("\n---\n").filter(Boolean) ?? [],
        contentPillars: savedBrand.contentPillars,
        brandHashtag: savedBrand.brandHashtag,
      };

      const strategyContext = {
        contentPillars: strategy.contentPillars,
        toneAndVoice: strategy.toneAndVoice,
        hashtagStrategy: strategy.hashtagStrategy,
        brandPositioning: strategy.brandPositioning,
      };

      // Generate calendar (metadata only — topics, pillars, types, headlines)
      // No caption/hashtag generation happens here. That's done per-item when the user creates content.
      const res = await fetch("/api/strategy/calendar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          strategyId: strategy.id,
          ...brandContext,
          postsPerWeek: savedBrand.postsPerWeek || 5,
          strategy: strategyContext,
          ...(brandId ? { brandId } : {}),
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Calendar generation failed" }));
        throw new Error(err.error || "Calendar generation failed");
      }

      const calendarData = await res.json();
      setCalendar(calendarData);

      setApproving(false);
      // Navigate to calendar view — user will create content daily from their dashboard
      router.push("/dashboard/calendar");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Calendar generation failed. Please try again.";
      setCalendarError(msg);
      setApproving(false);
    }
  };

  const pillarColors = [
    "bg-ig-pink/10 text-ig-pink border-ig-pink/20",
    "bg-blue-500/10 text-blue-500 border-blue-500/20",
    "bg-ig-orange/10 text-ig-orange border-ig-orange/20",
    "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
    "bg-amber-500/10 text-amber-500 border-amber-500/20",
  ];

  return (
    <div className="p-6 max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Review Your Strategy</h1>
          <p className="text-sm text-muted-foreground">
            Approve each section or request changes.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={approveAll}>
          <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
          Approve All
        </Button>
      </div>

      {/* Progress bar */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="font-medium">
            {approvedCount} of {totalSections} sections approved
          </span>
          <span className="text-muted-foreground">
            {Math.round((approvedCount / totalSections) * 100)}%
          </span>
        </div>
        <div className="h-2 rounded-full bg-muted overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-ig-pink"
            initial={{ width: 0 }}
            animate={{
              width: `${(approvedCount / totalSections) * 100}%`,
            }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      {/* Brand Positioning */}
      <SectionCard
        sectionKey="brandPositioning"
        label="Brand Positioning"
        icon={Target}
        status={sections.brandPositioning}
        onToggle={toggleSection}
        feedback={sectionFeedback.brandPositioning || ""}
        onFeedbackChange={updateFeedback}
        onRevise={handleReviseSection}
        isRevising={revisingSection === "brandPositioning"}
        revisionError={revisionError.brandPositioning}
        revisionsUsed={revisionCount.brandPositioning || 0}
        maxRevisions={MAX_REVISIONS}
      >
        <p className="text-sm">{strategy.brandPositioning?.summary}</p>
        <div className="flex flex-wrap gap-1.5 mt-2">
          {strategy.brandPositioning?.keyMessages?.map((msg: string) => (
            <span
              key={msg}
              className="inline-flex rounded-full bg-ig-pink/10 text-ig-pink px-2.5 py-0.5 text-xs"
            >
              {msg}
            </span>
          ))}
        </div>
      </SectionCard>

      {/* Content Pillars */}
      <SectionCard
        sectionKey="contentPillars"
        label="Content Pillars"
        icon={Layout}
        status={sections.contentPillars}
        onToggle={toggleSection}
        feedback={sectionFeedback.contentPillars || ""}
        onFeedbackChange={updateFeedback}
        onRevise={handleReviseSection}
        isRevising={revisingSection === "contentPillars"}
        revisionError={revisionError.contentPillars}
        revisionsUsed={revisionCount.contentPillars || 0}
        maxRevisions={MAX_REVISIONS}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {strategy.contentPillars?.map((pillar: any, i: number) => (
            <div
              key={pillar.name}
              className={`rounded-lg border p-3 space-y-2 ${pillarColors[i % pillarColors.length]}`}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold">{pillar.name}</span>
                <span className="text-xs font-bold">{pillar.percentage}%</span>
              </div>
              <p className="text-[11px] opacity-80">{pillar.rationale}</p>
              <div className="flex flex-wrap gap-1">
                {pillar.examples?.map((ex: string) => (
                  <span
                    key={ex}
                    className="text-[10px] bg-white/50 dark:bg-black/20 rounded px-1.5 py-0.5"
                  >
                    {ex}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Posting Cadence */}
      <SectionCard
        sectionKey="postingCadence"
        label="Posting Cadence"
        icon={Clock}
        status={sections.postingCadence}
        onToggle={toggleSection}
        feedback={sectionFeedback.postingCadence || ""}
        onFeedbackChange={updateFeedback}
        onRevise={handleReviseSection}
        isRevising={revisingSection === "postingCadence"}
        revisionError={revisionError.postingCadence}
        revisionsUsed={revisionCount.postingCadence || 0}
        maxRevisions={MAX_REVISIONS}
      >
        <div className="space-y-3">
          <p className="text-sm">
            <span className="font-medium">
              {strategy.postingCadence?.postsPerWeek} posts/week
            </span>
          </p>
          {/* Weekly schedule */}
          <div className="grid grid-cols-7 gap-1">
            {Object.entries(strategy.postingCadence?.schedule ?? {}).map(
              ([day, pillar]) => (
                <div
                  key={day}
                  className="text-center rounded-lg border border-border/40 p-2"
                >
                  <p className="text-[10px] font-medium text-muted-foreground">
                    {day}
                  </p>
                  <p className="text-xs font-medium mt-1">
                    {pillar as string}
                  </p>
                </div>
              )
            )}
          </div>
          {/* Best times */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Best times:</span>
            {strategy.postingCadence?.bestTimes?.map((t: string) => (
              <Badge key={t} variant="secondary" className="text-[10px]">
                {t}
              </Badge>
            ))}
          </div>
        </div>
      </SectionCard>

      {/* Tone & Voice */}
      <SectionCard
        sectionKey="toneAndVoice"
        label="Tone & Voice"
        icon={MessageSquare}
        status={sections.toneAndVoice}
        onToggle={toggleSection}
        feedback={sectionFeedback.toneAndVoice || ""}
        onFeedbackChange={updateFeedback}
        onRevise={handleReviseSection}
        isRevising={revisingSection === "toneAndVoice"}
        revisionError={revisionError.toneAndVoice}
        revisionsUsed={revisionCount.toneAndVoice || 0}
        maxRevisions={MAX_REVISIONS}
      >
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <p className="text-xs font-medium text-emerald-600">Do</p>
            <ul className="space-y-1">
              {strategy.toneAndVoice?.doList?.map((item: string) => (
                <li
                  key={item}
                  className="text-xs flex items-start gap-1.5"
                >
                  <CheckCircle2 className="h-3 w-3 text-emerald-500 mt-0.5 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="space-y-2">
            <p className="text-xs font-medium text-red-500">Don&apos;t</p>
            <ul className="space-y-1">
              {strategy.toneAndVoice?.dontList?.map((item: string) => (
                <li
                  key={item}
                  className="text-xs flex items-start gap-1.5"
                >
                  <XCircle className="h-3 w-3 text-red-500 mt-0.5 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
        {strategy.toneAndVoice?.sampleCaptions?.length > 0 && (
          <div className="mt-3 space-y-2">
            <p className="text-xs font-medium text-muted-foreground">
              Sample Captions
            </p>
            {strategy.toneAndVoice?.sampleCaptions?.map((cap: string) => (
              <blockquote
                key={cap}
                className="border-l-2 border-ig-pink/40 pl-3 text-xs italic text-muted-foreground"
              >
                &ldquo;{cap}&rdquo;
              </blockquote>
            ))}
          </div>
        )}
      </SectionCard>

      {/* Hashtag Strategy */}
      <SectionCard
        sectionKey="hashtagStrategy"
        label="Hashtag Strategy"
        icon={Hash}
        status={sections.hashtagStrategy}
        onToggle={toggleSection}
        feedback={sectionFeedback.hashtagStrategy || ""}
        onFeedbackChange={updateFeedback}
        onRevise={handleReviseSection}
        isRevising={revisingSection === "hashtagStrategy"}
        revisionError={revisionError.hashtagStrategy}
        revisionsUsed={revisionCount.hashtagStrategy || 0}
        maxRevisions={MAX_REVISIONS}
      >
        <div className="space-y-3">
          {(
            [
              ["Branded", strategy.hashtagStrategy?.branded],
              ["Niche", strategy.hashtagStrategy?.niche],
              ["Trending", strategy.hashtagStrategy?.trending],
            ] as [string, string[]][]
          ).map(([group, tags]) => (
            <div key={group}>
              <p className="text-xs font-medium text-muted-foreground mb-1">
                {group}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {tags?.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex rounded-full bg-ig-pink/10 text-ig-pink px-2.5 py-0.5 text-xs"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Content Formats */}
      <SectionCard
        sectionKey="contentFormats"
        label="Content Formats"
        icon={Film}
        status={sections.contentFormats}
        onToggle={toggleSection}
        feedback={sectionFeedback.contentFormats || ""}
        onFeedbackChange={updateFeedback}
        onRevise={handleReviseSection}
        isRevising={revisingSection === "contentFormats"}
        revisionError={revisionError.contentFormats}
        revisionsUsed={revisionCount.contentFormats || 0}
        maxRevisions={MAX_REVISIONS}
      >
        <div className="space-y-2">
          <div className="flex h-4 rounded-full overflow-hidden">
            <div
              className="bg-ig-pink"
              style={{
                width: `${strategy.contentFormats?.reels ?? 50}%`,
              }}
            />
            <div
              className="bg-blue-500"
              style={{
                width: `${strategy.contentFormats?.carousels ?? 30}%`,
              }}
            />
            <div
              className="bg-ig-orange"
              style={{
                width: `${strategy.contentFormats?.images ?? 20}%`,
              }}
            />
          </div>
          <div className="flex gap-4 text-xs">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-ig-pink" />
              Reels {strategy.contentFormats?.reels}%
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-blue-500" />
              Carousels {strategy.contentFormats?.carousels}%
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-ig-orange" />
              Images {strategy.contentFormats?.images}%
            </span>
          </div>
        </div>
      </SectionCard>

      {/* Growth Tactics */}
      <SectionCard
        sectionKey="growthTactics"
        label="Growth Tactics"
        icon={Rocket}
        status={sections.growthTactics}
        onToggle={toggleSection}
        feedback={sectionFeedback.growthTactics || ""}
        onFeedbackChange={updateFeedback}
        onRevise={handleReviseSection}
        isRevising={revisingSection === "growthTactics"}
        revisionError={revisionError.growthTactics}
        revisionsUsed={revisionCount.growthTactics || 0}
        maxRevisions={MAX_REVISIONS}
      >
        <div className="space-y-2">
          {strategy.growthTactics?.map((tactic: any) => (
            <div
              key={tactic.name}
              className="flex items-start gap-3 rounded-lg border border-border/40 p-3"
            >
              <Badge
                variant="secondary"
                className={`text-[10px] shrink-0 ${
                  tactic.impact === "High"
                    ? "bg-ig-pink/10 text-ig-pink"
                    : "bg-amber-500/10 text-amber-600"
                }`}
              >
                {tactic.impact}
              </Badge>
              <div>
                <p className="text-sm font-medium">{tactic.name}</p>
                <p className="text-xs text-muted-foreground">
                  {tactic.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Calendar generation error */}
      {calendarError && (
        <div className="mx-auto max-w-lg rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-center">
          <p className="text-sm text-red-500 font-medium">Calendar generation failed</p>
          <p className="text-xs text-muted-foreground mt-1">{calendarError}</p>
        </div>
      )}

      {/* Approve & Generate */}
      <div className="flex flex-col items-center gap-3 pt-4 pb-8">
        {!allApproved && (
          <p className="text-xs text-muted-foreground">
            Approve all {totalSections} sections to continue, or click the pencil icon to request changes.
          </p>
        )}
        <Button
          onClick={() => { setCalendarError(null); handleGenerateCalendar(); }}
          disabled={!allApproved || approving}
          size="lg"
          className="px-8 gap-2"
        >
          {approving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Generating Calendar...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              {calendarError ? "Retry Calendar Generation" : "Generate Content Calendar"}
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

function SectionCard({
  sectionKey,
  label,
  icon: Icon,
  status,
  onToggle,
  feedback,
  onFeedbackChange,
  onRevise,
  isRevising,
  revisionError,
  revisionsUsed,
  maxRevisions,
  children,
}: {
  sectionKey: string;
  label: string;
  icon: any;
  status: SectionStatus;
  onToggle: (key: string, status: SectionStatus) => void;
  feedback: string;
  onFeedbackChange: (key: string, value: string) => void;
  onRevise: (key: string) => void;
  isRevising: boolean;
  revisionError?: string;
  revisionsUsed: number;
  maxRevisions: number;
  children: React.ReactNode;
}) {
  const revisionsLeft = maxRevisions - revisionsUsed;
  return (
    <Card
      className={
        status === "approved"
          ? "ring-1 ring-emerald-500/30"
          : status === "rejected"
            ? "ring-1 ring-red-500/30"
            : ""
      }
    >
      <CardHeader className="flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Icon className="h-4 w-4 text-ig-pink" />
          {label}
          {status === "approved" && (
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          )}
          {status === "rejected" && (
            <Pencil className="h-4 w-4 text-amber-500" />
          )}
        </CardTitle>
        <div className="flex gap-1.5">
          <Button
            variant={status === "approved" ? "default" : "outline"}
            size="xs"
            onClick={() => onToggle(sectionKey, "approved")}
            className={
              status === "approved"
                ? "bg-emerald-500 hover:bg-emerald-600 text-white border-emerald-500"
                : ""
            }
          >
            <CheckCircle2 className="h-3 w-3" />
          </Button>
          <Button
            variant={status === "rejected" ? "destructive" : "outline"}
            size="xs"
            onClick={() => onToggle(sectionKey, "rejected")}
            title="Request changes"
          >
            <Pencil className="h-3 w-3" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {children}

        {/* Feedback & Revision UI — shown when section is rejected */}
        {status === "rejected" && (
          <div className="mt-4 pt-4 border-t border-border/40 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-amber-500">
                Tell the AI what to change
              </p>
              <span className={`text-[10px] font-medium ${revisionsLeft <= 1 ? "text-red-400" : "text-muted-foreground"}`}>
                {revisionsLeft} of {maxRevisions} revisions left
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Be specific — e.g. &ldquo;Change posting frequency to 3x/week&rdquo; or &ldquo;Remove the Product Highlights pillar and split its % among the others.&rdquo; The AI will regenerate only this section.
            </p>
            <textarea
              value={feedback}
              onChange={(e) => onFeedbackChange(sectionKey, e.target.value)}
              placeholder="Describe what you want changed, or say 'completely regenerate this section'..."
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm min-h-[80px] focus:outline-none focus:ring-2 focus:ring-ig-pink/30 resize-none"
              disabled={isRevising || revisionsLeft <= 0}
            />
            {revisionError && (
              <p className="text-xs text-red-500">{revisionError}</p>
            )}
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                onClick={() => onRevise(sectionKey)}
                disabled={isRevising || !feedback.trim() || revisionsLeft <= 0}
                className="gap-1.5"
              >
                {isRevising ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <RefreshCw className="h-3.5 w-3.5" />
                )}
                {isRevising ? "Revising..." : "Regenerate Section"}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onToggle(sectionKey, "approved")}
                disabled={isRevising}
                className="text-xs"
              >
                Approve As-Is
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}


