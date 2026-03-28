# CLAUDE.md

## Project: Instagram Creator SaaS

Multi-user SaaS platform for automated Instagram content creation and posting. Generates captions, strategies, calendars, and content queues powered by OpenAI (gpt-4o-mini). The creator configures their brand, approves strategy, then the system generates and posts everything.

## Architecture

- **Frontend**: Next.js 16 (App Router) + React 19 + TypeScript + Tailwind v4 + shadcn/ui
- **Content Engine**: `src/lib/content-engine/` — OpenAI SDK (gpt-4o-mini)
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

## Content Engine — OpenAI

All AI generation lives in `frontend/src/lib/content-engine/`:
- `index.ts` — `callClaude()` (name kept for backward compat) uses OpenAI SDK
- `caption-generator.ts` — Captions, headlines, hashtags, quality scores (uses few-shot voice examples)
- `strategy-generator.ts` — 7-section strategy + hook formula bank + reel structures
- `calendar-generator.ts` — Monthly content calendar from strategy
- `repurpose-generator.ts` — Long-form → 4 IG formats (reel script, carousel, caption, stories)
- `reel-script-generator.ts` — Timed scene breakdown (15/30/60/90s), faceless mode, visual directions
- `hashtag-generator.ts` — 4-category hashtag research (branded, niche, reach, trending)
- `research-generator.ts` — Competitor research (Graph API + AI analysis)
- `instagram-graph-api.ts` — Instagram Business Discovery API client

**Models:**
- `gpt-4o-mini` (FAST_MODEL + DEEP_MODEL) — all generation tasks

**Instagram Graph API Integration:**
- Token from Meta developer dashboard stored in env vars (dev mode)
- Instagram Login OAuth flow ready (needs HTTPS for production)
- `instagram-token.ts` — resolves credentials from cookie (OAuth) or env vars

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
- `/studio` — Content Studio (Create mode + Repurpose mode + Reel Script Editor)
- `/studio/hashtags` — Hashtag Explorer (AI-powered research across 4 categories)
- `/queue` — Content queue (batch approval/posting)
- `/queue/preview` — Design preview (redirects if no strategy)
- `/settings` — Account, brand, automation level, security
- `/settings/billing` — Plan info, usage, upgrade

### API Routes
- `GET /api/studio/drafts` — Returns saved drafts (stub: returns `[]`)
- `POST /api/studio/generate` — Single content generation (validates topic required, sanitizes HTML)
- `POST /api/studio/batch-generate` — Batch generation (NDJSON stream, validates slots)
- `POST /api/studio/repurpose` — Repurpose long-form content into 4 IG formats
- `POST /api/studio/generate-reel` — Reel script generation (timed scenes, faceless mode)
- `POST /api/studio/hashtags` — Hashtag research (branded/niche/reach/trending sets)
- `POST /api/studio/save` — Save draft (stub)
- `POST /api/strategy/research` — AI-powered niche research (Graph API + Claude web search)
- `POST /api/strategy/generate` — Strategy generation (validates discovery data required, uses research results)
- `POST /api/strategy/deep-dive` — Deep-dive follow-up questions before strategy gen
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
- Requires env vars: `AUTH_SECRET`, `NEXTAUTH_SECRET`, `OPENAI_API_KEY`, `INSTAGRAM_ACCESS_TOKEN` + `INSTAGRAM_BUSINESS_ACCOUNT_ID` (optional, for Graph API competitor analysis)
- GitHub repo: `shantanu2311/instagram-saas`, branch: `master`
- Auto-deploys on push to master

## Competitor Research Architecture

Two-tier data source for competitor analysis:

1. **Instagram Graph API (primary, for production)**
   - Uses the Business Discovery endpoint: `GET /{user-id}?fields=business_discovery.username(handle){...}`
   - Returns real data: follower count, media count, bio, recent posts with likes/comments
   - Only works for public **Business** and **Creator** accounts (not personal/private)
   - Requires: `INSTAGRAM_ACCESS_TOKEN` + `INSTAGRAM_BUSINESS_ACCOUNT_ID` in env
   - Computes: engagement rate, posting frequency, content mix from real post data
   - File: `src/lib/content-engine/instagram-graph-api.ts`

