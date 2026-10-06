from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

from app.exceptions.auth import (
    EmailAlreadyExistsException,
    InvalidCredentialsException,
    UserNotFoundException,
    InactiveUserException,
    PermissionDeniedException,
)
from app.exceptions.exam import ExamNotFoundException
from app.exceptions.question import (
    QuestionNotFoundException,
)

from app.exceptions.exam_question import (
    NotEnoughQuestionsException,
)

def register_exception_handlers(app: FastAPI):
    @app.exception_handler(QuestionNotFoundException)
    async def question_not_found_handler(
        request: Request,
        exc: QuestionNotFoundException,
    ):
        return JSONResponse(
            status_code=404,
            content={
                "success": False,
                "message": str(exc),
            },
        )
    @app.exception_handler(EmailAlreadyExistsException)
    async def email_exists_handler(
        request: Request,
        exc: EmailAlreadyExistsException,
    ):
        return JSONResponse(
            status_code=409,
            content={
                "success": False,
                "message": str(exc),
            },
        )
    @app.exception_handler(InvalidCredentialsException)
    async def invalid_credentials_handler(
        request: Request,
        exc: InvalidCredentialsException,
    ):
        return JSONResponse(
            status_code=401,
            content={
                "success": False,
                "message": str(exc),
            },
        )
    @app.exception_handler(UserNotFoundException)
    async def user_not_found_handler(
        request: Request,
        exc: UserNotFoundException,
    ):
        return JSONResponse(
            status_code=404,
            content={
                "success": False,
                "message": str(exc),
            },
        )
    @app.exception_handler(InactiveUserException)
    async def inactive_user_handler(
        request: Request,
        exc: InactiveUserException,
    ):
        return JSONResponse(
            status_code=403,
            content={
                "success": False,
                "message": str(exc),
            },
        )
    @app.exception_handler(PermissionDeniedException)
    async def permission_denied_handler(
        request: Request,
        exc: PermissionDeniedException,
    ):
        return JSONResponse(
            status_code=403,
            content={
                "success": False,
                "message": str(exc),
            },
        )

    @app.exception_handler(ExamNotFoundException)
    async def exam_not_found_handler(
        request: Request,
        exc: ExamNotFoundException,
    ):
        return JSONResponse(
            status_code=404,
            content={
                "success": False,
                "message": str(exc),
        },
    )

    @app.exception_handler(NotEnoughQuestionsException)
    async def not_enough_questions_handler(request: Request, exc: NotEnoughQuestionsException):
        return JSONResponse(
            status_code=400,
            content={
                "success": False,
                "message": str(exc),
            },
        )