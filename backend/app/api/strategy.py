"""Strategy Engine API endpoints."""

import calendar as cal
from datetime import date

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

router = APIRouter(prefix="/strategy", tags=["strategy"])


# ---------------------------------------------------------------------------
# Pydantic request/response models
# ---------------------------------------------------------------------------

class BusinessProfileCreate(BaseModel):
    user_id: str
    brand_id: str | None = None
    business_name: str
    business_description: str = ""
    product_service: str = ""
    website_url: str = ""
    target_age_min: int = 18
    target_age_max: int = 45
    target_demographics: list[str] = []
    target_location: str = ""
    target_gender: str = "all"
    competitors: list[str] = []
    goals: list[str] = []
    content_preferences: list[str] = []
    posting_history: str = "new"
    budget_tier: str = "free"
    usp: str = ""
    key_differentiators: list[str] = []
    pain_points: list[str] = []
    brand_personality: list[str] = []


class StrategyApproval(BaseModel):
    sections: dict[str, bool]  # section_name -> approved
    feedback: dict[str, str] = {}  # section_name -> feedback text


class CalendarGenerateRequest(BaseModel):
    month: int = Field(ge=1, le=12)
    year: int = Field(ge=2024, le=2030)
    posts_per_week: int = Field(default=5, ge=1, le=14)


# ---------------------------------------------------------------------------
# Discovery endpoints
# ---------------------------------------------------------------------------

@router.post("/discovery")
async def save_business_profile(profile: BusinessProfileCreate):
    """Save or update business discovery data."""
    return {"id": "mock-profile-id", "status": "saved", **profile.model_dump()}


@router.get("/discovery/{brand_id}")
async def get_business_profile(brand_id: str):
    """Get existing business profile for a brand."""
    return {"id": "mock-profile-id", "brand_id": brand_id, "business_name": "", "status": "not_found"}


@router.put("/discovery/{profile_id}")
async def update_business_profile(profile_id: str, updates: dict):
    """Update an existing business profile."""
    return {"id": profile_id, "status": "updated"}


# ---------------------------------------------------------------------------
# Research endpoints
# ---------------------------------------------------------------------------

@router.post("/research/{profile_id}")
async def start_research(profile_id: str):
    """Trigger async competitor + trend research."""
    return {"task_id": f"research-{profile_id}", "status": "started", "profile_id": profile_id}


@router.get("/research/{profile_id}/status")
async def get_research_status(profile_id: str):
    """Poll research progress."""
    return {
        "profile_id": profile_id,
        "status": "complete",
        "progress": 100,
        "steps": [
            {"name": "Analyzing business profile", "status": "complete"},
            {"name": "Scraping competitor accounts", "status": "complete"},
            {"name": "Finding viral content", "status": "complete"},
            {"name": "Analyzing existing content", "status": "complete"},
            {"name": "Identifying content gaps", "status": "complete"},
            {"name": "Generating insights", "status": "complete"},
        ],
    }


@router.get("/research/{profile_id}/results")
async def get_research_results(profile_id: str):
    """Get full research data."""
    return {
        "competitors": [
            {
                "ig_handle": "@competitor1",
                "followers_count": 125000,
                "avg_engagement_rate": 3.2,
                "posting_frequency_per_week": 5.5,
                "top_content_types": {"reels": 45, "carousels": 35, "images": 20},
                "strengths": ["Consistent posting schedule", "Strong visual branding", "Engaging captions"],
                "weaknesses": ["Low Reel quality", "No user-generated content", "Repetitive hashtags"],
            }
        ],
        "trends": [
            {
                "snapshot_type": "hashtag_trending",
                "trending_hashtags": ["#reelsofinstagram", "#contentcreator", "#socialmediatips"],
                "viral_posts": [
                    {
                        "url": "https://instagram.com/p/example",
                        "likes": 45000,
                        "content_type": "reel",
                        "why_viral": "Trending audio + relatable hook",
                    }
                ],
                "trending_formats": ["Before/After reveals", "Day-in-the-life vlogs", "Quick tip carousels"],
            }
        ],
        "existing_content_analysis": {
            "total_posts": 0,
            "status": "no_existing_content",
            "recommendation": "Fresh start \u2014 strategy will focus on establishing presence",
        },
        "insights": [
            {
                "insight_type": "content_gap",
                "title": "Competitors underserve educational carousels",
                "description": "Only 1 of 3 competitors regularly posts educational carousels. This is a high-save format in your niche.",
                "confidence_score": 0.85,
                "actionable": True,
                "action_suggestion": "Make educational carousels 30% of your content mix",
            },
            {
                "insight_type": "trending_format",
                "title": "Behind-the-scenes Reels performing 3x above average",
                "description": "BTS content in your niche gets 3.2x more saves than average posts.",
                "confidence_score": 0.9,
                "actionable": True,
                "action_suggestion": "Include 2 BTS Reels per week",
            },
            {
                "insight_type": "growth_opportunity",
                "title": "Optimal posting time: 7-9pm local",
                "description": "Competitor data shows 7-9pm posts get 40% more engagement than morning posts.",
                "confidence_score": 0.75,
                "actionable": True,
                "action_suggestion": "Schedule primary posts for 7:30pm",
            },
        ],
    }


