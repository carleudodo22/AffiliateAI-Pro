from datetime import datetime
from typing import Any

from pydantic import BaseModel


class CampaignPackageRequest(BaseModel):
    product_name: str = "produto tendência"
    niche: str = "beleza"
    marketplace: str = "shopee"

    average_price: float = 119.90
    commission_percent: float = 12

    target_audience: str = "pessoas interessadas em soluções práticas"
    objective: str = "vender"
    main_channel: str = "tiktok"
    campaign_style: str = "viral"
    budget_style: str = "organico"

    product_url: str | None = None
    affiliate_link: str | None = None


class CampaignPackageUpdateRequest(BaseModel):
    product_name: str | None = None
    niche: str | None = None
    marketplace: str | None = None

    score: str | None = None
    decision: str | None = None

    package_text: str | None = None
    status: str | None = None

    source_data: dict[str, Any] | None = None


class CampaignPackageResponse(BaseModel):
    id: int

    product_name: str
    niche: str
    marketplace: str

    score: str
    decision: str

    package_text: str
    source_data: dict[str, Any]

    status: str
    created_at: datetime

    model_config = {
        "from_attributes": True,
    }