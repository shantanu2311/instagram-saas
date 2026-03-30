# CLAUDE.md

## Project: Kuraite (formerly IGCreator)

Multi-user SaaS platform for automated Instagram content creation and posting. Generates captions, strategies, calendars, and content queues powered by OpenAI (gpt-4o-mini). The creator configures their brand, approves strategy, then the system generates and posts everything.

**Brand**: Kuraite — operated by Suprajanan (legal pages only). Domain: `kuraite.co.in`
**Operator**: Suprajanan (only mentioned in Privacy Policy §1 and Terms §11 — nowhere in UI/marketing)

## Architecture

- **Frontend**: Next.js 16 (App Router) + React 19 + TypeScript + Tailwind v4 + shadcn/ui
- **Content Engine**: `src/lib/content-engine/` — OpenAI SDK (gpt-4o-mini)
- **Backend**: Python FastAPI microservice (port 8000) — image gen, Instagram posting, analytics, hashtag web crawl
- **Database**: PostgreSQL 16 (shared, Next.js via Prisma v7 + `@prisma/adapter-pg`, FastAPI via SQLAlchemy)
- **Queue**: Celery + Redis 7 (scheduled posting, analytics collection)
- **Auth**: NextAuth v5 (credentials + Instagram OAuth) — Prisma + bcrypt, proxy.ts route protection
- **Deployment**: Vercel (manual `vercel --prod` deploys — GitHub auto-deploy may not trigger)
- **Domain**: `kuraite.co.in` (Vercel nameservers: ns1.vercel-dns.com, ns2.vercel-dns.com)

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
- `hashtag-generator.ts` — Hashtag discovery utility (web crawl + Graph API + AI), integrated into caption generation
- `research-generator.ts` — Competitor research (Graph API + AI analysis)
- `instagram-graph-api.ts` — Instagram Business Discovery API client

**Models:**
- `gpt-4o-mini` (FAST_MODEL + DEEP_MODEL) — all generation tasks

**Instagram Graph API Integration:**
- Uses **Facebook Login for Business** OAuth (not Instagram Login) — requires `config_id` parameter
- OAuth callback has fallback chain: `/me/accounts` → `/me?fields=accounts` → direct Page ID query → `/me?fields=instagram_business_account`
- Direct Page query by known Page ID (`980300588507807`) bypasses empty `/me/accounts` for Business Portfolio-managed Pages
- `instagram-token.ts` — resolves credentials from cookie (OAuth) or env vars
- **`business_discovery` requires Advanced Access** for `instagram_basic` — needs Meta App Review

## Content Pipeline Flow

