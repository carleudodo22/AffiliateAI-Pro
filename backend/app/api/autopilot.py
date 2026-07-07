from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.security import get_current_user
from app.db.session import get_db
from app.models.autopilot_campaign import AutopilotCampaign
from app.models.user import User
from app.schemas.autopilot import (
    AutopilotHistoryItem,
    AutopilotRequest,
    AutopilotResponse,
)
from app.services.autopilot import AutopilotService


router = APIRouter(
    prefix="/api/autopilot",
    tags=["Affiliate Autopilot"],
)

service = AutopilotService()


@router.post("/run", response_model=AutopilotResponse)
def run_autopilot(
    data: AutopilotRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return service.run_autopilot(
        data=data,
        db=db,
        current_user=current_user,
    )


@router.get("/history", response_model=list[AutopilotHistoryItem])
def list_autopilot_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return (
        db.query(AutopilotCampaign)
        .filter(AutopilotCampaign.user_id == current_user.id)
        .order_by(AutopilotCampaign.created_at.desc())
        .limit(20)
        .all()
    )


@router.get("/{campaign_id}", response_model=AutopilotResponse)
def get_autopilot_campaign(
    campaign_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    campaign = (
        db.query(AutopilotCampaign)
        .filter(AutopilotCampaign.id == campaign_id)
        .filter(AutopilotCampaign.user_id == current_user.id)
        .first()
    )

    if campaign is None:
        raise HTTPException(
            status_code=404,
            detail="Campanha não encontrada.",
        )

    return AutopilotResponse(
        id=campaign.id,
        agent="Affiliate Autopilot",
        status=campaign.status,
        niche=campaign.niche,
        objective=campaign.objective,
        main_channel=campaign.main_channel,
        budget_style=campaign.budget_style,
        campaign_style=campaign.campaign_style,
        package=campaign.campaign_data,
    )