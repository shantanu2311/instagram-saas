/**
 * Client for the Python FastAPI backend (image generation, media serving).
 * Gracefully returns null if backend is not running.
 */

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000";

export function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.slice(0, 2), 16) || 0;
  const g = parseInt(clean.slice(2, 4), 16) || 0;
  const b = parseInt(clean.slice(4, 6), 16) || 0;
  return [r, g, b];
}

function fontToFilename(fontName: string, weight: "bold" | "regular"): string {
  const name = fontName || "Inter";
  const suffix = weight === "bold" ? "Bold" : "Regular";
  return `${name}-${suffix}.ttf`;
}

interface BrandForBackend {
  primary_color: [number, number, number];
  secondary_color: [number, number, number];
  accent_color: [number, number, number];
  background_color: [number, number, number];
  text_color: [number, number, number];
  text_muted_color: [number, number, number];
  font_headline: string;
  font_body: string;
  brand_name: string;
  logo_url: string;
}

export function buildBackendBrand(brand: {
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  fontHeadline?: string;
  fontBody?: string;
  brandName?: string;
  logoUrl?: string;
}): BrandForBackend {
  return {
    primary_color: hexToRgb(brand.primaryColor || "#8b5cf6"),
    secondary_color: hexToRgb(brand.secondaryColor || "#ec4899"),
    accent_color: hexToRgb(brand.accentColor || "#f59e0b"),
    background_color: [10, 14, 26],
    text_color: [255, 255, 255],
    text_muted_color: [140, 150, 170],
    font_headline: fontToFilename(brand.fontHeadline || "Inter", "bold"),
    font_body: fontToFilename(brand.fontBody || "Inter", "regular"),
    brand_name: brand.brandName || "",
    logo_url: brand.logoUrl || "",
  };
}

export interface ImageGenerateResult {
  status: string;
  path: string | string[];
  type: string;
}

/**
 * Call the backend to generate an image.
 * Returns the media path(s) or null if backend is unavailable.
 */
export async function generateImage(
  template: Record<string, unknown>,
  brand: BrandForBackend
): Promise<ImageGenerateResult | null> {
  try {
    const res = await fetch(`${BACKEND_URL}/generate/image`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ template, brand, output_format: "png" }),
      signal: AbortSignal.timeout(30000),
    });

    if (!res.ok) return null;
    return await res.json();
  } catch {
    // Backend not running or request failed — graceful degradation
    return null;
  }
}

/**
 * Build a fact_card template from generated content.
 */
export function buildFactCardTemplate(opts: {
  headline: string;
  body?: string;
  category?: string;
  source?: string;
}): Record<string, unknown> {
  return {
    type: "fact_card",
    category: opts.category || "DID YOU KNOW?",
    headline: opts.headline,
    highlights: [],
    body: opts.body || "",
    source: opts.source || "",
    glow: { x: 540, y: 300, radius: 300, color: "accent" },
  };
}

/**
 * Build a carousel template from generated content.
 */
export function buildCarouselTemplate(opts: {
  title: string;
  slides: Array<{ headline: string; body: string }>;
}): Record<string, unknown> {
  return {
    type: "carousel",
    title_slide: true,
    slides: [
      { headline: opts.title, body: "", glow: { x: 540, y: 400, radius: 300, color: "primary" } },
      ...opts.slides.map((s, i) => ({
        number: String(i + 1).padStart(2, "0"),
        headline: s.headline,
        body: s.body,
        highlights: [],
      })),
    ],
  };
}

/**
 * Convert a backend media path to a frontend-accessible URL.
 */
export function mediaUrl(path: string): string {
  // Extract just the filename from the path
  const filename = path.split("/").pop() || path;
  return `/api/media/proxy?file=${encodeURIComponent(filename)}`;
}
