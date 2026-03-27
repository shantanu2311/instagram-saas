"""
AI-powered caption generation for Instagram posts.

Uses OpenAI API for caption + hashtag generation.
Falls back to placeholder content when no API key is configured.
"""

from __future__ import annotations

import json
import re

import httpx

from app.config import settings

# ---------------------------------------------------------------------------
# System prompt template
# ---------------------------------------------------------------------------

_SYSTEM_PROMPT = """You are an expert Instagram content creator and copywriter.
You write captions that drive engagement, follows, and saves.

Brand context:
- Niche: {niche}
- Brand voice: {brand_voice}
- Content pillar: {pillar}

Tone guidelines:
- Formality: {formality_desc} (score: {tone_formality}/100)
- Humor: {humor_desc} (score: {tone_humor}/100)

Rules:
1. Caption must be between 50 and {max_length} characters.
2. Start with a strong hook (first line must stop the scroll).
3. Use line breaks for readability (short paragraphs).
4. Include a clear call-to-action (save, share, comment, follow).
5. Do NOT use generic filler. Every sentence must add value.
6. Match the brand voice precisely.

Respond ONLY with valid JSON in this exact format:
{{
  "caption": "Your caption text here (use \\n for line breaks)",
  "hashtags": ["hashtag1", "hashtag2", "hashtag3", "hashtag4", "hashtag5"]
}}

Generate 5-10 relevant hashtags. Mix high-volume (100K+) and niche-specific tags.
Do NOT include the # symbol in hashtag strings.
{brand_hashtag_instruction}"""


# ---------------------------------------------------------------------------
# Tone descriptors
# ---------------------------------------------------------------------------

def _formality_desc(score: int) -> str:
    if score < 20:
        return "Very casual, slang OK, emoji-heavy"
    elif score < 40:
        return "Casual and conversational"
    elif score < 60:
        return "Balanced, professional but approachable"
    elif score < 80:
        return "Professional and polished"
    else:
        return "Formal and authoritative"


def _humor_desc(score: int) -> str:
    if score < 20:
        return "Serious and straightforward"
    elif score < 40:
        return "Mostly serious with occasional wit"
    elif score < 60:
        return "Balanced — informative with light humor"
    elif score < 80:
        return "Witty and playful"
    else:
        return "Very humorous, meme-aware, entertainment-first"


# ---------------------------------------------------------------------------
# Placeholder fallback
# ---------------------------------------------------------------------------

_PLACEHOLDER_CAPTIONS: dict[str, str] = {
    "facts": (
        "Did you know? Drop a comment if this surprised you!\n\n"
        "Save this post for later and share it with someone who needs to see this.\n\n"
        "Follow for more insights like this."
    ),
    "tips": (
        "Here's a tip that can change your approach.\n\n"
        "Try it out and let me know how it goes in the comments!\n\n"
        "Save this for when you need it most."
    ),
    "motivation": (
        "A little reminder for your feed today.\n\n"
        "Tag someone who needs to hear this right now.\n\n"
        "Double-tap if you agree."
    ),
    "behind_the_scenes": (
        "A look behind the scenes!\n\n"
        "What do you think? Drop your thoughts below.\n\n"
        "Follow along for more exclusive content."
    ),
}

_PLACEHOLDER_HASHTAGS = [
    "instagood", "photooftheday", "instadaily",
    "trending", "explore", "viral",
    "contentcreator", "socialmediatips",
]


def _placeholder_caption(
    topic: str,
    pillar: str,
    brand_hashtag: str,
) -> dict[str, str | list[str]]:
    """Return a placeholder caption when no AI API key is available."""
    base = _PLACEHOLDER_CAPTIONS.get(pillar, _PLACEHOLDER_CAPTIONS["facts"])
    caption = f"{topic}\n\n{base}"
    hashtags = list(_PLACEHOLDER_HASHTAGS)
    if brand_hashtag:
        clean = brand_hashtag.lstrip("#")
        if clean not in hashtags:
            hashtags.insert(0, clean)
    return {"caption": caption, "hashtags": hashtags}


