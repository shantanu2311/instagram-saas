"""
AI video generation integrations.

Supports:
- MiniMax Hailuo: Standard-quality video, fast generation, cost-effective
- Runway Gen-3: Premium-quality video, cinematic output

Routes based on the `quality` parameter.
"""

from __future__ import annotations

import asyncio

import httpx

from app.config import settings

# ---------------------------------------------------------------------------
# MiniMax Hailuo
# ---------------------------------------------------------------------------

async def _generate_hailuo(
    prompt: str,
    duration: int,
    aspect_ratio: str,
) -> str:
    """Generate a video via MiniMax Hailuo API.

    Hailuo is optimized for short-form social video with fast turnaround.
    Uses an async task submission + polling pattern.
    """
    if not settings.minimax_api_key:
        raise ValueError(
            "MiniMax API key not configured. "
            "Set MINIMAX_API_KEY in environment."
        )

    payload = {
        "model": "video-01",
        "prompt": prompt,
        "duration": min(duration, 6),  # Hailuo max 6s
    }

    async with httpx.AsyncClient(timeout=180.0) as client:
        # Submit generation task
        submit_response = await client.post(
            "https://api.minimaxi.chat/v1/video_generation",
            headers={
                "Authorization": f"Bearer {settings.minimax_api_key}",
                "Content-Type": "application/json",
            },
            json=payload,
        )
        submit_response.raise_for_status()
        task_data = submit_response.json()
        task_id = task_data.get("task_id")

        if not task_id:
            raise ValueError("MiniMax API did not return a task ID")

        # Poll for result
        for _ in range(90):  # Max 90 attempts (~3 minutes)
            await asyncio.sleep(2)
            poll_response = await client.get(
                f"https://api.minimaxi.chat/v1/query/video_generation?task_id={task_id}",
                headers={
                    "Authorization": f"Bearer {settings.minimax_api_key}",
                },
            )
            poll_response.raise_for_status()
            result = poll_response.json()

            status = result.get("status")
            if status == "Success":
                file_id = result.get("file_id", "")
                if file_id:
                    # Fetch the download URL
                    download_response = await client.get(
                        f"https://api.minimaxi.chat/v1/files/retrieve?file_id={file_id}",
                        headers={
                            "Authorization": f"Bearer {settings.minimax_api_key}",
                        },
                    )
                    download_response.raise_for_status()
                    download_data = download_response.json()
                    url = download_data.get("file", {}).get("download_url", "")
                    if url:
                        return url
                raise ValueError("MiniMax returned success but no download URL")
            elif status == "Fail":
                raise ValueError(
                    f"MiniMax generation failed: {result.get('base_resp', {}).get('status_msg', 'unknown')}"
                )
            # Otherwise keep polling ("Queueing", "Processing")

        raise TimeoutError("MiniMax Hailuo generation timed out after 3 minutes")


# ---------------------------------------------------------------------------
# Runway Gen-3
# ---------------------------------------------------------------------------

async def _generate_runway(
    prompt: str,
    duration: int,
    aspect_ratio: str,
) -> str:
    """Generate a video via Runway Gen-3 Alpha Turbo API.

    Runway produces premium cinematic-quality video.
    Uses an async task submission + polling pattern.
    """
    if not settings.runway_api_key:
        raise ValueError(
            "Runway API key not configured. "
            "Set RUNWAY_API_KEY in environment."
        )

    # Map aspect ratio for Runway
    runway_ratio = aspect_ratio
    if aspect_ratio == "4:5":
        runway_ratio = "9:16"  # Runway doesn't support 4:5, use closest

    payload = {
        "promptText": prompt,
        "model": "gen3a_turbo",
        "duration": min(duration, 10),  # Runway supports up to 10s
        "ratio": runway_ratio,
        "watermark": False,
    }

    async with httpx.AsyncClient(timeout=300.0) as client:
        # Submit task
        submit_response = await client.post(
            "https://api.dev.runwayml.com/v1/image_to_video",
            headers={
                "Authorization": f"Bearer {settings.runway_api_key}",
                "X-Runway-Version": "2024-11-06",
                "Content-Type": "application/json",
            },
            json=payload,
        )
        submit_response.raise_for_status()
        task_data = submit_response.json()
        task_id = task_data.get("id")

        if not task_id:
            raise ValueError("Runway API did not return a task ID")

        # Poll for result
        for _ in range(150):  # Max 150 attempts (~5 minutes)
            await asyncio.sleep(2)
            poll_response = await client.get(
                f"https://api.dev.runwayml.com/v1/tasks/{task_id}",
                headers={
                    "Authorization": f"Bearer {settings.runway_api_key}",
                    "X-Runway-Version": "2024-11-06",
                },
            )
            poll_response.raise_for_status()
            result = poll_response.json()

            status = result.get("status")
            if status == "SUCCEEDED":
                output = result.get("output", [])
                if output:
                    return output[0]  # First output URL
                raise ValueError("Runway returned success but no output URLs")
            elif status == "FAILED":
                raise ValueError(
                    f"Runway generation failed: {result.get('failure', 'unknown')}"
                )
            # Otherwise keep polling ("PENDING", "RUNNING")

        raise TimeoutError("Runway generation timed out after 5 minutes")


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

async def generate_ai_video(
    prompt: str,
    duration: int = 6,
    quality: str = "standard",
    aspect_ratio: str = "9:16",
) -> str:
    """Generate an AI video and return its URL.

    Args:
        prompt: Text description of the desired video.
        duration: Target duration in seconds (clamped per provider limits).
        quality: Quality tier.
            - "standard" routes to MiniMax Hailuo (faster, cheaper).
            - "premium" or "cinematic" routes to Runway Gen-3 (higher quality).
        aspect_ratio: "1:1", "4:5", "9:16", or "16:9".

    Returns:
        URL string of the generated video.

    Raises:
        ValueError: If the required API key is not configured or generation fails.
        TimeoutError: If the generation times out.
    """
    quality_lower = quality.lower()

    if quality_lower in ("premium", "cinematic", "high"):
        # Fall back to Hailuo if Runway key not available
        if not settings.runway_api_key and settings.minimax_api_key:
            return await _generate_hailuo(prompt, duration, aspect_ratio)
        return await _generate_runway(prompt, duration, aspect_ratio)
    else:
        # Standard → Hailuo
        # Fall back to Runway if Hailuo key not available
        if not settings.minimax_api_key and settings.runway_api_key:
            return await _generate_runway(prompt, duration, aspect_ratio)
        return await _generate_hailuo(prompt, duration, aspect_ratio)
