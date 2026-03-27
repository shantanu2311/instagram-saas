from fastapi import APIRouter

router = APIRouter(prefix="/billing", tags=["billing"])


@router.post("/checkout")
async def create_checkout() -> dict[str, str]:
    return {"status": "stub", "checkout_url": ""}


@router.post("/webhook")
async def billing_webhook() -> dict[str, str]:
    return {"status": "received"}


@router.get("/subscription")
async def get_subscription() -> dict[str, str]:
    return {"status": "stub", "plan": "free"}
