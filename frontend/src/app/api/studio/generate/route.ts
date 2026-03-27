import { NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { endpoint, ...payload } = body;

    const url = `${BACKEND_URL}/generate/${endpoint}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const error = await res.text();
      return NextResponse.json(
        { error: `Backend error: ${error}` },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    // Backend not running — return mock data for development
    return NextResponse.json({
      status: "generated",
      type: "image",
      mock: true,
      path: "/mock/generated-image.png",
      quality_score: 87,
      quality_criteria: {
        dimensions: 10,
        file_size: 10,
        text_readability: 9,
        zone_overlap: 10,
        color_contrast: 8,
        brand_consistency: 8,
        caption_quality: 8,
        hashtags: 8,
        hook_strength: 8,
        seasonal_relevance: 8,
      },
      caption:
        "The silent productivity killer nobody talks about...\n\nSleep deprivation costs the US economy $411 billion annually — that's 2.28% of GDP.\n\nThe research is clear: prioritizing rest isn't lazy, it's strategic.",
      hashtags: [
        "#productivity",
        "#sleep",
        "#health",
        "#business",
        "#wellness",
        "#mindset",
        "#success",
      ],
    });
  }
}
