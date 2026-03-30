import { NextResponse } from "next/server";
import { generateReelScript } from "@/lib/content-engine/reel-script-generator";
import type { BrandContext, StrategyContext } from "@/lib/content-engine";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const limited = rateLimit(request, "generate");
  if (limited) return limited;
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

    if (!body.topic || typeof body.topic !== "string" || !(body.topic as string).trim()) {
      return NextResponse.json(
        { error: "A topic is required to generate a Reel script." },
        { status: 400 }
      );
    }

    const topic = (body.topic as string).replace(/<[^>]*>/g, "").slice(0, 500);
    const duration = ["15", "30", "60", "90"].includes(body.duration as string)
      ? (body.duration as "15" | "30" | "60" | "90")
      : "30";

    const brand: BrandContext = {
      niche: (body.niche as string) || "",
      brandName: (body.brand_name as string) || "",
      primaryColor: "#DD2A7B",
      secondaryColor: "#F58529",
      accentColor: "#8134AF",
      toneFormality: typeof body.tone_formality === "number" ? Math.max(0, Math.min(100, body.tone_formality)) : 50,
      toneHumor: typeof body.tone_humor === "number" ? Math.max(0, Math.min(100, body.tone_humor)) : 50,
      voiceDescription: (body.brand_voice as string) || "",
      sampleCaptions: Array.isArray(body.sample_captions)
        ? (body.sample_captions as string[]).filter((c: string) => c.trim())
        : [],
      contentPillars: Array.isArray(body.content_pillars) ? (body.content_pillars as string[]) : [],
      brandHashtag: (body.brand_hashtag as string) || "",
    };

    const strategy: StrategyContext | null = (body.strategy as StrategyContext) || null;

    const result = await generateReelScript({
      topic,
      pillar: (body.pillar as string) || "education",
      brand,
      strategy,
      duration,
      faceless: body.faceless === true,
    });

    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Reel script generation failed";
    console.error("Reel generate error:", message);

    if (message.includes("OPENAI_API_KEY")) {
      return NextResponse.json(
        { error: "Set OPENAI_API_KEY in frontend/.env to enable AI content generation." },
        { status: 500 }
      );
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
