from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


ProductStatus = Literal[
    "afiliado",
    "precisa_se_afiliar",
    "pesquisando",
    "pausado",
]


Marketplace = Literal[
    "shopee",
    "mercado_livre",
    "amazon",
    "hotmart",
    "kiwify",
    "monetizze",
    "outro",
]


class AffiliateProductCreateRequest(BaseModel):
    product_name: str = Field(..., min_length=2)
    niche: str = Field(..., min_length=2)
    marketplace: Marketplace = "shopee"

    product_url: str | None = None
    affiliate_link: str | None = None

    average_price: float = 0
    commission_percent: float = 0

    status: ProductStatus = "precisa_se_afiliar"
    notes: str | None = None


class AffiliateProductUpdateRequest(BaseModel):
    product_name: str | None = None
    niche: str | None = None
    marketplace: Marketplace | None = None

    product_url: str | None = None
    affiliate_link: str | None = None

    average_price: float | None = None
    commission_percent: float | None = None

    status: ProductStatus | None = None
    notes: str | None = None
    is_active: bool | None = None


class AffiliateProductResponse(BaseModel):
    id: int
    user_id: int

    product_name: str
    niche: str
    marketplace: str

    product_url: str | None
    affiliate_link: str | None

    average_price: float
    commission_percent: float

    status: str
    notes: str | None

    is_active: bool

    created_at: datetime
    updated_at: datetime

    model_config = {
        "from_attributes": True,
    }