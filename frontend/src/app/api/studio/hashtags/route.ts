import { NextResponse } from "next/server";
import { researchHashtags } from "@/lib/content-engine/hashtag-generator";
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
        { error: "A topic is required to research hashtags." },
        { status: 400 }
      );
    }

    const topic = (body.topic as string).replace(/<[^>]*>/g, "").slice(0, 300);

    const brand: BrandContext = {
      niche: (body.niche as string) || "",
      brandName: (body.brand_name as string) || "",
      primaryColor: "#DD2A7B",
      secondaryColor: "#F58529",
      accentColor: "#8134AF",
      toneFormality: 50,
      toneHumor: 50,
      voiceDescription: "",
      sampleCaptions: [],
      contentPillars: Array.isArray(body.content_pillars) ? (body.content_pillars as string[]) : [],
      brandHashtag: (body.brand_hashtag as string) || "",
    };

    const strategy: StrategyContext | null = (body.strategy as StrategyContext) || null;

    const result = await researchHashtags({ topic, brand, strategy });

    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Hashtag research failed";
    console.error("Hashtag research error:", message);

    if (message.includes("ANTHROPIC_API_KEY")) {
      return NextResponse.json(
        { error: "Set ANTHROPIC_API_KEY in frontend/.env to enable AI features." },
        { status: 500 }
      );
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
