from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.security import get_current_user
from app.db.session import get_db
from app.models.autopilot_run import AutopilotRun
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
        db.query(AutopilotRun)
        .filter(AutopilotRun.user_id == current_user.id)
        .order_by(AutopilotRun.created_at.desc())
        .limit(20)
        .all()
    )


@router.get("/{run_id}", response_model=AutopilotResponse)
def get_autopilot_run(
    run_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    run = (
        db.query(AutopilotRun)
        .filter(AutopilotRun.id == run_id)
        .filter(AutopilotRun.user_id == current_user.id)
        .first()
    )

    if run is None:
        raise HTTPException(
            status_code=404,
            detail="Campanha não encontrada.",
        )

    return service.get_run_response(run)