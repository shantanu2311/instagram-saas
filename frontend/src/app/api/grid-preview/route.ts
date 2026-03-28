import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import { prisma } from "@/lib/db";

export async function GET(request: Request) {
  const limited = rateLimit(request, "default");
  if (limited) return limited;
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const brand = await prisma.brand.findFirst({
    where: { userId: session.user.id },
    select: { id: true, niche: true },
  });
  if (!brand)
    return NextResponse.json({ publishedPosts: [], upcomingPosts: [] });

  const [publishedPosts, upcomingPosts] = await Promise.all([
    // Last 6 published posts (most recent first)
    prisma.generatedContent.findMany({
      where: {
        brandId: brand.id,
        status: "published",
        postedAt: { not: null },
      },
      orderBy: { postedAt: "desc" },
      take: 6,
      select: {
        id: true,
        contentType: true,
        caption: true,
        mediaUrls: true,
        postedAt: true,
        igMediaId: true,
        qualityScore: true,
      },
    }),
    // Next 9 upcoming scheduled posts
    prisma.generatedContent.findMany({
      where: {
        brandId: brand.id,
        status: { in: ["queued", "draft"] },
        scheduledFor: { gte: new Date() },
      },
      orderBy: { scheduledFor: "asc" },
      take: 9,
      select: {
        id: true,
        contentType: true,
        caption: true,
        mediaUrls: true,
        scheduledFor: true,
        qualityScore: true,
      },
    }),
  ]);

  return NextResponse.json({ publishedPosts, upcomingPosts });
}
