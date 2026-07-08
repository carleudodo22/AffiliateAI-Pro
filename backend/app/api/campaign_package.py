from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.security import get_current_user
from app.db.session import get_db
from app.models.campaign_package import CampaignPackageRun
from app.models.user import User
from app.schemas.campaign_package import (
    CampaignPackageRequest,
    CampaignPackageResponse,
)
from app.services.campaign_package import CampaignPackageService


router = APIRouter(
    prefix="/api/campaign-package",
    tags=["Campaign Package"],
)

service = CampaignPackageService()


@router.post("/generate", response_model=CampaignPackageResponse)
def generate_campaign_package(
    data: CampaignPackageRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return service.create_package(
        data=data,
        db=db,
        current_user=current_user,
    )


@router.get("/history", response_model=list[CampaignPackageResponse])
def list_campaign_packages(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    packages = (
        db.query(CampaignPackageRun)
        .filter(CampaignPackageRun.user_id == current_user.id)
        .order_by(CampaignPackageRun.created_at.desc())
        .limit(50)
        .all()
    )

    return [service.get_package_response(package) for package in packages]


@router.get("/{package_id}", response_model=CampaignPackageResponse)
def get_campaign_package(
    package_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    package = (
        db.query(CampaignPackageRun)
        .filter(CampaignPackageRun.id == package_id)
        .filter(CampaignPackageRun.user_id == current_user.id)
        .first()
    )

    if package is None:
        raise HTTPException(
            status_code=404,
            detail="Campaign Package não encontrado.",
        )

    return service.get_package_response(package)


@router.post("/{package_id}/duplicate", response_model=CampaignPackageResponse)
def duplicate_campaign_package(
    package_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return service.duplicate_package(
        package_id=package_id,
        db=db,
        current_user=current_user,
    )


@router.delete("/{package_id}")
def delete_campaign_package(
    package_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    package = (
        db.query(CampaignPackageRun)
        .filter(CampaignPackageRun.id == package_id)
        .filter(CampaignPackageRun.user_id == current_user.id)
        .first()
    )

    if package is None:
        raise HTTPException(
            status_code=404,
            detail="Campaign Package não encontrado.",
        )

    db.delete(package)
    db.commit()

    return {
        "status": "deleted",
        "message": "Campaign Package removido com sucesso.",
    }