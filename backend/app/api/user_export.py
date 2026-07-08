from datetime import datetime
from typing import Any

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.security import get_current_user
from app.db.session import get_db
from app.models.affiliate_product import AffiliateProduct
from app.models.autopilot_run import AutopilotRun
from app.models.campaign_package import CampaignPackageRun
from app.models.content_generation import ContentGeneration
from app.models.creative_image import CreativeImageGeneration
from app.models.product_analysis import ProductAnalysis
from app.models.user import User
from app.models.user_settings import UserSettings
from app.models.workspace_profile import WorkspaceProfile


router = APIRouter(
    prefix="/api/user-export",
    tags=["User Export"],
)


def serialize_value(value):
    if isinstance(value, datetime):
        return value.isoformat()

    return value


def serialize_model(model) -> dict[str, Any]:
    data = {}

    for column in model.__table__.columns:
        field_name = column.name
        value = getattr(model, field_name, None)

        data[field_name] = serialize_value(value)

    return data


def serialize_list(items) -> list[dict[str, Any]]:
    return [serialize_model(item) for item in items]


@router.get("/me")
def export_my_data(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    products = (
        db.query(AffiliateProduct)
        .filter(AffiliateProduct.user_id == current_user.id)
        .order_by(AffiliateProduct.created_at.desc())
        .all()
    )

    autopilot_runs = (
        db.query(AutopilotRun)
        .filter(AutopilotRun.user_id == current_user.id)
        .order_by(AutopilotRun.created_at.desc())
        .all()
    )

    product_analyses = (
        db.query(ProductAnalysis)
        .filter(ProductAnalysis.user_id == current_user.id)
        .order_by(ProductAnalysis.created_at.desc())
        .all()
    )

    content_generations = (
        db.query(ContentGeneration)
        .filter(ContentGeneration.user_id == current_user.id)
        .order_by(ContentGeneration.created_at.desc())
        .all()
    )

    creative_generations = (
        db.query(CreativeImageGeneration)
        .filter(CreativeImageGeneration.user_id == current_user.id)
        .order_by(CreativeImageGeneration.created_at.desc())
        .all()
    )

    campaign_packages = (
        db.query(CampaignPackageRun)
        .filter(CampaignPackageRun.user_id == current_user.id)
        .order_by(CampaignPackageRun.created_at.desc())
        .all()
    )

    user_settings = (
        db.query(UserSettings)
        .filter(UserSettings.user_id == current_user.id)
        .first()
    )

    workspace_profile = (
        db.query(WorkspaceProfile)
        .filter(WorkspaceProfile.user_id == current_user.id)
        .first()
    )

    exported_at = datetime.utcnow().isoformat()

    return {
        "status": "ok",
        "export_name": "AffiliateAI Pro User Backup",
        "export_version": "1.1",
        "exported_at": exported_at,
        "user": {
            "id": current_user.id,
            "name": getattr(current_user, "name", None),
            "email": getattr(current_user, "email", None),
        },
        "summary": {
            "products": len(products),
            "autopilot_runs": len(autopilot_runs),
            "product_analyses": len(product_analyses),
            "content_generations": len(content_generations),
            "creative_generations": len(creative_generations),
            "campaign_packages": len(campaign_packages),
            "has_user_settings": user_settings is not None,
            "has_workspace_profile": workspace_profile is not None,
        },
        "data": {
            "user_settings": serialize_model(user_settings)
            if user_settings is not None
            else None,
            "workspace_profile": serialize_model(workspace_profile)
            if workspace_profile is not None
            else None,
            "affiliate_products": serialize_list(products),
            "autopilot_runs": serialize_list(autopilot_runs),
            "product_analyses": serialize_list(product_analyses),
            "content_generations": serialize_list(content_generations),
            "creative_image_generations": serialize_list(creative_generations),
            "campaign_packages": serialize_list(campaign_packages),
        },
    }