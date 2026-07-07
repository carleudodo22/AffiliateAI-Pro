from datetime import datetime

from pydantic import BaseModel


class DashboardAnalysisSummary(BaseModel):
    id: int
    product_name: str
    niche: str
    marketplace: str
    decision: str
    final_score: int
    created_at: datetime

    model_config = {
        "from_attributes": True,
    }


class DashboardMetricsResponse(BaseModel):
    total_analyses: int
    average_score: float
    good_opportunities: int
    best_opportunity: DashboardAnalysisSummary | None
    last_analysis: DashboardAnalysisSummary | None