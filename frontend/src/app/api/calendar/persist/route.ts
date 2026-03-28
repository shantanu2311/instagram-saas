import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const limited = rateLimit(request, "default");
  if (limited) return limited;

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: {
    brandId: string;
    slots: Array<{
      date: string;
      dayOfWeek: string;
      pillar: string;
      contentType: string;
      topic: string;
      headline?: string;
      suggestedTime?: string;
      isTrendBased?: boolean;
    }>;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Request body is required." },
      { status: 400 }
    );
  }

  if (!body.brandId || !Array.isArray(body.slots) || body.slots.length === 0) {
    return NextResponse.json(
      { error: "brandId and non-empty slots array are required." },
      { status: 400 }
    );
  }

  // Verify brand ownership
  const brand = await prisma.brand.findFirst({
    where: { id: body.brandId, userId: session.user.id },
  });

  if (!brand) {
    return NextResponse.json({ error: "Brand not found" }, { status: 404 });
  }

  try {
    // Upsert each slot (unique on brandId + date)
    const results = await Promise.all(
      body.slots.map((slot) => {
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

    return NextResponse.json({
      persisted: results.length,
      message: `${results.length} calendar slots saved.`,
    });
  } catch (err) {
    console.error("Calendar persist error:", err);
    return NextResponse.json(
      { error: "Failed to save calendar slots." },
      { status: 500 }
    );
  }
}
