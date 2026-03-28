import { NextResponse } from "next/server";
import { callClaude } from "@/lib/content-engine";

export async function POST(request: Request) {
  try {
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

    if (!body.profile) {
      return NextResponse.json(
        { error: "Discovery profile is required." },
        { status: 400 }
      );
    }

    const profile = body.profile;

    const systemPrompt = `You are an expert Instagram growth strategist conducting a follow-up interview with a client. Based on their discovery profile, ask 3-5 specific follow-up questions that would help create a more targeted content strategy.

Focus on:
- Gaps or ambiguities in their answers
- Areas where more detail would significantly improve the strategy
- Specific pain points that need deeper understanding
- Unexplored opportunities in their niche

Return ONLY valid JSON matching this exact structure:
{ "questions": ["Question 1?", "Question 2?", "Question 3?"] }

Keep questions conversational, specific to their business, and actionable. Avoid generic questions.`;

    const userMessage = `Here is the client's discovery profile:

ACCOUNT TYPE: ${profile.accountType || "business"}
NAME: ${profile.businessName || "Not provided"}
DESCRIPTION: ${profile.businessDescription || "Not provided"}
PRODUCT/SERVICE: ${profile.productService || "Not provided"}
USP: ${profile.usp || "Not provided"}
KEY DIFFERENTIATORS: ${(profile.keyDifferentiators || []).join(", ") || "Not specified"}
TARGET AUDIENCE: Age ${profile.targetAgeMin || 18}-${profile.targetAgeMax || 45}, ${(profile.targetDemographics || []).join(", ") || "Not specified"}
LOCATION: ${profile.targetLocation || "Not specified"}
COMPETITORS: ${(profile.competitors || []).join(", ") || "Not specified"}
GOALS: ${(profile.goals || []).join(", ") || "Not specified"}
CONTENT PREFERENCES: ${(profile.contentPreferences || []).join(", ") || "Not specified"}
PAIN POINTS: ${(profile.painPoints || []).join(", ") || "Not specified"}
BRAND PERSONALITY: ${(profile.brandPersonality || []).join(", ") || "Not specified"}
POSTING HISTORY: ${profile.postingHistory || "Not specified"}
AMBITION: ${profile.ambition || "Not specified"}
MONETIZATION: ${profile.monetizationGoal || "Not specified"}

Generate 3-5 follow-up questions to fill in any gaps and create a stronger strategy.`;

    const text = await callClaude({
      system: systemPrompt,
      userMessage,
      model: "fast",
      maxTokens: 1024,
    });

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Failed to parse questions from Claude response");
    }

    const parsed = JSON.parse(jsonMatch[0]);

    if (!parsed.questions || !Array.isArray(parsed.questions)) {
      throw new Error("Invalid response format: missing questions array");
    }

    return NextResponse.json({ questions: parsed.questions });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to generate follow-up questions";
    console.error("Deep dive error:", message);

    if (message.includes("ANTHROPIC_API_KEY")) {
      return NextResponse.json(
        {
          error:
            "Set ANTHROPIC_API_KEY in frontend/.env to enable AI-powered follow-up questions.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
