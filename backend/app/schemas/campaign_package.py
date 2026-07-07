from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field


class CampaignPackageSaveRequest(BaseModel):
    product_name: str = Field(..., min_length=1)
    niche: str = Field(..., min_length=1)
    marketplace: str = "não definido"

    score: str = "--"
    decision: str = "não definida"

    package_text: str = Field(..., min_length=10)
    source_data: dict[str, Any] = {}


class CampaignPackageResponse(BaseModel):
    id: int
    user_id: int

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


class CampaignPackageHistoryItem(BaseModel):
    id: int

    product_name: str
    niche: str
    marketplace: str

    score: str
    decision: str

    status: str
    created_at: datetime

    model_config = {
        "from_attributes": True,
    }