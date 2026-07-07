from datetime import datetime
from typing import Any

from sqlalchemy import DateTime, ForeignKey, Integer, JSON, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class ContentGeneration(Base):
    __tablename__ = "content_generator_v2_runs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)

    user_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("users.id"),
        nullable=False,
        index=True,
    )

    product_name: Mapped[str] = mapped_column(String(180), index=True)
    niche: Mapped[str] = mapped_column(String(120), index=True)
    target_audience: Mapped[str | None] = mapped_column(Text, nullable=True)

    platform: Mapped[str] = mapped_column(String(80))
    tone: Mapped[str] = mapped_column(String(80))
    objective: Mapped[str] = mapped_column(String(80))

    headline: Mapped[str] = mapped_column(Text)
    short_copy: Mapped[str] = mapped_column(Text)
    caption: Mapped[str] = mapped_column(Text)
    video_script: Mapped[str] = mapped_column(Text)
    whatsapp_text: Mapped[str] = mapped_column(Text)
    cta: Mapped[str] = mapped_column(Text)

    hashtags: Mapped[list[str]] = mapped_column(JSON)
    ad_variations: Mapped[list[str]] = mapped_column(JSON)

    content_package: Mapped[dict[str, Any]] = mapped_column(JSON)

    status: Mapped[str] = mapped_column(String(80), default="completed")

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        index=True,
    )