from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_db
from app.models.content import GeneratedContent

router = APIRouter(prefix="/posts", tags=["posting"])


# ---------- Request / Response models ----------


class PublishRequest(BaseModel):
    content_id: str
    ig_account_id: str


class ScheduleRequest(BaseModel):
    content_id: str
    ig_account_id: str
    scheduled_for: datetime


class PostStatusResponse(BaseModel):
    status: str
    content_id: str
    scheduled_for: str | None = None
    message: str | None = None


class QueueItem(BaseModel):
    content_id: str
    content_type: str
    status: str
    scheduled_for: str | None = None
    caption: str | None = None


class QueueResponse(BaseModel):
    posts: list[QueueItem]
    total: int


# ---------- Endpoints ----------


@router.post("/publish", response_model=PostStatusResponse)
async def publish_now(req: PublishRequest, db: AsyncSession = Depends(get_db)):
    """Immediately enqueue a post for publishing via Celery."""
    result = await db.execute(
        select(GeneratedContent).where(GeneratedContent.id == req.content_id)
    )
    content = result.scalar_one_or_none()
    if not content:
        raise HTTPException(status_code=404, detail="Content not found")

    if content.status not in ("draft", "approved"):
        raise HTTPException(
            status_code=400,
            detail=f"Content must be in draft or approved status, got: {content.status}",
        )

    # Update status and enqueue
    content.status = "queued"
    await db.commit()

    from app.tasks.posting import publish_scheduled_post

    publish_scheduled_post.delay(req.content_id)

    return PostStatusResponse(
        status="queued",
        content_id=req.content_id,
        message="Post queued for immediate publishing",
    )


@router.post("/schedule", response_model=PostStatusResponse)
async def schedule_post(req: ScheduleRequest, db: AsyncSession = Depends(get_db)):
    """Schedule a post for future publishing."""
    result = await db.execute(
        select(GeneratedContent).where(GeneratedContent.id == req.content_id)
    )
    content = result.scalar_one_or_none()
    if not content:
        raise HTTPException(status_code=404, detail="Content not found")

    if req.scheduled_for <= datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="Scheduled time must be in the future")

    content.status = "scheduled"
    content.scheduled_for = req.scheduled_for
    await db.commit()

    return PostStatusResponse(
        status="scheduled",
        content_id=req.content_id,
        scheduled_for=req.scheduled_for.isoformat(),
        message=f"Post scheduled for {req.scheduled_for.isoformat()}",
    )


@router.delete("/schedule/{content_id}", response_model=PostStatusResponse)
async def cancel_schedule(content_id: str, db: AsyncSession = Depends(get_db)):
    """Cancel a scheduled post, returning it to draft status."""
    result = await db.execute(
        select(GeneratedContent).where(GeneratedContent.id == content_id)
    )
    content = result.scalar_one_or_none()
    if not content:
        raise HTTPException(status_code=404, detail="Content not found")

    if content.status != "scheduled":
        raise HTTPException(
            status_code=400,
            detail=f"Content is not scheduled (status: {content.status})",
        )

    content.status = "draft"
    content.scheduled_for = None
    await db.commit()

    return PostStatusResponse(
        status="cancelled",
        content_id=content_id,
        message="Schedule cancelled, post returned to draft",
    )


@router.get("/queue", response_model=QueueResponse)
async def get_queue(db: AsyncSession = Depends(get_db)):
    """Get all scheduled and queued posts."""
    result = await db.execute(
        select(GeneratedContent)
        .where(GeneratedContent.status.in_(["scheduled", "queued", "publishing"]))
        .order_by(GeneratedContent.scheduled_for.asc().nulls_last())
    )
    posts = result.scalars().all()

    items = [
        QueueItem(
            content_id=str(p.id),
            content_type=p.content_type,
            status=p.status,
            scheduled_for=p.scheduled_for.isoformat() if p.scheduled_for else None,
            caption=(p.caption[:100] + "...") if p.caption and len(p.caption) > 100 else p.caption,
        )
        for p in posts
    ]

    return QueueResponse(posts=items, total=len(items))