```
1. Onboarding → Brand setup (niche, colors, fonts, voice, pillars) — 4 steps
2. Strategy Discovery → 10-step wizard (type, business, audience, competitors, goals, content, experience, brand, materials, USP)
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
- `/` — Landing page (hero, features, pricing, CTA) — branded Kuraite with icon
- `/privacy` — Privacy policy (Meta App Review compliant, mentions Suprajanan)
- `/terms` — Terms of service (Meta App Review compliant)
- `/data-deletion` — Data deletion status page (for Meta compliance)
- `/auth/signin`, `/auth/signup` — Authentication (has client-side validation)
- `/onboarding` — 4-step brand setup (own layout, no sidebar)
- `/dashboard` — Home dashboard with getting started checklist + Instagram Sync (Import All)
- `/dashboard/analytics` — Analytics dashboard with Recharts charts, KPIs, AI insights
- `/dashboard/grid-preview` — Instagram grid preview (IPhoneMockup, 3x3 grid of published + upcoming posts)
- `/dashboard/inspiration` — Content idea inbox (CRUD, filter by status/pillar/type, "Use This" → studio)
- `/dashboard/strategy-insights` — AI strategy recommendations from performance data, "Apply" to Zustand store
- `/dashboard/media` — Media library (upload, AI-generated, synced)
- `/dashboard/products` — Product catalog for brand
- `/dashboard/moments` — Brand moments (launches, events, milestones)
- `/dashboard/calendar` — Calendar view
- `/strategy` — Strategy hub
- `/strategy/discovery` — 10-step discovery wizard (clickable step dots for back-navigation, includes materials upload)
- `/strategy/research` — Research simulation + strategy generation
- `/strategy/review` — Section-by-section approval
- `/strategy/calendar` — Monthly calendar view (redirects to /strategy if no strategy)
- `/studio` — Content Studio (Create mode + Repurpose mode + Reel Script Editor)
- ~~`/studio/hashtags`~~ — Removed; hashtags now generated inline during content creation
- `/queue` — Content queue (batch approval/posting)
- `/queue/preview` — Design preview (redirects if no strategy)
- `/settings` — Account, brand, automation level, security
- `/settings/billing` — Plan info, usage, upgrade

### API Routes
- `POST /api/auth/register` — User registration (bcrypt hash, validates email/name/password, sanitizes name)
- `GET /api/auth/session` — Auth session
- `GET /api/studio/drafts` — Returns user's drafts from DB (auth + rate limited)
- `POST /api/studio/generate` — Single content generation + Pillow image gen (auth + rate limited)
- `POST /api/studio/batch-generate` — Batch generation NDJSON stream + images (auth + rate limited)
- `POST /api/studio/repurpose` — Repurpose long-form content into 4 IG formats
- `POST /api/studio/generate-reel` — Reel script generation (timed scenes, faceless mode)
- ~~`POST /api/studio/hashtags`~~ — Removed; hashtag discovery is now internal to caption generation
- `POST /api/studio/save` — Save draft to DB with ownership check (auth required)
- `GET /api/brands` — Returns user's brands from DB (auth + rate limited)
- `POST /api/brands` — Create/update brand config from onboarding (auth + rate limited)
- `GET /api/dashboard/stats` — Real KPIs: content counts, recent items, isNewUser (auth + rate limited)
- `POST /api/queue/status` — Sync queue status changes to DB with ownership check (auth + rate limited)
- `GET /api/media/proxy?file=` — Proxies generated images from Python backend (auth + rate limited, path traversal protected)
- `POST /api/strategy/research` — AI-powered niche research (Graph API + Claude web search)
- `POST /api/strategy/generate` — Strategy generation (validates discovery data required, uses research results)
- `POST /api/strategy/deep-dive` — Deep-dive follow-up questions before strategy gen (auth + rate limited, generate tier)
- `POST /api/strategy/approve` — Strategy approval (auth + rate limited)
- `POST /api/strategy/discovery` — Discovery profile save (auth + rate limited)
- `POST /api/strategy/calendar` — Calendar generation (validates strategy data required)
- `POST /api/strategy/scrape-website` — Website scraper for business info extraction
- `POST /api/posts/publish` — Instagram posting (auth + rate limited, sanitized errors)
- `GET /api/instagram/status` — Instagram connection status + profile info (auth + rate limited)
- `POST /api/instagram/disconnect` — Disconnect Instagram account (auth required)
- `GET/POST /api/instagram/data-deletion` — Meta data deletion callback (PUBLIC, no auth — returns confirmation_code + status URL)
- `GET/POST /api/instagram/deauthorize` — Meta deauthorize callback (PUBLIC, no auth)
- `GET /api/instagram/connect` — OAuth initiation (PUBLIC, no auth — redirects to Facebook Login)
- `GET /api/instagram/callback` — OAuth callback (PUBLIC, no auth — exchanges code for tokens)
- `POST /api/billing/checkout` — Stripe checkout session (auth + rate limited)
- `GET /api/billing/subscription` — Subscription status (auth + rate limited, uses session userId)
- `POST /api/calendar/persist` — Bulk upsert calendar slots to DB (auth required, brand ownership check, rate limited)
- `GET /api/calendar/slots?from=&to=` — Query calendar slots by date range (auth required, rate limited, max 90-day range, requires at least one date bound)
- `GET /api/calendar/slots/[id]` — Get single slot with linked content (auth required, rate limited)
- `PATCH /api/calendar/slots/[id]` — Update slot status/contentId (auth required, ownership check, contentId ownership verification, rate limited)
- `GET /api/analytics?period=30` — Analytics KPIs, engagement over time, by content type, top posts (auth + rate limited)
- `POST /api/analytics/insights` — AI-powered analytics insights from performance data (auth + rate limited, generate tier)
- `GET /api/grid-preview` — Published + upcoming posts for Instagram grid preview (auth + rate limited)
- `GET /api/ideas` — List content ideas with ?status=&pillar=&contentType= filters (auth + rate limited)
- `POST /api/ideas` — Create content idea (auth + rate limited)
- `PATCH /api/ideas/[id]` — Update idea (auth + ownership check)
- `DELETE /api/ideas/[id]` — Delete idea (auth + ownership check)
- `POST /api/strategy/insights` — AI strategy recommendations from current strategy + performance data (auth + rate limited, generate tier)
- `POST /api/collaterals/upload` — Upload business material (FormData: file + brandId, max 10MB, auth + rate limited)
- `POST /api/collaterals/process` — AI analysis of uploaded collateral (extracts products, moments, ideas; auth + generate rate limit)
- `GET /api/collaterals` — List user's collaterals (auth + rate limited)
- `DELETE /api/collaterals/[id]` — Delete collateral (auth + ownership check)
- `GET /api/collaterals/context` — Aggregated context from all processed collaterals for strategy generation

## Data Persistence (Prisma → PostgreSQL)

All routes now use real Prisma queries instead of stubs:
- **Auth**: `POST /api/auth/register` creates user with bcrypt hash; login queries `User` table
- **Brands**: `POST /api/brands` upserts brand config from onboarding; `GET /api/brands` returns user's brands
- **Studio Save**: `POST /api/studio/save` creates/updates `GeneratedContent`; `GET /api/studio/drafts` returns drafts
- **Dashboard**: `GET /api/dashboard/stats` returns real KPIs (content counts, recent items)
- **Calendar**: `POST /api/calendar/persist` upserts slots (unique on brandId+date); `GET /api/calendar/slots` queries by date range (bounded, max 90 days); auto-persists on calendar generation if authenticated + brandId verified as owned
- **Strategy**: `POST /api/strategy/approve` upserts `Strategy` (one per brand, stores full strategy JSON); `POST /api/strategy/discovery` upserts `DiscoveryProfile` (stores discovery wizard data); `GET /api/strategy/discovery` fetches saved profile
- **Calendar persistence**: Review page now passes `brandId` to `/api/strategy/calendar`, enabling auto-persist to CalendarSlot table on generation
- **Queue Status**: `POST /api/queue/status` syncs approve/reject/publish status to DB
- **Image Gen**: `POST /api/studio/generate` calls backend Pillow generator, proxied via `/api/media/proxy`
- **Prisma v7**: Requires `@prisma/adapter-pg` with `pg.Pool` — see `src/lib/db.ts`

## Shared Constants (`src/lib/constants.ts`)

Shared type constants used across API routes and UI:
- `VALID_CONTENT_TYPES` — `["image", "carousel", "reel"]`
- `VALID_MOMENT_TYPES` — `["launch", "event", "milestone", "collaboration", "seasonal"]`
- `VALID_MEDIA_SOURCES` — `["upload", "ai-generated", "instagram-sync"]`
- `VALID_IDEA_STATUSES` — `["new", "used", "archived"]`
- `VALID_IDEA_SOURCE_TYPES` — `["article", "social", "competitor", "manual"]`
- `PERIOD_OPTIONS` — `[{value: 7, label: "7d"}, {value: 30, label: "30d"}, {value: 90, label: "90d"}]`

## Stores (Zustand + sessionStorage)

- `onboarding-store.ts` — Brand config (niche, colors, fonts, voice, pillars) + automation level + step counter
- `strategy-store.ts` — Discovery profile (9 steps) + research status/results + strategy + calendar + step counter
- `queue-store.ts` — Content queue items + batch progress

## Daily Creative Cockpit (Sprint 0-1)

Dashboard transforms from a one-time strategy tool into a daily habit-forming creative control room. Flow: CHECK → CREATE → APPROVE → LEARN.

**New Components** (`src/components/dashboard/`):
- `todays-content-card.tsx` — Hero card for today's calendar slot, CTAs to create or mark done
- `weekly-strip.tsx` — Mon-Sun strip with pillar dots, status icons, clickable to studio
- `yesterdays-performance.tsx` — Thumbnail + engagement metrics + trend indicator
- `quick-actions-bar.tsx` — Pill-style shortcuts to common actions

**Calendar Persistence** (CalendarSlot model):
- Unique on `[brandId, date]` — supports multiple brands per user
- Status lifecycle: `pending → created → uploaded → skipped/missed`
- Auto-persists when calendar is generated with verified brand ownership
- Calendar slots GET endpoint requires date bounds (max 90 days) to prevent unbounded queries
- Weekly strip uses `YYYY-MM-DD` format with UTC for server dates, local for client dates

**Dashboard Loading**:
- Shows animated skeleton while stats load to prevent flash from new-user → active-user state

## Creator Workflow Features (Sprint 2)

### Analytics Dashboard (`/dashboard/analytics`)
- Recharts `ComposedChart` (likes/comments lines) + `BarChart` (by content type)
- 4 KPI cards mapped from config array, period selector pills (7d/30d/90d)
- AI Insights panel: sends trimmed analytics payload (kpis + byContentType + top 3 posts) to OpenAI
- API: `GET /api/analytics` computes server-side from PostAnalytics + GeneratedContent

### Instagram Grid Preview (`/dashboard/grid-preview`)
- Uses `IPhoneMockup` component with mock profile header + 3x3 CSS grid
- Shows last 6 published + next 9 upcoming posts, `allPosts` memoized with `useMemo`
- GridCell component: real thumbnails for published, type-icon placeholders for upcoming with "Scheduled" overlay

### Content Inspiration Inbox (`/dashboard/inspiration`)
- Full CRUD: inline form (title, sourceUrl, contentType, pillar, notes), filter pills (All/New/Used/Archived)
- "Use This" links to `/studio?topic={title}`, archive/mark-used actions
- ContentIdea model: brandId, title, description, sourceUrl, sourceType, contentType, pillar, tags (Json), notes, status

### Strategy Evolution (`/dashboard/strategy-insights`)
- AI analyzes current strategy (from Zustand) + performance data (from DB) → recommendations
- "Apply" button updates Zustand strategy store client-side (no server-side strategy persistence)
- Performance summary (best/worst pillar and type), period review with trend indicator

### Instagram Sync Improvements
- Auto-match calendar slots: imported posts match slots ±1 day by date proximity
- Creates PostAnalytics record with likes/comments on import (enables analytics)
- "Import All" button uses `Promise.allSettled` for concurrent imports
- Shared `importPost()` helper eliminates duplicate fetch logic

## Key Patterns & Gotchas

### Next.js 16 Proxy (not Middleware)
- **Next.js 16 uses `src/proxy.ts` instead of `middleware.ts`** — having both causes build failure. Use `proxy()` export.
- Proxy checks `authjs.session-token` cookie for auth; returns 401 for API, redirects for pages.
- **Public API paths bypass auth**: `/api/instagram/data-deletion`, `/api/instagram/deauthorize`, `/api/instagram/callback`, `/api/instagram/connect`, `/api/auth` — these are Meta callbacks and OAuth flows that don't carry session cookies.

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

### callClaude() Signature
- `callClaude()` takes a single options object: `callClaude({ system, userMessage, model?, maxTokens?, webSearch? })`
- NOT two positional arguments — `callClaude(system, message)` will fail

### Prisma v7 Migrations
- Schema has NO `url` in datasource block (Prisma v7 moved this to `prisma/prisma.config.ts`)
- Must pass `--config prisma/prisma.config.ts` flag: `npx prisma migrate dev --config prisma/prisma.config.ts --name migration-name`
- `npx prisma generate` also needs `--config prisma/prisma.config.ts` (or it auto-detects)
- PostgreSQL must be running locally for migrations

### Content Generation
- Studio generate sanitizes topic: strips `<tags>`, truncates to 500 chars
- Generate button requires non-empty prompt (`disabled={generating || !prompt.trim()}`)
- Strategy generate shows error message on failure instead of mock data fallback
- Research page uses ref-based interval tracking to avoid setState-during-render

### Deployment (Vercel)
- `package.json` has `"build": "prisma generate && next build"` and `"postinstall": "prisma generate"`
- Requires env vars: `AUTH_SECRET`, `NEXTAUTH_SECRET`, `OPENAI_API_KEY`, `INSTAGRAM_ACCESS_TOKEN` + `INSTAGRAM_BUSINESS_ACCOUNT_ID` (optional, for Graph API competitor analysis)
- GitHub repo: `shantanu2311/instagram-saas`, branch: `master`
- **GitHub auto-deploy may not trigger** — use `npx vercel --prod` from `frontend/` directory for reliable deploys
- Production URL: `https://kuraite.co.in` (aliased from Vercel)
- `NEXTAUTH_URL` on Vercel is set to `https://kuraite.co.in`

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

