from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.security import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.user_settings import (
    UserSettingsRequest,
    UserSettingsResponse,
)
from app.services.user_settings import UserSettingsService


router = APIRouter(
    prefix="/api/user-settings",
    tags=["User Settings"],
)

service = UserSettingsService()


@router.get("/me", response_model=UserSettingsResponse)
def get_my_settings(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return service.get_or_create_settings(
        db=db,
        current_user=current_user,
    )


@router.put("/me", response_model=UserSettingsResponse)
def update_my_settings(
    data: UserSettingsRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return service.update_settings(
        data=data,
        db=db,
        current_user=current_user,
    )