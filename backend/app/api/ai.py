from pydantic import BaseModel
from fastapi import APIRouter

from app.services.ai_engine import ai_engine


router = APIRouter(
    prefix="/api/ai",
    tags=["AI Engine"],
)


class AITestRequest(BaseModel):
    prompt: str


@router.get("/status")
def get_ai_status():
    return ai_engine.get_status()


@router.post("/test")
def test_ai_engine(data: AITestRequest):
    result = ai_engine.generate_text(
        system_prompt="Você é o AI Engine central do AffiliateAI Pro.",
        user_prompt=data.prompt,
        fallback_text=f"Teste recebido: {data.prompt}",
    )

    return {
        "status": "ok",
        "result": result,
        "engine": ai_engine.get_status(),
    }