| Priority | Issue | Location | Status |
|----------|-------|----------|--------|
| ~~Critical~~ | ~~No auth middleware~~ | `src/proxy.ts` | **FIXED** — proxy.ts protects pages + API routes |
| ~~Critical~~ | ~~Auth accepts any credentials (stub)~~ | `src/lib/auth.ts` | **FIXED** — Prisma + bcrypt real auth |
| ~~High~~ | ~~SSRF in scrape-website — can fetch internal URLs~~ | `src/app/api/strategy/scrape-website/route.ts` | **FIXED** — blocks private IPs, internal hostnames, non-HTTP schemes, credentials in URLs |
| ~~High~~ | ~~No security headers (X-Frame-Options, CSP, HSTS)~~ | `next.config.ts` | **FIXED** — CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy |
| ~~High~~ | ~~No rate limiting on API routes~~ | `src/lib/rate-limit.ts` | **FIXED** — sliding-window rate limiter on all AI generation (10/min), auth (5/min), and scrape routes |
| ~~Medium~~ | ~~Null bytes in topic crash generation + leak system prompt~~ | `src/app/api/studio/generate/route.ts` | **FIXED** — strips null bytes before sanitization |
| ~~Medium~~ | ~~Register API echoes unsanitized input~~ | `src/app/api/auth/register/route.ts` | **FIXED** — returns only `{ id, name, email }` |
| ~~Medium~~ | ~~Error message leakage in discovery route~~ | `src/app/api/strategy/discovery/route.ts` | **FIXED** — logs server-side, returns generic message to client |
| ~~Low~~ | ~~`/api/studio/save` accepts empty body~~ | `src/app/api/studio/save/route.ts` | **FIXED** — validates body, requires brand |
| ~~Critical~~ | ~~CalendarSlot unique on userId+date (blocks multi-brand)~~ | `prisma/schema.prisma` | **FIXED** — unique on `[brandId, date]` |
| ~~Critical~~ | ~~No contentId ownership check on PATCH slots~~ | `api/calendar/slots/[id]/route.ts` | **FIXED** — verifies content belongs to user before linking |
| ~~Critical~~ | ~~Brand ownership not verified in calendar auto-persist~~ | `api/strategy/calendar/route.ts` | **FIXED** — checks brand.userId before persisting |
| ~~Critical~~ | ~~Dashboard flashes new-user state while loading~~ | `dashboard/page.tsx` | **FIXED** — loading skeleton shown until stats arrive |
| ~~High~~ | ~~No rate limiting on calendar GET/PATCH endpoints~~ | `api/calendar/slots/` | **FIXED** — rate limited (default tier) |
| ~~High~~ | ~~Unbounded query on calendar slots GET~~ | `api/calendar/slots/route.ts` | **FIXED** — requires date bounds, max 90-day range, 500 row cap |
| ~~High~~ | ~~Weekly strip date key format mismatch~~ | `weekly-strip.tsx` | **FIXED** — consistent YYYY-MM-DD format, local timezone for both keys |
| ~~High~~ | ~~No auth on billing/checkout, billing/subscription~~ | `api/billing/` | **FIXED** — auth + rate limiting, subscription uses session userId |
| ~~High~~ | ~~No auth on strategy/approve, deep-dive, discovery~~ | `api/strategy/` | **FIXED** — auth + rate limiting on all three |
| ~~High~~ | ~~No auth on instagram/disconnect, instagram/status~~ | `api/instagram/` | **FIXED** — auth checks added |
| ~~High~~ | ~~No rate limiting on brands, drafts, queue/status, dashboard/stats~~ | multiple routes | **FIXED** — rate limited (default tier) |
| ~~High~~ | ~~Missing skipped/missed status handlers in TodaysContentCard~~ | `todays-content-card.tsx` | **FIXED** — added SkipForward + AlertCircle icons |
| ~~Medium~~ | ~~No error UI for calendar generation failure~~ | `strategy/review/page.tsx` | **FIXED** — error card + retry button |
| ~~Medium~~ | ~~Queue preview time parsing accepts invalid hours/minutes~~ | `queue/preview/page.tsx` | **FIXED** — validates hour 1-12, minutes 0-59 |
| ~~Critical~~ | ~~Calendar slots never persisted to DB (persistCalendar never called)~~ | `strategy/review/page.tsx` | **FIXED** — review page now passes brandId to calendar API, enabling auto-persist |
| ~~Critical~~ | ~~Strategy not persisted to DB (no Strategy model)~~ | `prisma/schema.prisma` | **FIXED** — added Strategy + DiscoveryProfile models; strategy saved on approval |
| ~~High~~ | ~~Discovery route proxies to Python backend~~ | `api/strategy/discovery/route.ts` | **FIXED** — saves to DiscoveryProfile table in PostgreSQL |
| ~~High~~ | ~~Approve route proxies to Python backend (dead code)~~ | `api/strategy/approve/route.ts` | **FIXED** — upserts Strategy to PostgreSQL |
| ~~Medium~~ | ~~JSON null body crashes calendar/persist, strategy/approve, strategy/discovery, ideas~~ | multiple POST routes | **FIXED** — null/type guard after `request.json()` parse |
| ~~Medium~~ | ~~Invalid dates in calendar/slots query cause Prisma error → 500~~ | `api/calendar/slots/route.ts` | **FIXED** — validates `new Date()` result with `isNaN()` before querying |
| ~~Medium~~ | ~~Null bytes in ideas title crash PostgreSQL insert~~ | `api/ideas/route.ts` | **FIXED** — strips `\0` from title and text fields before DB write |
| Low | Script tag warnings from framework | Next.js internals | Won't fix |

