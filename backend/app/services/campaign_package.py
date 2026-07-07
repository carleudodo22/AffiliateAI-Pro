from sqlalchemy.orm import Session

from app.models.campaign_package import CampaignPackageRun
from app.models.user import User
from app.schemas.campaign_package import CampaignPackageSaveRequest


class CampaignPackageService:
    def save_package(
        self,
        data: CampaignPackageSaveRequest,
        db: Session,
        current_user: User,
    ) -> CampaignPackageRun:
        campaign_package = CampaignPackageRun(
            user_id=current_user.id,
            product_name=data.product_name.strip(),
            niche=data.niche.strip().lower(),
            marketplace=data.marketplace,
            score=data.score,
            decision=data.decision,
            package_text=data.package_text,
            source_data=data.source_data,
            status="saved",
        )

        db.add(campaign_package)
        db.commit()
        db.refresh(campaign_package)

        return campaign_package