2. **Claude Web Search (fallback, current dev mode)**
   - When no Graph API credentials, Claude searches the web for competitor data
   - Uses Anthropic's `web_search_20250305` tool to find real follower counts, content patterns
   - Sources: SocialBlade, blog posts, news articles, social media reports
   - Less precise than Graph API but works without Instagram auth
   - File: `src/lib/content-engine/research-generator.ts`

**Flow:**
1. If `INSTAGRAM_ACCESS_TOKEN` is set → fetch real data via Graph API
2. For handles that fail (personal accounts, rate limits) → fall back to Claude web search
3. Claude adds strengths/weaknesses analysis, trending hashtags, and insights on top of real data

**What Graph API CAN get:** follower count, post count, bio, recent posts (likes, comments, caption, timestamp, media_type)
**What Graph API CANNOT get:** follower lists, Story metrics, Reel view counts, save/share counts, private account data

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

## Creator Techniques Integration (from claude-instagram-techniques.docx)

Features built from real creator workflows documented in the techniques report:

| Technique | Feature | Status |
|-----------|---------|--------|
| Few-Shot Voice Training | Onboarding Step 3: paste 3-10 sample captions, used as few-shot examples in all generators | Done |
| Content Repurposing | Studio Repurpose mode: paste blog/transcript/notes → 4 IG formats (reel, carousel, caption, stories) | Done |
| Interview Me First | Deep-dive chat before strategy gen: Claude asks follow-up questions, answers feed into strategy | Done |
| Hook Formula Bank | Strategy output includes 8-10 hook formulas (6 types) + reel structures with timed sections | Done |
| Reel Script Editor | Studio Reel mode: duration selector (15/30/60/90s), faceless toggle, timed scene breakdown with voiceover/on-screen text/visual direction | Done |
| Hashtag Research | Dedicated `/studio/hashtags` page: AI researches branded/niche/reach/trending tags with reach/competition estimates, copy-to-clipboard | Done |
| 6-Step Strategy Framework | Strategy Engine discovery → research → generation (existing) | Done |
| MCP Analytics | Backend analytics.py exists | Needs IG Graph API |
| Agentic Automation | Strategy → Calendar → Studio pipeline | Needs real posting |

### Key implementation patterns:
- **sampleCaptions**: Stored as `string[]` in onboarding store, passed to all generators via `BrandContext.sampleCaptions`
- **Reel script scenes**: Each scene has `{label, startSec, endSec, voiceover, onScreenText, visualDirection}`
- **Faceless mode**: Passed as boolean to reel generator, changes all visual directions to text-only/b-roll
- **Deep-dive chat**: `/api/strategy/deep-dive` returns 3-5 questions; answers are appended to strategy generation prompt
- **Hashtag sets**: 4 categories (Branded/Niche/Reach/Trending), each tag has reach + competition estimates

## Environment Variables (frontend/.env)

```
DATABASE_URL=postgresql://...
NEXTAUTH_URL=http://localhost:3002
NEXTAUTH_SECRET=...
AUTH_SECRET=...
OPENAI_API_KEY=...                      # Required — powers all AI generation (gpt-4o-mini)
ANTHROPIC_API_KEY=...                   # Optional — not currently used

# Facebook App (for OAuth flow — one app for all users)
FACEBOOK_APP_ID=...
FACEBOOK_APP_SECRET=...

# Instagram App (for Instagram Login OAuth — different IDs from Facebook)
INSTAGRAM_APP_ID=...
INSTAGRAM_APP_SECRET=...

# Instagram Graph API (dev/testing — token from Meta developer dashboard)
INSTAGRAM_ACCESS_TOKEN=...              # Generated from developers.facebook.com
INSTAGRAM_BUSINESS_ACCOUNT_ID=...       # IG Business Account ID (from dashboard)
```
