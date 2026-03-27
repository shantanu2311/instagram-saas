# CLAUDE.md

## Project: Instagram Creator SaaS

Multi-user SaaS platform for automated Instagram content creation and posting. Generates images, reels, captions, and audio with quality validation — the creator just approves.

## Architecture

- **Frontend**: Next.js 16 (App Router) + TypeScript + Tailwind v4 + shadcn/ui (port 3000)
- **Backend**: Python FastAPI microservice (port 8000)
- **Database**: PostgreSQL 16 (shared, Next.js via Prisma, FastAPI via SQLAlchemy)
- **Queue**: Celery + Redis 7 (scheduled posting, analytics collection)
- **Auth**: NextAuth v5 (credentials + Instagram OAuth)

## Build & Run

```bash
# Prerequisites: Docker, Node.js, Python 3.11+
export PATH="/c/Program Files/nodejs:$PATH"

# Start services
docker compose up -d

# Frontend
cd frontend && npm install && npm run dev

# Backend
cd backend && pip install -e ".[dev]" && uvicorn app.main:app --reload --port 8000

# Celery worker (for scheduled posting)
cd backend && celery -A app.tasks.celery_app worker --beat
```

## Content Generation: Two-Tier System

- **Standard**: Built-in Pillow (images) + MoviePy (reels) + procedural audio. Free/cheap.
- **AI-Enhanced**: Ideogram 3.0 / Flux Kontext (images) + Hailuo / Runway (video). Uses AI credits.

## Key Patterns

- Frontend proxies `/api/backend/*` to FastAPI at `localhost:8000`
- Brand config (colors, fonts, logo, voice) parameterizes all generators
- Quality gate: 10-criteria scoring, must score >= 80 to post
- Instagram posting via Meta Graph API with per-user OAuth tokens
- Celery beat handles scheduled posts and daily analytics collection
