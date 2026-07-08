from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.security import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.campaign_flow import CampaignFlowRequest, CampaignFlowResponse
from app.services.campaign_flow import CampaignFlowService


router = APIRouter(
    prefix="/api/campaign-flow",
    tags=["Campaign Flow"],
)

service = CampaignFlowService()


@router.post("/run", response_model=CampaignFlowResponse)
def run_campaign_flow(
    data: CampaignFlowRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return service.run_campaign_flow(
        data=data,
        db=db,
        current_user=current_user,
    )