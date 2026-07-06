from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.security import create_access_token, get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.auth import TokenResponse, UserCreate, UserLogin, UserPublic
from app.services.auth import AuthService


router = APIRouter(
    prefix="/api/auth",
    tags=["Auth"],
)

service = AuthService()


@router.post("/register", response_model=TokenResponse)
def register(
    data: UserCreate,
    db: Session = Depends(get_db),
):
    user = service.create_user(db=db, data=data)

    token = create_access_token(subject=str(user.id))

    return TokenResponse(
        access_token=token,
        user=user,
    )


@router.post("/login", response_model=TokenResponse)
def login(
    data: UserLogin,
    db: Session = Depends(get_db),
):
    user = service.authenticate_user(db=db, data=data)

    token = create_access_token(subject=str(user.id))

    return TokenResponse(
        access_token=token,
        user=user,
    )


@router.get("/me", response_model=UserPublic)
def me(
    current_user: User = Depends(get_current_user),
):
    return current_user