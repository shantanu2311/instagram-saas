# CLAUDE.md

## Project: Instagram Creator SaaS

Multi-user SaaS platform for automated Instagram content creation and posting. Generates captions, strategies, calendars, and content queues powered by Claude (Anthropic API or local Claude CLI). The creator configures their brand, approves strategy, then the system generates and posts everything.

## Architecture

- **Frontend**: Next.js 16 (App Router) + React 19 + TypeScript + Tailwind v4 + shadcn/ui
- **Content Engine**: `src/lib/content-engine/` — Dual-mode AI (Anthropic SDK or Claude CLI)
- **Backend**: Python FastAPI microservice (port 8000) — image gen, Instagram posting, analytics
- **Database**: PostgreSQL 16 (shared, Next.js via Prisma, FastAPI via SQLAlchemy)
- **Queue**: Celery + Redis 7 (scheduled posting, analytics collection)
- **Auth**: NextAuth v5 (credentials + Instagram OAuth) — currently stub, accepts any credentials
- **Deployment**: Vercel (auto-deploys from GitHub master)

## Build & Run

```bash
export PATH="/c/Program Files/nodejs:$PATH"

# Frontend
cd frontend && npm install && npm run dev

# Build (includes prisma generate)
npm run build

# Backend (optional — content generation works without it)
cd backend && pip install -e ".[dev]" && uvicorn app.main:app --reload --port 8000
```

## Content Engine — Dual Mode AI

All AI generation lives in `frontend/src/lib/content-engine/`:
- `index.ts` — `callClaude()` auto-detects mode: API key present → Anthropic SDK, no key → shells out to `claude` CLI
- `caption-generator.ts` — Captions, headlines, hashtags, quality scores
- `strategy-generator.ts` — 7-section content strategy from discovery data
- `calendar-generator.ts` — Monthly content calendar from strategy

**Models:**
- `claude-sonnet-4-6` (FAST_MODEL) — captions, calendar, website scraping
- `claude-opus-4-6` (DEEP_MODEL) — strategy generation

**Claude CLI mode:** Users with Claude Max subscription can run without API key. The `callClaudeCli()` function uses `execFile("claude", ["-p", prompt, "--model", model, "--output-format", "text"])` with 120s timeout.

## Content Pipeline Flow

```
1. Onboarding → Brand setup (niche, colors, fonts, voice, pillars) — 4 steps
2. Strategy Discovery → 9-step wizard (type, business, audience, competitors, goals, content, experience, brand, USP)
3. Strategy Research → Simulated research animation → "Generate My Strategy" button
4. Strategy Generation → Claude generates 7-section strategy
5. Strategy Review → User approves each section
6. Calendar Generation → Claude generates monthly content slots
7. [Full Control only] Design Preview → 3 sample posts for approval
8. Batch Generation → Claude generates all calendar slots (NDJSON stream)
9. Content Queue → User reviews/approves each post (or auto-posts)
10. Posting → Instagram Graph API
```

## Key Routes

### Pages
- `/` — Landing page (hero, features, pricing, CTA)
- `/auth/signin`, `/auth/signup` — Authentication (has client-side validation)
- `/onboarding` — 4-step brand setup (own layout, no sidebar)
- `/dashboard` — Home dashboard with getting started checklist
- `/strategy` — Strategy hub
- `/strategy/discovery` — 9-step discovery wizard (clickable step dots for back-navigation)
- `/strategy/research` — Research simulation + strategy generation
- `/strategy/review` — Section-by-section approval
- `/strategy/calendar` — Monthly calendar view (redirects to /strategy if no strategy)
- `/studio` — Content Studio (single post generation)
- `/queue` — Content queue (batch approval/posting)
- `/queue/preview` — Design preview (redirects if no strategy)
- `/settings` — Account, brand, automation level, security
- `/settings/billing` — Plan info, usage, upgrade

