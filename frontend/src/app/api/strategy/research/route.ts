import { NextResponse } from "next/server";
import { generateResearch } from "@/lib/content-engine/research-generator";

export async function POST(request: Request) {
  try {
    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Request body is required." },
        { status: 400 }
      );
    }

    const result = await generateResearch({
      accountType: String(body.accountType || "business"),
      businessName: String(body.businessName || ""),
      businessDescription: String(body.businessDescription || ""),
      productService: String(body.productService || ""),
      niche: String(body.niche || ""),
      competitors: Array.isArray(body.competitors) ? body.competitors.map(String) : [],
      goals: Array.isArray(body.goals) ? body.goals.map(String) : [],
      targetDemographics: Array.isArray(body.targetDemographics) ? body.targetDemographics.map(String) : [],
      targetLocation: String(body.targetLocation || ""),
      targetAgeMin: Number(body.targetAgeMin) || 18,
      targetAgeMax: Number(body.targetAgeMax) || 45,
      targetGender: String(body.targetGender || "all"),
      contentPreferences: Array.isArray(body.contentPreferences) ? body.contentPreferences.map(String) : [],
      brandPersonality: Array.isArray(body.brandPersonality) ? body.brandPersonality.map(String) : [],
      usp: String(body.usp || ""),
    });

    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Research generation failed";
    console.error("Research error:", message);

    if (message.includes("ANTHROPIC_API_KEY")) {
      return NextResponse.json(
        { error: "Set ANTHROPIC_API_KEY in frontend/.env to enable AI features." },
        { status: 500 }
      );
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
