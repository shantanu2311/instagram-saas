import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";
import { callAI } from "@/lib/content-engine";

export async function POST(request: Request) {
  const limited = rateLimit(request, "generate");
  if (limited) return limited;

  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Request body is required." },
      { status: 400 }
    );
  }

  const { brandId } = body || {};
  if (!brandId) {
    return NextResponse.json(
      { error: "brandId is required." },
      { status: 400 }
    );
  }

  try {
    // Verify brand ownership
    const brand = await prisma.brand.findFirst({
      where: { id: brandId, userId: session.user.id },
    });
    if (!brand) {
      return NextResponse.json({ error: "Brand not found" }, { status: 404 });
    }

    // Fetch current strategy
    const strategy = await prisma.strategy.findUnique({
      where: { brandId },
    });
    if (!strategy) {
      return NextResponse.json(
        { error: "No strategy found. Create a strategy first." },
        { status: 404 }
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const strategyData = strategy.data as any;

    // Fetch last 30 days of performance data
    const since = new Date();
    since.setDate(since.getDate() - 30);

    const posts = await prisma.generatedContent.findMany({
      where: {
        brandId,
        status: "published",
        postedAt: { gte: since },
      },
      include: {
        analytics: true,
        calendarSlot: { select: { pillar: true } },
      },
      take: 200,
    });

    // Compute performance breakdown
    const pillarPerf: Record<string, { likes: number; comments: number; count: number }> = {};
    const typePerf: Record<string, { likes: number; comments: number; count: number }> = {};

    for (const post of posts) {
      const pillar = post.calendarSlot?.pillar || "Unknown";
      const type = post.contentType || "image";
      const likes = post.analytics?.likes || 0;
      const comments = post.analytics?.comments || 0;

      if (!pillarPerf[pillar]) pillarPerf[pillar] = { likes: 0, comments: 0, count: 0 };
      pillarPerf[pillar].likes += likes;
      pillarPerf[pillar].comments += comments;
      pillarPerf[pillar].count += 1;

      if (!typePerf[type]) typePerf[type] = { likes: 0, comments: 0, count: 0 };
      typePerf[type].likes += likes;
      typePerf[type].comments += comments;
      typePerf[type].count += 1;
    }

    const pillarAnalysis = Object.entries(pillarPerf).map(([name, data]) => ({
      name,
      avgEngagement: data.count > 0 ? Math.round((data.likes + data.comments) / data.count) : 0,
      count: data.count,
    }));

    const typeAnalysis = Object.entries(typePerf).map(([type, data]) => ({
      type,
      avgEngagement: data.count > 0 ? Math.round((data.likes + data.comments) / data.count) : 0,
      count: data.count,
    }));

    const totalPosts = posts.length;
    const totalEngagement = posts.reduce(
      (sum, p) => sum + (p.analytics?.likes || 0) + (p.analytics?.comments || 0),
      0
    );
    const avgEngagement = totalPosts > 0 ? Math.round(totalEngagement / totalPosts) : 0;

    // Calendar completion stats
    const calendarSlots = await prisma.calendarSlot.findMany({
      where: {
        brandId,
        date: { gte: since },
      },
      select: { status: true },
    });

    const slotsTotal = calendarSlots.length;
    const slotsCompleted = calendarSlots.filter(
      (s) => s.status === "created" || s.status === "uploaded"
    ).length;
    const slotsMissed = calendarSlots.filter((s) => s.status === "missed" || s.status === "skipped").length;

    // Build AI evaluation prompt
    const systemPrompt = `You are an expert Instagram growth strategist conducting a 30-day strategy review. Analyze the creator's strategy goals versus their actual performance, identify what worked and what didn't, and recommend specific changes for the next 30-day cycle.

Return ONLY valid JSON with this exact structure:
{
  "evaluation": {
    "goalsSet": ["goal 1 from original strategy", "goal 2"],
    "goalsAchieved": ["achieved goal 1"],
    "goalsNotMet": ["missed goal with reason"],
    "postsPublished": number,
    "postsPlanned": number,
    "completionRate": number,
    "avgEngagement": number,
    "bestPerforming": { "pillar": "name", "type": "type", "reason": "why" },
    "worstPerforming": { "pillar": "name", "type": "type", "reason": "why" },
    "keyLearnings": ["learning 1", "learning 2", "learning 3"]
  },
  "recommendations": [
    {
      "area": "pillars|formats|cadence|tone|hashtags|content_mix",
      "change": "Specific change description",
      "reason": "Evidence-based reason from performance data",
      "priority": "high|medium|low"
    }
  ],
  "updatedStrategy": {
    "contentPillars": [{"name": "string", "percentage": number, "rationale": "string"}],
    "contentFormats": {"reels": number, "carousels": number, "images": number},
    "postingCadence": {"postsPerWeek": number, "bestTimes": ["string"]},
    "toneAndVoice": {"doList": ["string"], "dontList": ["string"]},
    "hashtagStrategy": {"branded": ["string"], "niche": ["string"], "trending": ["string"]},
    "growthTactics": [{"name": "string", "impact": "High|Medium|Low", "description": "string"}],
    "milestones": {"day30": {"followers": number, "engagementRate": "string", "posts": number}, "day60": {"followers": number, "engagementRate": "string", "posts": number}, "day90": {"followers": number, "engagementRate": "string", "posts": number}}
  },
  "summary": "One paragraph executive summary of the review"
}

IMPORTANT:
- The updatedStrategy must be a COMPLETE strategy object — not just the changed fields
- Base the updatedStrategy on the current strategy, applying only the recommended changes
- Be specific with numbers — "increase from 40% to 55%" not "increase"
- If there's insufficient data, still provide recommendations based on industry best practices
- Generate 3-7 recommendations, prioritized by impact`;

    const userMessage = `CURRENT STRATEGY (Cycle ${strategy.cycleNumber}):
- Content pillars: ${JSON.stringify(strategyData.contentPillars?.map((p: { name: string; percentage: number }) => `${p.name} (${p.percentage}%)`)) || "Not set"}
- Content formats: ${JSON.stringify(strategyData.contentFormats) || "Not set"}
- Posts per week: ${strategyData.postingCadence?.postsPerWeek || "Not set"}
- Tone: ${JSON.stringify(strategyData.toneAndVoice) || "Not set"}
- Growth milestones: ${JSON.stringify(strategyData.milestones) || "Not set"}
- Hashtag strategy: ${JSON.stringify(strategyData.hashtagStrategy) || "Not set"}

PERFORMANCE DATA (last 30 days):
- Posts published: ${totalPosts} of ${slotsTotal} planned (${slotsTotal > 0 ? Math.round((slotsCompleted / slotsTotal) * 100) : 0}% completion)
- Slots missed/skipped: ${slotsMissed}
- Average engagement per post: ${avgEngagement}
- Total engagement: ${totalEngagement}
- By pillar: ${JSON.stringify(pillarAnalysis)}
- By content type: ${JSON.stringify(typeAnalysis)}
- Brand niche: ${brand.niche || "general"}

Please evaluate this cycle and recommend improvements for the next 30 days.`;

    const result = await callAI({
      system: systemPrompt,
      userMessage,
      maxTokens: 4096,
    });

    const jsonMatch = result.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json(
        { error: "Failed to parse AI evaluation" },
        { status: 500 }
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let parsed: any;
    try {
      parsed = JSON.parse(jsonMatch[0]);
    } catch {
      return NextResponse.json(
        { error: "Failed to parse AI evaluation" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      evaluation: parsed.evaluation || {
        postsPublished: totalPosts,
        postsPlanned: slotsTotal,
        avgEngagement,
        keyLearnings: [],
      },
      recommendations: parsed.recommendations || [],
      updatedStrategy: parsed.updatedStrategy || strategyData,
      summary: parsed.summary || "Review completed.",
      currentCycle: strategy.cycleNumber,
      approvedAt: strategy.approvedAt,
    });
  } catch (err) {
    console.error("Strategy review-cycle error:", err);
    return NextResponse.json(
      { error: "Failed to generate strategy review." },
      { status: 500 }
    );
  }
}