## Creator Techniques Integration (from claude-instagram-techniques.docx)

Features built from real creator workflows documented in the techniques report:

| Technique | Feature | Status |
|-----------|---------|--------|
| Few-Shot Voice Training | Onboarding Step 3: paste 3-10 sample captions, used as few-shot examples in all generators | Done |
| Content Repurposing | Studio Repurpose mode: paste blog/transcript/notes → 4 IG formats (reel, carousel, caption, stories) | Done |
| Interview Me First | Deep-dive chat before strategy gen: Claude asks follow-up questions, answers feed into strategy | Done |
| Hook Formula Bank | Strategy output includes 8-10 hook formulas (6 types) + reel structures with timed sections | Done |
| Reel Script Editor | Studio Reel mode: duration selector (15/30/60/90s), faceless toggle, timed scene breakdown with voiceover/on-screen text/visual direction | Done |
| Hashtag Research | Integrated into content generation: Python web crawl discovers top accounts → Graph API mines hashtags → AI selects best mix | Done |
| 6-Step Strategy Framework | Strategy Engine discovery → research → generation (existing) | Done |
| MCP Analytics | Backend analytics.py exists | Needs IG Graph API |
| Agentic Automation | Strategy → Calendar → Studio pipeline | Needs real posting |

### Key implementation patterns:
- **sampleCaptions**: Stored as `string[]` in onboarding store, passed to all generators via `BrandContext.sampleCaptions`
- **Reel script scenes**: Each scene has `{label, startSec, endSec, voiceover, onScreenText, visualDirection}`
- **Faceless mode**: Passed as boolean to reel generator, changes all visual directions to text-only/b-roll
- **Deep-dive chat**: `/api/strategy/deep-dive` returns 3-5 questions; answers are appended to strategy generation prompt
- **Hashtag sets**: 4 categories (Branded/Niche/Reach/Trending), each tag has reach + competition estimates

