import logging
from datetime import datetime, timedelta, timezone

import httpx

logger = logging.getLogger(__name__)

# Meta long-lived tokens last ~60 days. Refresh when within this window.
REFRESH_THRESHOLD_DAYS = 7


async def refresh_token(current_token: str) -> dict:
    """Exchange a long-lived Instagram token for a new one.

    Returns:
        dict with "access_token" (str) and "expires_in" (int, seconds).
    """
    async with httpx.AsyncClient(timeout=15.0) as client:
        resp = await client.get(
            "https://graph.instagram.com/refresh_access_token",
            params={
                "grant_type": "ig_refresh_token",
                "access_token": current_token,
            },
        )
        resp.raise_for_status()
        data = resp.json()
        logger.info(
            "Token refreshed, new expiry in %d seconds (~%d days)",
            data["expires_in"],
            data["expires_in"] // 86400,
        )
        return {
            "access_token": data["access_token"],
            "expires_in": data["expires_in"],  # usually ~5184000 = 60 days
        }


def token_needs_refresh(expires_at: datetime) -> bool:
    """Check if a token should be refreshed (within REFRESH_THRESHOLD_DAYS of expiry)."""
    threshold = datetime.now(timezone.utc) + timedelta(days=REFRESH_THRESHOLD_DAYS)
    return expires_at <= threshold


def compute_expiry(expires_in_seconds: int) -> datetime:
    """Compute an absolute expiry datetime from a relative seconds value."""
    return datetime.now(timezone.utc) + timedelta(seconds=expires_in_seconds)
