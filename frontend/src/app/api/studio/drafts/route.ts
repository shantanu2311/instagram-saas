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

  const brand = await prisma.brand.findFirst({ where: { userId } });
  if (!brand) {
    return NextResponse.json([]);
  }

  const drafts = await prisma.generatedContent.findMany({
    where: { brandId: brand.id, status: "draft" },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      contentType: true,
      prompt: true,
      caption: true,
      hashtags: true,
      mediaUrls: true,
      qualityScore: true,
      status: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return NextResponse.json(drafts);
}