## Branding: Kuraite

- App name is **Kuraite** everywhere in UI (landing, sidebar, mobile nav, auth pages, metadata)
- Icon: `public/kuraite-icon.png` (purple/blue gradient K with constellation dots) + `src/app/icon.png` (favicon)
- **Suprajanan** only appears in Privacy Policy §1 and Terms §11 — never in UI, marketing, landing page, or footer
- Contact email in legal pages: `support@suprajanan.com`
- Zustand store keys NOT renamed (`igcreator-strategy`, `igcreator-queue`) — renaming would clear user localStorage data
- Footer links (About, Blog, Careers) point to `#` — need real pages or removal before Meta review

## Meta App Review & Facebook Login

### OAuth Flow (Facebook Login for Business)
- Uses `config_id` parameter (not `scope`) — configurations created in Meta dashboard
- Config ID stored in `FACEBOOK_LOGIN_CONFIG_ID` env var
- OAuth callback route: `/api/instagram/callback` — exchanges code for long-lived user token, then gets Page Token + IG Business Account ID
- Fallback chain for Page discovery: `/me/accounts` → direct Page ID query by known IDs → `/me?fields=instagram_business_account`
- Known Page ID: `980300588507807` (Decele.app Facebook Page)
- IG Business Account ID: `17841437050903090`

