from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field


class ProductHunterRequest(BaseModel):
    product_name: str = Field(..., min_length=2)
    niche: str = Field(..., min_length=2)
    marketplace: str = "shopee"

    average_price: float = 0
    commission_percent: float = 0

    target_audience: str | None = None
    product_url: str | None = None

    traffic_channel: str | None = "tiktok"
    competition_level: str | None = "media"


class ProductHunterStrategy(BaseModel):
    target_audience: str = "Público não informado"
    content_angles: list[str] = []
    recommended_channels: list[str] = []


class ProductHunterResponse(BaseModel):
    id: int | None = None
    agent: str = "Product Hunter Agent"
    status: str = "completed"

    product_name: str
    niche: str
    marketplace: str = "não definido"

    average_price: float = 0
    commission_percent: float = 0

    score: str = "--"
    decision: str = "não definido"
    summary: str = "Resumo não disponível."

    strengths: list[str] = []
    weaknesses: list[str] = []
    opportunities: list[str] = []
    risks: list[str] = []

    target_audience: str = "Público não informado"
    content_angles: list[str] = []
    recommended_channels: list[str] = []

    analysis_package: dict[str, Any] = {}

    created_at: datetime | None = None

    model_config = {
        "from_attributes": True,
    }


class ProductHunterHistoryItem(BaseModel):
    id: int

    product_name: str
    niche: str
    marketplace: str = "não definido"

    score: str = "--"
    decision: str = "não definido"
    status: str = "completed"

    created_at: datetime

    model_config = {
        "from_attributes": True,
    }