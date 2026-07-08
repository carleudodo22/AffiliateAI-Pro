from datetime import datetime
from typing import Any

from pydantic import BaseModel


class CampaignFlowRequest(BaseModel):
    niche: str | None = None
    target_audience: str | None = None

    objective: str = "vender"
    main_channel: str = "tiktok"
    budget_style: str = "organico"
    campaign_style: str = "viral"

    use_auto_pick: bool = True
    product_id: int | None = None


class CampaignFlowProduct(BaseModel):
    id: int | None = None
    product_name: str
    niche: str
    marketplace: str
    average_price: float = 0
    commission_percent: float = 0
    product_url: str | None = None
    affiliate_link: str | None = None
    source: str


class CampaignFlowResponse(BaseModel):
    status: str
    message: str

    saved_package_id: int

    product: CampaignFlowProduct

    score: str
    decision: str

    headline: str
    short_copy: str
    video_script: str
    image_brief: str
    voiceover_script: str

    package_text: str
    source_data: dict[str, Any]

    created_at: datetime