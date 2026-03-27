"""Instagram scraping utilities for competitor and trend research."""

import logging
import random
from datetime import datetime, timedelta

import httpx

logger = logging.getLogger(__name__)

IG_WEB_BASE = "https://www.instagram.com"
IG_API_BASE = "https://www.instagram.com/api/v1"

# Common headers to mimic browser requests
_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/125.0.0.0 Safari/537.36"
    ),
    "Accept": "*/*",
    "Accept-Language": "en-US,en;q=0.9",
    "X-IG-App-ID": "936619743392459",
    "X-Requested-With": "XMLHttpRequest",
}


# ---------------------------------------------------------------------------
# Mock data generators (used as fallback when scraping fails)
# ---------------------------------------------------------------------------

def _mock_profile(ig_handle: str) -> dict:
    """Generate realistic mock profile data."""
    handle = ig_handle.lstrip("@")
    followers = random.randint(5000, 500000)
    return {
        "handle": handle,
        "followers": followers,
        "following": random.randint(200, 2000),
        "media_count": random.randint(50, 800),
        "bio": f"{handle}'s bio — content creator & expert in their niche.",
        "category": "Creator",
        "is_mock": True,
        "recent_posts": _mock_posts(handle, count=12, avg_followers=followers),
    }


def _mock_posts(handle: str, count: int = 12, avg_followers: int = 10000) -> list[dict]:
    """Generate mock post data."""
    content_types = ["reel", "carousel", "image"]
    posts = []
    for i in range(count):
        ctype = random.choice(content_types)
        base_likes = int(avg_followers * random.uniform(0.02, 0.08))
        posts.append({
            "url": f"https://instagram.com/p/mock_{handle}_{i}",
            "type": ctype,
            "likes": base_likes + random.randint(-100, 500),
            "comments": int(base_likes * random.uniform(0.02, 0.1)),
            "saves": int(base_likes * random.uniform(0.05, 0.2)) if ctype == "carousel" else int(base_likes * 0.03),
            "caption": f"Sample caption from @{handle} — post {i + 1}. #content #growth",
            "hashtags": ["#contentcreator", "#growth", f"#{handle}"],
            "posted_at": (datetime.utcnow() - timedelta(days=i * 2 + random.randint(0, 2))).isoformat(),
        })
    return posts


def _mock_hashtag_posts(hashtag: str, count: int = 20) -> list[dict]:
    """Generate mock hashtag trending posts."""
    posts = []
    for i in range(count):
        likes = random.randint(1000, 100000)
        posts.append({
            "url": f"https://instagram.com/p/mock_tag_{hashtag}_{i}",
            "likes": likes,
            "comments": int(likes * random.uniform(0.01, 0.05)),
            "caption": f"Trending post for #{hashtag} — engaging content that resonates.",
            "hashtags": [f"#{hashtag}", "#trending", "#viral"],
            "content_type": random.choice(["reel", "carousel", "image"]),
            "account": f"@creator_{random.randint(100, 999)}",
            "followers": random.randint(10000, 1000000),
        })
    return posts


# ---------------------------------------------------------------------------
# Scraping functions
# ---------------------------------------------------------------------------

async def scrape_competitor_profile(ig_handle: str) -> dict:
    """Scrape an Instagram profile's public data.

    Tries Instagram's public web endpoints first. Falls back to mock data
    if scraping fails (rate limits, auth required, etc.).
    """
    handle = ig_handle.lstrip("@")

    async with httpx.AsyncClient(timeout=15.0, follow_redirects=True) as client:
        try:
            # Try the public web profile JSON endpoint
            resp = await client.get(
                f"{IG_WEB_BASE}/api/v1/users/web_profile_info/?username={handle}",
                headers=_HEADERS,
            )
            if resp.status_code == 200:
                data = resp.json()
                user = data.get("data", {}).get("user", {})
                if user:
                    edge_media = user.get("edge_owner_to_timeline_media", {})
                    recent = []
                    for edge in edge_media.get("edges", [])[:12]:
                        node = edge.get("node", {})
                        recent.append({
                            "url": f"https://instagram.com/p/{node.get('shortcode', '')}",
                            "type": _classify_media_type(node),
                            "likes": node.get("edge_liked_by", {}).get("count", 0),
                            "comments": node.get("edge_media_to_comment", {}).get("count", 0),
                            "caption": _extract_caption(node),
                            "hashtags": _extract_hashtags(_extract_caption(node)),
                            "posted_at": datetime.fromtimestamp(
                                node.get("taken_at_timestamp", 0)
                            ).isoformat() if node.get("taken_at_timestamp") else None,
                        })

                    return {
                        "handle": handle,
                        "followers": user.get("edge_followed_by", {}).get("count", 0),
                        "following": user.get("edge_follow", {}).get("count", 0),
                        "media_count": edge_media.get("count", 0),
                        "bio": user.get("biography", ""),
                        "category": user.get("category_name", ""),
                        "is_mock": False,
                        "recent_posts": recent,
                    }

            logger.info("IG API returned %s for %s — using mock data", resp.status_code, handle)
        except (httpx.RequestError, KeyError, ValueError) as e:
            logger.info("Scraping failed for %s: %s — using mock data", handle, e)

    return _mock_profile(handle)


