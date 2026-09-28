from sqlalchemy.orm import Session
from sqlalchemy import delete

from app.models.answer_options import AnswerOption

class AnswerOptionRepository:

    def save_selected_options(
        self,
        db: Session,
        answer_id: int,
        option_ids: list[int],
    ):
        answer_options = []

        for option_id in option_ids:
            answer_options.append(
                AnswerOption(
                    answer_id=answer_id,
                    option_id=option_id,
                )
            )

        db.add_all(answer_options)
        db.commit()

        return answer_options

    def delete_selected_options(
        self,
        db: Session,
        answer_id: int,
    ):
        db.execute(
            delete(AnswerOption).where(
                AnswerOption.answer_id == answer_id
            )
        )

        db.commit()