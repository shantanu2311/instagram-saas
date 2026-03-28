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
            "Mozilla/5.0 (compatible; IGCreator/1.0; +https://igcreator.app)",
          Accept: "text/html",
        },
      });
      html = await res.text();
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
    return NextResponse.json({ ...data, url: normalizedUrl });
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
