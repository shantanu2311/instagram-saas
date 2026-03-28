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

  const url = new URL(request.url);
  const period = Math.min(90, Math.max(7, Number(url.searchParams.get("period")) || 30));

  const brand = await prisma.brand.findFirst({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!brand)
    return NextResponse.json({ error: "No brand found" }, { status: 404 });

  const since = new Date();
  since.setDate(since.getDate() - period);

  // Fetch published content with analytics in the period
  const posts = await prisma.generatedContent.findMany({
    where: {
      brandId: brand.id,
      status: "published",
      postedAt: { gte: since },
    },
    include: {
      analytics: true,
    },
    orderBy: { postedAt: "asc" },
  });

  // KPIs
  let totalLikes = 0;
  let totalComments = 0;
  let totalEngagement = 0;
  const typeCounts: Record<string, { likes: number; comments: number; engagement: number; count: number }> = {};

  for (const post of posts) {
    const a = post.analytics;
    const likes = a?.likes || 0;
    const comments = a?.comments || 0;
    const engagement = a?.engagement || 0;
    totalLikes += likes;
    totalComments += comments;
    totalEngagement += engagement;

    const t = post.contentType || "image";
    if (!typeCounts[t]) typeCounts[t] = { likes: 0, comments: 0, engagement: 0, count: 0 };
    typeCounts[t].likes += likes;
    typeCounts[t].comments += comments;
    typeCounts[t].engagement += engagement;
    typeCounts[t].count += 1;
  }

  const totalPosts = posts.length;
  const avgEngagement = totalPosts > 0 ? totalEngagement / totalPosts : 0;

  // Best type by avg engagement
  let bestType = "—";
  let bestTypeEng = 0;
  for (const [type, data] of Object.entries(typeCounts)) {
    const avg = data.count > 0 ? data.engagement / data.count : 0;
    if (avg > bestTypeEng) {
      bestTypeEng = avg;
      bestType = type;
    }
  }

  // Engagement over time
  const engagementOverTime = posts.map((post) => ({
    date: post.postedAt ? post.postedAt.toISOString().slice(0, 10) : "",
    likes: post.analytics?.likes || 0,
    comments: post.analytics?.comments || 0,
    engagement: post.analytics?.engagement || 0,
  }));

  // By content type
  const byContentType = Object.entries(typeCounts).map(([type, data]) => ({
    type,
    avgLikes: data.count > 0 ? Math.round(data.likes / data.count) : 0,
    avgComments: data.count > 0 ? Math.round(data.comments / data.count) : 0,
    avgEngagement: data.count > 0 ? Math.round((data.engagement / data.count) * 100) / 100 : 0,
    count: data.count,
  }));

  // Top posts by total engagement (likes + comments)
  const topPosts = [...posts]
    .sort((a, b) => {
      const aEng = (a.analytics?.likes || 0) + (a.analytics?.comments || 0);
      const bEng = (b.analytics?.likes || 0) + (b.analytics?.comments || 0);
      return bEng - aEng;
    })
    .slice(0, 5)
    .map((post) => ({
      id: post.id,
      caption: post.caption?.slice(0, 120) || "",
      contentType: post.contentType,
      likes: post.analytics?.likes || 0,
      comments: post.analytics?.comments || 0,
      engagement: post.analytics?.engagement || 0,
      postedAt: post.postedAt?.toISOString() || "",
    }));

  return NextResponse.json({
    kpis: {
      totalPosts,
      totalLikes,
      totalComments,
      avgEngagement: Math.round(avgEngagement * 100) / 100,
      bestType,
    },
    engagementOverTime,
    byContentType,
    topPosts,
  });
}
