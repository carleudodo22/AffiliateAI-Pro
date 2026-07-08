from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, Field


AutopilotObjective = Literal[
    "vender",
    "validar_produto",
    "aquecer_audiencia",
    "capturar_lead",
]

BudgetStyle = Literal[
    "organico",
    "baixo_orcamento",
    "trafego_pago",
]

CampaignStyle = Literal[
    "direto",
    "viral",
    "premium",
    "popular",
    "emocional",
    "agressivo",
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


class AutopilotRequest(BaseModel):
    niche: str = Field(..., min_length=2)
    target_audience: str | None = None

    objective: AutopilotObjective = "vender"
    main_channel: TrafficChannel = "tiktok"
    budget_style: BudgetStyle = "organico"
    campaign_style: CampaignStyle = "viral"

    use_auto_pick: bool = False


class AutopilotResponse(BaseModel):
    id: int | None = None
    agent: str
    status: str

    niche: str
    target_audience: str | None = None

    objective: str
    main_channel: str
    budget_style: str
    campaign_style: str

    selected_product: str
    marketplace: str
    score: int
    decision: str

    strategy: str
    headline: str
    short_copy: str
    video_script: str
    image_brief: str
    voiceover_script: str

    checklist: list[str]
    campaign_package: dict[str, Any]

    created_at: datetime | None = None


class AutopilotHistoryItem(BaseModel):
    id: int
    niche: str
    selected_product: str
    marketplace: str
    score: int
    decision: str
    main_channel: str
    campaign_style: str
    status: str
    created_at: datetime

    model_config = {
        "from_attributes": True,
    }