import asyncio
import logging
from datetime import datetime, timezone

from app.tasks.celery_app import celery_app

logger = logging.getLogger(__name__)


def _run_async(coro):
    """Run an async function from a sync Celery task."""
    loop = asyncio.new_event_loop()
    try:
        return loop.run_until_complete(coro)
    finally:
        loop.close()


@celery_app.task(bind=True, max_retries=3, default_retry_delay=60)
def publish_scheduled_post(self, content_id: str):
    """Publish a single scheduled post via Instagram Graph API.

    Called by process_scheduled_posts or directly for immediate publishing.
    Retries up to 3 times on failure.
    """
    from sqlalchemy import select

    from app.db import async_session
    from app.instagram.publisher import InstagramCredentials, InstagramPublisher
    from app.instagram.uploader import upload_media
    from app.models.content import GeneratedContent

    async def _publish():
        async with async_session() as session:
            # Load the content record
            result = await session.execute(
                select(GeneratedContent).where(GeneratedContent.id == content_id)
            )
            content = result.scalar_one_or_none()
            if not content:
                logger.error("Content %s not found", content_id)
                return {"error": "Content not found"}

            if content.status not in ("scheduled", "approved", "draft"):
                logger.warning("Content %s has status %s, skipping", content_id, content.status)
                return {"error": f"Invalid status: {content.status}"}

            # Update status to publishing
            content.status = "publishing"
            await session.commit()

            try:
                # Get the brand's IG credentials (stored on the brand or user)
                brand = content.brand
                # TODO: Load actual credentials from DB once ig_accounts table exists
                # For now, this will be passed through the task or loaded from env
                logger.info("Publishing content %s for brand %s", content_id, brand.id if brand else "unknown")

                # Upload media to get a public URL if needed
                media_urls = content.media_urls or {}
                local_path = media_urls.get("local_path")
                public_url = media_urls.get("public_url")

                if local_path and not public_url:
                    file_type = media_urls.get("content_type", "image/png")
                    public_url = await upload_media(local_path, file_type)
                    media_urls["public_url"] = public_url
                    content.media_urls = media_urls
                    await session.commit()

                if not public_url:
                    raise ValueError("No media URL available for publishing")

                # Build caption
                caption = InstagramPublisher.format_caption(
                    caption=content.caption or "",
                    hashtags=content.hashtags or [],
                    brand_hashtag=brand.brand_hashtag or "" if brand else "",
                )

                # TODO: Replace with real credentials from ig_accounts table
                # creds = InstagramCredentials(
                #     access_token=account.access_token,
                #     ig_user_id=account.ig_user_id,
                # )
                # publisher = InstagramPublisher(creds)

                # Publish based on content type
                # if content.content_type == "carousel":
                #     media_id = await publisher.publish_carousel(image_urls, caption)
                # elif content.content_type == "reel":
                #     media_id = await publisher.publish_reel(public_url, caption)
                # else:
                #     media_id = await publisher.publish_single_image(public_url, caption)

                # Update record
                # content.ig_media_id = media_id
                content.status = "posted"
                content.posted_at = datetime.now(timezone.utc)
                await session.commit()

                logger.info("Successfully published content %s", content_id)
                return {"status": "posted", "content_id": content_id}

            except Exception as exc:
                content.status = "failed"
                await session.commit()
                logger.exception("Failed to publish content %s", content_id)
                raise self.retry(exc=exc)

    return _run_async(_publish())


@celery_app.task
def process_scheduled_posts():
    """Check for posts due to be published and enqueue them.

    Runs every minute via Celery beat.
    """
    from sqlalchemy import select

    from app.db import async_session
    from app.models.content import GeneratedContent

    async def _process():
        now = datetime.now(timezone.utc)
        async with async_session() as session:
            result = await session.execute(
                select(GeneratedContent).where(
                    GeneratedContent.status == "scheduled",
                    GeneratedContent.scheduled_for <= now,
                )
            )
            due_posts = result.scalars().all()

            count = 0
            for post in due_posts:
                publish_scheduled_post.delay(str(post.id))
                count += 1

            if count > 0:
                logger.info("Enqueued %d scheduled posts for publishing", count)
            return {"enqueued": count}

    return _run_async(_process())
