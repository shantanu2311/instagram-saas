import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import { prisma } from "@/lib/db";

export async function POST(request: Request) {
  const limited = rateLimit(request, "default");
  if (limited) return limited;

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Request body is required." },
      { status: 400 }
    );
  }

  const brand = await prisma.brand.findFirst({
    where: { userId: session.user.id },
  });
  if (!brand) {
    return NextResponse.json(
      { error: "Create a brand first" },
      { status: 400 }
    );
  }

  // Create external content record
  const content = await prisma.generatedContent.create({
    data: {
      brandId: brand.id,
      contentType: String(body.mediaType || "image"),
      caption: body.caption ? String(body.caption) : null,
      hashtags: [],
      mediaUrls: body.mediaUrl ? [String(body.mediaUrl)] : [],
      source: "external",
      status: "published",
      postedAt: body.timestamp ? new Date(String(body.timestamp)) : new Date(),
      igMediaId: body.igMediaId ? String(body.igMediaId) : null,
    },
  });

  // If calendarSlotId provided, verify ownership then link
  if (body.calendarSlotId) {
    const slot = await prisma.calendarSlot.findFirst({
      where: { id: String(body.calendarSlotId), userId: session.user.id },
    });
    if (slot) {
      await prisma.calendarSlot.update({
        where: { id: slot.id },
        data: { status: "uploaded", contentId: content.id },
      });
    }
  }

  return NextResponse.json({ id: content.id, status: "imported" });
}