# ---------------------------------------------------------------------------
# Strategy generation & management
# ---------------------------------------------------------------------------

@router.post("/generate/{profile_id}")
async def generate_strategy(profile_id: str):
    """Generate content strategy from research."""
    return {
        "id": f"strategy-{profile_id}",
        "status": "pending_review",
        "brand_positioning": {
            "summary": "Position as the go-to expert for actionable, data-backed insights in your niche.",
            "key_messages": ["Expert-led content", "Data-driven insights", "Community first"],
            "approved": False,
        },
        "content_pillars": [
            {
                "name": "Educational Insights",
                "description": "Data-backed tips and how-tos",
                "rationale": "Highest save rate in your niche (4.2%)",
                "percentage": 30,
                "examples": ["Quick tip carousels", "Myth-busting posts"],
                "approved": False,
            },
            {
                "name": "Behind the Scenes",
                "description": "Process, journey, authenticity",
                "rationale": "BTS Reels get 3.2x more saves than average",
                "percentage": 25,
                "examples": ["Day-in-the-life", "Work process reveals"],
                "approved": False,
            },
            {
                "name": "Engagement & Community",
                "description": "Questions, polls, discussions",
                "rationale": "Builds comment velocity \u2014 key algorithm signal",
                "percentage": 20,
                "examples": ["This or That", "Hot takes", "Polls"],
                "approved": False,
            },
            {
                "name": "Trend-Jacking",
                "description": "Trending audio, formats, and topics",
                "rationale": "Reels with trending audio get 2x distribution",
                "percentage": 15,
                "examples": ["Trending audio Reels", "Format remixes"],
                "approved": False,
            },
            {
                "name": "Social Proof & Results",
                "description": "Testimonials, case studies, wins",
                "rationale": "Builds trust \u2014 converts followers to customers",
                "percentage": 10,
                "examples": ["Customer stories", "Before/After", "Milestone celebrations"],
                "approved": False,
            },
        ],
        "posting_cadence": {
            "frequency": 5,
            "best_times": [
                {"day": "Monday", "hour": "19:30", "rationale": "Peak engagement start of week"},
                {"day": "Tuesday", "hour": "12:00", "rationale": "Lunch break scroll"},
                {"day": "Wednesday", "hour": "19:30", "rationale": "Mid-week peak"},
                {"day": "Thursday", "hour": "19:00", "rationale": "Pre-weekend engagement"},
                {"day": "Saturday", "hour": "10:00", "rationale": "Weekend morning discovery"},
            ],
            "schedule_map": {
                "0": "rest",
                "1": "educational",
                "2": "bts",
                "3": "engagement",
                "4": "trend",
                "5": "rest",
                "6": "social_proof",
            },
            "approved": False,
        },
        "tone_voice": {
            "formality": 40,
            "humor": 55,
            "style_notes": "Friendly expert. Like a knowledgeable friend sharing insights over coffee.",
            "do_list": ["Use first person", "Share personal stories", "Include data/stats", "Ask questions"],
            "dont_list": ["Don't be preachy", "Avoid jargon", "Never use clickbait without substance"],
            "sample_captions": [
                "I tracked my [metric] for 30 days and here's what happened...\n\n(It wasn't what I expected)",
                "Hot take: Most [niche] advice is outdated.\n\nHere's what actually works in 2026 \ud83d\udc47",
            ],
            "approved": False,
        },
        "hashtag_strategy": {
            "branded": ["#yourbrand"],
            "niche": ["#yourtopic", "#nichekeyword", "#industrytips"],
            "trending": ["#reels", "#trending", "#viral"],
            "mix_ratio": "3 branded + 5 niche + 2 trending per post",
            "approved": False,
        },
        "content_formats": {
            "reels_pct": 45,
            "carousels_pct": 35,
            "images_pct": 20,
            "rationale": "Reels get 2x organic reach. Carousels get highest saves. Images for quick engagement.",
            "approved": False,
        },
        "growth_tactics": [
            {
                "tactic": "Collaborate with micro-influencers",
                "description": "Partner with 3-5 accounts in your niche for cross-promotion",
                "expected_impact": "500-1000 new followers/month",
                "approved": False,
            },
            {
                "tactic": "Engage-before-you-post strategy",
                "description": "Spend 15 min engaging with target audience before each post",
                "expected_impact": "30% more engagement on posts",
                "approved": False,
            },
            {
                "tactic": "Story series on Mondays",
                "description": "Weekly behind-the-scenes story series to build daily habit",
                "expected_impact": "2x story views within 30 days",
                "approved": False,
            },
        ],
        "milestones": [
            {
                "name": "30-Day Foundation",
                "target_date": "2026-04-27",
                "kpis": {"followers": "+200", "engagement_rate": "3%", "posts_published": 20},
                "status": "pending",
            },
            {
                "name": "60-Day Growth",
                "target_date": "2026-05-27",
                "kpis": {"followers": "+600", "engagement_rate": "4%", "avg_reach": 1500},
                "status": "pending",
            },
            {
                "name": "90-Day Authority",
                "target_date": "2026-06-27",
                "kpis": {"followers": "+1500", "engagement_rate": "5%", "saves_per_post": 50},
                "status": "pending",
            },
        ],
        "kpi_targets": {
            "followers_30d": 200,
            "engagement_rate": 4.0,
            "reach_per_post": 1000,
            "saves_per_post": 25,
        },
    }


