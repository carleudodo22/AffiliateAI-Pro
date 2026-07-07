from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.security import get_current_user
from app.db.session import get_db
from app.models.product_analysis import ProductAnalysis
from app.models.user import User
from app.schemas.dashboard import DashboardMetricsResponse


router = APIRouter(
    prefix="/api/dashboard",
    tags=["Dashboard"],
)


@router.get("/metrics", response_model=DashboardMetricsResponse)
def get_dashboard_metrics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    total_analyses = (
        db.query(ProductAnalysis)
        .filter(ProductAnalysis.user_id == current_user.id)
        .count()
    )

    average_score_result = (
        db.query(func.avg(ProductAnalysis.final_score))
        .filter(ProductAnalysis.user_id == current_user.id)
        .scalar()
    )

    good_opportunities = (
        db.query(ProductAnalysis)
        .filter(ProductAnalysis.user_id == current_user.id)
        .filter(ProductAnalysis.final_score >= 70)
        .count()
    )

    best_opportunity = (
        db.query(ProductAnalysis)
        .filter(ProductAnalysis.user_id == current_user.id)
        .order_by(
            ProductAnalysis.final_score.desc(),
            ProductAnalysis.created_at.desc(),
        )
        .first()
    )

    last_analysis = (
        db.query(ProductAnalysis)
        .filter(ProductAnalysis.user_id == current_user.id)
        .order_by(ProductAnalysis.created_at.desc())
        .first()
    )

    average_score = 0

    if average_score_result is not None:
        average_score = round(float(average_score_result), 1)

    return DashboardMetricsResponse(
        total_analyses=total_analyses,
        average_score=average_score,
        good_opportunities=good_opportunities,
        best_opportunity=best_opportunity,
        last_analysis=last_analysis,
    )