import asyncio
import logging

import httpx

from app.tasks.celery_app import celery_app

logger = logging.getLogger(__name__)

# Instagram Insights metrics to collect
POST_METRICS = ["impressions", "reach", "likes", "comments", "shares", "saved", "engagement"]
ACCOUNT_METRICS = ["impressions", "reach", "follower_count", "profile_views"]

GRAPH_API_BASE = "https://graph.instagram.com/v21.0"


def _run_async(coro):
    """Run an async function from a sync Celery task."""
    loop = asyncio.new_event_loop()
    try:
        return loop.run_until_complete(coro)
    finally:
        loop.close()


@celery_app.task
def collect_all_analytics():
    """Fetch analytics for all active Instagram accounts.

    Runs daily via Celery beat. Dispatches per-account tasks for parallelism.
    """
    # TODO: Once ig_accounts table exists, query active accounts and fan out:
    #
    # from sqlalchemy import select
    # from app.db import async_session
    #
    # async def _collect():
    #     async with async_session() as session:
    #         result = await session.execute(
    #             select(IgAccount).where(IgAccount.is_active == True)
    #         )
    #         accounts = result.scalars().all()
    #         for account in accounts:
    #             collect_account_analytics.delay(str(account.id))
    #         return {"dispatched": len(accounts)}
    #
    # return _run_async(_collect())

    logger.info("Analytics collection task ran (no ig_accounts table yet)")
    return {"dispatched": 0}


@celery_app.task(bind=True, max_retries=2, default_retry_delay=120)
def collect_account_analytics(self, ig_account_id: str):
    """Fetch analytics for a single Instagram account.

    Collects account-level insights and per-post metrics for recent posts.
    """

    async def _collect():
        # TODO: Load account credentials from DB
        # async with async_session() as session:
        #     account = await session.get(IgAccount, ig_account_id)
        #     if not account:
        #         logger.error("Account %s not found", ig_account_id)
        #         return {"error": "Account not found"}
        #
        #     access_token = account.access_token
        #     ig_user_id = account.ig_user_id
        #
        #     async with httpx.AsyncClient(timeout=30.0) as client:
        #         # Collect account-level insights
        #         resp = await client.get(
        #             f"{GRAPH_API_BASE}/{ig_user_id}/insights",
        #             params={
        #                 "metric": ",".join(ACCOUNT_METRICS),
        #                 "period": "day",
        #                 "access_token": access_token,
        #             },
        #         )
        #         resp.raise_for_status()
        #         account_insights = resp.json().get("data", [])
        #
        #         # Collect recent media insights
        #         resp = await client.get(
        #             f"{GRAPH_API_BASE}/{ig_user_id}/media",
        #             params={
        #                 "fields": "id,timestamp,media_type,like_count,comments_count",
        #                 "limit": 25,
        #                 "access_token": access_token,
        #             },
        #         )
        #         resp.raise_for_status()
        #         recent_media = resp.json().get("data", [])
        #
        #         # For each recent post, get detailed insights
        #         for media in recent_media:
        #             media_resp = await client.get(
        #                 f"{GRAPH_API_BASE}/{media['id']}/insights",
        #                 params={
        #                     "metric": ",".join(POST_METRICS),
        #                     "access_token": access_token,
        #                 },
        #             )
        #             if media_resp.status_code == 200:
        #                 media["insights"] = media_resp.json().get("data", [])
        #
        #         # TODO: Store insights in analytics table
        #         logger.info(
        #             "Collected analytics for account %s: %d account metrics, %d posts",
        #             ig_account_id, len(account_insights), len(recent_media),
        #         )
        #         return {
        #             "account_id": ig_account_id,
        #             "account_metrics": len(account_insights),
        #             "posts_analyzed": len(recent_media),
        #         }

        logger.info("Analytics collection for account %s (no ig_accounts table yet)", ig_account_id)
        return {"account_id": ig_account_id, "status": "skipped"}

    try:
        return _run_async(_collect())
    except Exception as exc:
        logger.exception("Failed to collect analytics for account %s", ig_account_id)
        raise self.retry(exc=exc)
