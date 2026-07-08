from datetime import datetime
from typing import Any

from pydantic import BaseModel


class ContentGeneratorRequest(BaseModel):
    product_name: str = "produto tendência"
    niche: str = "beleza"

    platform: str | None = None
    main_channel: str | None = None
    channel: str | None = None

    content_type: str = "short_video"
    objective: str = "vender"
    campaign_style: str = "viral"

    target_audience: str | None = None
    product_url: str | None = None
    keywords: str | None = None


class ContentGeneratorResponse(BaseModel):
    id: int | None = None
    agent: str = "Content Generator Agent"
    status: str = "completed"

    product_name: str
    niche: str
    platform: str
    content_type: str

    target_audience: str

    headline: str
    caption: str
    script: str
    short_copy: str

    hashtags: list[str] = []
    ctas: list[str] = []

    generated_content: str
    content_package: dict[str, Any] = {}

    created_at: datetime | None = None

    model_config = {
        "from_attributes": True,
    }


class ContentGeneratorHistoryItem(BaseModel):
    id: int

    product_name: str
    niche: str
    platform: str
    content_type: str

    headline: str
    status: str
    created_at: datetime

    model_config = {
        "from_attributes": True,
    }