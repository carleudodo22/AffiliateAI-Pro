from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel


WorkspaceTone = Literal[
    "direto",
    "premium",
    "viral",
    "emocional",
    "agressivo",
    "educativo",
    "minimalista",
]

WorkspaceVisualStyle = Literal[
    "premium_dark",
    "clean_light",
    "neon",
    "luxury",
    "popular",
    "automotivo",
    "beleza",
]

WorkspaceLanguage = Literal[
    "pt-BR",
    "en-US",
    "es",
]


class WorkspaceProfileRequest(BaseModel):
    project_name: str = "AffiliateAI Pro"
    brand_name: str = ""

    default_target_audience: str = (
        "pessoas interessadas em soluções práticas e ofertas úteis"
    )

    default_cta: str = "Clique no link e confira a oferta."

    tone: WorkspaceTone = "direto"
    visual_style: WorkspaceVisualStyle = "premium_dark"
    language: WorkspaceLanguage = "pt-BR"

    preferred_words: list[str] = []
    forbidden_words: list[str] = []

    notes: str | None = None
    extra_data: dict[str, Any] = {}


class WorkspaceProfileResponse(BaseModel):
    id: int
    user_id: int

    project_name: str
    brand_name: str

    default_target_audience: str
    default_cta: str

    tone: str
    visual_style: str
    language: str

    preferred_words: list[str]
    forbidden_words: list[str]

    notes: str | None
    extra_data: dict[str, Any]

    created_at: datetime
    updated_at: datetime

    model_config = {
        "from_attributes": True,
    }