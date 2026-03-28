import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";

export async function GET(request: Request) {
  const limited = rateLimit(request, "default");
  if (limited) return limited;

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  // Check if user has any brand (completed onboarding)
  const brand = await prisma.brand.findFirst({ where: { userId } });

  // Count content by status
  const contentCounts = brand
    ? await prisma.generatedContent.groupBy({
        by: ["status"],
        where: { brandId: brand.id },
        _count: { _all: true },
      })
    : [];

  const statusMap: Record<string, number> = {};
  for (const row of contentCounts) {
    statusMap[row.status] = row._count._all;
  }

  const totalContent = Object.values(statusMap).reduce((a, b) => a + b, 0);
  const drafts = statusMap["draft"] || 0;
  const queued = statusMap["queued"] || 0;
  const published = statusMap["published"] || 0;

  // Posts this week
  const startOfWeek = new Date();
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  const postsThisWeek = brand
    ? await prisma.generatedContent.count({
        where: {
          brandId: brand.id,
          status: "published",
          postedAt: { gte: startOfWeek },
        },
      })
    : 0;

  // Recent content (last 5)
  const recentContent = brand
    ? await prisma.generatedContent.findMany({
        where: { brandId: brand.id },
        orderBy: { updatedAt: "desc" },
        take: 5,
        select: {
          id: true,
          contentType: true,
          caption: true,
          status: true,
          qualityScore: true,
          createdAt: true,
        },
      })
    : [];

  // ─── Daily Cockpit Data ────────────────────────────────────────

  // Today's calendar slot
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const todaySlot = await prisma.calendarSlot.findFirst({
    where: {
      userId,
      date: { gte: todayStart, lte: todayEnd },
    },
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

  // This week's calendar slots (Sun-Sat)
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);

  const weekSlots = await prisma.calendarSlot.findMany({
    where: {
      userId,
      date: { gte: startOfWeek, lte: endOfWeek },
    },
    orderBy: { date: "asc" },
    select: {
      id: true,
      date: true,
      pillar: true,
      contentType: true,
      topic: true,
      status: true,
    },
  });

  // Yesterday's published post (with analytics if available)
  const yesterdayStart = new Date(todayStart);
  yesterdayStart.setDate(yesterdayStart.getDate() - 1);
  const yesterdayEnd = new Date(yesterdayStart);
  yesterdayEnd.setHours(23, 59, 59, 999);

  let yesterdayPost = null;
  if (brand) {
    yesterdayPost = await prisma.generatedContent.findFirst({
      where: {
        brandId: brand.id,
        status: "published",
        postedAt: { gte: yesterdayStart, lte: yesterdayEnd },
      },
      select: {
        id: true,
        contentType: true,
        caption: true,
        thumbnailUrl: true,
        qualityScore: true,
        analytics: {
          select: {
            likes: true,
            comments: true,
            saves: true,
            shares: true,
            engagement: true,
          },
        },
      },
    });
  }

  // Check if user has an active Instagram account
  const igAccount = await prisma.instagramAccount.findFirst({
    where: { userId, isActive: true },
    select: { id: true },
  });

  return NextResponse.json({
    isNewUser: totalContent === 0 && !brand,
    hasBrand: !!brand,
    hasInstagram: !!igAccount,
    postsThisWeek,
    totalContent,
    drafts,
    queued,
    published,
    recentContent,
    // Daily Cockpit
    todaySlot,
    weekSlots,
    yesterdayPost,
  });
}
