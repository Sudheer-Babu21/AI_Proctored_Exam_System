from uuid import UUID,uuid4

from sqlalchemy.orm import Session

from app.core.enums import QuestionType
from app.exceptions.exam import ExamNotFoundException
from app.repositories.answer_option_repository import AnswerOptionRepository
from app.repositories.answer_repository import AnswerRepository
from app.repositories.exam_session_repository import ExamSessionRepository
from app.repositories.question_repository import QuestionRepository
from app.schemas.answer_schema import SubmitAnswerRequest
import os
from pathlib import Path
from fastapi import UploadFile, HTTPException

class AnswerService:

    def __init__(self):
        self.answer_repo = AnswerRepository()
        self.answer_option_repo = AnswerOptionRepository()
        self.session_repo = ExamSessionRepository()
        self.question_repo = QuestionRepository()

    def submit_answer(
        self,
        db: Session,
        session_public_id: UUID,
        request: SubmitAnswerRequest,
    ):

        session = self.session_repo.get_session_by_public_id(
            db=db,
            session_public_id=session_public_id,
        )

        if session is None:
            raise ExamNotFoundException()

        question = self.question_repo.get_question_by_public_id(
            db=db,
            public_id=request.question_public_id,
        )

        if question is None:
            raise ExamNotFoundException()

        answer = self.answer_repo.get_answer(
            db=db,
            exam_session_id=session.id,
            question_id=question.id,
        )

        if answer:

            answer = self.answer_repo.update_answer(
                db=db,
                answer=answer,
                answer_text=request.answer_text,
            )

            self.answer_option_repo.delete_selected_options(
                db=db,
                answer_id=answer.id,
            )

        else:

            answer = self.answer_repo.create_answer(
                db=db,
                exam_session_id=session.id,
                question_id=question.id,
                answer_text=request.answer_text,
            )

        if request.selected_option_ids:

            option_ids = []

            for option in question.options:
                if option.id in request.selected_option_ids:
                    option_ids.append(option.id)

            self.answer_option_repo.save_selected_options(
                db=db,
                answer_id=answer.id,
                option_ids=option_ids,
            )

        return {
            "message": "Answer saved successfully."
        }
    
    def upload_image_answer(
        self,
        db: Session,
        session_public_id: UUID,
        question_public_id: UUID,
        image: UploadFile,
    ):
        # Validate session
        session = self.session_repo.get_session_by_public_id(
            db=db,
            session_public_id=session_public_id,
        )

        if session is None:
            raise ExamNotFoundException()

        # Validate question
        question = self.question_repo.get_question_by_public_id(
            db=db,
            public_id=question_public_id,
        )

        if question is None:
            raise ExamNotFoundException()

        # Allow only image upload questions
        if question.question_type != QuestionType.IMAGE_UPLOAD:
            raise HTTPException(
                status_code=400,
                detail="This question does not accept image uploads.",
            )

        # Validate content type
        allowed_types = {
            "image/jpeg",
            "image/jpg",
            "image/png",
        }

        if image.content_type not in allowed_types:
            raise HTTPException(
                status_code=400,
                detail="Only JPG, JPEG and PNG images are allowed.",
            )

        # Validate file size (5 MB)
        contents = image.file.read()

        max_size = 5 * 1024 * 1024

        if len(contents) > max_size:
            raise HTTPException(
                status_code=400,
                detail="Image size cannot exceed 5 MB.",
            )

        image.file.seek(0)

        # Create upload directory
        base_dir = Path(__file__).resolve().parent.parent
        upload_dir = base_dir / "uploads" / "answers"
        upload_dir.mkdir(parents=True, exist_ok=True)

        # Generate unique filename
        extension = Path(image.filename).suffix.lower() if image.filename else ".jpg"
        filename = f"{uuid4()}{extension}"

        file_path = upload_dir / filename

        # Save file
        with open(file_path, "wb") as buffer:
            buffer.write(contents)


        image_url = f"/uploads/answers/{filename}"

        # Find existing answer
        answer = self.answer_repo.get_answer(
            db=db,
            exam_session_id=session.id,
            question_id=question.id,
        )

        if answer:
            self.answer_repo.update_image(
                db=db,
                answer=answer,
                image_url=image_url,
            )
        else:
            self.answer_repo.create_answer(
                db=db,
                exam_session_id=session.id,
                question_id=question.id,
                image_url=image_url,
            )

        return {
            "message": "Image uploaded successfully.",
            "image_url": image_url,
        }