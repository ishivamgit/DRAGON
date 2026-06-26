from typing import Optional

from pydantic import BaseModel, EmailStr

from app.schemas.user import UserResponse


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    # Included on login so the frontend can populate the auth store in one call.
    user: Optional[UserResponse] = None


class RefreshRequest(BaseModel):
    refresh_token: str
