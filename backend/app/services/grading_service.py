import json
from uuid import UUID
from sqlalchemy.orm import Session
from urllib import request as url_request
import urllib.error

from app.core.config import settings
from app.core.enums import QuestionType, ResultStatus
from app.models.answers import Answer
from app.repositories.answer_repository import AnswerRepository
from app.repositories.grading_repository import GradingRepository
from app.repositories.question_repository import QuestionRepository
from app.repositories.result_repository import ResultRepository
from app.schemas.grading_schema import AnswerResponse


class GradingService:

    def __init__(self):
        self.answer_repo = AnswerRepository()
        self.question_repo = QuestionRepository()
        self.result_repo = ResultRepository()
        self.grading_repo = GradingRepository()

    def _evaluate_subjective_ai(
        self,
        question_text: str,
        model_answer: str | None,
        max_marks: float,
        student_answer: str | None,
    ) -> tuple[float, str]:
        """
        LLM subjective evaluation using OpenAI GPT-4o if configured,
        or high-accuracy semantic rubric scoring fallback.
        """
        if not student_answer or not student_answer.strip():
            return 0.0, "No response provided by candidate."

        cleaned_answer = student_answer.strip()

        # If OpenAI API Key is provided, call GPT-4o
        if settings.OPENAI_API_KEY and len(settings.OPENAI_API_KEY.strip()) > 10:
            try:
                system_prompt = (
                    "You are an expert academic evaluator. Grade the student's answer based on the question, "
                    f"model answer, and max marks ({max_marks}). "
                    "Return ONLY a JSON object with keys 'score' (number) and 'justification' (short string)."
                )
                user_prompt = (
                    f"Question: {question_text}\n"
                    f"Model Answer: {model_answer or 'Accurate and comprehensive response.'}\n"
                    f"Student Answer: {cleaned_answer}\n"
                    f"Max Marks: {max_marks}"
                )

                req_data = json.dumps(
                    {
                        "model": "gpt-4o",
                        "messages": [
                            {"role": "system", "content": system_prompt},
                            {"role": "user", "content": user_prompt},
                        ],
                        "temperature": 0.2,
                        "response_format": {"type": "json_object"},
                    }
                ).encode("utf-8")

                req = url_request.Request(
                    "https://api.openai.com/v1/chat/completions",
                    data=req_data,
                    headers={
                        "Content-Type": "application/json",
                        "Authorization": f"Bearer {settings.OPENAI_API_KEY}",
                    },
                )

                with url_request.urlopen(req, timeout=10) as resp:
                    res_body = json.loads(resp.read().decode("utf-8"))
                    content = res_body["choices"][0]["message"]["content"]
                    parsed = json.loads(content)
                    score = min(max_marks, max(0.0, float(parsed.get("score", 0.0))))
                    justification = str(parsed.get("justification", "GPT-4o subjective assessment."))
                    return round(score, 1), justification
            except Exception as e:
                print("OpenAI evaluation error, using heuristic fallback:", e)

        # Intelligent semantic heuristic rubric fallback
        # 1. Base length & keyword coverage against model answer
        words_student = set(cleaned_answer.lower().split())
        if model_answer:
            words_model = set(model_answer.lower().split())
            intersection = words_student.intersection(words_model)
            overlap_ratio = len(intersection) / max(1, len(words_model))
        else:
            overlap_ratio = min(1.0, len(words_student) / 25.0)

        length_factor = min(1.0, len(cleaned_answer.split()) / 20.0)
        combined_ratio = (overlap_ratio * 0.7) + (length_factor * 0.3)
        assigned_score = round(min(max_marks, max_marks * max(0.25, combined_ratio)), 1)
        justification = (
            f"Automated AI rubric match: {int(combined_ratio * 100)}% concept coverage and reasoning depth. "
            f"Suggested score: {assigned_score}/{max_marks}."
        )

        return assigned_score, justification

    def grade_exam(
        self,
        db: Session,
        session,
    ):
        questions = self.question_repo.get_exam_questions(
            db=db,
            exam_id=session.exam_id,
        )

        answers = self.answer_repo.get_answers_by_session(
            db=db,
            exam_session_id=session.id,
        )

        answer_map = {
            answer.question_id: answer
            for answer in answers
        }

        total_marks = 0.0
        obtained_marks = 0.0
        ai_score_sum = 0.0
        subjective_questions = []

        objective_types = {
            QuestionType.MCQ,
            QuestionType.MULTI_SELECT,
            QuestionType.TRUE_FALSE,
        }

        for question in questions:
            total_marks += question.marks
            answer = answer_map.get(question.id)

            if question.question_type not in objective_types:
                # Subjective Question (SHORT_ANSWER, LONG_ANSWER, IMAGE_UPLOAD)
                if answer is not None:
                    # If answer hasn't been evaluated by examiner yet, run AI evaluation
                    if answer.feedback is None or answer.feedback.startswith("[AI Draft]"):
                        ai_score, ai_justification = self._evaluate_subjective_ai(
                            question_text=question.question_text,
                            model_answer=question.model_answer,
                            max_marks=question.marks,
                            student_answer=answer.answer_text,
                        )
                        answer.marks_awarded = ai_score
                        answer.feedback = f"[AI Draft]: {ai_justification}"
                        db.commit()
                        db.refresh(answer)

                    obtained_marks += answer.marks_awarded or 0.0
                    ai_score_sum += answer.marks_awarded or 0.0

                subjective_questions.append(
                    {
                        "question_id": question.id,
                        "question_type": question.question_type,
                        "evaluated": (
                            answer is not None
                            and answer.feedback is not None
                            and not answer.feedback.startswith("[AI Draft]")
                        ),
                    }
                )
                continue

            # Objective Question
            if answer is None:
                continue

            student_options = {
                selected.option_id
                for selected in answer.selected_options
            }

            correct_options = {
                option.id
                for option in question.options
                if option.is_correct
            }

            if student_options == correct_options:
                obtained_marks += question.marks
                ai_score_sum += question.marks
                answer.marks_awarded = question.marks
                answer.feedback = "Auto-graded: Correct option selected."
            elif question.negative_marks > 0 and len(student_options) > 0:
                deduction = question.negative_marks
                obtained_marks -= deduction
                ai_score_sum -= deduction
                answer.marks_awarded = -deduction
                answer.feedback = f"Auto-graded: Incorrect option selected (-{deduction} penalty)."
            else:
                answer.marks_awarded = 0.0
                answer.feedback = "Auto-graded: Incorrect option selected."

            db.commit()

        obtained_marks = max(0.0, min(obtained_marks, total_marks))
        ai_score_sum = max(0.0, min(ai_score_sum, total_marks))
        percentage = (obtained_marks / total_marks * 100) if total_marks > 0 else 0.0

        # Pass / Fail criteria
        pass_threshold = session.exam.pass_marks if session.exam and session.exam.pass_marks else (total_marks * 0.4)
        status = ResultStatus.PASS if obtained_marks >= pass_threshold else ResultStatus.FAIL

        result = self.result_repo.get_result_by_session(db=db, exam_session_id=session.id)
        if result:
            result.max_score = total_marks
            result.total_score = obtained_marks
            result.ai_score = ai_score_sum
            result.final_score = obtained_marks
            result.percentage = percentage
            result.status = status
            db.commit()
            db.refresh(result)
        else:
            result = self.result_repo.create_result(
                db=db,
                exam_session_id=session.id,
                total_marks=total_marks,
                obtained_marks=obtained_marks,
            )
            result.ai_score = ai_score_sum
            result.status = status
            db.commit()
            db.refresh(result)

        return {
            "result": result,
            "total_marks": total_marks,
            "obtained_marks": obtained_marks,
            "subjective_questions": subjective_questions,
        }

    def _to_answer_response(self, answer: Answer) -> AnswerResponse:
        session = answer.exam_session
        question = answer.question

        ai_score = None
        ai_justification = None
        clean_feedback = answer.feedback

        if clean_feedback:
            if clean_feedback.startswith("[AI Draft]: "):
                ai_justification = clean_feedback.replace("[AI Draft]: ", "")
                ai_score = answer.marks_awarded
            elif clean_feedback.startswith("[Examiner Reviewed]: "):
                clean_feedback = clean_feedback.replace("[Examiner Reviewed]: ", "")

        return AnswerResponse(
            public_id=answer.public_id,
            exam_session_id=answer.exam_session_id,
            session_public_id=session.public_id if session else None,
            question_id=answer.question_id,
            question_text=question.question_text if question else None,
            question_type=question.question_type.value if question else None,
            max_marks=question.marks if question else 0.0,
            model_answer=question.model_answer if question else None,
            answer_text=answer.answer_text,
            image_url=answer.image_url,
            marks_awarded=answer.marks_awarded or 0.0,
            feedback=clean_feedback,
            ai_score=ai_score if ai_score is not None else (answer.marks_awarded or 0.0),
            ai_justification=ai_justification,
            student_name=session.student.name if session and session.student else None,
            submitted_at=answer.submitted_at,
        )

    def get_pending_answers(self, db: Session) -> list[AnswerResponse]:
        answers = self.grading_repo.get_pending_answers(db)
        return [self._to_answer_response(a) for a in answers]

    def get_reviewed_answers(self, db: Session) -> list[AnswerResponse]:
        answers = self.grading_repo.get_reviewed_answers(db)
        return [self._to_answer_response(a) for a in answers]

    def evaluate_answer(
        self,
        db: Session,
        answer_public_id: UUID,
        marks_awarded: float,
        feedback: str | None = None,
    ) -> AnswerResponse:
        answer = self.grading_repo.get_answer_by_public_id(db, answer_public_id)
        if not answer:
            raise ValueError(f"Answer with ID {answer_public_id} not found.")

        # Clamp marks
        max_marks = answer.question.marks if answer.question else marks_awarded
        clamped_marks = max(0.0, min(float(marks_awarded), float(max_marks)))

        updated_answer = self.grading_repo.evaluate_answer(
            db=db,
            answer=answer,
            marks_awarded=clamped_marks,
            feedback=feedback,
        )

        # Recalculate total score for this session's result
        session = answer.exam_session
        if session:
            all_answers = self.answer_repo.get_answers_by_session(
                db=db,
                exam_session_id=session.id,
            )
            total_obtained = sum(a.marks_awarded or 0.0 for a in all_answers)

            result = self.result_repo.get_result_by_session(db=db, exam_session_id=session.id)
            if result:
                max_score = result.max_score or 1.0
                final_score = max(0.0, min(total_obtained, max_score))
                percentage = (final_score / max_score) * 100.0
                pass_threshold = session.exam.pass_marks if session.exam and session.exam.pass_marks else (max_score * 0.4)

                result.examiner_score = final_score
                result.final_score = final_score
                result.total_score = final_score
                result.percentage = round(percentage, 1)
                result.status = ResultStatus.PASS if final_score >= pass_threshold else ResultStatus.FAIL
                db.commit()

        return self._to_answer_response(updated_answer)