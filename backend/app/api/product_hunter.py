from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.security import get_current_user
from app.db.session import get_db
from app.models.product_analysis import ProductAnalysis
from app.models.user import User
from app.schemas.product_hunter import (
    ProductHunterHistoryItem,
    ProductHunterRequest,
    ProductHunterResponse,
)
from app.services.product_hunter import ProductHunterService


router = APIRouter(
    prefix="/api/product-hunter",
    tags=["Product Hunter"],
)

service = ProductHunterService()


def safe_get(obj, field: str, fallback=None):
    value = getattr(obj, field, fallback)

    if value is None or value == "":
        return fallback

    return value


def normalize_history_item(analysis: ProductAnalysis) -> dict:
    return {
        "id": safe_get(analysis, "id", 0),
        "product_name": safe_get(analysis, "product_name", "Produto analisado"),
        "niche": safe_get(analysis, "niche", "nicho"),
        "marketplace": safe_get(analysis, "marketplace", "não definido"),
        "score": safe_get(analysis, "score", "--"),
        "decision": safe_get(analysis, "decision", "não definido"),
        "status": safe_get(analysis, "status", "completed"),
        "created_at": safe_get(analysis, "created_at", datetime.utcnow()),
    }


def normalize_detail_item(analysis: ProductAnalysis) -> dict:
    product_name = safe_get(analysis, "product_name", "Produto analisado")
    niche = safe_get(analysis, "niche", "nicho")
    marketplace = safe_get(analysis, "marketplace", "não definido")

    target_audience = safe_get(
        analysis,
        "target_audience",
        f"pessoas interessadas em produtos do nicho de {niche}",
    )

    content_angles = safe_get(
        analysis,
        "content_angles",
        [
            f"Demonstração prática do {product_name}",
            f"Review rápido do {product_name}",
            f"Achadinho no nicho de {niche}",
        ],
    )

    recommended_channels = safe_get(
        analysis,
        "recommended_channels",
        ["TikTok", "Instagram Reels", "YouTube Shorts"],
    )

    analysis_package = safe_get(
        analysis,
        "analysis_package",
        {
            "legacy_record": True,
            "message": "Registro antigo normalizado pelo backend.",
        },
    )

    return {
        "id": safe_get(analysis, "id", 0),
        "agent": "Product Hunter Agent",
        "status": safe_get(analysis, "status", "completed"),
        "product_name": product_name,
        "niche": niche,
        "marketplace": marketplace,
        "average_price": safe_get(analysis, "average_price", 0),
        "commission_percent": safe_get(analysis, "commission_percent", 0),
        "score": safe_get(analysis, "score", "--"),
        "decision": safe_get(analysis, "decision", "não definido"),
        "summary": safe_get(
            analysis,
            "summary",
            "Esse é um registro antigo do Product Hunter. Ele foi carregado com valores seguros para não quebrar o sistema.",
        ),
        "strengths": safe_get(
            analysis,
            "strengths",
            [
                "Produto salvo no histórico.",
                "Pode ser usado como referência para campanha.",
            ],
        ),
        "weaknesses": safe_get(
            analysis,
            "weaknesses",
            [
                "Registro antigo com alguns campos incompletos.",
            ],
        ),
        "opportunities": safe_get(
            analysis,
            "opportunities",
            [
                "Reanalisar o produto para gerar um pacote atualizado.",
            ],
        ),
        "risks": safe_get(
            analysis,
            "risks",
            [
                "Dados antigos podem não representar a oportunidade atual.",
            ],
        ),
        "target_audience": target_audience,
        "content_angles": content_angles,
        "recommended_channels": recommended_channels,
        "analysis_package": analysis_package,
        "created_at": safe_get(analysis, "created_at", datetime.utcnow()),
    }


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


@router.get("/history", response_model=list[ProductHunterHistoryItem])
def list_product_analysis_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    analyses = (
        db.query(ProductAnalysis)
        .filter(ProductAnalysis.user_id == current_user.id)
        .order_by(ProductAnalysis.created_at.desc())
        .limit(30)
        .all()
    )

    return [normalize_history_item(analysis) for analysis in analyses]


@router.get("/{analysis_id}", response_model=ProductHunterResponse)
def get_product_analysis(
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
        raise HTTPException(
            status_code=404,
            detail="Análise de produto não encontrada.",
        )

    return normalize_detail_item(analysis)


@router.delete("/{analysis_id}")
def delete_product_analysis(
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
        raise HTTPException(
            status_code=404,
            detail="Análise de produto não encontrada.",
        )

    db.delete(analysis)
    db.commit()

    return {
        "status": "deleted",
        "message": "Análise de produto removida com sucesso.",
    }