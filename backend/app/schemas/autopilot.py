from typing import Literal

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
    niche: str = Field(..., min_length=2, examples=["beleza"])
    target_audience: str | None = "pessoas interessadas no nicho"
    objective: AutopilotObjective = "vender"
    main_channel: TrafficChannel = "tiktok"
    budget_style: BudgetStyle = "organico"
    campaign_style: CampaignStyle = "viral"


class AutopilotResponse(BaseModel):
    agent: str
    status: str
    niche: str
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