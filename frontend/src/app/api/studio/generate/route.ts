import { NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const res = await fetch(`${BACKEND_URL}/generate/complete`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        topic: body.topic || body.template?.headline || "Instagram post",
        pillar: body.pillar || "facts",
        content_type: body.content_type || "image",
        image_style: body.image_style || "fact_card",
        generation_tier: body.generation_tier || "standard",
        brand: body.brand || {},
        brand_voice: body.brand_voice || "",
        niche: body.niche || "",
        tone_formality: body.tone_formality || 50,
        tone_humor: body.tone_humor || 50,
        brand_hashtag: body.brand_hashtag || "",
      }),
    });

    if (!res.ok) {
      const error = await res.text();
      return NextResponse.json(
        { error: `Backend error: ${error}` },
        { status: res.status }
      );
    }

    const data = await res.json();

    // Prepend backend URL to relative image paths
    if (data.image_url && data.image_url.startsWith("/media/")) {
      data.image_url = `${BACKEND_URL}${data.image_url}`;
    }

    return NextResponse.json(data);
  } catch {
    if (process.env.NODE_ENV === "development") {
      return NextResponse.json({
        status: "generated",
        image_url: null,
        caption:
          "The silent productivity killer nobody talks about...\n\nSleep deprivation costs the US economy $411 billion annually — that's 2.28% of GDP.\n\nThe research is clear: prioritizing rest isn't lazy, it's strategic.",
        hashtags: [
          "#productivity",
          "#sleep",
          "#health",
          "#business",
          "#wellness",
        ],
        quality_score: 87,
        quality_criteria: {
          dimensions: 10,
          file_size: 10,
          text_readability: 9,
          brand_consistency: 8,
          caption_quality: 8,
          hashtags: 8,
        },
        content_type: "image",
        generation_tier: "standard",
        mock: true,
      });
    }
    return NextResponse.json(
      { error: "Content generation service unavailable. Please try again later." },
      { status: 503 }
    );
  }
}
