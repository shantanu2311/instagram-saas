import { NextResponse } from "next/server";
import { generateCalendar, type BrandContext, type StrategyContext } from "@/lib/content-engine";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const limited = rateLimit(request, "generate");
  if (limited) return limited;

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
      sampleCaptions: Array.isArray(body.sampleCaptions) ? body.sampleCaptions : [],
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

    // Auto-persist to DB if user is authenticated and brandId is provided
    const session = await auth();
    if (session?.user?.id && body.brandId && calendar?.slots?.length) {
      try {
        // Verify brand ownership before persisting
        const brand = await prisma.brand.findFirst({
          where: { id: body.brandId, userId: session.user.id },
        });
        if (!brand) {
          // Skip persist silently — calendar still returns to client
          console.warn("Calendar auto-persist skipped: brand not owned by user");
          return NextResponse.json(calendar);
        }

        await Promise.all(
          calendar.slots.map((slot: { date: string; dayOfWeek: string; pillar: string; contentType: string; topic: string; headline?: string; suggestedTime?: string; isTrendBased?: boolean }) => {
            const slotDate = new Date(slot.date);
            return prisma.calendarSlot.upsert({
              where: {
                brandId_date: {
                  brandId: body.brandId,
                  date: slotDate,
                },
              },
              create: {
                userId: session.user!.id!,
                brandId: body.brandId,
                date: slotDate,
                dayOfWeek: slot.dayOfWeek,
                pillar: slot.pillar,
                contentType: slot.contentType,
                topic: slot.topic,
                headline: slot.headline || "",
                suggestedTime: slot.suggestedTime || "",
                isTrendBased: slot.isTrendBased || false,
              },
              update: {
                brandId: body.brandId,
                dayOfWeek: slot.dayOfWeek,
                pillar: slot.pillar,
                contentType: slot.contentType,
                topic: slot.topic,
                headline: slot.headline || "",
                suggestedTime: slot.suggestedTime || "",
                isTrendBased: slot.isTrendBased || false,
              },
            });
          })
        );
      } catch (dbErr) {
        // Non-fatal: calendar still returns to client even if DB persist fails
        console.error("Calendar DB persist failed (non-fatal):", dbErr);
      }
    }

    return NextResponse.json(calendar);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Calendar generation failed";
    console.error("Calendar generate error:", message);

    if (message.includes("OPENAI_API_KEY")) {
      return NextResponse.json(
        { error: "Set OPENAI_API_KEY in frontend/.env to enable AI calendar generation." },
        { status: 500 }
      );
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ calendars: [] });
}
