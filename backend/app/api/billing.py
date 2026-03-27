import os

from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel

router = APIRouter(prefix="/billing", tags=["billing"])

STRIPE_SECRET_KEY = os.environ.get("STRIPE_SECRET_KEY", "")
STRIPE_WEBHOOK_SECRET = os.environ.get("STRIPE_WEBHOOK_SECRET", "")

TIER_PRICES = {
    "starter": "price_starter_monthly",  # Replace with real Stripe price IDs
    "pro": "price_pro_monthly",
    "agency": "price_agency_monthly",
}

TIER_LIMITS = {
    "free": {"posts_per_week": 3, "ai_credits": 0, "ig_accounts": 1},
    "starter": {"posts_per_week": 7, "ai_credits": 0, "ig_accounts": 1},
    "pro": {"posts_per_week": 7, "ai_credits": 50, "ig_accounts": 3},
    "agency": {"posts_per_week": 7, "ai_credits": 200, "ig_accounts": 10},
}


class CheckoutRequest(BaseModel):
    tier: str
    user_id: str
    success_url: str = "http://localhost:3000/settings/billing?success=true"
    cancel_url: str = "http://localhost:3000/settings/billing?cancelled=true"


class SubscriptionResponse(BaseModel):
    tier: str
    status: str
    posts_this_week: int
    posts_limit: int
    ai_credits_remaining: int
    ai_credits_limit: int
    ig_accounts_limit: int
    current_period_end: str | None = None


class PortalResponse(BaseModel):
    portal_url: str | None = None
    error: str | None = None
    message: str | None = None


@router.post("/create-checkout")
async def create_checkout(req: CheckoutRequest):
    """Create a Stripe Checkout session for upgrading to a paid tier."""
    if not STRIPE_SECRET_KEY:
        return {"checkout_url": None, "error": "Stripe not configured. Set STRIPE_SECRET_KEY in .env"}

    if req.tier not in TIER_PRICES:
        raise HTTPException(400, f"Invalid tier: {req.tier}")

    try:
        import stripe

        stripe.api_key = STRIPE_SECRET_KEY

        session = stripe.checkout.Session.create(
            payment_method_types=["card"],
            line_items=[{"price": TIER_PRICES[req.tier], "quantity": 1}],
            mode="subscription",
            success_url=req.success_url,
            cancel_url=req.cancel_url,
            client_reference_id=req.user_id,
            metadata={"tier": req.tier, "user_id": req.user_id},
        )
        return {"checkout_url": session.url}
    except Exception as e:
        raise HTTPException(500, f"Stripe error: {e}")


@router.post("/webhook")
async def stripe_webhook(request: Request):
    """Handle Stripe webhook events for subscription lifecycle."""
    if not STRIPE_SECRET_KEY:
        return {"status": "stripe_not_configured"}

    payload = await request.body()
    sig_header = request.headers.get("stripe-signature", "")

    try:
        import stripe

        stripe.api_key = STRIPE_SECRET_KEY
        event = stripe.Webhook.construct_event(payload, sig_header, STRIPE_WEBHOOK_SECRET)
    except Exception as e:
        raise HTTPException(400, f"Webhook error: {e}")

    event_type = event["type"]
    data = event["data"]["object"]

    if event_type == "checkout.session.completed":
        # Create/update subscription in DB
        user_id = data.get("client_reference_id")
        tier = data.get("metadata", {}).get("tier", "starter")
        print(f"Subscription created: user={user_id}, tier={tier}")
        # TODO: Update user record in DB with tier + Stripe customer/subscription IDs
    elif event_type == "customer.subscription.deleted":
        print(f"Subscription cancelled: {data.get('id')}")
        # TODO: Downgrade user to free tier in DB
    elif event_type == "invoice.paid":
        print("Invoice paid, reset credits")
        # TODO: Reset monthly AI credits for user

    return {"status": "processed"}


@router.get("/subscription/{user_id}")
async def get_subscription(user_id: str):
    """Get the current subscription status and usage for a user."""
    # TODO: Query DB for real subscription data
    limits = TIER_LIMITS["free"]
    return SubscriptionResponse(
        tier="free",
        status="active",
        posts_this_week=0,
        posts_limit=limits["posts_per_week"],
        ai_credits_remaining=0,
        ai_credits_limit=limits["ai_credits"],
        ig_accounts_limit=limits["ig_accounts"],
    )


@router.post("/create-portal", response_model=PortalResponse)
async def create_portal():
    """Create a Stripe Customer Portal session for managing subscriptions."""
    if not STRIPE_SECRET_KEY:
        return PortalResponse(
            portal_url=None,
            error="Stripe not configured",
        )
    # TODO: Look up Stripe customer ID from DB and create portal session
    return PortalResponse(
        portal_url=None,
        message="Set up Stripe to enable portal",
    )
