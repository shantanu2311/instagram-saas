import { NextResponse } from "next/server";
import { callAI } from "@/lib/content-engine";
import { auth } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const limited = rateLimit(request, "generate");
  if (limited) return limited;

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { sectionKey?: string; currentContent?: unknown; feedback?: string; brandContext?: unknown };
  try {
    body = await request.json();
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ error: "Request body is required." }, { status: 400 });
  }

  const { sectionKey, currentContent, feedback, brandContext } = body;

  if (!sectionKey || !feedback?.trim()) {
    return NextResponse.json(
      { error: "sectionKey and feedback are required." },
      { status: 400 }
    );
  }

  const sectionLabels: Record<string, string> = {
    brandPositioning: "Brand Positioning",
    contentPillars: "Content Pillars",
    postingCadence: "Posting Cadence",
    toneAndVoice: "Tone & Voice",
    hashtagStrategy: "Hashtag Strategy",
    contentFormats: "Content Formats",
    growthTactics: "Growth Tactics",
  };

  const label = sectionLabels[sectionKey] || sectionKey;

  try {
    const systemPrompt = `You are revising one section of an Instagram content strategy. The user reviewed the "${label}" section and wants changes.

CURRENT CONTENT:
${JSON.stringify(currentContent, null, 2)}

${brandContext ? `BRAND CONTEXT: ${JSON.stringify(brandContext)}` : ""}

RULES:
- Return ONLY valid JSON matching the exact same structure as the current content
- Apply the user's feedback to improve/change the section
- Keep the same JSON keys and types — only change the values
- Do NOT wrap in markdown code blocks — return raw JSON only`;

    const text = await callAI({
      system: systemPrompt,
      userMessage: `User feedback: "${feedback}"`,
      model: "fast",
      maxTokens: 2048,
    });

    // Extract JSON from response
    const jsonMatch = text.match(/[\[{][\s\S]*[\]}]/);
    if (!jsonMatch) {
      return NextResponse.json(
        { error: "Failed to parse revised section. Try again with clearer feedback." },
        { status: 500 }
      );
    }

    const revised = JSON.parse(jsonMatch[0]);
    return NextResponse.json({ sectionKey, revised });
  } catch (err) {
    console.error("Section revision error:", err);
    return NextResponse.json(
      { error: "Failed to revise section. Please try again." },
      { status: 500 }
    );
  }
}
