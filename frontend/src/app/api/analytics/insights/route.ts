import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
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

  if (!body.analyticsData) {
    return NextResponse.json(
      { error: "analyticsData is required" },
      { status: 400 }
    );
  }

  const systemPrompt = `You are an expert Instagram growth strategist and data analyst. Analyze the following Instagram performance data and provide 3-5 specific, actionable insights. Each insight should reference specific numbers and suggest concrete actions. Be concise — each insight should be 1-2 sentences max.

Focus on:
- Which content types perform best and why
- Engagement patterns and trends
- Specific recommendations to improve performance
- Any concerning trends that need attention

Return ONLY a JSON object with this structure:
{
  "insights": ["insight 1", "insight 2", ...]
}`;

  const userMessage = `Here's my Instagram analytics data for the selected period:

KPIs: ${JSON.stringify(body.analyticsData.kpis)}
Performance by content type: ${JSON.stringify(body.analyticsData.byContentType)}
Top performing posts: ${JSON.stringify(body.analyticsData.topPosts?.slice(0, 3))}
Engagement trend data points: ${body.analyticsData.engagementOverTime?.length || 0} posts`;

  try {
    const result = await callClaude({ system: systemPrompt, userMessage });
    const jsonMatch = result.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ insights: [result.trim()] });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let parsed: any;
    try {
      parsed = JSON.parse(jsonMatch[0]);
    } catch {
      return NextResponse.json({ insights: [result.trim()] });
    }

    return NextResponse.json({
      insights: Array.isArray(parsed.insights) ? parsed.insights : [result.trim()],
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to generate insights" },
      { status: 500 }
    );
  }
}
