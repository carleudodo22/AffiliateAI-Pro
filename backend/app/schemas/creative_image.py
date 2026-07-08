from datetime import datetime
from typing import Any

from pydantic import BaseModel


class CreativeImageRequest(BaseModel):
    product_name: str = "produto tendência"
    niche: str = "beleza"

    platform: str | None = None
    main_channel: str | None = None
    channel: str | None = None

    campaign_style: str = "viral"
    image_style: str | None = None
    visual_style: str | None = None

    target_audience: str | None = None
    product_url: str | None = None
    extra_instructions: str | None = None


class CreativeImageResponse(BaseModel):
    id: int | None = None
    agent: str = "Creative Image Agent"
    status: str = "completed"

    product_name: str
    niche: str
    platform: str

    campaign_style: str
    visual_style: str

    target_audience: str

    image_prompt: str
    negative_prompt: str
    image_brief: str
    design_direction: str
    text_overlay: str
    color_direction: str
    composition: str

    creative_package: dict[str, Any] = {}

    created_at: datetime | None = None

    model_config = {
        "from_attributes": True,
    }


class CreativeImageHistoryItem(BaseModel):
    id: int

    product_name: str
    niche: str
    platform: str

    visual_style: str
    status: str
    created_at: datetime

    model_config = {
        "from_attributes": True,
    }