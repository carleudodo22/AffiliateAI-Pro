from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class UserSettings(Base):
    __tablename__ = "user_settings"

    __table_args__ = (
        UniqueConstraint("user_id", name="uq_user_settings_user_id"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)

    user_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("users.id"),
        nullable=False,
        index=True,
    )

    default_niche: Mapped[str] = mapped_column(String(120), default="beleza")
    default_channel: Mapped[str] = mapped_column(String(80), default="tiktok")
    default_campaign_style: Mapped[str] = mapped_column(String(80), default="viral")
    default_budget_style: Mapped[str] = mapped_column(String(80), default="organico")
    default_marketplace: Mapped[str] = mapped_column(String(80), default="shopee")
    language: Mapped[str] = mapped_column(String(20), default="pt-BR")

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        index=True,
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        index=True,
    )