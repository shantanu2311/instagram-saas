import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
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

  return NextResponse.json({
    isNewUser: totalContent === 0 && !brand,
    hasBrand: !!brand,
    postsThisWeek,
    totalContent,
    drafts,
    queued,
    published,
    recentContent,
  });
}
