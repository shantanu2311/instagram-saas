"""
AI image generation integrations.

Supports:
- Ideogram 3.0: Best for text-heavy designs and stylized images
- Flux Pro 1.1 (BFL): Best for photorealistic and general-purpose images

Routes automatically based on the `style` parameter.
Falls back to a placeholder error when API keys are not configured.
"""

from __future__ import annotations

import asyncio
from typing import Any

import httpx

from app.config import settings

# ---------------------------------------------------------------------------
# Aspect ratio mappings per provider
# ---------------------------------------------------------------------------

_IDEOGRAM_RATIOS: dict[str, str] = {
    "1:1": "ASPECT_1_1",
    "4:5": "ASPECT_4_5",
    "9:16": "ASPECT_9_16",
    "16:9": "ASPECT_16_9",
}

_FLUX_RATIOS: dict[str, str] = {
    "1:1": "1:1",
    "4:5": "4:5",
    "9:16": "9:16",
    "16:9": "16:9",
}


# ---------------------------------------------------------------------------
# Ideogram
# ---------------------------------------------------------------------------

async def _generate_ideogram(
    prompt: str,
    aspect_ratio: str,
    brand_config: dict[str, Any] | None,
) -> str:
    """Generate an image via Ideogram API.

    Ideogram excels at images with embedded text, stylized typography,
    and graphic design-style outputs.
    """
    if not settings.ideogram_api_key:
        raise ValueError(
            "Ideogram API key not configured. "
            "Set IDEOGRAM_API_KEY in environment."
        )

    # Enhance prompt with brand colors if provided
    enhanced_prompt = prompt
    if brand_config:
        colors = []
        for key in ("primary_color", "secondary_color", "accent_color"):
            c = brand_config.get(key)
            if c and isinstance(c, (list, tuple)) and len(c) == 3:
                hex_color = "#{:02x}{:02x}{:02x}".format(*c)
                colors.append(hex_color)
        if colors:
            enhanced_prompt += f" Use brand colors: {', '.join(colors)}."

    payload = {
        "image_request": {
            "prompt": enhanced_prompt,
            "aspect_ratio": _IDEOGRAM_RATIOS.get(aspect_ratio, "ASPECT_1_1"),
            "model": "V_2A",
            "magic_prompt_option": "AUTO",
            "style_type": "DESIGN",
        }
    }

    async with httpx.AsyncClient(timeout=60.0) as client:
        response = await client.post(
            "https://api.ideogram.ai/generate",
            headers={
                "Api-Key": settings.ideogram_api_key,
                "Content-Type": "application/json",
            },
            json=payload,
        )
        response.raise_for_status()
        data = response.json()

    # Extract URL from response
    images = data.get("data", [])
    if not images:
        raise ValueError("Ideogram returned no images")
    return images[0].get("url", "")


# ---------------------------------------------------------------------------
# Flux (BFL)
# ---------------------------------------------------------------------------

async def _generate_flux(
    prompt: str,
    aspect_ratio: str,
    brand_config: dict[str, Any] | None,
) -> str:
    """Generate an image via Black Forest Labs Flux Pro 1.1 API.

    Flux excels at photorealistic imagery and general-purpose generation.
    Uses an async polling pattern: submit task, then poll for result.
    """
    if not settings.bfl_api_key:
        raise ValueError(
            "BFL/Flux API key not configured. "
            "Set BFL_API_KEY in environment."
        )

    enhanced_prompt = prompt
    if brand_config:
        colors = []
        for key in ("primary_color", "secondary_color", "accent_color"):
            c = brand_config.get(key)
            if c and isinstance(c, (list, tuple)) and len(c) == 3:
                hex_color = "#{:02x}{:02x}{:02x}".format(*c)
                colors.append(hex_color)
        if colors:
            enhanced_prompt += f" Use brand colors: {', '.join(colors)}."

    payload = {
        "prompt": enhanced_prompt,
        "width": _flux_dimensions(aspect_ratio)[0],
        "height": _flux_dimensions(aspect_ratio)[1],
    }

    async with httpx.AsyncClient(timeout=120.0) as client:
        # Submit generation task
        submit_response = await client.post(
            "https://api.bfl.ml/v1/flux-pro-1.1",
            headers={
                "x-key": settings.bfl_api_key,
                "Content-Type": "application/json",
            },
            json=payload,
        )
        submit_response.raise_for_status()
        task_data = submit_response.json()
        task_id = task_data.get("id")

        if not task_id:
            raise ValueError("Flux API did not return a task ID")

        # Poll for result
        for _ in range(60):  # Max 60 attempts (~2 minutes)
            await asyncio.sleep(2)
            poll_response = await client.get(
                f"https://api.bfl.ml/v1/get_result?id={task_id}",
                headers={"x-key": settings.bfl_api_key},
            )
            poll_response.raise_for_status()
            result = poll_response.json()

            status = result.get("status")
            if status == "Ready":
                output = result.get("result", {})
                url = output.get("sample", "")
                if url:
                    return url
                raise ValueError("Flux returned Ready status but no image URL")
            elif status in ("Error", "Failed"):
                raise ValueError(f"Flux generation failed: {result.get('error', 'unknown')}")
            # Otherwise keep polling ("Pending", "Processing")

        raise TimeoutError("Flux generation timed out after 2 minutes")


def _flux_dimensions(aspect_ratio: str) -> tuple[int, int]:
    """Map aspect ratio string to pixel dimensions for Flux."""
    mapping = {
        "1:1": (1024, 1024),
        "4:5": (1024, 1280),
        "9:16": (768, 1344),
        "16:9": (1344, 768),
    }
    return mapping.get(aspect_ratio, (1024, 1024))


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

async def generate_ai_image(
    prompt: str,
    style: str = "general",
    aspect_ratio: str = "1:1",
    brand_config: dict[str, Any] | None = None,
) -> str:
    """Generate an AI image and return its URL.

    Args:
        prompt: Text description of the desired image.
        style: Generation style hint.
            - "text_heavy" or "design" routes to Ideogram.
            - "photorealistic" or "photo" routes to Flux.
            - "general" (default) routes to Flux.
        aspect_ratio: "1:1", "4:5", "9:16", or "16:9".
        brand_config: Optional dict with brand color tuples for prompt enhancement.

    Returns:
        URL string of the generated image.

    Raises:
        ValueError: If the required API key is not configured or generation fails.
        TimeoutError: If the generation times out (Flux only).
    """
    style_lower = style.lower()

    if style_lower in ("text_heavy", "design", "typography", "graphic"):
        return await _generate_ideogram(prompt, aspect_ratio, brand_config)
    else:
        # Default: photorealistic / general → Flux
        # Fall back to Ideogram if Flux key not available but Ideogram is
        if not settings.bfl_api_key and settings.ideogram_api_key:
            return await _generate_ideogram(prompt, aspect_ratio, brand_config)
        return await _generate_flux(prompt, aspect_ratio, brand_config)
