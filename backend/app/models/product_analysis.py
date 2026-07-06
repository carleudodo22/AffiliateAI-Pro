from datetime import datetime

from sqlalchemy import DateTime, Float, Integer, String, Text, JSON
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class ProductAnalysis(Base):
    __tablename__ = "product_analyses"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)

    niche: Mapped[str] = mapped_column(String(120), index=True)
    product_name: Mapped[str] = mapped_column(String(180), index=True)
    marketplace: Mapped[str] = mapped_column(String(80))
    main_channel: Mapped[str] = mapped_column(String(80))

    target_audience: Mapped[str | None] = mapped_column(Text, nullable=True)

    average_price: Mapped[float] = mapped_column(Float)
    commission_percent: Mapped[float] = mapped_column(Float)
    estimated_competition: Mapped[int] = mapped_column(Integer)
    trend_signal: Mapped[int] = mapped_column(Integer)

    decision: Mapped[str] = mapped_column(String(80))
    final_score: Mapped[int] = mapped_column(Integer)

    result_data: Mapped[dict] = mapped_column(JSON)

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        index=True,
    )