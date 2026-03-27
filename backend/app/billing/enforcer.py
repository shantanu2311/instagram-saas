from app.api.billing import TIER_LIMITS


async def check_can_generate(
    user_id: str, tier: str = "free", generation_tier: str = "standard"
) -> dict:
    """Check if user can generate content based on their subscription.

    Returns {"allowed": True/False, "reason": str | None}.
    """
    limits = TIER_LIMITS.get(tier, TIER_LIMITS["free"])

    if generation_tier == "ai-enhanced" and limits["ai_credits"] <= 0:
        return {
            "allowed": False,
            "reason": "AI-Enhanced generation requires Pro or Agency plan",
        }

    # TODO: Check actual weekly post count from DB
    # TODO: Check remaining AI credits from DB

    return {"allowed": True, "reason": None}


async def deduct_credits(user_id: str, credits: int = 1):
    """Deduct AI credits from user's subscription.

    Called after a successful AI-enhanced generation.
    """
    # TODO: Decrement ai_credits_remaining in DB for user
    pass
