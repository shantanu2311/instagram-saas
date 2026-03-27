import asyncio
import logging
from dataclasses import dataclass

import httpx

logger = logging.getLogger(__name__)


@dataclass
class InstagramCredentials:
    access_token: str
    ig_user_id: str


class InstagramPublishError(Exception):
    """Raised when Instagram publishing fails."""

    def __init__(self, message: str, status_code: int | None = None, response_body: dict | None = None):
        super().__init__(message)
        self.status_code = status_code
        self.response_body = response_body


class InstagramPublisher:
    BASE_URL = "https://graph.instagram.com/v21.0"
    POLL_INTERVAL = 10  # seconds between status checks for video processing
    MAX_POLLS = 8  # max number of polling attempts

    def __init__(self, credentials: InstagramCredentials):
        self.creds = credentials

    async def publish_single_image(self, image_url: str, caption: str) -> str:
        """Publish a single image post. Returns the published media_id."""
        async with httpx.AsyncClient(timeout=30.0) as client:
            # Step 1: Create media container
            resp = await client.post(
                f"{self.BASE_URL}/{self.creds.ig_user_id}/media",
                data={
                    "image_url": image_url,
                    "caption": caption,
                    "access_token": self.creds.access_token,
                },
            )
            resp.raise_for_status()
            creation_id = resp.json()["id"]
            logger.info("Created image container %s", creation_id)

            # Wait for server-side processing
            await asyncio.sleep(3)

            # Step 2: Publish the container
            resp = await client.post(
                f"{self.BASE_URL}/{self.creds.ig_user_id}/media_publish",
                data={
                    "creation_id": creation_id,
                    "access_token": self.creds.access_token,
                },
            )
            resp.raise_for_status()
            media_id = resp.json()["id"]
            logger.info("Published image %s", media_id)
            return media_id

    async def publish_carousel(self, image_urls: list[str], caption: str) -> str:
        """Publish a carousel post (2-10 images). Returns the published media_id."""
        if len(image_urls) < 2:
            raise InstagramPublishError("Carousel requires at least 2 images")
        if len(image_urls) > 10:
            raise InstagramPublishError("Carousel supports at most 10 images")

        async with httpx.AsyncClient(timeout=30.0) as client:
            # Step 1: Create child containers for each image
            child_ids: list[str] = []
            for url in image_urls:
                resp = await client.post(
                    f"{self.BASE_URL}/{self.creds.ig_user_id}/media",
                    data={
                        "image_url": url,
                        "is_carousel_item": "true",
                        "access_token": self.creds.access_token,
                    },
                )
                resp.raise_for_status()
                child_ids.append(resp.json()["id"])
                logger.info("Created carousel child container %s", child_ids[-1])

            await asyncio.sleep(3)

            # Step 2: Create the carousel container
            resp = await client.post(
                f"{self.BASE_URL}/{self.creds.ig_user_id}/media",
                data={
                    "media_type": "CAROUSEL",
                    "children": ",".join(child_ids),
                    "caption": caption,
                    "access_token": self.creds.access_token,
                },
            )
            resp.raise_for_status()
            creation_id = resp.json()["id"]
            logger.info("Created carousel container %s", creation_id)

            await asyncio.sleep(3)

            # Step 3: Publish
            resp = await client.post(
                f"{self.BASE_URL}/{self.creds.ig_user_id}/media_publish",
                data={
                    "creation_id": creation_id,
                    "access_token": self.creds.access_token,
                },
            )
            resp.raise_for_status()
            media_id = resp.json()["id"]
            logger.info("Published carousel %s", media_id)
            return media_id

    async def publish_reel(self, video_url: str, caption: str, cover_url: str | None = None) -> str:
        """Publish a reel. Polls for video processing completion. Returns the published media_id."""
        async with httpx.AsyncClient(timeout=60.0) as client:
            # Step 1: Create reel container
            data: dict[str, str] = {
                "media_type": "REELS",
                "video_url": video_url,
                "caption": caption,
                "access_token": self.creds.access_token,
            }
            if cover_url:
                data["cover_url"] = cover_url

            resp = await client.post(
                f"{self.BASE_URL}/{self.creds.ig_user_id}/media",
                data=data,
            )
            resp.raise_for_status()
            creation_id = resp.json()["id"]
            logger.info("Created reel container %s", creation_id)

            # Step 2: Poll for processing completion
            for attempt in range(self.MAX_POLLS):
                await asyncio.sleep(self.POLL_INTERVAL)
                resp = await client.get(
                    f"{self.BASE_URL}/{creation_id}",
                    params={
                        "fields": "status_code",
                        "access_token": self.creds.access_token,
                    },
                )
                resp.raise_for_status()
                status = resp.json().get("status_code")
                logger.info("Reel %s status: %s (attempt %d/%d)", creation_id, status, attempt + 1, self.MAX_POLLS)

                if status == "FINISHED":
                    break
                if status == "ERROR":
                    raise InstagramPublishError(
                        f"Reel processing failed for container {creation_id}",
                        response_body=resp.json(),
                    )
            else:
                raise InstagramPublishError(
                    f"Reel processing timed out after {self.MAX_POLLS * self.POLL_INTERVAL}s"
                )

            # Step 3: Publish
            resp = await client.post(
                f"{self.BASE_URL}/{self.creds.ig_user_id}/media_publish",
                data={
                    "creation_id": creation_id,
                    "access_token": self.creds.access_token,
                },
            )
            resp.raise_for_status()
            media_id = resp.json()["id"]
            logger.info("Published reel %s", media_id)
            return media_id

    @staticmethod
    def format_caption(caption: str, hashtags: list[str], brand_hashtag: str = "") -> str:
        """Format caption with hashtags. Instagram max is 2200 chars, 30 hashtags."""
        parts: list[str] = [caption.strip()]

        # Build hashtag block
        tag_parts: list[str] = []
        if brand_hashtag:
            tag = brand_hashtag if brand_hashtag.startswith("#") else f"#{brand_hashtag}"
            tag_parts.append(tag)
        for ht in hashtags:
            tag = ht if ht.startswith("#") else f"#{ht}"
            tag_parts.append(tag)

        if tag_parts:
            # Separate caption from hashtags with dot separators
            parts.append(".\n.\n.")
            parts.append(" ".join(tag_parts))

        result = "\n".join(parts)

        # Enforce Instagram limits
        if len(result) > 2200:
            # Trim hashtags from the end until we fit
            while len(result) > 2200 and tag_parts:
                tag_parts.pop()
                hashtag_block = " ".join(tag_parts)
                result = f"{caption.strip()}\n.\n.\n.\n{hashtag_block}" if tag_parts else caption.strip()

        return result
