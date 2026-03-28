import { NextResponse } from "next/server";
import { repurposeContent } from "@/lib/content-engine/repurpose-generator";
import type { BrandContext, StrategyContext } from "@/lib/content-engine";

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

    if (
      !body.source_content ||
      typeof body.source_content !== "string" ||
      !body.source_content.trim()
    ) {
      return NextResponse.json(
        { error: "Source content is required for repurposing." },
        { status: 400 }
      );
    }

    // Sanitize: strip HTML, truncate to 5000 chars
    const sourceContent = body.source_content
      .replace(/<[^>]*>/g, "")
      .slice(0, 5000);

    const brand: BrandContext = {
      niche: body.niche || "",
      brandName: body.brand_name || "",
      primaryColor: "#DD2A7B",
      secondaryColor: "#F58529",
      accentColor: "#8134AF",
      toneFormality: body.tone_formality ?? 50,
      toneHumor: body.tone_humor ?? 50,
      voiceDescription: body.brand_voice || "",
      sampleCaptions: Array.isArray(body.sample_captions)
        ? body.sample_captions.filter((c: string) => c.trim())
        : [],
      contentPillars: body.content_pillars || [],
      brandHashtag: body.brand_hashtag || "",
    };

    const strategy: StrategyContext | null = body.strategy || null;

    const result = await repurposeContent({
      sourceContent,
      sourceType: body.source_type || "other",
      brand,
      strategy,
    });

    return NextResponse.json({ status: "repurposed", ...result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Repurpose failed";
    console.error("Studio repurpose error:", message);

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
