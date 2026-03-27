from datetime import datetime

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_db
from app.models.content import GeneratedContent

router = APIRouter(prefix="/analytics", tags=["analytics"])


# ---------- Response models ----------


class OverviewMetrics(BaseModel):
    total_posts: int
    posts_this_week: int
    posts_this_month: int
    avg_quality_score: float | None
    content_type_breakdown: dict[str, int]


class PostAnalyticsItem(BaseModel):
    content_id: str
    content_type: str
    caption: str | None
    quality_score: float | None
    status: str
    posted_at: str | None
    ig_media_id: str | None


class PostAnalyticsResponse(BaseModel):
    posts: list[PostAnalyticsItem]
    total: int
    page: int
    page_size: int


class Recommendation(BaseModel):
    type: str
    title: str
    description: str
    priority: str  # "high" | "medium" | "low"


class RecommendationsResponse(BaseModel):
    recommendations: list[Recommendation]


# ---------- Endpoints ----------


@router.get("/overview", response_model=OverviewMetrics)
async def get_overview(
    brand_id: str | None = Query(None, description="Filter by brand ID"),
    db: AsyncSession = Depends(get_db),
):
    """Get high-level posting analytics overview."""
    base_query = select(GeneratedContent).where(GeneratedContent.status == "posted")
    if brand_id:
        base_query = base_query.where(GeneratedContent.brand_id == brand_id)

    result = await db.execute(base_query)
    posted = result.scalars().all()

    now = datetime.utcnow()

    # Count posts by time window
    posts_this_week = sum(
        1 for p in posted if p.posted_at and (now - p.posted_at).days < 7
    )
    posts_this_month = sum(
        1 for p in posted if p.posted_at and (now - p.posted_at).days < 30
    )

    # Average quality score
    scores = [p.quality_score for p in posted if p.quality_score is not None]
    avg_score = round(sum(scores) / len(scores), 1) if scores else None

    # Content type breakdown
    type_counts: dict[str, int] = {}
    for p in posted:
        type_counts[p.content_type] = type_counts.get(p.content_type, 0) + 1

    return OverviewMetrics(
        total_posts=len(posted),
        posts_this_week=posts_this_week,
        posts_this_month=posts_this_month,
        avg_quality_score=avg_score,
        content_type_breakdown=type_counts,
    )


@router.get("/posts", response_model=PostAnalyticsResponse)
async def get_post_analytics(
    brand_id: str | None = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    """Get per-post analytics with pagination."""
    query = (
        select(GeneratedContent)
        .where(GeneratedContent.status == "posted")
        .order_by(GeneratedContent.posted_at.desc())
    )
    if brand_id:
        query = query.where(GeneratedContent.brand_id == brand_id)

    # Count total
    count_result = await db.execute(
        select(func.count())
        .select_from(GeneratedContent)
        .where(GeneratedContent.status == "posted")
    )
    total = count_result.scalar() or 0

    # Paginate
    query = query.offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(query)
    posts = result.scalars().all()

    items = [
        PostAnalyticsItem(
            content_id=str(p.id),
            content_type=p.content_type,
            caption=(p.caption[:100] + "...") if p.caption and len(p.caption) > 100 else p.caption,
            quality_score=p.quality_score,
            status=p.status,
            posted_at=p.posted_at.isoformat() if p.posted_at else None,
            ig_media_id=p.ig_media_id,
        )
        for p in posts
    ]

    return PostAnalyticsResponse(
        posts=items,
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get("/recommendations", response_model=RecommendationsResponse)
async def get_recommendations(
    brand_id: str | None = Query(None),
    db: AsyncSession = Depends(get_db),
):
    """Get AI-powered posting recommendations based on analytics data."""
    recommendations: list[Recommendation] = []

    # Query recent posts for analysis
    query = (
        select(GeneratedContent)
        .where(GeneratedContent.status == "posted")
        .order_by(GeneratedContent.posted_at.desc())
        .limit(50)
    )
    if brand_id:
        query = query.where(GeneratedContent.brand_id == brand_id)

    result = await db.execute(query)
    recent_posts = result.scalars().all()

    if not recent_posts:
        recommendations.append(
            Recommendation(
                type="getting_started",
                title="Create your first post",
                description="Start by generating and publishing content to build your analytics baseline.",
                priority="high",
            )
        )
        return RecommendationsResponse(recommendations=recommendations)

    # Analyze content type distribution
    type_counts: dict[str, int] = {}
    for p in recent_posts:
        type_counts[p.content_type] = type_counts.get(p.content_type, 0) + 1

    if "reel" not in type_counts or type_counts.get("reel", 0) < len(recent_posts) * 0.3:
        recommendations.append(
            Recommendation(
                type="content_mix",
                title="Post more Reels",
                description="Reels typically get 2-3x more reach than static posts. Aim for 30%+ of your content as Reels.",
                priority="high",
            )
        )

    if "carousel" not in type_counts:
        recommendations.append(
            Recommendation(
                type="content_mix",
                title="Try carousel posts",
                description="Carousel posts drive higher engagement and saves. Great for educational or step-by-step content.",
                priority="medium",
            )
        )

    # Check posting consistency
    posted_dates = [p.posted_at.date() for p in recent_posts if p.posted_at]
    if posted_dates:
        unique_weeks = len(set(d.isocalendar()[1] for d in posted_dates))
        avg_per_week = len(posted_dates) / max(unique_weeks, 1)
        if avg_per_week < 3:
            recommendations.append(
                Recommendation(
                    type="consistency",
                    title="Increase posting frequency",
                    description=f"You're averaging {avg_per_week:.1f} posts/week. Aim for 3-5 posts/week for optimal growth.",
                    priority="medium",
                )
            )

    # Check quality scores
    scores = [p.quality_score for p in recent_posts if p.quality_score is not None]
    if scores:
        avg_score = sum(scores) / len(scores)
        if avg_score < 80:
            recommendations.append(
                Recommendation(
                    type="quality",
                    title="Improve content quality",
                    description=f"Average quality score is {avg_score:.0f}/100. Review low-scoring posts and adjust your brand settings.",
                    priority="high",
                )
            )

    return RecommendationsResponse(recommendations=recommendations)
