import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import { prisma } from "@/lib/db";
import { callClaude } from "@/lib/content-engine";

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

  const currentStrategy = body.currentStrategy;
  if (!currentStrategy) {
    return NextResponse.json(
      { error: "currentStrategy is required" },
      { status: 400 }
    );
  }

  const period = Math.min(90, Math.max(7, Number(body.period) || 30));
  const since = new Date();
  since.setDate(since.getDate() - period);

  // Fetch analytics data server-side
  const brand = await prisma.brand.findFirst({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!brand)
    return NextResponse.json({ error: "No brand found" }, { status: 404 });

  const posts = await prisma.generatedContent.findMany({
    where: {
      brandId: brand.id,
      status: "published",
      postedAt: { gte: since },
    },
    include: { analytics: true },
  });

  // Compute performance by content type
  const typePerf: Record<string, { likes: number; comments: number; count: number }> = {};
  for (const post of posts) {
    const t = post.contentType || "image";
    if (!typePerf[t]) typePerf[t] = { likes: 0, comments: 0, count: 0 };
    typePerf[t].likes += post.analytics?.likes || 0;
    typePerf[t].comments += post.analytics?.comments || 0;
    typePerf[t].count += 1;
  }

  const typeAnalysis = Object.entries(typePerf).map(([type, data]) => ({
    type,
    avgEngagement: data.count > 0 ? Math.round((data.likes + data.comments) / data.count) : 0,
    count: data.count,
  }));

  // Sort by avg engagement
  typeAnalysis.sort((a, b) => b.avgEngagement - a.avgEngagement);

  const totalPosts = posts.length;
  const totalEngagement = posts.reduce(
    (sum, p) => sum + (p.analytics?.likes || 0) + (p.analytics?.comments || 0),
    0
  );
  const avgEngagement = totalPosts > 0 ? Math.round(totalEngagement / totalPosts) : 0;

  const systemPrompt = `You are an expert Instagram growth strategist. Given a creator's current content strategy and their recent performance data, provide specific recommendations for improving their strategy.

Return ONLY valid JSON with this exact structure:
{
  "performanceSummary": {
    "bestPillar": { "name": "string", "avgEngagement": number },
    "worstPillar": { "name": "string", "avgEngagement": number },
    "bestType": { "name": "string", "avgEngagement": number },
    "worstType": { "name": "string", "avgEngagement": number }
  },
  "recommendations": [
    {
      "id": "rec_1",
      "text": "specific recommendation text",
      "type": "increase|decrease|adjust",
      "target": "what to change",
      "currentValue": number or null,
      "suggestedValue": number or null
    }
  ],
  "monthlyReview": {
    "totalPosts": number,
    "avgEngagement": number,
    "trend": "up|down|stable",
    "highlight": "one sentence summary"
  }
}

If there's insufficient data for pillars, use content types instead. Generate 3-5 recommendations. Be specific with numbers.`;

  const userMessage = `CURRENT STRATEGY:
- Content pillars: ${JSON.stringify(currentStrategy.contentPillars?.map((p: { name: string; percentage: number }) => `${p.name} (${p.percentage}%)`)) || "Not set"}
- Content formats: ${JSON.stringify(currentStrategy.contentFormats) || "Not set"}
- Posts per week: ${currentStrategy.postingCadence?.postsPerWeek || "Not set"}

PERFORMANCE DATA (last ${period} days):
- Total posts: ${totalPosts}
- Average engagement per post: ${avgEngagement}
- By content type: ${JSON.stringify(typeAnalysis)}
- Total engagement: ${totalEngagement}`;

  try {
    const result = await callClaude({ system: systemPrompt, userMessage });
    const jsonMatch = result.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ error: "Failed to parse AI response" }, { status: 500 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let parsed: any;
    try {
      parsed = JSON.parse(jsonMatch[0]);
    } catch {
      return NextResponse.json({ error: "Failed to parse AI response" }, { status: 500 });
    }

    return NextResponse.json({
      performanceSummary: parsed.performanceSummary || {
        bestPillar: { name: "—", avgEngagement: 0 },
        worstPillar: { name: "—", avgEngagement: 0 },
        bestType: typeAnalysis[0] || { name: "—", avgEngagement: 0 },
        worstType: typeAnalysis[typeAnalysis.length - 1] || { name: "—", avgEngagement: 0 },
      },
      recommendations: parsed.recommendations || [],
      monthlyReview: parsed.monthlyReview || {
        totalPosts,
        avgEngagement,
        trend: "stable",
        highlight: `${totalPosts} posts published with an average engagement of ${avgEngagement}.`,
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to generate insights" },
      { status: 500 }
    );
  }
}
