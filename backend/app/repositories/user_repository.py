from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.users import User


class UserRepository:

    @staticmethod
    def get_by_email(
        db: Session,
        email: str,
    ) -> User | None:

        stmt = select(User).where(
            User.email == email
        )

        return db.scalar(stmt)

    @staticmethod
    def get_by_id(
        db: Session,
        user_id: int,
    ) -> User | None:

        stmt = select(User).where(
            User.id == user_id
        )

        return db.scalar(stmt)

    @staticmethod
    def exists_by_email(
        db: Session,
        email: str,
    ) -> bool:

        return UserRepository.get_by_email(db, email) is not None

    @staticmethod
    def create(
        db: Session,
        user: User,
    ) -> User:

        db.add(user)
        db.commit()
        db.refresh(user)

        return user

    @staticmethod
    def update(
        db: Session,
        user: User,
    ) -> User:

        db.commit()
        db.refresh(user)

        return user

    @staticmethod
    def delete(
        db: Session,
        user: User,
    ) -> None:

        db.delete(user)
        db.commit()
    
    @staticmethod
    def get_by_public_id(
        db: Session,
        public_id: str,
    ) -> User | None:

        stmt = select(User).where(
            User.public_id == str(public_id)
    )

        return db.scalar(stmt)