"""Strategy AI service — generates content strategies using OpenAI."""

import json
import logging

import httpx

from app.config import get_settings

logger = logging.getLogger(__name__)

OPENAI_URL = "https://api.openai.com/v1/chat/completions"
MODEL = "gpt-4o-mini"


async def _call_openai(system_prompt: str, user_prompt: str, temperature: float = 0.7) -> dict:
    """Call OpenAI chat completions and parse JSON response."""
    settings = get_settings()

    if not settings.openai_api_key:
        logger.warning("No OpenAI API key configured — returning mock data")
        return {}

    async with httpx.AsyncClient(timeout=120.0) as client:
        try:
            resp = await client.post(
                OPENAI_URL,
                headers={
                    "Authorization": f"Bearer {settings.openai_api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": MODEL,
                    "temperature": temperature,
                    "response_format": {"type": "json_object"},
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt},
                    ],
                },
            )
            resp.raise_for_status()
            data = resp.json()
            content = data["choices"][0]["message"]["content"]
            return json.loads(content)
        except httpx.HTTPStatusError as e:
            logger.error("OpenAI API error: %s — %s", e.response.status_code, e.response.text)
            return {}
        except (json.JSONDecodeError, KeyError, IndexError) as e:
            logger.error("Failed to parse OpenAI response: %s", e)
            return {}
        except httpx.RequestError as e:
            logger.error("OpenAI request failed: %s", e)
            return {}


async def analyze_business_profile(profile: dict) -> dict:
    """Summarize business, identify key themes, suggest initial direction."""
    system_prompt = (
        "You are an expert Instagram growth strategist. Analyze the business profile and return JSON with: "
        "summary (string), key_themes (list of strings), initial_direction (string), "
        "suggested_pillars (list of {name, description, rationale})."
    )
    user_prompt = f"Business profile data:\n{json.dumps(profile, indent=2)}"

    result = await _call_openai(system_prompt, user_prompt)
    if result:
        return result

    # Mock fallback
    return {
        "summary": f"A {profile.get('business_name', 'business')} looking to grow on Instagram.",
        "key_themes": ["brand awareness", "audience engagement", "content consistency"],
        "initial_direction": "Build authority through educational and behind-the-scenes content.",
        "suggested_pillars": [
            {"name": "Educational", "description": "Tips and how-tos", "rationale": "High save rates"},
            {"name": "Behind the Scenes", "description": "Process and authenticity", "rationale": "Builds trust"},
            {"name": "Community", "description": "Engagement-driven posts", "rationale": "Algorithm boost"},
        ],
    }


async def analyze_competitors(competitor_data: list[dict]) -> dict:
    """Analyze competitor patterns, strengths, weaknesses, content gaps."""
    system_prompt = (
        "You are an Instagram competitive analyst. Analyze these competitor profiles and return JSON with: "
        "patterns (list of strings), strengths_weaknesses (list of {account, strengths, weaknesses}), "
        "content_gaps (list of strings), opportunities (list of strings), best_practices (list of strings)."
    )
    user_prompt = f"Competitor data:\n{json.dumps(competitor_data, indent=2)}"

    result = await _call_openai(system_prompt, user_prompt)
    if result:
        return result

    return {
        "patterns": ["Most competitors post 4-6 times per week", "Reels dominate content mix"],
        "strengths_weaknesses": [
            {
                "account": c.get("ig_handle", "unknown"),
                "strengths": c.get("strengths", ["Consistent posting"]),
                "weaknesses": c.get("weaknesses", ["Low engagement on carousels"]),
            }
            for c in competitor_data
        ],
        "content_gaps": ["Educational carousels underserved", "No live content"],
        "opportunities": ["BTS content gets 3x saves", "Collab posts with micro-influencers"],
        "best_practices": ["Post at peak hours (7-9pm)", "Use 8-12 hashtags", "Hook in first 3 seconds of Reels"],
    }


async def analyze_existing_content(ig_posts: list[dict], benchmarks: dict) -> dict:
    """Analyze user's existing IG content."""
    if not ig_posts:
        return {
            "top_performing": [],
            "underperforming": [],
            "content_mix": {},
            "engagement_patterns": {},
            "recommendations": ["Start with a consistent posting schedule"],
            "status": "no_existing_content",
        }

    system_prompt = (
        "You are an Instagram content analyst. Analyze these posts against the benchmarks and return JSON with: "
        "top_performing (list of {url, why}), underperforming (list of {url, why}), "
        "content_mix (dict of type->percentage), engagement_patterns (dict), recommendations (list of strings)."
    )
    user_prompt = (
        f"Posts:\n{json.dumps(ig_posts[:30], indent=2)}\n\nBenchmarks:\n{json.dumps(benchmarks, indent=2)}"
    )

    result = await _call_openai(system_prompt, user_prompt)
    if result:
        return result

    return {
        "top_performing": [],
        "underperforming": [],
        "content_mix": {"reels": 40, "images": 40, "carousels": 20},
        "engagement_patterns": {"best_time": "evening", "best_day": "Wednesday"},
        "recommendations": ["Increase carousel content", "Add more hooks to Reels"],
    }


