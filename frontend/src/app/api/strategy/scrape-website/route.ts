import { NextResponse } from "next/server";
import { callClaude } from "@/lib/content-engine";
import { rateLimit } from "@/lib/rate-limit";

/**
 * Check if a hostname resolves to a private/internal IP range.
 * Blocks SSRF attempts targeting internal services.
 */
function isBlockedHost(hostname: string): boolean {
  const lower = hostname.toLowerCase();

  // Block common internal hostnames
  if (
    lower === "localhost" ||
    lower === "host.docker.internal" ||
    lower.endsWith(".local") ||
    lower.endsWith(".internal")
  ) {
    return true;
  }

  // Block IP addresses in private/reserved ranges
  // Strip IPv6 brackets if present
  const ip = lower.replace(/^\[|\]$/g, "");

  // IPv4 private ranges
  if (/^127\./.test(ip)) return true; // loopback
  if (/^10\./.test(ip)) return true; // 10.0.0.0/8
  if (/^172\.(1[6-9]|2\d|3[01])\./.test(ip)) return true; // 172.16.0.0/12
  if (/^192\.168\./.test(ip)) return true; // 192.168.0.0/16
  if (/^169\.254\./.test(ip)) return true; // link-local
  if (ip === "0.0.0.0" || ip === "::1" || ip === "::") return true;

  // Block metadata endpoints (cloud providers)
  if (/^100\.(6[4-9]|[7-9]\d|1[0-1]\d|12[0-7])\./.test(ip)) return true; // 100.64.0.0/10

  return false;
}

