/**
 * Text extraction from various file formats.
 * Supports: PDF, XLSX/CSV, DOCX, plain text.
 * Images and unsupported formats return null (caller should inform user).
 */

const SUPPORTED_MIME_TYPES = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel",
  "text/csv",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
  "text/markdown",
]);

const IMAGE_MIME_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/gif",
  "image/webp",
  "image/svg+xml",
]);

export function isTextExtractable(mimeType: string): boolean {
  return SUPPORTED_MIME_TYPES.has(mimeType);
}

export function isImageFile(mimeType: string): boolean {
  return IMAGE_MIME_TYPES.has(mimeType);
}

export function classifyFileType(
  mimeType: string
): "pdf" | "spreadsheet" | "document" | "image" | "link" | "other" {
  if (mimeType === "application/pdf") return "pdf";
  if (
    mimeType.includes("spreadsheet") ||
    mimeType.includes("excel") ||
    mimeType === "text/csv"
  )
    return "spreadsheet";
  if (
    mimeType.includes("wordprocessingml") ||
    mimeType === "text/plain" ||
    mimeType === "text/markdown"
  )
    return "document";
  if (IMAGE_MIME_TYPES.has(mimeType)) return "image";
  return "other";
}

/**
 * Extract text content from a file buffer.
 * Returns extracted text or null if format is unsupported.
 * Truncates to ~50K chars to stay within LLM context limits.
 */
export async function extractText(
  buffer: Buffer,
  mimeType: string,
  filename: string
): Promise<string | null> {
  const MAX_CHARS = 50_000;

  try {
    if (mimeType === "application/pdf") {
      return await extractPdf(buffer, MAX_CHARS);
    }

    if (
      mimeType.includes("spreadsheet") ||
      mimeType.includes("excel") ||
      mimeType === "text/csv"
    ) {
      return await extractSpreadsheet(buffer, MAX_CHARS, filename);
    }

    if (mimeType.includes("wordprocessingml")) {
      return await extractDocx(buffer, MAX_CHARS);
    }

    if (mimeType === "text/plain" || mimeType === "text/markdown") {
      const text = buffer.toString("utf-8");
      return text.slice(0, MAX_CHARS);
    }

    // Images and other formats — no text extraction
    return null;
  } catch (err) {
    console.error(`Text extraction failed for ${filename}:`, err);
    return null;
  }
}

async function extractPdf(buffer: Buffer, maxChars: number): Promise<string> {
  // pdf-parse — dynamic import
  const mod = await import("pdf-parse");
  // Handle both ESM default and CJS module shapes
  const pdfParse = typeof mod === "function" ? mod : (mod as { default?: typeof mod }).default ?? mod;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data = await (pdfParse as any)(buffer);
  return (data.text || "").slice(0, maxChars);
}

async function extractSpreadsheet(
  buffer: Buffer,
  maxChars: number,
  filename: string
): Promise<string> {
  const XLSX = await import("xlsx");

  let workbook;
  if (filename.endsWith(".csv")) {
    const csvText = buffer.toString("utf-8");
    workbook = XLSX.read(csvText, { type: "string" });
  } else {
    workbook = XLSX.read(buffer, { type: "buffer" });
  }

  const parts: string[] = [];
  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    if (!sheet) continue;
    parts.push(`--- Sheet: ${sheetName} ---`);
    const csv = XLSX.utils.sheet_to_csv(sheet);
    parts.push(csv);
  }

  const text = parts.join("\n\n");
  return text.slice(0, maxChars);
}

async function extractDocx(buffer: Buffer, maxChars: number): Promise<string> {
  const mammoth = await import("mammoth");
  const result = await mammoth.extractRawText({ buffer });
  return (result.value || "").slice(0, maxChars);
}
