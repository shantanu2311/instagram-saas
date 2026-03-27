import asyncio
import logging

from app.tasks.celery_app import celery_app

logger = logging.getLogger(__name__)


def _run_async(coro):
    """Run an async function from a sync Celery task."""
    loop = asyncio.new_event_loop()
    try:
        return loop.run_until_complete(coro)
    finally:
        loop.close()


@celery_app.task
def refresh_expiring_tokens():
    """Refresh all Instagram tokens expiring within 7 days.

    Runs daily via Celery beat. Queries the database for accounts with
    tokens nearing expiry and refreshes them through the Meta Graph API.
    """
    from app.instagram.token_manager import compute_expiry, refresh_token, token_needs_refresh

    async def _refresh():
        # TODO: Once ig_accounts table exists, query for accounts with expiring tokens:
        #
        # from sqlalchemy import select
        # from app.db import async_session
        #
        # async with async_session() as session:
        #     result = await session.execute(
        #         select(IgAccount).where(IgAccount.is_active == True)
        #     )
        #     accounts = result.scalars().all()
        #
        #     refreshed = 0
        #     for account in accounts:
        #         if token_needs_refresh(account.token_expires_at):
        #             try:
        #                 new_token_data = await refresh_token(account.access_token)
        #                 account.access_token = new_token_data["access_token"]
        #                 account.token_expires_at = compute_expiry(new_token_data["expires_in"])
        #                 refreshed += 1
        #             except Exception:
        #                 logger.exception("Failed to refresh token for account %s", account.id)
        #
        #     await session.commit()
        #     logger.info("Refreshed %d/%d tokens", refreshed, len(accounts))
        #     return {"refreshed": refreshed, "total": len(accounts)}

        logger.info("Token refresh task ran (no ig_accounts table yet)")
        return {"refreshed": 0, "total": 0}

    return _run_async(_refresh())
