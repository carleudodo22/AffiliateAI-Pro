from datetime import datetime
from typing import Any

from sqlalchemy import DateTime, ForeignKey, Integer, JSON, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class WorkspaceProfile(Base):
    __tablename__ = "workspace_profiles"

    __table_args__ = (
        UniqueConstraint("user_id", name="uq_workspace_profiles_user_id"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)

    user_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("users.id"),
        nullable=False,
        index=True,
    )

    project_name: Mapped[str] = mapped_column(
        String(160),
        default="AffiliateAI Pro",
    )

    brand_name: Mapped[str] = mapped_column(
        String(160),
        default="",
    )

    default_target_audience: Mapped[str] = mapped_column(
        Text,
        default="pessoas interessadas em soluções práticas e ofertas úteis",
    )

    default_cta: Mapped[str] = mapped_column(
        String(220),
        default="Clique no link e confira a oferta.",
    )

    tone: Mapped[str] = mapped_column(
        String(80),
        default="direto",
        index=True,
    )

    visual_style: Mapped[str] = mapped_column(
        String(80),
        default="premium_dark",
        index=True,
    )

    language: Mapped[str] = mapped_column(
        String(20),
        default="pt-BR",
    )

    preferred_words: Mapped[list[str]] = mapped_column(
        JSON,
        default=list,
    )

    forbidden_words: Mapped[list[str]] = mapped_column(
        JSON,
        default=list,
    )

    notes: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    extra_data: Mapped[dict[str, Any]] = mapped_column(
        JSON,
        default=dict,
    )

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