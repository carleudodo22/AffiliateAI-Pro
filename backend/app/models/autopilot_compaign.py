from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text, JSON
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class AutopilotCampaign(Base):
    __tablename__ = "autopilot_campaigns"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)

    user_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("users.id"),
        nullable=False,
        index=True,
    )

    niche: Mapped[str] = mapped_column(String(120), index=True)
    objective: Mapped[str] = mapped_column(String(80))
    main_channel: Mapped[str] = mapped_column(String(80))
    budget_style: Mapped[str] = mapped_column(String(80))
    campaign_style: Mapped[str] = mapped_column(String(80))

    target_audience: Mapped[str | None] = mapped_column(Text, nullable=True)

    campaign_data: Mapped[dict] = mapped_column(JSON)

    status: Mapped[str] = mapped_column(String(80), default="completed")

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        index=True,
    )