# ---------------------------------------------------------------------------
# OpenAI integration
# ---------------------------------------------------------------------------

async def _call_openai(system_prompt: str, user_prompt: str) -> dict:
    """Make a chat completion request to OpenAI."""
    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.post(
            "https://api.openai.com/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {settings.openai_api_key}",
                "Content-Type": "application/json",
            },
            json={
                "model": "gpt-4o-mini",
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                "temperature": 0.8,
                "max_tokens": 1024,
            },
        )
        response.raise_for_status()
        data = response.json()
        content = data["choices"][0]["message"]["content"]
        return _parse_response(content)


def _parse_response(raw: str) -> dict:
    """Parse the AI response, extracting JSON from possible markdown fences."""
    # Strip markdown code fences if present
    cleaned = raw.strip()
    if cleaned.startswith("```"):
        # Remove opening fence (with optional language tag)
        cleaned = re.sub(r"^```\w*\n?", "", cleaned)
        cleaned = re.sub(r"\n?```$", "", cleaned)
        cleaned = cleaned.strip()

    try:
        parsed = json.loads(cleaned)
    except json.JSONDecodeError:
        # Fallback: try to extract JSON object from the text
        match = re.search(r"\{.*\}", cleaned, re.DOTALL)
        if match:
            parsed = json.loads(match.group())
        else:
            return {
                "caption": cleaned,
                "hashtags": list(_PLACEHOLDER_HASHTAGS),
            }

    caption = parsed.get("caption", "")
    hashtags = parsed.get("hashtags", [])

    # Clean hashtags: remove # prefix, lowercase, deduplicate
    clean_tags = []
    seen: set[str] = set()
    for tag in hashtags:
        t = str(tag).lstrip("#").lower().strip()
        if t and t not in seen:
            clean_tags.append(t)
            seen.add(t)

    return {"caption": caption, "hashtags": clean_tags}


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

async def generate_caption(
    topic: str,
    pillar: str = "facts",
    brand_voice: str = "",
    niche: str = "",
    tone_formality: int = 50,
    tone_humor: int = 50,
    brand_hashtag: str = "",
    max_length: int = 2200,
) -> dict[str, str | list[str]]:
    """Generate an Instagram caption with hashtags.

    Returns {"caption": str, "hashtags": list[str]}.

    If no OpenAI API key is configured, returns a placeholder caption.
    """
    # Clamp tone values
    tone_formality = max(0, min(100, tone_formality))
    tone_humor = max(0, min(100, tone_humor))

    # Fallback if no API key
    if not settings.openai_api_key:
        return _placeholder_caption(topic, pillar, brand_hashtag)

    # Build prompts
    brand_hashtag_instruction = ""
    if brand_hashtag:
        clean = brand_hashtag.lstrip("#")
        brand_hashtag_instruction = f'Always include "{clean}" as the first hashtag.'

    system = _SYSTEM_PROMPT.format(
        niche=niche or "general",
        brand_voice=brand_voice or "engaging, informative, and authentic",
        pillar=pillar,
        formality_desc=_formality_desc(tone_formality),
        tone_formality=tone_formality,
        humor_desc=_humor_desc(tone_humor),
        tone_humor=tone_humor,
        max_length=max_length,
        brand_hashtag_instruction=brand_hashtag_instruction,
    )

    user_prompt = f"Write an Instagram caption about: {topic}"

    try:
        result = await _call_openai(system, user_prompt)
    except Exception:
        # On any API error, return placeholder
        return _placeholder_caption(topic, pillar, brand_hashtag)

    # Ensure brand hashtag is first
    if brand_hashtag:
        clean = brand_hashtag.lstrip("#").lower()
        tags = result.get("hashtags", [])
        tags = [t for t in tags if t.lower() != clean]
        tags.insert(0, clean)
        result["hashtags"] = tags

    return result
