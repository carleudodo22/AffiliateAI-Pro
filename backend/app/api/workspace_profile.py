from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.security import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.workspace_profile import (
    WorkspaceProfileRequest,
    WorkspaceProfileResponse,
)
from app.services.workspace_profile import WorkspaceProfileService


router = APIRouter(
    prefix="/api/workspace-profile",
    tags=["Workspace Profile"],
)

service = WorkspaceProfileService()


@router.get("/me", response_model=WorkspaceProfileResponse)
def get_my_workspace_profile(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return service.get_or_create_profile(
        db=db,
        current_user=current_user,
    )


@router.put("/me", response_model=WorkspaceProfileResponse)
def update_my_workspace_profile(
    data: WorkspaceProfileRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return service.update_profile(
        data=data,
        db=db,
        current_user=current_user,
    )