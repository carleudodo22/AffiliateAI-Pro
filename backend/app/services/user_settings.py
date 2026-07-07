from sqlalchemy.orm import Session

from app.models.user import User
from app.models.user_settings import UserSettings
from app.schemas.user_settings import UserSettingsRequest


class UserSettingsService:
    def get_or_create_settings(
        self,
        db: Session,
        current_user: User,
    ) -> UserSettings:
        settings = (
            db.query(UserSettings)
            .filter(UserSettings.user_id == current_user.id)
            .first()
        )

        if settings is not None:
            return settings

        settings = UserSettings(
            user_id=current_user.id,
            default_niche="beleza",
            default_channel="tiktok",
            default_campaign_style="viral",
            default_budget_style="organico",
            default_marketplace="shopee",
            language="pt-BR",
        )

        db.add(settings)
        db.commit()
        db.refresh(settings)

        return settings

    def update_settings(
        self,
        data: UserSettingsRequest,
        db: Session,
        current_user: User,
    ) -> UserSettings:
        settings = self.get_or_create_settings(
            db=db,
            current_user=current_user,
        )

        settings.default_niche = data.default_niche.strip().lower()
        settings.default_channel = data.default_channel
        settings.default_campaign_style = data.default_campaign_style
        settings.default_budget_style = data.default_budget_style
        settings.default_marketplace = data.default_marketplace
        settings.language = data.language

        db.add(settings)
        db.commit()
        db.refresh(settings)

        return settings