"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useStrategyStore } from "@/lib/stores/strategy-store";
import { useOnboardingStore } from "@/lib/stores/onboarding-store";
import { useQueueStore } from "@/lib/stores/queue-store";
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
  Trophy,
  Loader2,
  Sparkles,
} from "lucide-react";
import { motion } from "framer-motion";

type SectionStatus = "pending" | "approved" | "rejected";

function convertTimeToISO(time: string): string {
  const match = time.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (!match) return "07:30:00";
  let hours = parseInt(match[1]);
  const minutes = match[2];
  const period = match[3].toUpperCase();
  if (period === "PM" && hours < 12) hours += 12;
  if (period === "AM" && hours === 12) hours = 0;
  return `${hours.toString().padStart(2, "0")}:${minutes}:00`;
}

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
  const { brand: savedBrand } = useOnboardingStore();
  const [sections, setSections] = useState<Record<string, SectionStatus>>({});
  const [approving, setApproving] = useState(false);

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

  const handleGenerateCalendar = async () => {
    setApproving(true);
    const queueStore = useQueueStore.getState();

    try {
      // Approve strategy
      await fetch("/api/strategy/approve", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ strategyId: strategy.id, sections }),
      }).catch(() => {}); // Non-critical if approve endpoint isn't wired

      // Build brand context for batch generation
      const brandContext = {
        niche: savedBrand.niche,
        brandName: savedBrand.brandHashtag?.replace("#", "") || "",
        primaryColor: savedBrand.primaryColor,
        secondaryColor: savedBrand.secondaryColor,
        accentColor: savedBrand.accentColor,
        toneFormality: savedBrand.toneFormality,
        toneHumor: savedBrand.toneHumor,
        voiceDescription: savedBrand.voiceDescription,
        sampleCaption: savedBrand.sampleCaption,
        contentPillars: savedBrand.contentPillars,
        brandHashtag: savedBrand.brandHashtag,
      };

      const strategyContext = {
        contentPillars: strategy.contentPillars,
        toneAndVoice: strategy.toneAndVoice,
        hashtagStrategy: strategy.hashtagStrategy,
        brandPositioning: strategy.brandPositioning,
      };

      // Generate calendar with full context
      const res = await fetch("/api/strategy/calendar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          strategyId: strategy.id,
          ...brandContext,
          postsPerWeek: savedBrand.postsPerWeek || 5,
          strategy: strategyContext,
        }),
      });
      const calendarData = await res.json();
      setCalendar(calendarData);

      // Check automation level
      const autoLevel = savedBrand.automationLevel || "approve-posts";

      // Full-control: go to design preview first (no batch gen yet)
      if (autoLevel === "full-control") {
        setApproving(false);
        router.push("/queue/preview");
        return;
      }

      // Approve-posts or full-auto: start batch content generation
      const slots = calendarData.slots || [];
      if (slots.length > 0) {
        // Add placeholder queue items for each slot
        for (const slot of slots) {
          queueStore.addItem({
            id: `q-${slot.date}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            calendarSlotDate: slot.date,
            pillar: slot.pillar,
            contentType: slot.contentType || "image",
            topic: slot.topic,
            headline: slot.headline || slot.topic,
            caption: "",
            hashtags: [],
            qualityScore: 0,
            suggestedTime: slot.suggestedTime || "7:30 AM",
            status: "generating",
            createdAt: new Date().toISOString(),
            scheduledFor: `${slot.date}T${slot.suggestedTime ? convertTimeToISO(slot.suggestedTime) : "07:30:00"}`,
          });
        }

        queueStore.setBatchProgress({
          total: slots.length,
          completed: 0,
          failed: 0,
          inProgress: true,
        });

        // Navigate to queue immediately — generation happens in background
        setApproving(false);
        router.push("/queue");

        // Stream batch generation results
        const batchRes = await fetch("/api/studio/batch-generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            slots,
            brand: brandContext,
            strategy: strategyContext,
          }),
        });

        const reader = batchRes.body?.getReader();
        const decoder = new TextDecoder();
        const queueItems = queueStore.items.filter((i) => i.status === "generating");
        let completed = 0;
        let failed = 0;

        if (reader) {
          let buffer = "";
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });

            // Process complete NDJSON lines
            const lines = buffer.split("\n");
            buffer = lines.pop() || "";

            for (const line of lines) {
              if (!line.trim()) continue;
              try {
                const result = JSON.parse(line);
                const qItem = queueItems[result.index];
                if (!qItem) continue;

                const autoLevel = savedBrand.automationLevel || "approve-posts";
                const newStatus =
                  result.status === "success"
                    ? autoLevel === "full-auto"
                      ? ("approved" as const)
                      : ("pending_approval" as const)
                    : ("failed" as const);

                useQueueStore.getState().updateItem(qItem.id, {
                  headline: result.headline || qItem.headline,
                  caption: result.caption || "",
                  hashtags: result.hashtags || [],
                  qualityScore: result.qualityScore || 0,
                  status: newStatus,
                  error: result.error,
                });

                if (result.status === "success") completed++;
                else failed++;

                useQueueStore.getState().setBatchProgress({
                  total: slots.length,
                  completed: completed + failed,
                  failed,
                  inProgress: completed + failed < slots.length,
                });
              } catch {
                // Skip malformed lines
              }
            }
          }
        }

        useQueueStore.getState().setBatchProgress({
          total: slots.length,
          completed: completed + failed,
          failed,
          inProgress: false,
        });

        return; // Already navigated
      }
    } catch {
      // Mock calendar fallback
      setCalendar(buildMockCalendar());
    }
    setApproving(false);
    router.push("/strategy/calendar");
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
            {strategy.toneAndVoice.sampleCaptions.map((cap: string) => (
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

      {/* Milestones */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Trophy className="h-4 w-4 text-ig-pink" />
            Milestones
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3">
            {(
              [
                ["30 Days", strategy.milestones?.day30],
                ["60 Days", strategy.milestones?.day60],
                ["90 Days", strategy.milestones?.day90],
              ] as [string, any][]
            ).map(([label, data]) => (
              <div
                key={label}
                className="rounded-lg border border-border/40 p-3 text-center space-y-1"
              >
                <p className="text-xs font-medium text-muted-foreground">
                  {label}
                </p>
                <p className="text-lg font-bold">{data?.followers}</p>
                <p className="text-[10px] text-muted-foreground">followers</p>
                <p className="text-xs">
                  {data?.engagement} engagement
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {data?.posts} posts target
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Approve & Generate */}
      <div className="flex justify-center pt-4 pb-8">
        <Button
          onClick={handleGenerateCalendar}
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
              Approve All &amp; Generate Calendar
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
  children,
}: {
  sectionKey: string;
  label: string;
  icon: any;
  status: SectionStatus;
  onToggle: (key: string, status: SectionStatus) => void;
  children: React.ReactNode;
}) {
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
            <XCircle className="h-4 w-4 text-red-500" />
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
          >
            <XCircle className="h-3 w-3" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function buildMockCalendar() {
  const pillars = ["Education", "Entertainment", "Promotion", "Community"];
  const types = ["reel", "carousel", "image", "reel", "carousel"];
  const topics = [
    "5 tips for beginners",
    "Day in the life reel",
    "Product showcase carousel",
    "Community Q&A",
    "Trending audio reel",
    "Before/after transformation",
    "Industry myth busting",
    "Behind the scenes",
    "Customer spotlight",
    "Weekly roundup",
  ];

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const slots: any[] = [];

  // Generate 5 slots per week
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month, d);
    const dow = date.getDay();
    if (dow === 0 || dow === 6) continue; // skip weekends
    slots.push({
      date: date.toISOString().split("T")[0],
      day: d,
      dayOfWeek: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][dow],
      pillar: pillars[d % pillars.length],
      contentType: types[d % types.length],
      topic: topics[d % topics.length],
      headline: `Draft headline for ${topics[d % topics.length]}`,
      suggestedTime: d % 2 === 0 ? "7:30 AM" : "6:30 PM",
      isTrendBased: d % 4 === 0,
    });
  }

  return {
    id: "mock-calendar-1",
    month: month + 1,
    year,
    slots,
  };
}
