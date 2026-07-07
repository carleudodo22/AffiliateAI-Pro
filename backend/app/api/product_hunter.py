from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.security import get_current_user
from app.db.session import get_db
from app.models.product_analysis import ProductAnalysis
from app.models.user import User
from app.schemas.product_hunter import (
    ProductAnalysisHistoryItem,
    ProductHunterRequest,
    ProductHunterResponse,
)
from app.services.product_hunter import ProductHunterService


router = APIRouter(
    prefix="/api/product-hunter",
    tags=["Product Hunter"],
)

service = ProductHunterService()


@router.post("/analyze", response_model=ProductHunterResponse)
def analyze_product(
    data: ProductHunterRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return service.analyze_product(
        data=data,
        db=db,
        current_user=current_user,
    )


@router.get("/history", response_model=list[ProductAnalysisHistoryItem])
def list_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return (
        db.query(ProductAnalysis)
        .filter(ProductAnalysis.user_id == current_user.id)
        .order_by(ProductAnalysis.created_at.desc())
        .limit(20)
        .all()
    )


@router.get("/history/{analysis_id}", response_model=ProductHunterResponse)
def get_analysis(
    analysis_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    analysis = (
        db.query(ProductAnalysis)
        .filter(ProductAnalysis.id == analysis_id)
        .filter(ProductAnalysis.user_id == current_user.id)
        .first()
    )

    if analysis is None:
        raise HTTPException(status_code=404, detail="Análise não encontrada.")

    data = analysis.result_data
    data["id"] = analysis.id

    return data