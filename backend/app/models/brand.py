import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, func
from sqlalchemy.dialects.postgresql import JSON, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db import Base


class Brand(Base):
    __tablename__ = "brands"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    niche: Mapped[str | None] = mapped_column(String(255))

    # Visual identity
    primary_color: Mapped[str | None] = mapped_column(String(7))
    secondary_color: Mapped[str | None] = mapped_column(String(7))
    accent_color: Mapped[str | None] = mapped_column(String(7))
    logo_url: Mapped[str | None] = mapped_column(String(1024))
    font_headline: Mapped[str | None] = mapped_column(String(255))
    font_body: Mapped[str | None] = mapped_column(String(255))

    # Tone & voice
    tone_formality: Mapped[str | None] = mapped_column(String(50))
    tone_humor: Mapped[str | None] = mapped_column(String(50))
    voice_description: Mapped[str | None] = mapped_column(String(2000))

    # Content strategy
    content_pillars: Mapped[dict | None] = mapped_column(JSON)
    posting_days: Mapped[dict | None] = mapped_column(JSON)
    posts_per_week: Mapped[int | None] = mapped_column(Integer)
    brand_hashtag: Mapped[str | None] = mapped_column(String(255))

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    user = relationship("User", back_populates="brands")
    contents = relationship("GeneratedContent", back_populates="brand", cascade="all, delete-orphan")
