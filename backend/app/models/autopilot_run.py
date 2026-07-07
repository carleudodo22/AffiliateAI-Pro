from datetime import datetime
from typing import Any

from sqlalchemy import DateTime, ForeignKey, Integer, JSON, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class AutopilotRun(Base):
    __tablename__ = "autopilot_v2_runs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)

    user_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("users.id"),
        nullable=False,
        index=True,
    )

    niche: Mapped[str] = mapped_column(String(120), index=True)
    target_audience: Mapped[str | None] = mapped_column(Text, nullable=True)

    objective: Mapped[str] = mapped_column(String(80))
    main_channel: Mapped[str] = mapped_column(String(80))
    budget_style: Mapped[str] = mapped_column(String(80))
    campaign_style: Mapped[str] = mapped_column(String(80))

    selected_product: Mapped[str] = mapped_column(String(180))
    marketplace: Mapped[str] = mapped_column(String(80))
    score: Mapped[int] = mapped_column(Integer)
    decision: Mapped[str] = mapped_column(String(120))

    strategy: Mapped[str] = mapped_column(Text)
    headline: Mapped[str] = mapped_column(Text)
    short_copy: Mapped[str] = mapped_column(Text)
    video_script: Mapped[str] = mapped_column(Text)
    image_brief: Mapped[str] = mapped_column(Text)
    voiceover_script: Mapped[str] = mapped_column(Text)

    checklist: Mapped[list[str]] = mapped_column(JSON)
    campaign_package: Mapped[dict[str, Any]] = mapped_column(JSON)

    status: Mapped[str] = mapped_column(String(80), default="completed")

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        index=True,
    )