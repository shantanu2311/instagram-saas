import { NextResponse } from "next/server";
import { generateStrategy } from "@/lib/content-engine";

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

    if (!body.businessName && !body.businessDescription && !body.goals) {
      return NextResponse.json(
        { error: "Discovery data is required. Please complete the discovery questionnaire first." },
        { status: 400 }
      );
    }

    const strategy = await generateStrategy({
      accountType: body.accountType || "business",
      businessName: body.businessName || "",
      businessDescription: body.businessDescription || "",
      productService: body.productService || "",
      targetDemographics: body.targetDemographics || [],
      targetLocation: body.targetLocation || "",
      targetAgeMin: body.targetAgeMin || 18,
      targetAgeMax: body.targetAgeMax || 45,
      competitors: body.competitors || [],
      goals: body.goals || [],
      contentPreferences: body.contentPreferences || [],
      usp: body.usp || "",
      keyDifferentiators: body.keyDifferentiators || [],
      painPoints: body.painPoints || [],
      brandPersonality: body.brandPersonality || [],
      postingHistory: body.postingHistory || "",
      ambition: body.ambition || "",
      monetizationGoal: body.monetizationGoal || "",
      instagramHandle: body.instagramHandle || "",
    });

    return NextResponse.json(strategy);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Strategy generation failed";
    console.error("Strategy generate error:", message);

    if (message.includes("ANTHROPIC_API_KEY")) {
      return NextResponse.json(
        { error: "Set ANTHROPIC_API_KEY in frontend/.env to enable AI strategy generation." },
        { status: 500 }
      );
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
