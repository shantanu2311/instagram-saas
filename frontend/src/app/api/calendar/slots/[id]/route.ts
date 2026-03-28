import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const limited = rateLimit(request, "default");
  if (limited) return limited;

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const slot = await prisma.calendarSlot.findFirst({
      where: { id, userId: session.user.id },
      include: {
        content: {
          select: {
            id: true,
            status: true,
            caption: true,
            hashtags: true,
            thumbnailUrl: true,
            mediaUrls: true,
            qualityScore: true,
          },
        },
      },
    });

    if (!slot) {
      return NextResponse.json(
        { error: "Calendar slot not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(slot);
  } catch (err) {
    console.error("Calendar slot fetch error:", err);
    return NextResponse.json(
      { error: "Failed to fetch calendar slot." },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const limited = rateLimit(request, "default");
  if (limited) return limited;

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  let body: { status?: string; contentId?: string | null };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Request body is required." },
      { status: 400 }
    );
  }

  const allowedStatuses = ["pending", "created", "uploaded", "skipped", "missed"];
  if (body.status && !allowedStatuses.includes(body.status)) {
    return NextResponse.json(
      { error: `Invalid status. Allowed: ${allowedStatuses.join(", ")}` },
      { status: 400 }
    );
  }

  try {
    // Verify slot ownership
    const existing = await prisma.calendarSlot.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Calendar slot not found" },
        { status: 404 }
      );
    }

    const updateData: Record<string, unknown> = {};
    if (body.status) updateData.status = body.status;

    // Verify contentId ownership if provided
    if (body.contentId !== undefined) {
      if (body.contentId !== null) {
        const content = await prisma.generatedContent.findFirst({
          where: { id: body.contentId, brand: { userId: session.user.id } },
        });
        if (!content) {
          return NextResponse.json(
            { error: "Content not found or not owned by you." },
            { status: 403 }
          );
        }
      }
      updateData.contentId = body.contentId;
    }

    const updated = await prisma.calendarSlot.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(updated);
  } catch (err) {
    console.error("Calendar slot update error:", err);
    return NextResponse.json(
      { error: "Failed to update calendar slot." },
      { status: 500 }
    );
  }
}
