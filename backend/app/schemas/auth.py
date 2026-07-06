from datetime import datetime

from pydantic import BaseModel, EmailStr, Field


class UserCreate(BaseModel):
    name: str = Field(..., min_length=2, examples=["Kauet"])
    email: EmailStr = Field(..., examples=["kauet@email.com"])
    password: str = Field(..., min_length=6, examples=["123456"])


class UserLogin(BaseModel):
    email: EmailStr = Field(..., examples=["kauet@email.com"])
    password: str = Field(..., min_length=6, examples=["123456"])


class UserPublic(BaseModel):
    id: int
    name: str
    email: EmailStr
    is_active: bool
    created_at: datetime

    model_config = {
        "from_attributes": True,
    }


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserPublic