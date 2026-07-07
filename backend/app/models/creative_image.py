from datetime import datetime
from typing import Any

from sqlalchemy import DateTime, ForeignKey, Integer, JSON, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class CreativeImageGeneration(Base):
    __tablename__ = "creative_image_v1_runs"

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
    creative_style: Mapped[str] = mapped_column(String(80))
    objective: Mapped[str] = mapped_column(String(80))

    art_headline: Mapped[str] = mapped_column(Text)
    art_subtitle: Mapped[str] = mapped_column(Text)
    cta: Mapped[str] = mapped_column(Text)

    visual_brief: Mapped[str] = mapped_column(Text)
    image_prompt: Mapped[str] = mapped_column(Text)
    negative_prompt: Mapped[str] = mapped_column(Text)

    layout_direction: Mapped[str] = mapped_column(Text)
    background_style: Mapped[str] = mapped_column(Text)
    typography_direction: Mapped[str] = mapped_column(Text)

    color_palette: Mapped[list[str]] = mapped_column(JSON)
    checklist: Mapped[list[str]] = mapped_column(JSON)
    creative_package: Mapped[dict[str, Any]] = mapped_column(JSON)

    status: Mapped[str] = mapped_column(String(80), default="completed")

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        index=True,
    )