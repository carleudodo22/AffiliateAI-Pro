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


class AutopilotRequest(BaseModel):
    niche: str = Field(..., min_length=2)
    target_audience: str | None = None

    objective: AutopilotObjective = "vender"
    main_channel: TrafficChannel = "tiktok"
    budget_style: BudgetStyle = "organico"
    campaign_style: CampaignStyle = "viral"

    preferred_marketplaces: list[MarketplaceName] = Field(
        default_factory=lambda: ["shopee", "mercado_livre", "amazon", "hotmart"]
    )


class AutopilotHistoryItem(BaseModel):
    id: int
    niche: str
    objective: str
    main_channel: str
    budget_style: str
    campaign_style: str
    status: str
    created_at: datetime

    model_config = {
        "from_attributes": True,
    }


class AutopilotResponse(BaseModel):
    id: int | None = None
    agent: str = "Affiliate Autopilot"
    status: str = "completed"

    niche: str
    objective: str
    main_channel: str
    budget_style: str
    campaign_style: str

    package: dict[str, Any]