"""Hashtag discovery endpoint — crawls the web for top Instagram accounts by topic."""

import logging
import re

import httpx
from fastapi import APIRouter

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/hashtags", tags=["hashtags"])

# Google search headers
_SEARCH_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/125.0.0.0 Safari/537.36"
    ),
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
}

# Pattern to extract Instagram handles from web pages
_IG_HANDLE_PATTERN = re.compile(
    r"(?:instagram\.com/|@)([a-zA-Z0-9._]{1,30})(?:\s|/|$|[\"'\)])",
    re.IGNORECASE,
)


async def _search_google(query: str, client: httpx.AsyncClient) -> str:
    """Perform a Google search and return raw HTML."""
    url = "https://www.google.com/search"
    params = {"q": query, "num": "20", "hl": "en"}
    try:
        resp = await client.get(url, params=params, headers=_SEARCH_HEADERS)
        if resp.status_code == 200:
            return resp.text
    except httpx.RequestError as e:
        logger.warning("Google search failed: %s", e)
    return ""


async def _search_bing(query: str, client: httpx.AsyncClient) -> str:
    """Fallback: Bing search."""
    url = "https://www.bing.com/search"
    params = {"q": query, "count": "20"}
    try:
        resp = await client.get(url, params=params, headers=_SEARCH_HEADERS)
        if resp.status_code == 200:
            return resp.text
    except httpx.RequestError as e:
        logger.warning("Bing search failed: %s", e)
    return ""


def _extract_handles(html: str) -> list[str]:
    """Extract unique Instagram handles from HTML content."""
    matches = _IG_HANDLE_PATTERN.findall(html)
    # Normalize and deduplicate
    seen: set[str] = set()
    handles: list[str] = []
    # Filter out common false positives
    ignore = {
        "p", "reel", "explore", "accounts", "stories", "about",
        "developer", "help", "privacy", "terms", "api", "press",
        "jobs", "nametag", "direct", "tv", "reels", "static",
        "legal", "hc", "contact", "directory", "lite", "web",
        "emails", "locations", "tags", "graphql", "challenge",
        "instagram", "meta", "facebook", "threads",
    }
    for handle in matches:
        h = handle.lower().rstrip(".")
        if h not in seen and h not in ignore and len(h) > 2:
            seen.add(h)
            handles.append(h)
    return handles


class DiscoverRequest:
    """Pydantic-free request model."""
    pass


@router.post("/discover")
async def discover_accounts(body: dict) -> dict:
    """Discover top Instagram accounts for a given topic via web crawl.

    Request body: { "topic": "morning productivity routine" }
    Response: { "handles": ["@handle1", "@handle2", ...], "query": "..." }
    """
    topic = str(body.get("topic", "")).strip()
    if not topic:
        return {"handles": [], "query": "", "error": "Topic is required"}

    # Build search queries to find top Instagram accounts for this topic
    queries = [
        f"top Instagram accounts for {topic}",
        f"best Instagram creators {topic} 2024 2025",
        f"Instagram influencers {topic} to follow",
    ]

    all_handles: list[str] = []
    async with httpx.AsyncClient(timeout=15.0, follow_redirects=True) as client:
        for query in queries:
            # Try Google first, then Bing as fallback
            html = await _search_google(query, client)
            if not html or len(html) < 500:
                html = await _search_bing(query, client)

            handles = _extract_handles(html)
            all_handles.extend(handles)

    # Deduplicate while preserving order
    seen: set[str] = set()
    unique: list[str] = []
    for h in all_handles:
        if h not in seen:
            seen.add(h)
            unique.append(h)

    # Return top 15 discovered handles
    result_handles = unique[:15]
    logger.info(
        "Hashtag discovery: found %d unique handles for topic '%s'",
        len(result_handles),
        topic,
    )

    return {
        "handles": result_handles,
        "query": queries[0],
        "total_discovered": len(unique),
    }


# Pattern to extract hashtags from web pages
_HASHTAG_PATTERN = re.compile(r"#[a-zA-Z][a-zA-Z0-9_]{2,29}", re.UNICODE)


def _extract_hashtags_from_html(html: str) -> list[str]:
    """Extract unique hashtags from HTML content."""
    matches = _HASHTAG_PATTERN.findall(html)
    seen: set[str] = set()
    hashtags: list[str] = []
    # Filter out common non-hashtag matches
    ignore = {"#000", "#fff", "#333", "#666", "#999", "#ccc", "#eee", "#aaa"}
    for tag in matches:
        lower = tag.lower()
        if lower not in seen and lower not in ignore:
            seen.add(lower)
            hashtags.append(tag)
    return hashtags


@router.post("/discover-tags")
async def discover_hashtags_for_topic(body: dict) -> dict:
    """Discover hashtags for a topic via web crawl.

    Searches for hashtag-specific content rather than Instagram handles.

    Request body: { "topic": "morning routine for toddlers", "niche": "early childhood" }
    Response: { "hashtags": ["#morningroutine", "#toddlerlife", ...], "source": "web_crawl" }
    """
    topic = str(body.get("topic", "")).strip()
    niche = str(body.get("niche", "")).strip()
    if not topic:
        return {"hashtags": [], "source": "web_crawl", "error": "Topic is required"}

    queries = [
        f"best Instagram hashtags for {topic} {niche} 2025",
        f"top hashtags {topic} Instagram",
        f"trending Instagram hashtags {topic}",
    ]

    all_hashtags: list[str] = []
    async with httpx.AsyncClient(timeout=15.0, follow_redirects=True) as client:
        for query in queries:
            html = await _search_google(query, client)
            if not html or len(html) < 500:
                html = await _search_bing(query, client)

            hashtags = _extract_hashtags_from_html(html)
            all_hashtags.extend(hashtags)

    # Deduplicate while preserving order
    seen: set[str] = set()
    unique: list[str] = []
    for h in all_hashtags:
        lower = h.lower()
        if lower not in seen:
            seen.add(lower)
            unique.append(h)

    result = unique[:25]
    logger.info(
        "Hashtag tag discovery: found %d unique hashtags for topic '%s'",
        len(result),
        topic,
    )

    return {
        "hashtags": result,
        "source": "web_crawl",
        "total_discovered": len(unique),
    }
