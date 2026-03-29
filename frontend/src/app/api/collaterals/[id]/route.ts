import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const limited = rateLimit(request, "default");
  if (limited) return limited;

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "ID is required" }, { status: 400 });
  }

  try {
    // Ownership check via brand
    const collateral = await prisma.collateral.findFirst({
      where: {
        id,
        brand: { userId: session.user.id },
      },
    });

    if (!collateral) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await prisma.collateral.delete({ where: { id } });

    return NextResponse.json({ deleted: true });
  } catch (err) {
    console.error("Collateral delete error:", err);
    return NextResponse.json(
      { error: "Failed to delete collateral." },
      { status: 500 }
    );
  }
}
