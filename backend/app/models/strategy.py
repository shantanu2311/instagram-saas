"""Strategy Engine SQLAlchemy models."""

import uuid
from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSON
from sqlalchemy.orm import relationship

from app.db import Base


class BusinessProfile(Base):
    __tablename__ = "business_profiles"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, nullable=False)
    brand_id = Column(String, nullable=True, unique=True)
    business_name = Column(String, nullable=False)
    business_description = Column(Text, nullable=True)
    product_service = Column(Text, nullable=True)
    website_url = Column(String, nullable=True)
    target_age_min = Column(Integer, default=18)
    target_age_max = Column(Integer, default=45)
    target_demographics = Column(JSON, default=list)
    target_location = Column(String, nullable=True)
    target_gender = Column(String, default="all")
    competitors = Column(JSON, default=list)
    goals = Column(JSON, default=list)
    content_preferences = Column(JSON, default=list)
    posting_history = Column(String, default="new")
    budget_tier = Column(String, default="free")
    usp = Column(Text, nullable=True)
    key_differentiators = Column(JSON, default=list)
    pain_points = Column(JSON, default=list)
    brand_personality = Column(JSON, default=list)
    existing_content_analysis = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    competitor_accounts = relationship("CompetitorAccount", back_populates="business_profile")
    trend_snapshots = relationship("TrendSnapshot", back_populates="business_profile")
    content_strategy = relationship("ContentStrategy", back_populates="business_profile", uselist=False)
    insights = relationship("StrategyInsight", back_populates="business_profile")


class CompetitorAccount(Base):
    __tablename__ = "competitor_accounts"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    business_profile_id = Column(String, ForeignKey("business_profiles.id"), nullable=False)
    ig_handle = Column(String, nullable=False)
    ig_user_id = Column(String, nullable=True)
    followers_count = Column(Integer, default=0)
    following_count = Column(Integer, default=0)
    media_count = Column(Integer, default=0)
    bio = Column(Text, nullable=True)
    category = Column(String, nullable=True)
    avg_engagement_rate = Column(Float, default=0.0)
    avg_likes = Column(Integer, default=0)
    avg_comments = Column(Integer, default=0)
    posting_frequency_per_week = Column(Float, default=0.0)
    top_content_types = Column(JSON, default=dict)
    top_hashtags = Column(JSON, default=list)
    top_posts = Column(JSON, default=list)
    strengths = Column(JSON, default=list)
    weaknesses = Column(JSON, default=list)
    last_scraped_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    business_profile = relationship("BusinessProfile", back_populates="competitor_accounts")


class TrendSnapshot(Base):
    __tablename__ = "trend_snapshots"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    business_profile_id = Column(String, ForeignKey("business_profiles.id"), nullable=False)
    niche = Column(String, nullable=False)
    snapshot_type = Column(String, nullable=False)
    raw_data = Column(JSON, default=list)
    insights = Column(JSON, default=list)
    viral_posts = Column(JSON, default=list)
    trending_hashtags = Column(JSON, default=list)
    trending_audio = Column(JSON, default=list)
    trending_formats = Column(JSON, default=list)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    business_profile = relationship("BusinessProfile", back_populates="trend_snapshots")


class ContentStrategy(Base):
    __tablename__ = "content_strategies"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    business_profile_id = Column(String, ForeignKey("business_profiles.id"), nullable=False, unique=True)
    user_id = Column(String, nullable=False)
    version = Column(Integer, default=1)
    status = Column(String, default="draft")

    # Strategy sections (each independently approvable)
    brand_positioning = Column(JSON, nullable=True)
    content_pillars = Column(JSON, nullable=True)
    posting_cadence = Column(JSON, nullable=True)
    tone_voice = Column(JSON, nullable=True)
    hashtag_strategy = Column(JSON, nullable=True)
    content_formats = Column(JSON, nullable=True)
    growth_tactics = Column(JSON, nullable=True)
    audience_persona = Column(JSON, nullable=True)
    competitor_insights_summary = Column(Text, nullable=True)

    # Milestones & performance tracking
    milestones = Column(JSON, nullable=True)
    kpi_targets = Column(JSON, nullable=True)
    performance_reviews = Column(JSON, default=list)

    approved_sections = Column(JSON, default=list)
    rejected_sections = Column(JSON, default=list)
    approved_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    business_profile = relationship("BusinessProfile", back_populates="content_strategy")
    inventories = relationship("ContentInventory", back_populates="strategy")


class ContentInventory(Base):
    __tablename__ = "content_inventories"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    strategy_id = Column(String, ForeignKey("content_strategies.id"), nullable=False)
    brand_id = Column(String, nullable=True)
    month = Column(Integer, nullable=False)
    year = Column(Integer, nullable=False)
    total_slots = Column(Integer, default=0)
    slots = Column(JSON, default=list)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    strategy = relationship("ContentStrategy", back_populates="inventories")


class StrategyInsight(Base):
    __tablename__ = "strategy_insights"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    business_profile_id = Column(String, ForeignKey("business_profiles.id"), nullable=False)
    insight_type = Column(String, nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    data_points = Column(JSON, default=list)
    confidence_score = Column(Float, default=0.5)
    actionable = Column(Boolean, default=True)
    action_suggestion = Column(Text, nullable=True)
    source = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    business_profile = relationship("BusinessProfile", back_populates="insights")