export async function POST(request: Request) {
  const limited = rateLimit(request, "default");
  if (limited) return limited;

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let body: any;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Request body is required." },
        { status: 400 }
      );
    }

    const { url } = body;

    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    // Normalize URL
    let normalizedUrl = url.trim();
    if (!normalizedUrl.startsWith("http")) {
      normalizedUrl = "https://" + normalizedUrl;
    }

    // SSRF protection: validate URL scheme and hostname
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(normalizedUrl);
    } catch {
      return NextResponse.json({ error: "Invalid URL format" }, { status: 400 });
    }

    // Only allow http and https schemes
    if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
      return NextResponse.json(
        { error: "Only HTTP and HTTPS URLs are allowed" },
        { status: 400 }
      );
    }

    // Block internal/private hostnames and IPs
    if (isBlockedHost(parsedUrl.hostname)) {
      return NextResponse.json(
        { error: "Cannot scrape internal or private URLs" },
        { status: 400 }
      );
    }

    // Block URLs with credentials
    if (parsedUrl.username || parsedUrl.password) {
      return NextResponse.json(
        { error: "URLs with credentials are not allowed" },
        { status: 400 }
      );
    }

    // Fetch the website
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    let html: string;
    try {
      const res = await fetch(normalizedUrl, {
        signal: controller.signal,
        headers: {
          "User-Agent":
            "Mozilla/5.0 (compatible; Kuraite/1.0; +https://kuraite.co.in)",
          Accept: "text/html",
        },
      });
      const reader = res.body?.getReader();
      if (!reader) {
        return NextResponse.json({ error: "Could not read response" }, { status: 422 });
      }
      const maxBytes = 2 * 1024 * 1024;
      const chunks: Uint8Array[] = [];
      let totalBytes = 0;
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        totalBytes += value.byteLength;
        if (totalBytes > maxBytes) {
          chunks.push(value.slice(0, value.byteLength - (totalBytes - maxBytes)));
          break;
        }
        chunks.push(value);
      }
      reader.cancel();
      html = new TextDecoder().decode(Buffer.concat(chunks.map(c => Buffer.from(c))));
    } catch {
      return NextResponse.json(
        { error: "Could not fetch website. Check the URL and try again." },
        { status: 422 }
      );
    } finally {
      clearTimeout(timeout);
    }

    // Extract meta tags and visible text
    const extracted = extractPageData(html);

    // Use Claude to interpret the website data
    const text = await callClaude({
      system: `You extract structured business information from website HTML metadata and content snippets. Return ONLY valid JSON with these fields (use empty string "" if not found):
{
  "businessName": "company/brand name",
  "businessDescription": "what the business does, 1-2 sentences",
  "productService": "main products or services offered",
  "usp": "unique selling proposition if apparent",
  "targetAudience": "who the business serves, if apparent",
  "industry": "industry/niche category"
}`,
      userMessage: `Extract business info from this website data:\n\nURL: ${normalizedUrl}\nTitle: ${extracted.title}\nMeta Description: ${extracted.description}\nOG Title: ${extracted.ogTitle}\nOG Description: ${extracted.ogDescription}\nKeywords: ${extracted.keywords}\nHeadings: ${extracted.headings.join(" | ")}\nBody snippet: ${extracted.bodySnippet}`,
      model: "fast",
      maxTokens: 1024,
    });
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json(
        { error: "Could not extract business data from website" },
        { status: 422 }
      );
    }

    const data = JSON.parse(jsonMatch[0]);

    // Extract brand colors and fonts from CSS if requested
    let brandColors: { primary?: string; secondary?: string; accent?: string; background?: string; text?: string } | undefined;
    let brandFonts: { headline?: string; body?: string } | undefined;

    const reqUrl = new URL(request.url);
    const extractBrand = reqUrl.searchParams.get("extractBrand") === "true" ||
      (typeof body.extractBrand === "boolean" && body.extractBrand);

    if (extractBrand) {
      // Step 1: Fetch external CSS files for comprehensive color extraction
      let externalCSS = "";
      try {
        externalCSS = await fetchExternalCSS(html, normalizedUrl);
      } catch {
        // Continue without external CSS
      }

      // Step 2: Extract ALL colors and fonts from HTML + CSS deterministically
      const brandData = extractBrandData(html, externalCSS);

      // Step 3: If we have enough data, use AI to SELECT from extracted colors (not guess)
      const hasColors = brandData.colorUsages.length > 0 || brandData.cssVariables.length > 0;
      const hasFonts = brandData.googleFonts.length > 0 || brandData.cssFonts.length > 0;

      if (hasColors || hasFonts) {
        try {
          // Build the color inventory for AI to select from
          const colorInventory: string[] = [];
          if (brandData.themeColor) {
            colorInventory.push(`META THEME-COLOR: ${brandData.themeColor} (highest priority — this is the official brand color)`);
          }
          if (brandData.cssVariables.length > 0) {
            colorInventory.push(`\nCSS VARIABLES (named colors — very reliable):\n${brandData.cssVariables.join("\n")}`);
          }
          if (brandData.colorUsages.length > 0) {
            colorInventory.push(`\nCOLORS BY FREQUENCY (from CSS rules):\n${brandData.colorUsages.map((c) => `${c.color} — used ${c.count}x in: ${c.context}`).join("\n")}`);
          }

          const fontInventory: string[] = [];
          if (brandData.googleFonts.length > 0) {
            fontInventory.push(`Google Fonts loaded: ${brandData.googleFonts.join(", ")}`);
          }
          if (brandData.cssFonts.length > 0) {
            fontInventory.push(`CSS font-family declarations: ${brandData.cssFonts.join(", ")}`);
          }

          const brandAiText = await callClaude({
            system: `You are a brand identity analyst. Your job is to SELECT the correct brand colors and fonts from the ACTUAL CSS data extracted from a website.

CRITICAL RULES:
1. You MUST ONLY choose colors from the provided color inventory below. Do NOT invent or guess colors.
2. For "primary": pick the main brand color — look first at meta theme-color, then CSS variables with "primary"/"brand"/"main" in the name, then the most-used vibrant color on buttons/links/headers.
3. For "secondary": pick a complementary color used for secondary elements (backgrounds, borders, secondary buttons). Must be a DIFFERENT color from primary.
4. For "accent": pick a highlight/CTA color (used on links, hover states, call-to-action buttons). Must differ from primary and secondary.
5. For fonts: if Google Fonts are loaded, those are the brand fonts. First one is typically the display/headline font, second is body. If only CSS font-family, use those.
6. If a CSS variable is named "--primary" or "--brand-color", trust that name — it IS the primary color.
7. Return ONLY colors that appear in the inventory. Never return a color not listed.

Return ONLY valid JSON:
{
  "primary": "#hex",
  "secondary": "#hex",
  "accent": "#hex",
  "background": "#hex or null",
  "text": "#hex or null",
  "headlineFont": "font name or null",
  "bodyFont": "font name or null"
}`,
            userMessage: `Website: ${normalizedUrl}
Title: ${extracted.title}

=== COLOR INVENTORY (select from these ONLY) ===
${colorInventory.join("\n")}

=== FONT INVENTORY ===
${fontInventory.length > 0 ? fontInventory.join("\n") : "No custom fonts detected — return null for fonts."}

Select the brand colors from the inventory above.`,
            model: "fast",
            maxTokens: 300,
          });

          const brandJsonMatch = brandAiText.match(/\{[\s\S]*\}/);
          if (brandJsonMatch) {
            const ai = JSON.parse(brandJsonMatch[0]);
            // Validate that returned colors actually exist in our inventory
            const allExtracted = new Set([
              brandData.themeColor,
              ...brandData.cssVariables.map((v) => v.split(":")[1]?.trim()),
              ...brandData.colorUsages.map((c) => c.color),
            ].filter(Boolean));

            const validColor = (c: string | null | undefined): string | undefined => {
              if (!c || c === "null") return undefined;
              const norm = normalizeColor(c);
              if (norm && (allExtracted.has(norm) || [...allExtracted].some((e) => e?.toLowerCase() === norm.toLowerCase()))) return norm;
              return undefined;
            };

            const primary = validColor(ai.primary);
            const secondary = validColor(ai.secondary);
            const accent = validColor(ai.accent);

            if (primary || secondary || accent) {
              brandColors = {
                ...(primary ? { primary } : {}),
                ...(secondary ? { secondary } : {}),
                ...(accent ? { accent } : {}),
                ...(validColor(ai.background) ? { background: validColor(ai.background) } : {}),
                ...(validColor(ai.text) ? { text: validColor(ai.text) } : {}),
              };
            }

            // Fonts: validate against extracted fonts
            const allFonts = [...brandData.googleFonts, ...brandData.cssFonts];
            const validFont = (f: string | null | undefined): string | undefined => {
              if (!f || f === "null") return undefined;
              // Exact match
              if (allFonts.includes(f)) return f;
              // Case-insensitive match
              const match = allFonts.find((af) => af.toLowerCase() === f.toLowerCase());
              return match || undefined;
            };

            const headline = validFont(ai.headlineFont);
            const body = validFont(ai.bodyFont);
            if (headline || body) {
              brandFonts = {
                ...(headline ? { headline } : {}),
                ...(body ? { body } : {}),
              };
            }
          }
        } catch {
          // AI selection failed — use deterministic fallback
        }
      }

      // Fallback: if AI didn't produce results, use deterministic selection
      if (!brandColors) {
        const fallbackColors: string[] = [];
        // Priority 1: theme-color meta
        if (brandData.themeColor) fallbackColors.push(brandData.themeColor);
        // Priority 2: CSS variables with "primary" in name
        for (const v of brandData.cssVariables) {
          const hex = v.split(":")[1]?.trim();
          if (hex && !fallbackColors.includes(hex)) fallbackColors.push(hex);
        }
        // Priority 3: most frequent colors
        for (const c of brandData.colorUsages) {
          if (!fallbackColors.includes(c.color)) fallbackColors.push(c.color);
          if (fallbackColors.length >= 5) break;
        }
        if (fallbackColors.length > 0) {
          brandColors = {
            primary: fallbackColors[0],
            ...(fallbackColors[1] ? { secondary: fallbackColors[1] } : {}),
            ...(fallbackColors[2] ? { accent: fallbackColors[2] } : {}),
          };
        }
      }
      if (!brandFonts) {
        const fonts = brandData.googleFonts.length > 0 ? brandData.googleFonts : brandData.cssFonts;
        if (fonts.length > 0) {
          brandFonts = {
            headline: fonts[0],
            body: fonts[1] || fonts[0],
          };
        }
      }
    }

    return NextResponse.json({
      ...data,
      url: normalizedUrl,
      ...(brandColors ? { brandColors } : {}),
      ...(brandFonts ? { brandFonts } : {}),
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Website scraping failed";
    console.error("Scrape website error:", message);

    if (message.includes("ANTHROPIC_API_KEY")) {
      return NextResponse.json(
        { error: "API key not configured" },
        { status: 500 }
      );
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function extractPageData(html: string) {
  const getMeta = (name: string): string => {
    const match = html.match(
      new RegExp(
        `<meta[^>]*(?:name|property)=["']${name}["'][^>]*content=["']([^"']*)["']`,
        "i"
      )
    );
    if (match) return match[1];
    // Try reversed order (content before name)
    const match2 = html.match(
      new RegExp(
        `<meta[^>]*content=["']([^"']*)["'][^>]*(?:name|property)=["']${name}["']`,
        "i"
      )
    );
    return match2 ? match2[1] : "";
  };

  const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);

  // Extract headings (h1, h2)
  const headingMatches = html.match(/<h[12][^>]*>([\s\S]*?)<\/h[12]>/gi) || [];
  const headings = headingMatches
    .map((h) => h.replace(/<[^>]*>/g, "").trim())
    .filter(Boolean)
    .slice(0, 10);

  // Extract body text snippet (strip tags, take first ~500 chars of meaningful text)
  const bodyMatch = html.match(/<body[\s\S]*?>([\s\S]*)<\/body>/i);
  let bodySnippet = "";
  if (bodyMatch) {
    bodySnippet = bodyMatch[1]
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<nav[\s\S]*?<\/nav>/gi, "")
      .replace(/<footer[\s\S]*?<\/footer>/gi, "")
      .replace(/<[^>]*>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 800);
  }

  return {
    title: titleMatch ? titleMatch[1].trim() : "",
    description: getMeta("description"),
    ogTitle: getMeta("og:title"),
    ogDescription: getMeta("og:description"),
    keywords: getMeta("keywords"),
    headings,
    bodySnippet,
  };
}

/**
 * Fetch external CSS files referenced in <link> tags.
 * Returns combined CSS text (capped at maxBytes).
 */
async function fetchExternalCSS(html: string, baseUrl: string, maxBytes = 200_000): Promise<string> {
  const linkMatches = html.matchAll(
    /<link[^>]*rel=["']stylesheet["'][^>]*href=["']([^"']+)["']/gi
  );
  // Also try reversed order (href before rel)
  const linkMatches2 = html.matchAll(
    /<link[^>]*href=["']([^"']+)["'][^>]*rel=["']stylesheet["']/gi
  );
  const urls = new Set<string>();
  for (const m of linkMatches) if (m[1]) urls.add(m[1]);
  for (const m of linkMatches2) if (m[1]) urls.add(m[1]);

  const chunks: string[] = [];
  let totalLen = 0;

  for (const href of urls) {
    if (totalLen >= maxBytes) break;
    // Skip third-party CSS (Google Fonts returns @font-face, not colors)
    if (href.includes("fonts.googleapis.com")) continue;
    try {
      const cssUrl = href.startsWith("http") ? href : new URL(href, baseUrl).toString();
      // SSRF: skip private URLs
      const parsed = new URL(cssUrl);
      if (isBlockedHost(parsed.hostname)) continue;

      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 5000);
      const res = await fetch(cssUrl, {
        signal: controller.signal,
        headers: { Accept: "text/css" },
      });
      clearTimeout(timer);
      if (res.ok) {
        const text = await res.text();
        const slice = text.slice(0, maxBytes - totalLen);
        chunks.push(slice);
        totalLen += slice.length;
      }
    } catch {
      // Skip unreachable stylesheets
    }
  }
  return chunks.join("\n");
}

/** Normalize any color value to 6-digit lowercase hex. Returns null if unparseable. */
function normalizeColor(raw: string): string | null {
  const s = raw.trim().toLowerCase();
  // #rgb → #rrggbb
  const hex3 = s.match(/^#([0-9a-f])([0-9a-f])([0-9a-f])$/);
  if (hex3) return `#${hex3[1]}${hex3[1]}${hex3[2]}${hex3[2]}${hex3[3]}${hex3[3]}`;
  // #rrggbb or #rrggbbaa
  const hex6 = s.match(/^#([0-9a-f]{6})([0-9a-f]{2})?$/);
  if (hex6) return `#${hex6[1]}`;
  // rgb(r, g, b) or rgba(r, g, b, a)
  const rgbMatch = s.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
  if (rgbMatch) {
    const [, r, g, b] = rgbMatch;
    return `#${Number(r).toString(16).padStart(2, "0")}${Number(g).toString(16).padStart(2, "0")}${Number(b).toString(16).padStart(2, "0")}`;
  }
  return null;
}

/** Check if a color is too close to pure black/white/gray to be a "brand" color. */
function isGenericColor(hex: string): boolean {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  // Check if grayscale (r ≈ g ≈ b)
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const saturation = max === 0 ? 0 : (max - min) / max;
  // Very low saturation = gray/black/white
  if (saturation < 0.1) return true;
  // Too dark (near-black) or too light (near-white) with low saturation
  if (max < 30) return true; // near black
  if (min > 230 && saturation < 0.15) return true; // near white
  return false;
}

interface ExtractedBrandData {
  /** Labeled CSS custom properties (e.g., "--primary: #ff6f61") */
  cssVariables: string[];
  /** Colors found in CSS with usage context */
  colorUsages: Array<{ color: string; context: string; count: number }>;
  /** Theme color from meta tag */
  themeColor: string | null;
  /** Google Fonts families */
  googleFonts: string[];
  /** font-family declarations from CSS */
  cssFonts: string[];
}

/**
 * Extract all brand-relevant data from HTML + CSS text.
 * Returns structured data for AI to select from — no guessing needed.
 */
function extractBrandData(html: string, externalCSS: string): ExtractedBrandData {
  const allCSS = [
    // Inline style tags
    ...(html.match(/<style[^>]*>([\s\S]*?)<\/style>/gi) || []).map(
      (s) => s.replace(/<\/?style[^>]*>/gi, "")
    ),
    externalCSS,
  ].join("\n");

  // 1. CSS custom properties with semantic names
  const cssVariables: string[] = [];
  // Match named CSS vars that contain color-related keywords OR are color definitions
  const cssVarPatterns = [
    // Variables with semantic color names
    /(--[a-zA-Z0-9_-]*(?:color|brand|primary|secondary|accent|theme|bg|text|heading|link|button|highlight|surface|cta|main|base|red|green|blue|purple|yellow|orange|pink|teal|cyan)[a-zA-Z0-9_-]*)\s*:\s*([^;}\n]+)/gi,
    // Variables that are assigned hex or rgb values (catch-all for --ns-red, --color-foo, etc.)
    /(--(?:color|ns|brand|theme)-[a-zA-Z0-9_-]+)\s*:\s*([^;}\n]+)/gi,
  ];
  const seenVars = new Set<string>();
  for (const pattern of cssVarPatterns) {
    const matches = allCSS.matchAll(pattern);
    for (const m of matches) {
      const varName = m[1].trim();
      const rawValue = m[2].trim();
      if (seenVars.has(varName)) continue;
      // Skip Tailwind internal variables
      if (varName.startsWith("--tw-")) continue;
      const hex = normalizeColor(rawValue);
      if (hex && !isGenericColor(hex)) {
        seenVars.add(varName);
        cssVariables.push(`${varName}: ${hex}`);
      }
    }
  }

  // 2. All color values with their CSS property context
  const colorMap = new Map<string, { contexts: Set<string>; count: number }>();
  // Match hex colors
  const hexMatches = allCSS.matchAll(
    /([a-zA-Z-]+)\s*:\s*(#[0-9a-fA-F]{3,8})/g
  );
  for (const m of hexMatches) {
    const prop = m[1].trim().toLowerCase();
    const hex = normalizeColor(m[2]);
    if (hex && !isGenericColor(hex)) {
      const entry = colorMap.get(hex) || { contexts: new Set<string>(), count: 0 };
      entry.contexts.add(prop);
      entry.count++;
      colorMap.set(hex, entry);
    }
  }
  // Match rgb/rgba colors
  const rgbMatches = allCSS.matchAll(
    /([a-zA-Z-]+)\s*:\s*(rgba?\([^)]+\))/g
  );
  for (const m of rgbMatches) {
    const prop = m[1].trim().toLowerCase();
    const hex = normalizeColor(m[2]);
    if (hex && !isGenericColor(hex)) {
      const entry = colorMap.get(hex) || { contexts: new Set<string>(), count: 0 };
      entry.contexts.add(prop);
      entry.count++;
      colorMap.set(hex, entry);
    }
  }
  // Also extract from HTML inline styles
  const inlineMatches = html.matchAll(
    /style="[^"]*?([a-zA-Z-]+)\s*:\s*(#[0-9a-fA-F]{3,8}|rgba?\([^)]+\))/gi
  );
  for (const m of inlineMatches) {
    const prop = m[1].trim().toLowerCase();
    const hex = normalizeColor(m[2]);
    if (hex && !isGenericColor(hex)) {
      const entry = colorMap.get(hex) || { contexts: new Set<string>(), count: 0 };
      entry.contexts.add(`inline-${prop}`);
      entry.count++;
      colorMap.set(hex, entry);
    }
  }

  // Sort by frequency (most used first)
  const colorUsages = [...colorMap.entries()]
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 30) // Top 30 colors
    .map(([color, data]) => ({
      color,
      context: [...data.contexts].join(", "),
      count: data.count,
    }));

  // 3. Theme color from meta tag
  let themeColor: string | null = null;
  const themeMatch = html.match(
    /<meta[^>]*name=["']theme-color["'][^>]*content=["']([^"']+)["']/i
  ) || html.match(
    /<meta[^>]*content=["']([^"']+)["'][^>]*name=["']theme-color["']/i
  );
  if (themeMatch) themeColor = normalizeColor(themeMatch[1]);

  // 4. Google Fonts
  const googleFonts: string[] = [];
  const gfMatches = allCSS.matchAll(
    /fonts\.googleapis\.com\/css2?\?family=([^"&\s)]+)/gi
  );
  for (const m of gfMatches) {
    const familyStr = decodeURIComponent(m[1]);
    for (const f of familyStr.split("|")) {
      const name = f.split(":")[0].replace(/\+/g, " ").trim();
      if (name && !googleFonts.includes(name)) googleFonts.push(name);
    }
  }
  // Also check the HTML <head> for Google Fonts links
  const gfHtmlMatches = html.matchAll(
    /fonts\.googleapis\.com\/css2?\?family=([^"&\s)]+)/gi
  );
  for (const m of gfHtmlMatches) {
    const familyStr = decodeURIComponent(m[1]);
    for (const f of familyStr.split("|")) {
      const name = f.split(":")[0].replace(/\+/g, " ").trim();
      if (name && !googleFonts.includes(name)) googleFonts.push(name);
    }
  }

  // 5. font-family from CSS
  const cssFonts: string[] = [];
  const genericFonts = new Set([
    "sans-serif", "serif", "monospace", "system-ui", "cursive", "fantasy",
    "inherit", "initial", "unset", "revert", "-apple-system", "blinkmacsystemfont",
    "segoe ui", "helvetica", "arial", "roboto", "oxygen", "ubuntu", "cantarell",
    "fira sans", "droid sans", "helvetica neue", "apple color emoji",
    "segoe ui emoji", "segoe ui symbol", "noto color emoji",
  ]);
  const ffMatches = allCSS.matchAll(
    /font-family\s*:\s*([^;}\n]+)/gi
  );
  for (const m of ffMatches) {
    const families = m[1].split(",").map((f) => f.trim().replace(/["']/g, "").trim());
    for (let f of families) {
      // Skip fallback declarations like "fontName Fallback"
      if (f.endsWith(" Fallback") || f.endsWith("Fallback")) continue;
      if (!f || genericFonts.has(f.toLowerCase())) continue;
      // Skip CSS function references, raw var() expressions, and partial font stacks
      if (/^var\s*\(/i.test(f) || /^ui-/i.test(f) || f.includes("(") || f.includes(")")) continue;
      // Skip single-word generic names
      if (/^(monospace|emoji|cursive|fantasy)$/i.test(f)) continue;
      // Convert camelCase font names to Title Case (e.g., "newKansas" → "New Kansas")
      const spaced = f.replace(/([a-z])([A-Z])/g, "$1 $2");
      f = spaced.replace(/\b\w/g, (c) => c.toUpperCase());
      if (!cssFonts.includes(f)) {
        cssFonts.push(f);
      }
    }
  }

  // Also extract font names from @font-face src URLs and preload links
  const preloadFonts = html.matchAll(
    /rel=["']preload["'][^>]*href=["'][^"']*\/([^/"']+)-s\.p\.[^"']+\.woff2["']/gi
  );
  for (const m of preloadFonts) {
    // Convert hex-encoded or hashed names — these are usually not useful
    // But font file names sometimes contain the font name
  }
  // Extract from @font-face { font-family: "Name" }
  const fontFaceMatches = allCSS.matchAll(
    /@font-face\s*\{[^}]*font-family\s*:\s*["']?([^"';}\n,]+)/gi
  );
  for (const m of fontFaceMatches) {
    let f = m[1].trim().replace(/["']/g, "");
    if (f.endsWith(" Fallback") || f.endsWith("Fallback")) continue;
    if (!f || genericFonts.has(f.toLowerCase())) continue;
    const spaced = f.replace(/([a-z])([A-Z])/g, "$1 $2");
    f = spaced.replace(/\b\w/g, (c) => c.toUpperCase());
    if (!cssFonts.includes(f)) {
      cssFonts.push(f);
    }
  }

  return { cssVariables, colorUsages, themeColor, googleFonts, cssFonts };
}
