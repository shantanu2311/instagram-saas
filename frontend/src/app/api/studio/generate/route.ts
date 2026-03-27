import { NextResponse } from "next/server";
import {
  generateCaption,
  type BrandContext,
  type StrategyContext,
} from "@/lib/content-engine";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Build brand context from request
    const brand: BrandContext = {
      niche: body.niche || "",
      brandName: body.brand?.brand_name || "",
      primaryColor: body.brand?.primary_color
        ? `rgb(${body.brand.primary_color.join(",")})`
        : "#DD2A7B",
      secondaryColor: body.brand?.secondary_color
        ? `rgb(${body.brand.secondary_color.join(",")})`
        : "#F58529",
      accentColor: body.brand?.accent_color
        ? `rgb(${body.brand.accent_color.join(",")})`
        : "#8134AF",
      toneFormality: body.tone_formality ?? 50,
      toneHumor: body.tone_humor ?? 50,
      voiceDescription: body.brand_voice || "",
      sampleCaption: body.sample_caption || "",
      contentPillars: body.content_pillars || [],
      brandHashtag: body.brand_hashtag || "",
    };

    // Strategy context (optional — passed from frontend if strategy exists)
    const strategy: StrategyContext | null = body.strategy || null;

    const result = await generateCaption({
      topic: body.topic || "Instagram post",
      pillar: body.pillar || "facts",
      contentType: body.content_type || "image",
      style: body.image_style || "fact_card",
      brand,
      strategy,
    });

    return NextResponse.json({
      status: "generated",
      image_url: null, // No image generation yet — frontend shows branded placeholder
      headline: result.headline,
      caption: result.caption,
      hashtags: result.hashtags,
      quality_score: result.quality_score,
      quality_criteria: result.quality_criteria,
      content_type: body.content_type || "image",
      generation_tier: body.generation_tier || "standard",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Generation failed";
    console.error("Studio generate error:", message);

    // If ANTHROPIC_API_KEY is missing, return helpful error
    if (message.includes("ANTHROPIC_API_KEY")) {
      return NextResponse.json(
        {
          error:
            "Set ANTHROPIC_API_KEY in frontend/.env to enable AI content generation.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
