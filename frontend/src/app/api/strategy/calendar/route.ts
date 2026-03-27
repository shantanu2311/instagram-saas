import { NextResponse } from "next/server";
import { generateCalendar, type BrandContext, type StrategyContext } from "@/lib/content-engine";

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

    if (!body || typeof body !== "object" || (!body.strategy && !body.niche)) {
      return NextResponse.json(
        { error: "Strategy data is required. Please generate a strategy first." },
        { status: 400 }
      );
    }

    const now = new Date();
    const month = body.month || now.getMonth() + 1;
    const year = body.year || now.getFullYear();

    // Build brand context
    const brand: BrandContext = {
      niche: body.niche || "",
      brandName: body.brandName || "",
      primaryColor: body.primaryColor || "#DD2A7B",
      secondaryColor: body.secondaryColor || "#F58529",
      accentColor: body.accentColor || "#8134AF",
      toneFormality: body.toneFormality ?? 50,
      toneHumor: body.toneHumor ?? 50,
      voiceDescription: body.voiceDescription || "",
      sampleCaption: "",
      contentPillars: body.contentPillars || [],
      brandHashtag: body.brandHashtag || "",
    };

    // Strategy context
    const strategy: StrategyContext = body.strategy || {
      contentPillars: [
        { name: "Education", percentage: 40, rationale: "" },
        { name: "Entertainment", percentage: 30, rationale: "" },
        { name: "Engagement", percentage: 30, rationale: "" },
      ],
    };

    const calendar = await generateCalendar({
      strategy,
      brand,
      month,
      year,
      postsPerWeek: body.postsPerWeek || 5,
    });

    return NextResponse.json(calendar);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Calendar generation failed";
    console.error("Calendar generate error:", message);

    if (message.includes("ANTHROPIC_API_KEY")) {
      return NextResponse.json(
        { error: "Set ANTHROPIC_API_KEY in frontend/.env to enable AI calendar generation." },
        { status: 500 }
      );
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ calendars: [] });
}
