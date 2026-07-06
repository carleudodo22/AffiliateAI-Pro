from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


MarketplaceName = Literal[
    "shopee",
    "mercado_livre",
    "amazon",
    "hotmart",
    "kiwify",
    "monetizze",
    "generic",
]

TrafficChannel = Literal[
    "tiktok",
    "instagram",
    "youtube_shorts",
    "google",
    "facebook_ads",
    "whatsapp",
    "pinterest",
]


class ProductHunterRequest(BaseModel):
    niche: str = Field(
        ...,
        min_length=2,
        examples=["beleza", "fitness", "automotivo"],
    )

    product_name: str | None = Field(
        default=None,
        examples=["escova secadora"],
    )

    target_audience: str | None = Field(
        default=None,
        examples=["mulheres de 20 a 35 anos interessadas em autocuidado"],
    )

    marketplace: MarketplaceName = "generic"

    main_channel: TrafficChannel = "tiktok"

    average_price: float = Field(
        ...,
        gt=0,
        examples=[97.90],
    )

    commission_percent: float = Field(
        ...,
        ge=1,
        le=100,
        examples=[12],
    )

    estimated_competition: int = Field(
        default=50,
        ge=0,
        le=100,
        description="Nível estimado de concorrência de 0 a 100.",
    )

    trend_signal: int = Field(
        default=50,
        ge=0,
        le=100,
        description="Força percebida da tendência de 0 a 100.",
    )


class ProductScoreBreakdown(BaseModel):
    demand_score: int
    virality_score: int
    profit_score: int
    competition_score: int
    saturation_risk: int
    final_score: int


class ProductHunterStrategy(BaseModel):
    positioning: str
    sales_angle: str
    content_ideas: list[str]
    offer_structure: str
    recommended_channels: list[str]
    warnings: list[str]


class ProductHunterResponse(BaseModel):
    id: int | None = None
    agent: str
    niche: str
    product_name: str
    marketplace: str
    decision: str
    score: ProductScoreBreakdown
    strategy: ProductHunterStrategy


class ProductAnalysisHistoryItem(BaseModel):
    id: int
    niche: str
    product_name: str
    marketplace: str
    main_channel: str
    decision: str
    final_score: int
    created_at: datetime

    model_config = {
        "from_attributes": True,
    }