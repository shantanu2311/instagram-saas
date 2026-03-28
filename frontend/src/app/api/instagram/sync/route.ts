import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import { prisma } from "@/lib/db";
import { fetchOwnMedia } from "@/lib/content-engine/instagram-graph-api";

export async function POST(request: Request) {
  const limited = rateLimit(request, "default");
  if (limited) return limited;

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Get user's Instagram account
    const igAccount = await prisma.instagramAccount.findFirst({
      where: { userId: session.user.id, isActive: true },
    });

    if (!igAccount) {
      return NextResponse.json(
        { error: "No Instagram account connected" },
        { status: 400 }
      );
    }

    // Fetch recent posts from Instagram
    const igPosts = await fetchOwnMedia(
      { accessToken: igAccount.accessToken, igUserId: igAccount.igUserId },
      25
    );

    // Get existing content with igMediaId
    const existingContent = await prisma.generatedContent.findMany({
      where: {
        brand: { userId: session.user.id },
        igMediaId: { not: null },
      },
      select: { igMediaId: true },
    });

    const knownIds = new Set(existingContent.map((c) => c.igMediaId));

    // Find posts not in our system
    const externalPosts = igPosts.filter((p) => !knownIds.has(p.id));

    return NextResponse.json({
      total: igPosts.length,
      synced: igPosts.length - externalPosts.length,
      externalPosts: externalPosts.map((p) => ({
        id: p.id,
        caption: p.caption?.slice(0, 200) || "",
        timestamp: p.timestamp,
        mediaType: p.media_type,
        permalink: p.permalink,
        likes: p.like_count || 0,
        comments: p.comments_count || 0,
      })),
    });
  } catch (err) {
    console.error("Instagram sync error:", err);
    return NextResponse.json({ error: "Failed to sync" }, { status: 500 });
  }
}
