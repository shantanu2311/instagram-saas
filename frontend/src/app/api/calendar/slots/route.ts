import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";

const MAX_RANGE_DAYS = 90;

export async function GET(request: NextRequest) {
  const limited = rateLimit(request, "default");
  if (limited) return limited;

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = request.nextUrl;
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  // Require at least one date bound to prevent unbounded queries
  if (!from && !to) {
    return NextResponse.json(
      { error: "At least one of 'from' or 'to' query parameters is required." },
      { status: 400 }
    );
  }

  const dateFilter: Record<string, Date> = {};
  if (from) {
    const d = new Date(from);
    if (isNaN(d.getTime())) {
      return NextResponse.json(
        { error: "'from' is not a valid date." },
        { status: 400 }
      );
    }
    dateFilter.gte = d;
  }
  if (to) {
    const d = new Date(to);
    if (isNaN(d.getTime())) {
      return NextResponse.json(
        { error: "'to' is not a valid date." },
        { status: 400 }
      );
    }
    dateFilter.lte = d;
  }

  // Enforce max range of 90 days
  if (dateFilter.gte && dateFilter.lte) {
    const diffMs = dateFilter.lte.getTime() - dateFilter.gte.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);
    if (diffDays > MAX_RANGE_DAYS) {
      return NextResponse.json(
        { error: `Date range cannot exceed ${MAX_RANGE_DAYS} days.` },
        { status: 400 }
      );
    }
  } else if (dateFilter.gte && !dateFilter.lte) {
    // If only 'from', cap at 90 days forward
    dateFilter.lte = new Date(dateFilter.gte.getTime() + MAX_RANGE_DAYS * 24 * 60 * 60 * 1000);
  } else if (!dateFilter.gte && dateFilter.lte) {
    // If only 'to', cap at 90 days back
    dateFilter.gte = new Date(dateFilter.lte.getTime() - MAX_RANGE_DAYS * 24 * 60 * 60 * 1000);
  }

  try {
    const slots = await prisma.calendarSlot.findMany({
      where: {
        userId: session.user.id,
        date: dateFilter,
      },
      orderBy: { date: "asc" },
      take: 500, // Hard cap
      include: {
        content: {
          select: {
            id: true,
            status: true,
            caption: true,
            thumbnailUrl: true,
            qualityScore: true,
          },
        },
      },
    });

    return NextResponse.json({ slots });
  } catch (err) {
    console.error("Calendar slots fetch error:", err);
    return NextResponse.json(
      { error: "Failed to fetch calendar slots." },
      { status: 500 }
    );
  }
}
