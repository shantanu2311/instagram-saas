import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body is required." }, { status: 400 });
  }

  const userId = session.user.id;

  // Find user's brand (required for GeneratedContent)
  const brand = await prisma.brand.findFirst({ where: { userId } });
  if (!brand) {
    return NextResponse.json(
      { error: "Complete onboarding first to save content." },
      { status: 400 }
    );
  }

  try {
    const id = body.id as string | undefined;
    const data = {
      brandId: brand.id,
      contentType: (body.contentType as string) || "image",
      prompt: (body.topic as string) || (body.prompt as string) || null,
      caption: (body.caption as string) || null,
      hashtags: body.hashtags || [],
      mediaUrls: body.mediaUrls || [],
      qualityScore: body.qualityScore ? Number(body.qualityScore) : null,
      qualityCriteria: body.qualityCriteria || undefined,
      status: "draft" as const,
    };

    let content;
    if (id && !id.startsWith("draft_")) {
      // Verify ownership before update
      const existing = await prisma.generatedContent.findUnique({
        where: { id },
        include: { brand: { select: { userId: true } } },
      });
      if (!existing || existing.brand.userId !== userId) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      content = await prisma.generatedContent.update({
        where: { id },
        data,
      });
    } else {
      // Create new
      content = await prisma.generatedContent.create({ data });
    }

    return NextResponse.json({
      id: content.id,
      status: "saved",
    });
  } catch {
    return NextResponse.json({ error: "Failed to save" }, { status: 500 });
  }
}
