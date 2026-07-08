from datetime import datetime

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class AffiliateProduct(Base):
    __tablename__ = "affiliate_products"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)

    user_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("users.id"),
        nullable=False,
        index=True,
    )

    product_name: Mapped[str] = mapped_column(String(180), index=True)
    niche: Mapped[str] = mapped_column(String(120), index=True)
    marketplace: Mapped[str] = mapped_column(String(80), index=True)

    product_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    affiliate_link: Mapped[str | None] = mapped_column(Text, nullable=True)

    average_price: Mapped[float] = mapped_column(Float, default=0)
    commission_percent: Mapped[float] = mapped_column(Float, default=0)

    status: Mapped[str] = mapped_column(
        String(80),
        default="precisa_se_afiliar",
        index=True,
    )

    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

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