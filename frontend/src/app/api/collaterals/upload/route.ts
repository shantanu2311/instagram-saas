import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";
import {
  extractText,
  isTextExtractable,
  isImageFile,
  classifyFileType,
} from "@/lib/content-engine/collateral-extractor";

// Max file size: 10MB
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const MAX_FILES_PER_BRAND = 20;

export async function POST(request: Request) {
  const limited = rateLimit(request, "default");
  if (limited) return limited;

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const brandId = formData.get("brandId") as string | null;

    if (!file || !brandId) {
      return NextResponse.json(
        { error: "file and brandId are required." },
        { status: 400 }
      );
    }

    // Verify brand ownership
    const brand = await prisma.brand.findFirst({
      where: { id: brandId, userId: session.user.id },
    });
    if (!brand) {
      return NextResponse.json({ error: "Brand not found" }, { status: 404 });
    }

    // Check file count limit
    const existingCount = await prisma.collateral.count({
      where: { brandId },
    });
    if (existingCount >= MAX_FILES_PER_BRAND) {
      return NextResponse.json(
        { error: `Maximum ${MAX_FILES_PER_BRAND} files allowed per brand.` },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File too large. Maximum 10MB allowed." },
        { status: 400 }
      );
    }

    const mimeType = file.type || "application/octet-stream";
    const fileType = classifyFileType(mimeType);
    const canExtract = isTextExtractable(mimeType);
    const isImage = isImageFile(mimeType);

    // Read file into buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // For images, store as base64 data URL (needed for preview/media library)
    // For documents, store just a reference — the extractedText is what matters
    let storedUrl: string;
    if (isImage) {
      const base64 = buffer.toString("base64");
      storedUrl = `data:${mimeType};base64,${base64}`;
    } else {
      storedUrl = `file://${file.name}`; // Placeholder — production should use Blob storage
    }

    // Extract text if possible (don't let extraction failure block upload)
    let extractedText: string | null = null;
    if (canExtract) {
      try {
        extractedText = await extractText(buffer, mimeType, file.name);
      } catch (extractErr) {
        console.error("Text extraction failed:", extractErr);
        // Continue — file will be saved without extracted text
      }
    }

    // Determine initial status
    const status = canExtract && extractedText
      ? "processed" // Text extracted, ready for AI analysis
      : isImage
      ? "processed" // Images go to media library, no text needed
      : "failed"; // Unsupported format

    const collateral = await prisma.collateral.create({
      data: {
        brandId,
        filename: file.name.replace(/\0/g, "").slice(0, 255),
        url: storedUrl,
        mimeType,
        sizeBytes: file.size,
        fileType,
        status,
        extractedText,
      },
    });

    return NextResponse.json({
      id: collateral.id,
      filename: collateral.filename,
      fileType: collateral.fileType,
      status: collateral.status,
      hasExtractedText: !!extractedText,
      isImage,
      message: !canExtract && !isImage
        ? "This file format cannot be processed by AI. Only PDF, DOCX, XLSX, CSV, and text files can be analyzed."
        : undefined,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("Collateral upload error:", msg, err);
    return NextResponse.json(
      { error: `Failed to upload file: ${msg}` },
      { status: 500 }
    );
  }
}
