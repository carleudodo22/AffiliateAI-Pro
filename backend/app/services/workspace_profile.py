from sqlalchemy.orm import Session

from app.models.user import User
from app.models.workspace_profile import WorkspaceProfile
from app.schemas.workspace_profile import WorkspaceProfileRequest


class WorkspaceProfileService:
    def get_or_create_profile(
        self,
        db: Session,
        current_user: User,
    ) -> WorkspaceProfile:
        profile = (
            db.query(WorkspaceProfile)
            .filter(WorkspaceProfile.user_id == current_user.id)
            .first()
        )

        if profile is not None:
            return profile

        profile = WorkspaceProfile(
            user_id=current_user.id,
            project_name="AffiliateAI Pro",
            brand_name="",
            default_target_audience=(
                "pessoas interessadas em soluções práticas e ofertas úteis"
            ),
            default_cta="Clique no link e confira a oferta.",
            tone="direto",
            visual_style="premium_dark",
            language="pt-BR",
            preferred_words=[],
            forbidden_words=[],
            notes=None,
            extra_data={},
        )

        db.add(profile)
        db.commit()
        db.refresh(profile)

        return profile

    def update_profile(
        self,
        data: WorkspaceProfileRequest,
        db: Session,
        current_user: User,
    ) -> WorkspaceProfile:
        profile = self.get_or_create_profile(
            db=db,
            current_user=current_user,
        )

        profile.project_name = self._clean_text(
            value=data.project_name,
            fallback="AffiliateAI Pro",
        )

        profile.brand_name = self._clean_text(
            value=data.brand_name,
            fallback="",
        )

        profile.default_target_audience = self._clean_text(
            value=data.default_target_audience,
            fallback="pessoas interessadas em soluções práticas e ofertas úteis",
        )

        profile.default_cta = self._clean_text(
            value=data.default_cta,
            fallback="Clique no link e confira a oferta.",
        )

        profile.tone = data.tone
        profile.visual_style = data.visual_style
        profile.language = data.language

        profile.preferred_words = self._clean_list(data.preferred_words)
        profile.forbidden_words = self._clean_list(data.forbidden_words)

        profile.notes = data.notes.strip() if data.notes else None
        profile.extra_data = data.extra_data or {}

        db.add(profile)
        db.commit()
        db.refresh(profile)

        return profile

    def _clean_text(
        self,
        value: str,
        fallback: str,
    ) -> str:
        clean_value = value.strip()

        if not clean_value:
            return fallback

        return clean_value

    def _clean_list(
        self,
        values: list[str],
    ) -> list[str]:
        clean_values: list[str] = []

        for value in values:
            clean_value = str(value).strip()

            if not clean_value:
                continue

            if clean_value in clean_values:
                continue

            clean_values.append(clean_value)

        return clean_values