from datetime import datetime
from typing import Literal

from pydantic import BaseModel


DefaultChannel = Literal[
    "tiktok",
    "instagram",
    "youtube_shorts",
    "whatsapp",
    "pinterest",
    "facebook_ads",
    "google",
]

DefaultCampaignStyle = Literal[
    "viral",
    "direto",
    "premium",
    "popular",
    "emocional",
    "agressivo",
    "minimalista",
]

DefaultBudgetStyle = Literal[
    "organico",
    "baixo_orcamento",
    "trafego_pago",
]

DefaultMarketplace = Literal[
    "shopee",
    "mercado_livre",
    "amazon",
    "hotmart",
    "kiwify",
    "monetizze",
]

DefaultLanguage = Literal[
    "pt-BR",
    "en-US",
    "es",
]


class UserSettingsRequest(BaseModel):
    default_niche: str = "beleza"
    default_channel: DefaultChannel = "tiktok"
    default_campaign_style: DefaultCampaignStyle = "viral"
    default_budget_style: DefaultBudgetStyle = "organico"
    default_marketplace: DefaultMarketplace = "shopee"
    language: DefaultLanguage = "pt-BR"


class UserSettingsResponse(BaseModel):
    id: int
    user_id: int

    default_niche: str
    default_channel: str
    default_campaign_style: str
    default_budget_style: str
    default_marketplace: str
    language: str

    created_at: datetime
    updated_at: datetime

    model_config = {
        "from_attributes": True,
    }