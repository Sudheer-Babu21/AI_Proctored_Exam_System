from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from fastapi.security import OAuth2PasswordRequestForm
from app.db.dependencies import get_db
from app.schemas.auth import (
    RegisterRequest,
    LoginRequest,
    GoogleLoginRequest,
    TokenResponse,
    UserResponse,
)
from app.services.auth_service import AuthService

router = APIRouter(
    prefix="/auth",
    tags=["Authentication"],
)


@router.post(
    "/register",
    response_model=UserResponse,
    status_code=201,
)
def register(
    data: RegisterRequest,
    db: Session = Depends(get_db),
):

    user = AuthService.register(
        db=db,
        data=data,
    )

    return user

from app.dependencies.auth import get_current_user
from app.models.users import User

@router.post(
    "/login",
    response_model=TokenResponse,
)
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
):
    data = LoginRequest(
        email=form_data.username,
        password=form_data.password,
    )

    token, user = AuthService.login(
        db=db,
        data=data,
    )

    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user=user,
    )


@router.post(
    "/login-json",
    response_model=TokenResponse,
)
def login_json(
    data: LoginRequest,
    db: Session = Depends(get_db),
):
    token, user = AuthService.login(
        db=db,
        data=data,
    )

    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user=user,
    )


@router.post(
    "/google",
    response_model=TokenResponse,
)
def google_login(
    data: GoogleLoginRequest,
    db: Session = Depends(get_db),
):
    token, user = AuthService.google_login(
        db=db,
        data=data,
    )

    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user=user,
    )


@router.get(
    "/me",
    response_model=UserResponse,
)
def get_me(
    current_user: User = Depends(get_current_user),
):
    return current_user