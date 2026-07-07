from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, Field


CreativePlatform = Literal[
    "tiktok",
    "instagram",
    "youtube_shorts",
    "whatsapp",
    "facebook_ads",
    "google",
    "pinterest",
]

CreativeStyle = Literal[
    "viral",
    "direto",
    "premium",
    "popular",
    "emocional",
    "agressivo",
    "minimalista",
]

CreativeObjective = Literal[
    "vender",
    "capturar_lead",
    "aquecer_audiencia",
    "validar_produto",
]


class CreativeImageRequest(BaseModel):
    product_name: str = Field(..., min_length=2)
    niche: str = Field(..., min_length=2)
    target_audience: str | None = None

    platform: CreativePlatform = "tiktok"
    creative_style: CreativeStyle = "viral"
    objective: CreativeObjective = "vender"


class CreativeImageResponse(BaseModel):
    id: int | None = None

    agent: str
    status: str

    product_name: str
    niche: str
    target_audience: str | None = None

    platform: str
    creative_style: str
    objective: str

    art_headline: str
    art_subtitle: str
    cta: str

    visual_brief: str
    image_prompt: str
    negative_prompt: str

    layout_direction: str
    background_style: str
    typography_direction: str

    color_palette: list[str]
    checklist: list[str]
    creative_package: dict[str, Any]

    created_at: datetime | None = None


class CreativeImageHistoryItem(BaseModel):
    id: int

    product_name: str
    niche: str
    platform: str
    creative_style: str
    objective: str

    art_headline: str
    status: str
    created_at: datetime

    model_config = {
        "from_attributes": True,
    }