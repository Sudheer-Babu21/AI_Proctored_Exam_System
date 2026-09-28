from fastapi import Depends
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError
from sqlalchemy.orm import Session
from app.core.enums import UserRole
from app.core.security import decode_access_token
from app.db.dependencies import get_db
from app.exceptions.auth import (
    InvalidCredentialsException,
    UserNotFoundException,
)
from app.repositories.user_repository import UserRepository

oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="/auth/login"
)


def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
):
    try:
        payload = decode_access_token(token)
        print("TOKEN PAYLOAD:", payload)

        public_id = payload.get("sub")

        if public_id is None:
            raise InvalidCredentialsException()

    except JWTError:
        raise InvalidCredentialsException()

    user = UserRepository.get_by_public_id(
        db=db,
        public_id=public_id,
    )

    if user is None:
        raise UserNotFoundException()

    return user

def require_student(
    current_user=Depends(get_current_user),
):
    if current_user.role != UserRole.STUDENT:
        raise InvalidCredentialsException()

    return current_user


def require_examiner(
    current_user=Depends(get_current_user),
):
    if current_user.role not in [UserRole.EXAMINER, UserRole.ADMIN]:
        raise InvalidCredentialsException()

    return current_user