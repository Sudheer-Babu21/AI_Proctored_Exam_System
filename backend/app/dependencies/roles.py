from fastapi import Depends

from app.core.enums import UserRole
from app.dependencies.auth import get_current_user
from app.exceptions.auth import InvalidCredentialsException, PermissionDeniedException


def require_admin(
    current_user=Depends(get_current_user),
):
    if current_user.role != UserRole.ADMIN:
        raise PermissionDeniedException()

    return current_user


def require_examiner(
    current_user=Depends(get_current_user),
):
    if current_user.role not in [UserRole.EXAMINER, UserRole.ADMIN]:
        raise PermissionDeniedException()

    return current_user


def require_student(
    current_user=Depends(get_current_user),
):
    if current_user.role != UserRole.STUDENT:
        raise PermissionDeniedException()

    return current_user