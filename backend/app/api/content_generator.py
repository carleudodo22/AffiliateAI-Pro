from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.security import get_current_user
from app.db.session import get_db
from app.models.content_generation import ContentGeneration
from app.models.product_analysis import ProductAnalysis
from app.models.user import User
from app.schemas.content_generator import (
    ContentGenerationHistoryItem,
    ContentGeneratorRequest,
    ContentGeneratorResponse,
)
from app.services.content_generator import ContentGeneratorService


router = APIRouter(
    prefix="/api/content-generator",
    tags=["Content Generator"],
)

service = ContentGeneratorService()


@router.post("/generate", response_model=ContentGeneratorResponse)
def generate_content(
    data: ContentGeneratorRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if data.analysis_id is not None:
        analysis = (
            db.query(ProductAnalysis)
            .filter(ProductAnalysis.id == data.analysis_id)
            .filter(ProductAnalysis.user_id == current_user.id)
            .first()
        )

        if analysis is None:
            raise HTTPException(
                status_code=404,
                detail="Análise não encontrada para este usuário.",
            )

    return service.generate_content(
        data=data,
        db=db,
        current_user=current_user,
    )


@router.get("/history", response_model=list[ContentGenerationHistoryItem])
def list_content_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return (
        db.query(ContentGeneration)
        .filter(ContentGeneration.user_id == current_user.id)
        .order_by(ContentGeneration.created_at.desc())
        .limit(20)
        .all()
    )


@router.get("/{content_id}", response_model=ContentGeneratorResponse)
def get_content_generation(
    content_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    content_generation = (
        db.query(ContentGeneration)
        .filter(ContentGeneration.id == content_id)
        .filter(ContentGeneration.user_id == current_user.id)
        .first()
    )

    if content_generation is None:
        raise HTTPException(
            status_code=404,
            detail="Conteúdo não encontrado.",
        )

    data = content_generation.generated_data
    data["id"] = content_generation.id

    return data