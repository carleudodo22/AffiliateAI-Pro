from datetime import datetime
from typing import Any

from sqlalchemy import DateTime, ForeignKey, Integer, JSON, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class CampaignPackageRun(Base):
    __tablename__ = "campaign_package_v1_runs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)

    user_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("users.id"),
        nullable=False,
        index=True,
    )

    product_name: Mapped[str] = mapped_column(String(180), index=True)
    niche: Mapped[str] = mapped_column(String(120), index=True)
    marketplace: Mapped[str] = mapped_column(String(80), default="não definido")

    score: Mapped[str] = mapped_column(String(30), default="--")
    decision: Mapped[str] = mapped_column(String(180), default="não definida")

    package_text: Mapped[str] = mapped_column(Text)
    source_data: Mapped[dict[str, Any]] = mapped_column(JSON)

    status: Mapped[str] = mapped_column(String(80), default="saved")

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        index=True,
    )