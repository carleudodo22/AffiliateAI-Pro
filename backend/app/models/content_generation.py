from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text, JSON
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class ContentGeneration(Base):
    __tablename__ = "content_generations"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)

    user_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("users.id"),
        nullable=False,
        index=True,
    )

    source_analysis_id: Mapped[int | None] = mapped_column(
        Integer,
        ForeignKey("product_analyses.id"),
        nullable=True,
        index=True,
    )

    niche: Mapped[str] = mapped_column(String(120), index=True)
    product_name: Mapped[str] = mapped_column(String(180), index=True)
    marketplace: Mapped[str] = mapped_column(String(80))
    main_channel: Mapped[str] = mapped_column(String(80))

    platform: Mapped[str] = mapped_column(String(80))
    tone: Mapped[str] = mapped_column(String(80))
    objective: Mapped[str] = mapped_column(String(80))

    target_audience: Mapped[str | None] = mapped_column(Text, nullable=True)

    generated_data: Mapped[dict] = mapped_column(JSON)

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        index=True,
    )