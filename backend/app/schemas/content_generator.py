from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, Field


ContentPlatform = Literal[
    "tiktok",
    "instagram",
    "youtube_shorts",
    "whatsapp",
    "facebook_ads",
    "google",
]

ContentTone = Literal[
    "viral",
    "direto",
    "premium",
    "emocional",
    "agressivo",
    "popular",
]

ContentObjective = Literal[
    "vender",
    "capturar_lead",
    "aquecer_audiencia",
    "validar_produto",
]


class ContentGeneratorRequest(BaseModel):
    product_name: str = Field(..., min_length=2)
    niche: str = Field(..., min_length=2)
    target_audience: str | None = None

    platform: ContentPlatform = "tiktok"
    tone: ContentTone = "viral"
    objective: ContentObjective = "vender"


class ContentGeneratorResponse(BaseModel):
    id: int | None = None

    agent: str
    status: str

    product_name: str
    niche: str
    target_audience: str | None = None

    platform: str
    tone: str
    objective: str

    headline: str
    short_copy: str
    caption: str
    video_script: str
    whatsapp_text: str
    cta: str

    hashtags: list[str]
    ad_variations: list[str]

    content_package: dict[str, Any]

    created_at: datetime | None = None


class ContentGeneratorHistoryItem(BaseModel):
    id: int

    product_name: str
    niche: str
    platform: str
    tone: str
    objective: str

    headline: str
    status: str
    created_at: datetime

    model_config = {
        "from_attributes": True,
    }