### API Routes
- `GET /api/studio/drafts` — Returns saved drafts (stub: returns `[]`)
- `POST /api/studio/generate` — Single content generation (validates topic required, sanitizes HTML)
- `POST /api/studio/batch-generate` — Batch generation (NDJSON stream, validates slots)
- `POST /api/studio/save` — Save draft (stub)
- `POST /api/strategy/generate` — Strategy generation (validates discovery data required)
- `POST /api/strategy/calendar` — Calendar generation (validates strategy data required)
- `POST /api/strategy/scrape-website` — Website scraper for business info extraction
- `POST /api/posts/publish` — Instagram posting
- `GET /api/auth/session` — Auth session

## Stores (Zustand + sessionStorage)

- `onboarding-store.ts` — Brand config (niche, colors, fonts, voice, pillars) + automation level + step counter
- `strategy-store.ts` — Discovery profile (9 steps) + research status/results + strategy + calendar + step counter
- `queue-store.ts` — Content queue items + batch progress

## Key Patterns & Gotchas

### React 19 + Next.js 16
- **Framer Motion `AnimatePresence mode="wait"` is BROKEN with React 19** — exit animations never complete, blocking new component mounts. Removed from discovery and onboarding pages. Use plain `<CurrentStep key={step} />` instead.
- **`useSearchParams()` requires `<Suspense fallback={null}>`** — without the fallback, causes infinite RSC polling (80+ requests). Both studio and settings pages use this pattern.
- **All hooks before early returns** — useState/useMemo/useCallback must be before any conditional `return` to avoid React hooks order violations.

### API Route Validation Pattern
All POST routes should wrap `request.json()` in try/catch:
```typescript
let body: any;
try {
  body = await request.json();
} catch {
  return NextResponse.json({ error: "Request body is required." }, { status: 400 });
}
```
This is implemented on: strategy/generate, studio/generate, scrape-website, calendar, publish, batch-generate.

### Content Generation
- Studio generate sanitizes topic: strips `<tags>`, truncates to 500 chars
- Generate button requires non-empty prompt (`disabled={generating || !prompt.trim()}`)
- Strategy generate shows error message on failure instead of mock data fallback
- Research page uses ref-based interval tracking to avoid setState-during-render

### Deployment (Vercel)
- `package.json` has `"build": "prisma generate && next build"` and `"postinstall": "prisma generate"`
- Requires env vars: `AUTH_SECRET`, `NEXTAUTH_SECRET`, `ANTHROPIC_API_KEY` (optional if Claude CLI available)
- GitHub repo: `shantanu2311/instagram-saas`, branch: `master`
- Auto-deploys on push to master

## Known Issues — Must Fix Before Production

| Priority | Issue | Location |
|----------|-------|----------|
| Critical | No auth middleware — all API routes accessible without login | Need `middleware.ts` |
| Critical | Auth accepts any credentials (stub) | `src/lib/auth.ts` |
| High | SSRF in scrape-website — can fetch internal URLs | `src/app/api/strategy/scrape-website/route.ts` |
| High | No security headers (X-Frame-Options, CSP, HSTS) | `next.config.ts` |
| High | No rate limiting on API routes | Need middleware or Vercel edge config |
| Medium | Null bytes in topic crash generation + leak system prompt | `src/app/api/studio/generate/route.ts` |
| Medium | Register API echoes unsanitized input | `src/app/api/auth/register/route.ts` |
| Medium | Error message leakage in discovery route | `src/app/api/strategy/discovery/route.ts` |
| Low | `/api/studio/save` accepts empty body | Stub route |
| Low | NextAuth ClientFetchError on all pages (no DB) | Expected in dev |
| Low | Script tag warnings from framework | Next.js internals |

## Environment Variables (frontend/.env)

```
DATABASE_URL=postgresql://...
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=...
AUTH_SECRET=...
ANTHROPIC_API_KEY=...  # Optional if Claude CLI is available
```
