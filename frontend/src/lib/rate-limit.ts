import { NextResponse } from "next/server";

/**
 * Simple in-memory sliding-window rate limiter.
 * Suitable for single-instance deployments (Vercel serverless resets between cold starts).
 * For production at scale, replace with Vercel KV or Upstash Redis.
 */

interface RateLimitEntry {
  timestamps: number[];
}

const store = new Map<string, RateLimitEntry>();

// Cleanup stale entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store) {
    entry.timestamps = entry.timestamps.filter((t) => now - t < 120_000);
    if (entry.timestamps.length === 0) store.delete(key);
  }
}, 300_000).unref?.();

interface RateLimitConfig {
  /** Max requests allowed in the window */
  limit: number;
  /** Window size in seconds */
  windowSec: number;
}

const DEFAULTS: Record<string, RateLimitConfig> = {
  // AI generation routes — expensive, strict limits
  generate: { limit: 10, windowSec: 60 },
  // Auth routes — prevent brute force
  auth: { limit: 5, windowSec: 60 },
  // General API routes
  default: { limit: 30, windowSec: 60 },
};

/**
 * Extract client identifier from request.
 * Uses x-forwarded-for (set by Vercel/proxies) or falls back to a default.
 */
function getClientId(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  const real = request.headers.get("x-real-ip");
  if (real) return real;
  return "unknown";
}

/**
 * Check rate limit for a request. Returns null if allowed, or a 429 Response if blocked.
 *
 * Usage in route handlers:
 *   const limited = rateLimit(request, "generate");
 *   if (limited) return limited;
 */
export function rateLimit(
  request: Request,
  tier: "generate" | "auth" | "default" = "default"
): NextResponse | null {
  const config = DEFAULTS[tier];
  const clientId = getClientId(request);
  const key = `${tier}:${clientId}`;
  const now = Date.now();
  const windowMs = config.windowSec * 1000;

  let entry = store.get(key);
  if (!entry) {
    entry = { timestamps: [] };
    store.set(key, entry);
  }

  // Remove timestamps outside the window
  entry.timestamps = entry.timestamps.filter((t) => now - t < windowMs);

  if (entry.timestamps.length >= config.limit) {
    const oldestInWindow = entry.timestamps[0];
    const retryAfter = Math.ceil((oldestInWindow + windowMs - now) / 1000);

    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      {
        status: 429,
        headers: {
          "Retry-After": String(retryAfter),
          "X-RateLimit-Limit": String(config.limit),
          "X-RateLimit-Remaining": "0",
        },
      }
    );
  }

  entry.timestamps.push(now);

  return null;
}