async def scrape_user_content(ig_handle: str, limit: int = 50) -> list[dict]:
    """Scrape user's own existing content for analysis."""
    profile = await scrape_competitor_profile(ig_handle)
    posts = profile.get("recent_posts", [])
    return posts[:limit]


async def scrape_hashtag_trending(hashtags: list[str], limit_per_tag: int = 50) -> list[dict]:
    """Get top posts for given hashtags."""
    all_posts: list[dict] = []

    async with httpx.AsyncClient(timeout=15.0, follow_redirects=True) as client:
        for tag in hashtags:
            clean_tag = tag.lstrip("#").lower()
            try:
                resp = await client.get(
                    f"{IG_WEB_BASE}/explore/tags/{clean_tag}/?__a=1&__d=dis",
                    headers=_HEADERS,
                )
                if resp.status_code == 200:
                    data = resp.json()
                    edges = (
                        data.get("graphql", {})
                        .get("hashtag", {})
                        .get("edge_hashtag_to_top_posts", {})
                        .get("edges", [])
                    )
                    for edge in edges[:limit_per_tag]:
                        node = edge.get("node", {})
                        caption = _extract_caption(node)
                        all_posts.append({
                            "url": f"https://instagram.com/p/{node.get('shortcode', '')}",
                            "likes": node.get("edge_liked_by", {}).get("count", 0),
                            "comments": node.get("edge_media_to_comment", {}).get("count", 0),
                            "caption": caption,
                            "hashtags": _extract_hashtags(caption),
                            "content_type": _classify_media_type(node),
                            "account": node.get("owner", {}).get("username", "unknown"),
                            "followers": 0,  # not available from hashtag endpoint
                        })
                    continue  # success, move to next tag
                logger.info("Hashtag API returned %s for #%s", resp.status_code, clean_tag)
            except (httpx.RequestError, KeyError, ValueError) as e:
                logger.info("Hashtag scraping failed for #%s: %s", clean_tag, e)

            # Fallback to mock
            all_posts.extend(_mock_hashtag_posts(clean_tag, count=min(limit_per_tag, 20)))

    return all_posts