@router.get("/{strategy_id}")
async def get_strategy(strategy_id: str):
    """Get a strategy by ID."""
    return {"id": strategy_id, "status": "not_found"}


@router.put("/{strategy_id}/approve")
async def approve_strategy(strategy_id: str, approval: StrategyApproval):
    """Approve or reject individual strategy sections."""
    approved_count = sum(1 for v in approval.sections.values() if v)
    total = len(approval.sections)
    if total == 0:
        raise HTTPException(status_code=400, detail="No sections provided")

    status = (
        "approved" if approved_count == total
        else "partially_approved" if approved_count > 0
        else "pending_review"
    )
    return {"id": strategy_id, "status": status, "approved_count": approved_count, "total": total}


@router.put("/{strategy_id}/edit")
async def edit_strategy_section(strategy_id: str, updates: dict):
    """Edit specific strategy sections."""
    return {"id": strategy_id, "status": "updated"}


# ---------------------------------------------------------------------------
# Calendar endpoints
# ---------------------------------------------------------------------------

@router.post("/{strategy_id}/calendar/generate")
async def generate_calendar(strategy_id: str, req: CalendarGenerateRequest):
    """Generate content calendar from approved strategy."""
    days_in_month = cal.monthrange(req.year, req.month)[1]
    slots: list[dict] = []
    pillar_cycle = ["educational", "bts", "engagement", "trend", "social_proof"]

    slot_count = 0
    for day in range(1, days_in_month + 1):
        d = date(req.year, req.month, day)
        dow = d.weekday()  # 0=Monday

        # Skip weekends for <= 5 posts/week
        if req.posts_per_week <= 5 and dow == 6:
            continue
        if req.posts_per_week <= 4 and dow == 5:
            continue

        pillar = pillar_cycle[slot_count % len(pillar_cycle)]
        content_type = (
            "reel" if pillar in ["bts", "trend"]
            else "carousel" if pillar == "educational"
            else "image"
        )

        slots.append({
            "date": d.isoformat(),
            "day_of_week": d.strftime("%A"),
            "time": "19:30",
            "content_type": content_type,
            "pillar": pillar,
            "topic": f"Sample topic for {pillar} \u2014 Day {day}",
            "headline_draft": f"Draft headline for {pillar} content",
            "body_draft": "",
            "hashtag_set": ["#content", "#growth", "#instagram"],
            "caption_notes": "",
            "status": "planned",
            "generated_content_id": None,
            "is_trend_based": pillar == "trend",
            "trend_reference": None,
        })
        slot_count += 1

        if slot_count >= int(req.posts_per_week * 4.3):
            break

    return {
        "id": f"calendar-{strategy_id}-{req.month}-{req.year}",
        "strategy_id": strategy_id,
        "month": req.month,
        "year": req.year,
        "total_slots": len(slots),
        "slots": slots,
    }


@router.get("/{strategy_id}/calendar/{month}/{year}")
async def get_calendar(strategy_id: str, month: int, year: int):
    """Get existing calendar for a strategy/month/year."""
    return {"strategy_id": strategy_id, "month": month, "year": year, "slots": []}


@router.put("/{strategy_id}/calendar/slot/{index}")
async def update_calendar_slot(strategy_id: str, index: int, updates: dict):
    """Update a single calendar slot."""
    return {"strategy_id": strategy_id, "slot_index": index, "status": "updated"}


# ---------------------------------------------------------------------------
# Trends endpoints
# ---------------------------------------------------------------------------

@router.post("/trends/refresh/{profile_id}")
async def refresh_trends(profile_id: str):
    """Trigger a trend data refresh."""
    return {"profile_id": profile_id, "status": "refresh_started"}


@router.get("/trends/latest/{profile_id}")
async def get_latest_trends(profile_id: str):
    """Get latest trend data for a profile."""
    return {"profile_id": profile_id, "trends": [], "last_refreshed": None}


# ---------------------------------------------------------------------------
# Insights endpoints
# ---------------------------------------------------------------------------

@router.get("/insights/{profile_id}")
async def get_insights(profile_id: str):
    """Get strategy insights for a profile."""
    return {"profile_id": profile_id, "insights": []}


# ---------------------------------------------------------------------------
# Milestone assessment
# ---------------------------------------------------------------------------

@router.post("/milestone/{strategy_id}/assess/{milestone_index}")
async def assess_milestone(strategy_id: str, milestone_index: int):
    """Assess performance against a milestone."""
    return {
        "strategy_id": strategy_id,
        "milestone_index": milestone_index,
        "assessment": "on_track",
        "metrics_vs_target": {},
        "suggested_adjustments": [],
    }