async def analyze_trends(trend_data: list[dict], niche: str) -> dict:
    """Extract actionable insights from trend data."""
    system_prompt = (
        "You are an Instagram trend analyst. Analyze the trend data for this niche and return JSON with: "
        "trending_topics (list of strings), emerging_formats (list of strings), "
        "optimal_hashtags (list of strings), content_opportunities (list of {topic, format, rationale, urgency})."
    )
    user_prompt = f"Niche: {niche}\n\nTrend data:\n{json.dumps(trend_data, indent=2)}"

    result = await _call_openai(system_prompt, user_prompt)
    if result:
        return result

    return {
        "trending_topics": ["AI tools", "productivity hacks", "minimalism"],
        "emerging_formats": ["Before/After reveals", "Day-in-the-life vlogs", "Quick tip carousels"],
        "optimal_hashtags": [f"#{niche}", "#contentcreator", "#growthhacks"],
        "content_opportunities": [
            {
                "topic": "Trending audio Reel",
                "format": "reel",
                "rationale": "Trending audio gets 2x distribution",
                "urgency": "high",
            }
        ],
    }


async def generate_audience_persona(profile: dict, competitor_analysis: dict) -> dict:
    """Create detailed target audience persona."""
    system_prompt = (
        "You are an audience research expert. Create a detailed target audience persona and return JSON with: "
        "name (string), age_range (string), occupation (string), interests (list), pain_points (list), "
        "content_preferences (list), platforms (list), buying_behavior (string)."
    )
    user_prompt = (
        f"Business profile:\n{json.dumps(profile, indent=2)}\n\n"
        f"Competitor analysis:\n{json.dumps(competitor_analysis, indent=2)}"
    )

    result = await _call_openai(system_prompt, user_prompt)
    if result:
        return result

    return {
        "name": "Alex",
        "age_range": f"{profile.get('target_age_min', 25)}-{profile.get('target_age_max', 35)}",
        "occupation": "Young professional",
        "interests": profile.get("target_demographics", ["technology", "self-improvement"]),
        "pain_points": profile.get("pain_points", ["information overload", "lack of time"]),
        "content_preferences": ["short-form video", "actionable tips", "relatable stories"],
        "platforms": ["Instagram", "TikTok", "YouTube"],
        "buying_behavior": "Research-driven, values authenticity and social proof",
    }


