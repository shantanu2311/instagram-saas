import { NextResponse } from "next/server";
import {
  generateCaption,
  type BrandContext,
  type StrategyContext,
} from "@/lib/content-engine";

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

    if (!body.topic || typeof body.topic !== "string" || !body.topic.trim()) {
      return NextResponse.json(
        { error: "A topic is required to generate content." },
        { status: 400 }
      );
    }

    // Sanitize topic: strip HTML tags and truncate
    body.topic = body.topic.replace(/<[^>]*>/g, "").slice(0, 500);

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
      sampleCaptions: Array.isArray(body.sample_captions) ? body.sample_captions.filter((c: string) => c.trim()) : body.sample_caption ? [body.sample_caption] : [],
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
