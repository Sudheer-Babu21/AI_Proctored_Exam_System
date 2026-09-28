from sqlalchemy.orm import Session
from app.models.results import Result
from app.core.enums import ResultStatus

class ResultRepository:

    def create_result(
        self,
        db: Session,
        exam_session_id: int,
        total_marks: float,
        obtained_marks: float,
    ):
        percentage = (
            (obtained_marks / total_marks) * 100
            if total_marks > 0 else 0
        )

        existing = self.get_result_by_session(
            db=db,
            exam_session_id=exam_session_id,
        )

        if existing:
            existing.max_score = total_marks
            existing.total_score = obtained_marks
            existing.ai_score = obtained_marks
            existing.final_score = obtained_marks
            existing.percentage = percentage
            existing.status = ResultStatus.PASS

            db.commit()
            db.refresh(existing)
            return existing

        result = Result(
            exam_session_id=exam_session_id,
            max_score=total_marks,
            total_score=obtained_marks,
            ai_score=obtained_marks,
            examiner_score=0,
            final_score=obtained_marks,
            percentage=percentage,
            status=ResultStatus.PASS,
        )

        db.add(result)
        db.commit()
        db.refresh(result)

        return result

    def get_result_by_session(
        self,
        db: Session,
        exam_session_id: int,
    ):
        return (
            db.query(Result)
            .filter(
                Result.exam_session_id == exam_session_id
            )
            .first()
        )

    def delete_result(
        self,
        db: Session,
        exam_session_id: int,
    ):
        result = self.get_result_by_session(
            db=db,
            exam_session_id=exam_session_id,
        )

        if result is None:
            return False

        db.delete(result)
        db.commit()

        return True