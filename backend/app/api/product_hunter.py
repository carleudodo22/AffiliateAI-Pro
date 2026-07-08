from datetime import datetime
from typing import Any

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


def safe_list(value) -> list[str]:
    if isinstance(value, list):
        return [str(item) for item in value]

    if isinstance(value, tuple):
        return [str(item) for item in value]

    if isinstance(value, str) and value.strip():
        return [value]

    return []


def safe_dict(value) -> dict[str, Any]:
    if isinstance(value, dict):
        return value

    return {}


def normalize_history_item(analysis: ProductAnalysis) -> dict:
    analysis_package = safe_dict(
        safe_get(
            analysis,
            "analysis_package",
            {},
        )
    )

    score = safe_get(
        analysis,
        "score",
        analysis_package.get("score", "--"),
    )

    decision = safe_get(
        analysis,
        "decision",
        analysis_package.get("decision", "não definido"),
    )

    status = safe_get(analysis, "status", "completed")

    return {
        "id": safe_get(analysis, "id", 0),
        "product_name": safe_get(analysis, "product_name", "Produto analisado"),
        "niche": safe_get(analysis, "niche", "nicho"),
        "marketplace": safe_get(analysis, "marketplace", "não definido"),
        "score": str(score),
        "decision": str(decision),
        "status": str(status),
        "created_at": safe_get(analysis, "created_at", datetime.utcnow()),
    }


def normalize_detail_item(analysis: ProductAnalysis) -> dict:
    product_name = safe_get(analysis, "product_name", "Produto analisado")
    niche = safe_get(analysis, "niche", "nicho")
    marketplace = safe_get(analysis, "marketplace", "não definido")

    analysis_package = safe_dict(
        safe_get(
            analysis,
            "analysis_package",
            {},
        )
    )

    target_audience = safe_get(
        analysis,
        "target_audience",
        analysis_package.get(
            "target_audience",
            f"pessoas interessadas em produtos do nicho de {niche}",
        ),
    )

    content_angles = safe_list(
        safe_get(
            analysis,
            "content_angles",
            analysis_package.get(
                "content_angles",
                [
                    f"Demonstração prática do {product_name}",
                    f"Review rápido do {product_name}",
                    f"Achadinho no nicho de {niche}",
                ],
            ),
        )
    )

    recommended_channels = safe_list(
        safe_get(
            analysis,
            "recommended_channels",
            analysis_package.get(
                "recommended_channels",
                ["TikTok", "Instagram Reels", "YouTube Shorts"],
            ),
        )
    )

    score = safe_get(
        analysis,
        "score",
        analysis_package.get("score", "--"),
    )

    decision = safe_get(
        analysis,
        "decision",
        analysis_package.get("decision", "não definido"),
    )

    summary = safe_get(
        analysis,
        "summary",
        analysis_package.get(
            "summary",
            "Registro carregado com valores seguros para não quebrar o sistema.",
        ),
    )

    strengths = safe_list(
        safe_get(
            analysis,
            "strengths",
            analysis_package.get(
                "strengths",
                [
                    "Produto salvo no histórico.",
                    "Pode ser usado como referência para campanha.",
                ],
            ),
        )
    )

    weaknesses = safe_list(
        safe_get(
            analysis,
            "weaknesses",
            analysis_package.get(
                "weaknesses",
                [
                    "Registro antigo com alguns campos incompletos.",
                ],
            ),
        )
    )

    opportunities = safe_list(
        safe_get(
            analysis,
            "opportunities",
            analysis_package.get(
                "opportunities",
                [
                    "Reanalisar o produto para gerar um pacote atualizado.",
                ],
            ),
        )
    )

    risks = safe_list(
        safe_get(
            analysis,
            "risks",
            analysis_package.get(
                "risks",
                [
                    "Dados antigos podem não representar a oportunidade atual.",
                ],
            ),
        )
    )

    return {
        "id": safe_get(analysis, "id", 0),
        "agent": "Product Hunter Agent",
        "status": safe_get(analysis, "status", "completed"),
        "product_name": product_name,
        "niche": niche,
        "marketplace": marketplace,
        "average_price": float(safe_get(analysis, "average_price", 0) or 0),
        "commission_percent": float(
            safe_get(analysis, "commission_percent", 0) or 0
        ),
        "score": str(score),
        "decision": str(decision),
        "summary": str(summary),
        "strengths": strengths,
        "weaknesses": weaknesses,
        "opportunities": opportunities,
        "risks": risks,
        "target_audience": str(target_audience),
        "content_angles": content_angles,
        "recommended_channels": recommended_channels,
        "analysis_package": analysis_package
        or {
            "legacy_record": True,
            "message": "Registro antigo normalizado pelo backend.",
        },
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