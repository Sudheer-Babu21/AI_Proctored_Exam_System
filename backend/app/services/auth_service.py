from sqlalchemy.orm import Session
from app.exceptions.auth import (
    EmailAlreadyExistsException,
    InvalidCredentialsException,
    InactiveUserException,
)
from app.core.security import (
    hash_password,
    verify_password,
    create_access_token,
)
from app.models.users import User
from app.repositories.user_repository import UserRepository
from app.schemas.auth import RegisterRequest, LoginRequest


class AuthService:

    @staticmethod
    def register(
        db: Session,
        data: RegisterRequest,
    ) -> User:

        # Email already exists?
        if UserRepository.exists_by_email(db, data.email):
            raise EmailAlreadyExistsException()

        # Create User
        user = User(
            name=data.name,
            email=data.email,
            password_hash=hash_password(data.password),
            role=data.role,
        )

        return UserRepository.create(db, user)

    @staticmethod
    def login(
        db: Session,
        data: LoginRequest,
    ) -> tuple[str, User]:

        user = UserRepository.get_by_email(db, data.email)

        if not user:
            raise InvalidCredentialsException()

        if not verify_password(
            data.password,
            user.password_hash,
        ):
            raise InvalidCredentialsException()

        if not user.is_active:
            raise InactiveUserException()

        token = create_access_token(
            {
                "sub": str(user.public_id),
                "role": user.role.value,
                "name": user.name,
                "email": user.email,
            }
        )

        return token, user

    @staticmethod
    def google_login(
        db: Session,
        data: "GoogleLoginRequest",
    ) -> tuple[str, User]:
        import secrets
        from app.core.enums import UserRole

        user = UserRepository.get_by_email(db, data.email)

        if not user:
            assigned_role = data.role or UserRole.STUDENT
            random_pass = secrets.token_urlsafe(32)
            user = User(
                name=data.name or data.email.split("@")[0].capitalize(),
                email=data.email,
                password_hash=hash_password(random_pass),
                role=assigned_role,
                is_active=True,
                is_verified=True,
            )
            user = UserRepository.create(db, user)

        if not user.is_active:
            raise InactiveUserException()

        token = create_access_token(
            {
                "sub": str(user.public_id),
                "role": user.role.value,
                "name": user.name,
                "email": user.email,
            }
        )

        return token, user