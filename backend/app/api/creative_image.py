from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.security import get_current_user
from app.db.session import get_db
from app.models.creative_image import CreativeImageGeneration
from app.models.user import User
from app.schemas.creative_image import (
    CreativeImageHistoryItem,
    CreativeImageRequest,
    CreativeImageResponse,
)
from app.services.creative_image import CreativeImageService


router = APIRouter(
    prefix="/api/creative-image",
    tags=["Creative Image Agent"],
)

service = CreativeImageService()


@router.post("/generate", response_model=CreativeImageResponse)
def generate_creative_image(
    data: CreativeImageRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return service.generate_creative(
        data=data,
        db=db,
        current_user=current_user,
    )


@router.get("/history", response_model=list[CreativeImageHistoryItem])
def list_creative_image_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return (
        db.query(CreativeImageGeneration)
        .filter(CreativeImageGeneration.user_id == current_user.id)
        .order_by(CreativeImageGeneration.created_at.desc())
        .limit(30)
        .all()
    )


@router.get("/{creative_id}", response_model=CreativeImageResponse)
def get_creative_image_generation(
    creative_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    creative = (
        db.query(CreativeImageGeneration)
        .filter(CreativeImageGeneration.id == creative_id)
        .filter(CreativeImageGeneration.user_id == current_user.id)
        .first()
    )

    if creative is None:
        raise HTTPException(
            status_code=404,
            detail="Criativo não encontrado.",
        )

    return service.get_creative_response(creative)