# CLAUDE.md

## Project: Instagram Creator SaaS

Multi-user SaaS platform for automated Instagram content creation and posting. Generates captions, strategies, calendars, and content queues powered by Claude (Anthropic API). The creator configures their brand, approves strategy, then the system generates and posts everything.

## Architecture

- **Frontend**: Next.js 16 (App Router) + TypeScript + Tailwind v4 + shadcn/ui (port 3000)
- **Content Engine**: `src/lib/content-engine/` — Claude API (Anthropic SDK) for all AI generation
- **Backend**: Python FastAPI microservice (port 8000) — image gen, Instagram posting, analytics
- **Database**: PostgreSQL 16 (shared, Next.js via Prisma, FastAPI via SQLAlchemy)
- **Queue**: Celery + Redis 7 (scheduled posting, analytics collection)
- **Auth**: NextAuth v5 (credentials + Instagram OAuth)

## Build & Run

```bash
# Prerequisites: Docker, Node.js, Python 3.11+
export PATH="/c/Program Files/nodejs:$PATH"

# Start services
docker compose up -d

# Frontend (requires ANTHROPIC_API_KEY in frontend/.env)
cd frontend && npm install && npm run dev

# Backend (optional — content generation works without it)
cd backend && pip install -e ".[dev]" && uvicorn app.main:app --reload --port 8000
```

## Content Engine (Claude API)

All AI content generation lives in `frontend/src/lib/content-engine/`:
- `index.ts` — Anthropic client singleton, shared types, model config
- `caption-generator.ts` — Generates captions, headlines, hashtags, quality scores
- `strategy-generator.ts` — Generates 7-section content strategy from discovery data
- `calendar-generator.ts` — Generates monthly content calendar from strategy

**Models used:**
- `claude-sonnet-4-6` (FAST_MODEL) — captions, calendar generation
- `claude-opus-4-6` (DEEP_MODEL) — strategy generation

**Context injection:** Every generation receives full brand context (niche, colors, tone, voice, pillars, hashtags) + approved strategy context (positioning, do/don't lists, hashtag strategy).

## Content Pipeline Flow

```
1. Onboarding → Brand setup (niche, colors, fonts, voice, pillars)
2. Strategy Discovery → 8-step wizard (business, audience, competitors, goals...)
3. Strategy Generation → Claude generates 7-section strategy
4. Strategy Review → User approves each section
5. Calendar Generation → Claude generates monthly content slots
6. [Full Control only] Design Preview → 3 sample posts for approval
7. Batch Generation → Claude generates all calendar slots (NDJSON stream)
8. Content Queue → User reviews/approves each post (or auto-posts)
9. Posting → Instagram Graph API
```

## 3-Level Automation

Stored in `onboardingStore.brand.automationLevel`:
- **full-control**: Design preview → approve scripts → approve each post
- **approve-posts** (default): Auto-generate, review each post before posting
- **full-auto**: Generate and post everything automatically per schedule

## Key Routes

### Pages
- `/` — Landing page
- `/auth/signin`, `/auth/signup` — Authentication
- `/onboarding` — 4-step brand setup
- `/dashboard` — Home dashboard
- `/strategy` — Strategy hub
- `/strategy/discovery` — 8-step discovery wizard
- `/strategy/research` — Research progress + strategy generation
- `/strategy/review` — Section-by-section approval
- `/strategy/calendar` — Monthly calendar view
- `/studio` — Content Studio (single post generation)
- `/queue` — Content queue (batch approval/posting)
- `/queue/preview` — Design preview (full-control mode)
- `/settings` — Account, brand, automation level, security

### API Routes
- `POST /api/studio/generate` — Single content generation (Claude)
- `POST /api/studio/batch-generate` — Batch generation (NDJSON stream)
- `POST /api/strategy/generate` — Strategy generation (Claude)
- `POST /api/strategy/calendar` — Calendar generation (Claude)
- `POST /api/posts/publish` — Instagram posting

## Stores (Zustand + sessionStorage)

- `onboarding-store.ts` — Brand config + automation level
- `strategy-store.ts` — Discovery profile + strategy + calendar
- `queue-store.ts` — Content queue items + batch progress

## Key Patterns

- Brand config (colors, fonts, logo, voice) parameterizes all generators
- Quality gate: 5-criteria scoring (hook, caption, hashtags, CTA, brand alignment)
- Batch generation uses NDJSON streaming for progressive UI updates
- Queue items can be replaced via Studio (`?replaceId=` query param)
- Instagram posting via Meta Graph API with per-user OAuth tokens
- Protected routes: dashboard, studio, settings, onboarding, strategy, queue

## Environment Variables (frontend/.env)

```
DATABASE_URL=postgresql://...
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=...
AUTH_SECRET=...
ANTHROPIC_API_KEY=...  # Required for AI content generation
```
