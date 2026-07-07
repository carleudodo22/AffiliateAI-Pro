from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field

from app.schemas.product_hunter import MarketplaceName, TrafficChannel


ContentPlatform = Literal[
    "tiktok",
    "instagram",
    "instagram_reels",
    "youtube_shorts",
    "whatsapp",
    "facebook_ads",
    "all",
]

ContentTone = Literal[
    "direto",
    "emocional",
    "urgente",
    "premium",
    "popular",
    "engracado",
]

ContentObjective = Literal[
    "vender",
    "validar_produto",
    "aquecer_audiencia",
    "capturar_lead",
]


class ContentGeneratorRequest(BaseModel):
    analysis_id: int | None = None

    niche: str = Field(..., min_length=2, examples=["beleza"])
    product_name: str = Field(..., min_length=2, examples=["escova secadora"])

    target_audience: str | None = Field(
        default=None,
        examples=["mulheres de 20 a 35 anos interessadas em autocuidado"],
    )

    marketplace: MarketplaceName = "generic"
    main_channel: TrafficChannel = "tiktok"

    platform: ContentPlatform = "all"
    tone: ContentTone = "direto"
    objective: ContentObjective = "vender"


class GeneratedContentPackage(BaseModel):
    headline: str
    product_description: str
    short_sales_copy: str
    video_hooks: list[str]
    video_scripts: list[str]
    instagram_caption: str
    tiktok_caption: str
    whatsapp_message: str
    ad_copy: str
    ctas: list[str]
    hashtags: list[str]


class ContentGeneratorResponse(BaseModel):
    id: int | None = None
    source_analysis_id: int | None = None
    agent: str
    niche: str
    product_name: str
    platform: str
    tone: str
    objective: str
    content: GeneratedContentPackage


class ContentGenerationHistoryItem(BaseModel):
    id: int
    source_analysis_id: int | None
    niche: str
    product_name: str
    platform: str
    tone: str
    objective: str
    created_at: datetime

    model_config = {
        "from_attributes": True,
    }