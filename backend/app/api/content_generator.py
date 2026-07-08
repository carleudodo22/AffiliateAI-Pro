from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.security import get_current_user
from app.db.session import get_db
from app.models.content_generation import ContentGeneration
from app.models.user import User
from app.schemas.content_generator import (
    ContentGeneratorHistoryItem,
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
    return service.generate_content(
        data=data,
        db=db,
        current_user=current_user,
    )


@router.get("/history", response_model=list[ContentGeneratorHistoryItem])
def list_content_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    contents = (
        db.query(ContentGeneration)
        .filter(ContentGeneration.user_id == current_user.id)
        .order_by(ContentGeneration.created_at.desc())
        .limit(30)
        .all()
    )

    return [service.normalize_history_item(content) for content in contents]


@router.get("/{content_id}", response_model=ContentGeneratorResponse)
def get_content_generation(
    content_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    content = (
        db.query(ContentGeneration)
        .filter(ContentGeneration.id == content_id)
        .filter(ContentGeneration.user_id == current_user.id)
        .first()
    )

    if content is None:
        raise HTTPException(
            status_code=404,
            detail="Conteúdo não encontrado.",
        )

    return service.get_content_response(content)


@router.delete("/{content_id}")
def delete_content_generation(
    content_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    content = (
        db.query(ContentGeneration)
        .filter(ContentGeneration.id == content_id)
        .filter(ContentGeneration.user_id == current_user.id)
        .first()
    )

    if content is None:
        raise HTTPException(
            status_code=404,
            detail="Conteúdo não encontrado.",
        )

    db.delete(content)
    db.commit()

    return {
        "status": "deleted",
        "message": "Conteúdo removido com sucesso.",
    }