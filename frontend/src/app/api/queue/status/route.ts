import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

/**
 * Update the status of a content item (approve, reject, mark as posted/failed).
 */
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { id: string; status: string; error?: string; igMediaId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body is required." }, { status: 400 });
  }

  const { id, status } = body;
  if (!id || !status) {
    return NextResponse.json({ error: "id and status are required" }, { status: 400 });
  }

  const validStatuses = ["draft", "queued", "approved", "published", "rejected", "failed"];
  if (!validStatuses.includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  try {
    // Verify ownership: content must belong to a brand owned by this user
    const content = await prisma.generatedContent.findUnique({
      where: { id },
      include: { brand: { select: { userId: true } } },
    });

    if (!content) {
      // Item might not exist in DB yet (came from sessionStorage queue)
      return NextResponse.json({ id, status, synced: false });
    }

    if (content.brand.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const updated = await prisma.generatedContent.update({
      where: { id },
      data: {
        status,
        ...(status === "published" ? { postedAt: new Date() } : {}),
        ...(body.igMediaId ? { igMediaId: body.igMediaId } : {}),
      },
    });

    return NextResponse.json({ id: updated.id, status: updated.status });
  } catch {
    // Item might not exist in DB yet (came from sessionStorage queue)
    return NextResponse.json({ id, status, synced: false });
  }
}
