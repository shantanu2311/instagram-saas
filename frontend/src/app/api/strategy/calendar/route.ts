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
    const startDate = body.startDate || now.toISOString().split("T")[0];
    const days = Math.min(90, Math.max(7, Number(body.days) || 30));

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

    // Fetch moments and ideas if authenticated + brandId present
    let calendarMoments: Array<{ title: string; type: string; date?: string; description: string }> | undefined;
    let calendarIdeas: Array<{ title: string; contentType?: string; pillar?: string; notes?: string }> | undefined;

    const session = await auth();
    if (session?.user?.id && body.brandId) {
      try {
        const ownedBrand = await prisma.brand.findFirst({
          where: { id: body.brandId, userId: session.user.id },
          select: { id: true },
        });
        if (ownedBrand) {
          const endDate = new Date(startDate);
          endDate.setDate(endDate.getDate() + days);

          const [dbMoments, dbIdeas] = await Promise.all([
            prisma.brandMoment.findMany({
              where: {
                brandId: ownedBrand.id,
                date: { gte: new Date(startDate), lte: endDate },
              },
              select: { title: true, type: true, date: true, description: true },
              take: 20,
            }),
            prisma.contentIdea.findMany({
              where: { brandId: ownedBrand.id, status: "new" },
              select: { title: true, contentType: true, pillar: true, notes: true },
              take: 20,
            }),
          ]);

          if (dbMoments.length > 0) {
            calendarMoments = dbMoments.map(m => ({
              title: m.title,
              type: m.type,
              date: m.date.toISOString().split("T")[0],
              description: m.description || "",
            }));
          }
          if (dbIdeas.length > 0) {
            calendarIdeas = dbIdeas.map(i => ({
              title: i.title,
              contentType: i.contentType ?? undefined,
              pillar: i.pillar ?? undefined,
              notes: i.notes ?? undefined,
            }));
          }
        }
      } catch {
        // Non-fatal — calendar gen still works without these
      }
    }

    const calendar = await generateCalendar({
      strategy,
      brand,
      startDate,
      days,
      postsPerWeek: body.postsPerWeek || 5,
      moments: calendarMoments,
      ideas: calendarIdeas,
    });

    // Auto-persist to DB if user is authenticated and brandId is provided
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
