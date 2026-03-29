import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Routes that require authentication
const protectedPagePrefixes = ["/dashboard", "/studio", "/settings", "/strategy", "/queue"];
const protectedApiPrefixes = ["/api/studio", "/api/strategy", "/api/brands", "/api/dashboard", "/api/posts", "/api/queue", "/api/instagram", "/api/media"];

// Public API routes that must bypass auth (Meta callbacks, OAuth)
const publicApiPaths = [
  "/api/instagram/data-deletion",
  "/api/instagram/deauthorize",
  "/api/instagram/callback",
  "/api/instagram/connect",
  "/api/auth",
];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check for next-auth session token (works with JWT strategy)
  const token =
    request.cookies.get("authjs.session-token") ??
    request.cookies.get("__Secure-authjs.session-token");

  // Allow public API paths (Meta callbacks, OAuth) without auth
  const isPublicApi = publicApiPaths.some((path) =>
    pathname.startsWith(path)
  );
  if (isPublicApi) {
    return NextResponse.next();
  }

  // Protect API routes — return 401
  const isProtectedApi = protectedApiPrefixes.some((prefix) =>
    pathname.startsWith(prefix)
  );
  if (isProtectedApi && !token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Protect page routes — redirect to signin
  const isProtectedPage = protectedPagePrefixes.some((prefix) =>
    pathname.startsWith(prefix)
  );
  if (isProtectedPage && !token) {
    const signInUrl = new URL("/auth/signin", request.url);
    signInUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Match all paths except static files and _next internals
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