### Meta App Review Requirements (for Advanced Access to `instagram_basic`)
- ✅ Privacy Policy at `https://kuraite.co.in/privacy`
- ✅ Terms of Service at `https://kuraite.co.in/terms`
- ✅ Data Deletion callback at `https://kuraite.co.in/api/instagram/data-deletion`
- ✅ Deauthorize callback at `https://kuraite.co.in/api/instagram/deauthorize`
- ⬜ Business Verification (requires Meta Business Suite)
- ⬜ Screen recording of app using the permission
- ⬜ Permission justification text
- ⬜ Submit App Review

### Meta Dashboard URLs to Configure
- App Domains: `kuraite.co.in`
- Privacy Policy URL: `https://kuraite.co.in/privacy`
- Terms of Service URL: `https://kuraite.co.in/terms`
- Data Deletion URL: `https://kuraite.co.in/api/instagram/data-deletion`
- Deauthorize Callback: `https://kuraite.co.in/api/instagram/deauthorize`
- OAuth Redirect URI: `https://kuraite.co.in/api/instagram/callback`

### Known Meta Issues
- **`/me/accounts` returns empty** for Pages managed through Business Portfolio — use direct Page ID query fallback
- **"Feature Unavailable" error** appears after making multiple Meta app config changes — usually resolves in 24h
- **`business_discovery` error 10** ("Application does not have permission") — requires Advanced Access for `instagram_basic`, which needs full App Review
- **System User tokens** can't be generated until the app is "installed" on the system user AND assets (Page + IG account) are assigned

## Environment Variables (frontend/.env)

```
DATABASE_URL=postgresql://...
NEXTAUTH_URL=http://localhost:3002       # Production: https://kuraite.co.in
NEXTAUTH_SECRET=...
AUTH_SECRET=...
OPENAI_API_KEY=...                      # Required — powers all AI generation (gpt-4o-mini)
ANTHROPIC_API_KEY=...                   # Optional — not currently used

# Facebook App (for OAuth flow — one app for all users)
FACEBOOK_APP_ID=...
FACEBOOK_APP_SECRET=...                 # Also used to verify signed_request in data-deletion/deauthorize callbacks
FACEBOOK_LOGIN_CONFIG_ID=...            # Facebook Login for Business configuration ID

# Instagram App (for Instagram Login OAuth — different IDs from Facebook)
INSTAGRAM_APP_ID=...
INSTAGRAM_APP_SECRET=...

# Instagram Graph API (Page Token from Facebook Page linked to IG Business Account)
INSTAGRAM_ACCESS_TOKEN=...              # Page Token (not User Token) — enables business_discovery API
INSTAGRAM_BUSINESS_ACCOUNT_ID=...       # IG Business Account ID (17841437050903090)
```
