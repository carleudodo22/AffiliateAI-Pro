from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.security import get_current_user
from app.db.session import get_db
from app.models.campaign_package import CampaignPackageRun
from app.models.user import User
from app.schemas.campaign_package import (
    CampaignPackageHistoryItem,
    CampaignPackageResponse,
    CampaignPackageSaveRequest,
)
from app.services.campaign_package import CampaignPackageService


router = APIRouter(
    prefix="/api/campaign-package",
    tags=["Campaign Package"],
)

service = CampaignPackageService()


@router.post("/save", response_model=CampaignPackageResponse)
def save_campaign_package(
    data: CampaignPackageSaveRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return service.save_package(
        data=data,
        db=db,
        current_user=current_user,
    )


@router.get("/history", response_model=list[CampaignPackageHistoryItem])
def list_campaign_packages(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return (
        db.query(CampaignPackageRun)
        .filter(CampaignPackageRun.user_id == current_user.id)
        .order_by(CampaignPackageRun.created_at.desc())
        .limit(30)
        .all()
    )


@router.get("/{package_id}", response_model=CampaignPackageResponse)
def get_campaign_package(
    package_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    campaign_package = (
        db.query(CampaignPackageRun)
        .filter(CampaignPackageRun.id == package_id)
        .filter(CampaignPackageRun.user_id == current_user.id)
        .first()
    )

    if campaign_package is None:
        raise HTTPException(
            status_code=404,
            detail="Pacote de campanha não encontrado.",
        )

    return campaign_package


@router.delete("/{package_id}")
def delete_campaign_package(
    package_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    campaign_package = (
        db.query(CampaignPackageRun)
        .filter(CampaignPackageRun.id == package_id)
        .filter(CampaignPackageRun.user_id == current_user.id)
        .first()
    )

    if campaign_package is None:
        raise HTTPException(
            status_code=404,
            detail="Pacote de campanha não encontrado.",
        )

    db.delete(campaign_package)
    db.commit()

    return {
        "status": "deleted",
        "message": "Pacote de campanha removido com sucesso.",
    }