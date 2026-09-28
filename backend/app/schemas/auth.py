from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.core.enums import UserRole


class RegisterRequest(BaseModel):
    name: str = Field(
        min_length=3,
        max_length=100,
        description="Full Name"
    )

    email: EmailStr

    password: str = Field(
        min_length=8,
        max_length=128,
        description="User Password"
    )

    role: UserRole


class LoginRequest(BaseModel):
    email: EmailStr

    password: str = Field(
        min_length=8,
        max_length=128
    )


class GoogleLoginRequest(BaseModel):
    email: EmailStr
    name: str = "Google User"
    avatar: str | None = None
    role: UserRole | None = None
    token: str | None = None


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: "UserResponse | None" = None


class UserResponse(BaseModel):
    id: int
    public_id: str
    name: str
    email: EmailStr
    role: UserRole
    is_active: bool

    model_config = ConfigDict(from_attributes=True)