async def generate_content_strategy(
    profile: dict,
    competitor_analysis: dict,
    trend_analysis: dict,
    existing_content_analysis: dict | None = None,
) -> dict:
    """Generate full content strategy with milestones."""
    system_prompt = """You are an elite Instagram growth strategist. Generate a comprehensive content strategy.

Return JSON with these exact keys:
- brand_positioning: {summary, key_messages (list), approved: false}
- content_pillars: list of {name, description, rationale, percentage (int), examples (list), approved: false} — 4-6 pillars totaling 100%
- posting_cadence: {frequency (int, posts/week), best_times (list of {day, hour, rationale}), schedule_map (dict of day_number->pillar), approved: false}
- tone_voice: {formality (int 0-100), humor (int 0-100), style_notes, do_list (list), dont_list (list), sample_captions (list of 3), approved: false}
- hashtag_strategy: {branded (list), niche (list), trending (list), mix_ratio (string), approved: false}
- content_formats: {reels_pct (int), carousels_pct (int), images_pct (int), rationale, approved: false}
- growth_tactics: list of {tactic, description, expected_impact, approved: false}
- audience_persona: {name, age_range, interests, pain_points, content_preferences}
- milestones: list of {name, target_date (YYYY-MM-DD), kpis (dict), status: "pending"} for 30/60/90 days
- kpi_targets: {followers_30d (int), engagement_rate (float), reach_per_post (int), saves_per_post (int)}

Make the strategy specific to the business, data-driven, and actionable."""

    existing_str = ""
    if existing_content_analysis:
        existing_str = f"\n\nExisting content analysis:\n{json.dumps(existing_content_analysis, indent=2)}"

    user_prompt = (
        f"Business profile:\n{json.dumps(profile, indent=2)}\n\n"
        f"Competitor analysis:\n{json.dumps(competitor_analysis, indent=2)}\n\n"
        f"Trend analysis:\n{json.dumps(trend_analysis, indent=2)}"
        f"{existing_str}"
    )

    result = await _call_openai(system_prompt, user_prompt, temperature=0.8)
    if result:
        return result

    # Comprehensive mock fallback
    biz_name = profile.get("business_name", "Your Brand")
    return {
        "brand_positioning": {
            "summary": f"Position {biz_name} as the go-to expert for actionable, data-backed insights in your niche.",
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
                "rationale": "Builds comment velocity — key algorithm signal",
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
                "rationale": "Builds trust — converts followers to customers",
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
                "Save this for later \u2014 you'll thank me.\n\n5 [topic] mistakes I see every day:",
            ],
            "approved": False,
        },
        "hashtag_strategy": {
            "branded": [f"#{biz_name.lower().replace(' ', '')}"],
            "niche": ["#contentcreator", "#growthtips", "#socialmediamarketing"],
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
        "audience_persona": {
            "name": "Alex",
            "age_range": f"{profile.get('target_age_min', 25)}-{profile.get('target_age_max', 35)}",
            "interests": profile.get("target_demographics", ["technology", "self-improvement"]),
            "pain_points": profile.get("pain_points", ["information overload"]),
            "content_preferences": ["short-form video", "actionable tips"],
        },
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


async def generate_content_calendar(
    strategy: dict,
    month: int,
    year: int,
    posts_per_week: int = 5,
    trend_data: list[dict] | None = None,
) -> list[dict]:
    """Generate a month's content calendar from approved strategy."""
    trend_str = ""
    if trend_data:
        trend_str = f"\n\nCurrent trends to weave in:\n{json.dumps(trend_data[:10], indent=2)}"

    system_prompt = f"""You are an Instagram content calendar expert. Generate a month's content calendar.

Return JSON with key "slots" containing a list of objects, each with:
- date (YYYY-MM-DD)
- day_of_week (string)
- time (HH:MM)
- content_type (reel/carousel/image)
- pillar (matches strategy pillars)
- topic (specific, actionable topic)
- headline_draft (attention-grabbing headline)
- body_draft (2-3 sentence body/caption direction)
- hashtag_set (list of 8-12 hashtags)
- caption_notes (brief notes for the caption writer)
- is_trend_based (boolean)

Generate approximately {posts_per_week} posts per week for {month}/{year}.
Vary content types according to the strategy's format percentages.
Distribute pillars according to their percentage weights."""

    user_prompt = f"Strategy:\n{json.dumps(strategy, indent=2)}{trend_str}"

    result = await _call_openai(system_prompt, user_prompt, temperature=0.9)
    if result and "slots" in result:
        return result["slots"]

    # Mock fallback — generate programmatic calendar
    import calendar as cal
    from datetime import date

    days_in_month = cal.monthrange(year, month)[1]
    pillars_cfg = strategy.get("content_pillars", [])
    pillar_names = [p["name"] for p in pillars_cfg] if pillars_cfg else [
        "Educational", "BTS", "Engagement", "Trend", "Social Proof"
    ]
    cadence = strategy.get("posting_cadence", {})
    best_times = cadence.get("best_times", [])

    slots: list[dict] = []
    slot_idx = 0
    for day in range(1, days_in_month + 1):
        d = date(year, month, day)
        dow = d.weekday()
        # Skip Sunday for <= 5 posts/week
        if posts_per_week <= 5 and dow == 6:
            continue
        # Skip Saturday too for <= 4 posts/week
        if posts_per_week <= 4 and dow == 5:
            continue

        pillar = pillar_names[slot_idx % len(pillar_names)]
        time_entry = best_times[slot_idx % len(best_times)] if best_times else {"hour": "19:30"}
        content_type = "reel" if "bts" in pillar.lower() or "trend" in pillar.lower() else (
            "carousel" if "educ" in pillar.lower() else "image"
        )

        slots.append({
            "date": d.isoformat(),
            "day_of_week": d.strftime("%A"),
            "time": time_entry.get("hour", "19:30"),
            "content_type": content_type,
            "pillar": pillar,
            "topic": f"Sample topic for {pillar} \u2014 Day {day}",
            "headline_draft": f"Draft headline for {pillar} content",
            "body_draft": "",
            "hashtag_set": ["#content", "#growth", "#instagram"],
            "caption_notes": "",
            "is_trend_based": "trend" in pillar.lower(),
        })
        slot_idx += 1

        if slot_idx >= int(posts_per_week * 4.3):
            break

    return slots


async def generate_content_inventory(strategy: dict, calendar_slots: list[dict]) -> list[dict]:
    """Generate template drafts for each calendar slot."""
    system_prompt = """You are an Instagram content creator. For each calendar slot, generate a content template.

Return JSON with key "templates" containing a list of objects, each with:
- slot_date (YYYY-MM-DD)
- template_type (the content_type from slot)
- headline (final headline text)
- body_text (full caption draft, 100-200 words)
- hashtags (list of 10 hashtags)
- call_to_action (string)
- visual_direction (brief description of what the visual should show)
- hook (the opening line/hook for Reels or first carousel slide)"""

    user_prompt = (
        f"Strategy:\n{json.dumps(strategy, indent=2)}\n\n"
        f"Calendar slots:\n{json.dumps(calendar_slots[:15], indent=2)}"
    )

    result = await _call_openai(system_prompt, user_prompt, temperature=0.9)
    if result and "templates" in result:
        return result["templates"]

    # Mock fallback
    return [
        {
            "slot_date": slot.get("date", ""),
            "template_type": slot.get("content_type", "image"),
            "headline": slot.get("headline_draft", "Headline"),
            "body_text": f"Draft caption for {slot.get('pillar', 'content')} post.",
            "hashtags": slot.get("hashtag_set", []),
            "call_to_action": "Save this for later!",
            "visual_direction": f"Visual showing {slot.get('topic', 'topic')}",
            "hook": "Here's what nobody tells you about...",
        }
        for slot in calendar_slots
    ]


async def suggest_trending_content(
    latest_trends: dict,
    existing_calendar: list[dict],
    strategy: dict,
) -> list[dict]:
    """Suggest trend-based content additions for the current week."""
    system_prompt = """You are an Instagram trend analyst. Suggest 2-4 trend-based content additions for this week.

Return JSON with key "suggestions" containing a list of objects, each with:
- topic (string)
- content_type (reel/carousel/image)
- pillar (matching strategy pillar)
- rationale (why this trend matters)
- trend_reference (what trend it's based on)
- urgency (high/medium/low — how time-sensitive the trend is)"""

    user_prompt = (
        f"Latest trends:\n{json.dumps(latest_trends, indent=2)}\n\n"
        f"Current calendar:\n{json.dumps(existing_calendar[:10], indent=2)}\n\n"
        f"Strategy pillars:\n{json.dumps(strategy.get('content_pillars', []), indent=2)}"
    )

    result = await _call_openai(system_prompt, user_prompt)
    if result and "suggestions" in result:
        return result["suggestions"]

    return [
        {
            "topic": "Trending audio Reel — remix for your niche",
            "content_type": "reel",
            "pillar": "Trend-Jacking",
            "rationale": "Audio trending with 50k+ uses this week",
            "trend_reference": "trending_audio_001",
            "urgency": "high",
        },
        {
            "topic": "Quick tip carousel on [emerging topic]",
            "content_type": "carousel",
            "pillar": "Educational Insights",
            "rationale": "Topic spiking in search volume",
            "trend_reference": "hashtag_trend_005",
            "urgency": "medium",
        },
    ]


async def assess_milestone_performance(
    strategy: dict,
    current_metrics: dict,
    milestone_index: int,
) -> dict:
    """Assess performance against a milestone, suggest strategy adjustments."""
    milestones = strategy.get("milestones", [])
    if milestone_index >= len(milestones):
        return {"error": "Milestone index out of range"}

    milestone = milestones[milestone_index]

    system_prompt = """You are an Instagram growth coach. Assess performance against the milestone target.

Return JSON with:
- milestone (dict — the milestone being assessed)
- metrics_vs_target (dict mapping each KPI to {target, actual, on_track: bool})
- assessment (string — overall narrative assessment)
- on_track (bool — overall on-track status)
- suggested_adjustments (list of {area, current_approach, suggested_change, expected_impact})"""

    user_prompt = (
        f"Milestone:\n{json.dumps(milestone, indent=2)}\n\n"
        f"Current metrics:\n{json.dumps(current_metrics, indent=2)}\n\n"
        f"Full strategy context:\n{json.dumps(strategy, indent=2)}"
    )

    result = await _call_openai(system_prompt, user_prompt)
    if result:
        return result

    return {
        "milestone": milestone,
        "metrics_vs_target": {},
        "assessment": "Insufficient data to assess. Continue current strategy and revisit at milestone date.",
        "on_track": True,
        "suggested_adjustments": [],
    }