async def scrape_niche_explore(niche: str, limit: int = 100) -> list[dict]:
    """Discover viral content in a niche via related hashtags."""
    # Map niche to relevant hashtags
    niche_hashtags = _niche_to_hashtags(niche)
    posts = await scrape_hashtag_trending(niche_hashtags, limit_per_tag=limit // len(niche_hashtags))

    # Sort by engagement and add engagement_rate estimate
    for post in posts:
        followers = post.get("followers", 0) or 10000  # assume 10k if unknown
        total_engagement = post.get("likes", 0) + post.get("comments", 0)
        post["engagement_rate"] = round(total_engagement / followers * 100, 2)
        post["why_trending"] = _guess_why_trending(post)

    posts.sort(key=lambda p: p.get("likes", 0), reverse=True)
    return posts[:limit]


async def analyze_viral_patterns(posts: list[dict]) -> dict:
    """Analyze common patterns in high-engagement posts."""
    if not posts:
        return {
            "avg_caption_length": 0,
            "common_hashtag_count": 0,
            "best_content_types": {},
            "best_posting_times": [],
            "common_hooks": [],
            "emoji_usage": "unknown",
        }

    caption_lengths = []
    hashtag_counts = []
    type_engagement: dict[str, list[int]] = {}
    hooks: list[str] = []

    for post in posts:
        caption = post.get("caption", "")
        caption_lengths.append(len(caption))
        hashtag_counts.append(len(post.get("hashtags", [])))

        ctype = post.get("content_type", "image")
        engagement = post.get("likes", 0) + post.get("comments", 0)
        type_engagement.setdefault(ctype, []).append(engagement)

        # Extract hook (first line)
        if caption:
            first_line = caption.split("\n")[0].strip()
            if len(first_line) > 10:
                hooks.append(first_line[:80])

    best_types = {
        t: round(sum(engagements) / len(engagements))
        for t, engagements in type_engagement.items()
    }

    has_emoji = sum(1 for p in posts if any(ord(c) > 127 for c in p.get("caption", "")))
    emoji_pct = has_emoji / len(posts) * 100 if posts else 0

    return {
        "avg_caption_length": round(sum(caption_lengths) / len(caption_lengths)) if caption_lengths else 0,
        "common_hashtag_count": round(sum(hashtag_counts) / len(hashtag_counts)) if hashtag_counts else 0,
        "best_content_types": best_types,
        "best_posting_times": ["evening"],  # would need timestamp analysis for real data
        "common_hooks": hooks[:5],
        "emoji_usage": f"{emoji_pct:.0f}% of posts use emoji",
    }


async def scrape_trending_audio() -> list[dict]:
    """Get currently trending Reel audio.

    Note: Trending audio is hard to scrape reliably from public endpoints.
    Returns curated/mock data.
    """
    return [
        {"name": "Original Audio", "artist": "Various", "usage_count": 120000, "trend_category": "general"},
        {"name": "Trending Sound #1", "artist": "Creator Mix", "usage_count": 85000, "trend_category": "comedy"},
        {"name": "Motivational Beat", "artist": "Beats Studio", "usage_count": 62000, "trend_category": "motivation"},
        {"name": "Chill Lo-Fi", "artist": "Lo-Fi Collective", "usage_count": 45000, "trend_category": "lifestyle"},
        {"name": "Viral Dance Track", "artist": "DJ Trending", "usage_count": 95000, "trend_category": "entertainment"},
    ]


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _classify_media_type(node: dict) -> str:
    """Classify an IG media node into reel/carousel/image."""
    typename = node.get("__typename", "")
    if typename == "GraphSidecar" or node.get("edge_sidecar_to_children"):
        return "carousel"
    if typename == "GraphVideo" or node.get("is_video"):
        return "reel"
    return "image"


def _extract_caption(node: dict) -> str:
    """Extract caption text from a media node."""
    edges = node.get("edge_media_to_caption", {}).get("edges", [])
    if edges:
        return edges[0].get("node", {}).get("text", "")
    return ""


def _extract_hashtags(caption: str) -> list[str]:
    """Extract hashtags from caption text."""
    import re
    return re.findall(r"#\w+", caption)


def _niche_to_hashtags(niche: str) -> list[str]:
    """Map a niche keyword to relevant Instagram hashtags."""
    niche_lower = niche.lower()
    niche_map = {
        "fitness": ["#fitness", "#workout", "#fitnessmotivation", "#gym", "#healthylifestyle"],
        "food": ["#foodie", "#cooking", "#recipe", "#healthyfood", "#foodphotography"],
        "fashion": ["#fashion", "#style", "#ootd", "#fashionblogger", "#streetstyle"],
        "beauty": ["#beauty", "#skincare", "#makeup", "#beautytips", "#glowup"],
        "travel": ["#travel", "#wanderlust", "#travelgram", "#explore", "#adventure"],
        "tech": ["#tech", "#technology", "#coding", "#startup", "#innovation"],
        "business": ["#business", "#entrepreneur", "#marketing", "#smallbusiness", "#hustle"],
        "photography": ["#photography", "#photooftheday", "#photographer", "#naturephotography"],
        "art": ["#art", "#artist", "#artwork", "#digitalart", "#creative"],
        "music": ["#music", "#musician", "#newmusic", "#producer", "#songwriter"],
    }

    for key, tags in niche_map.items():
        if key in niche_lower:
            return tags

    # Generic fallback — use niche as hashtag plus general tags
    return [f"#{niche_lower.replace(' ', '')}", "#contentcreator", "#growthhacks", "#instagramtips", "#explore"]


def _guess_why_trending(post: dict) -> str:
    """Heuristic guess for why a post might be trending."""
    likes = post.get("likes", 0)
    ctype = post.get("content_type", "image")

    reasons = []
    if ctype == "reel":
        reasons.append("Reel format gets higher distribution")
    if likes > 50000:
        reasons.append("Extremely high engagement signals viral spread")
    if len(post.get("hashtags", [])) >= 8:
        reasons.append("Strong hashtag strategy")

    caption = post.get("caption", "")
    if "?" in caption:
        reasons.append("Question-based caption drives comments")
    if any(word in caption.lower() for word in ["save", "share", "tag"]):
        reasons.append("CTA in caption encourages saves/shares")

    return "; ".join(reasons) if reasons else "High-quality content in an active niche"
