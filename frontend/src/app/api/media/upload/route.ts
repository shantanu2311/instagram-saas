import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import { prisma } from "@/lib/db";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "video/mp4"];
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100MB

export async function POST(request: Request) {
  const limited = rateLimit(request, "generate");
  if (limited) return limited;

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Unsupported file type. Allowed: JPEG, PNG, WebP, MP4." },
        { status: 400 }
      );
    }

    const maxSize = file.type.startsWith("video/") ? MAX_VIDEO_SIZE : MAX_IMAGE_SIZE;
    if (file.size > maxSize) {
      return NextResponse.json(
        {
          error: file.type.startsWith("video/")
            ? "Video must be under 100MB."
            : "Image must be under 10MB.",
        },
        { status: 400 }
      );
    }

    // Get user's brand
    const brand = await prisma.brand.findFirst({
      where: { userId: session.user.id },
    });

    // In production, this would use @vercel/blob's put() to store the file.
    // For now, store a placeholder URL pointing to a future upload path.
    const asset = await prisma.mediaAsset.create({
      data: {
        userId: session.user.id,
        brandId: brand?.id || null,
        filename: file.name.replace(/[<>"'\\\/\x00-\x1f]/g, "_"),
        url: `/api/media/uploads/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`,
        mimeType: file.type,
        sizeBytes: file.size,
        source: "upload",
      },
    });

    return NextResponse.json({
      id: asset.id,
      url: asset.url,
      filename: asset.filename,
    });
  } catch (err) {
    console.error("Upload error:", err);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
