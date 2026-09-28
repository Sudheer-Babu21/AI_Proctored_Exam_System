"""
Database seed script to populate sample questions, default demo users, and exams.
"""
from datetime import datetime, timedelta, timezone
from app.db.database import SessionLocal
from app.models.users import User
from app.models.exams import Exam
from app.models.question_bank import QuestionBank
from app.models.options import Option
from app.models.exam_questions import ExamQuestion
from app.core.enums import QuestionType, DifficultyLevel, UserRole
from app.core.security import hash_password


def seed_data():
    db = SessionLocal()
    try:
        # 1. Ensure Default Demo Users Exist
        users_data = [
            {
                "name": "System Administrator",
                "email": "admin@ai-exam.com",
                "password": "admin12345",
                "role": UserRole.ADMIN,
            },
            {
                "name": "Dr. Sarah Mitchell",
                "email": "examiner@ai-exam.com",
                "password": "examiner123",
                "role": UserRole.EXAMINER,
            },
            {
                "name": "Alex Johnson",
                "email": "student@ai-exam.com",
                "password": "student123",
                "role": UserRole.STUDENT,
            },
        ]

        created_users = {}
        for u in users_data:
            user = db.query(User).filter(User.email == u["email"]).first()
            if not user:
                user = User(
                    name=u["name"],
                    email=u["email"],
                    password_hash=hash_password(u["password"]),
                    role=u["role"],
                    is_active=True,
                    is_verified=True,
                )
                db.add(user)
                db.commit()
                db.refresh(user)
                print(f"Created default user: {u['email']} ({u['role'].value})")
            else:
                # Ensure user has correct password and is active
                user.password_hash = hash_password(u["password"])
                user.is_active = True
                db.commit()
                db.refresh(user)
            created_users[u["role"]] = user

        examiner = created_users.get(UserRole.EXAMINER) or created_users.get(UserRole.ADMIN)
        creator_id = examiner.id

        # 2. Rich Questions
        sample_questions = [
            {
                "question_text": "Which of the following built-in Python data structures is immutable?",
                "question_type": QuestionType.MCQ,
                "difficulty": DifficultyLevel.EASY,
                "subject": "Python",
                "topic": "Data Types",
                "marks": 5.0,
                "negative_marks": 1.0,
                "explanation": "Tuples and strings in Python are immutable collections.",
                "options": [
                    ("List", False),
                    ("Dictionary", False),
                    ("Tuple", True),
                    ("Set", False),
                ],
            },
            {
                "question_text": "Python is an interpreted, dynamically typed programming language.",
                "question_type": QuestionType.TRUE_FALSE,
                "difficulty": DifficultyLevel.EASY,
                "subject": "Python",
                "topic": "Fundamentals",
                "marks": 5.0,
                "negative_marks": 0.0,
                "explanation": "Python executes via bytecode in the Python Virtual Machine and types are checked at runtime.",
                "options": [
                    ("True", True),
                    ("False", False),
                ],
            },
            {
                "question_text": "Which of the following statements about Python generators are TRUE? (Select all that apply)",
                "question_type": QuestionType.MULTI_SELECT,
                "difficulty": DifficultyLevel.MEDIUM,
                "subject": "Python",
                "topic": "Generators & Iterators",
                "marks": 10.0,
                "negative_marks": 2.0,
                "explanation": "Generators use yield, preserve execution state, and compute values lazily.",
                "options": [
                    ("Generators use the 'yield' keyword instead of 'return'", True),
                    ("Generators load all values into memory at once", False),
                    ("Generators implement the iterator protocol with __next__()", True),
                    ("Generators can only produce integer sequences", False),
                ],
            },
            {
                "question_text": "Explain the difference between shallow copy and deep copy in Python with respect to nested mutable objects.",
                "question_type": QuestionType.SHORT_ANSWER,
                "difficulty": DifficultyLevel.MEDIUM,
                "subject": "Python",
                "topic": "Memory & Copies",
                "marks": 10.0,
                "negative_marks": 0.0,
                "model_answer": "A shallow copy creates a new object but inserts references into it to the objects found in the original, meaning nested mutable objects are shared. A deep copy recursively copies all objects found in the original, so changes to nested objects do not affect each other.",
                "options": [],
            },
            {
                "question_text": "Describe the Python Global Interpreter Lock (GIL). What problem does it solve in CPython, and how does it affect CPU-bound vs I/O-bound multi-threaded programs?",
                "question_type": QuestionType.LONG_ANSWER,
                "difficulty": DifficultyLevel.HARD,
                "subject": "Python",
                "topic": "Concurrency & Internals",
                "marks": 20.0,
                "negative_marks": 0.0,
                "model_answer": "The GIL is a mutex that prevents multiple native threads from executing Python bytecode simultaneously in CPython. It ensures thread-safe memory management without fine-grained locks. For CPU-bound tasks, it limits multi-threaded performance to a single CPU core. For I/O-bound tasks, the GIL is released during I/O operations, allowing concurrent execution.",
                "options": [],
            },
        ]

        created_questions = []
        for q_data in sample_questions:
            existing = db.query(QuestionBank).filter(QuestionBank.question_text == q_data["question_text"]).first()
            if not existing:
                q = QuestionBank(
                    question_text=q_data["question_text"],
                    question_type=q_data["question_type"],
                    difficulty=q_data["difficulty"],
                    subject=q_data["subject"],
                    topic=q_data.get("topic"),
                    marks=q_data["marks"],
                    negative_marks=q_data.get("negative_marks", 0.0),
                    model_answer=q_data.get("model_answer"),
                    explanation=q_data.get("explanation"),
                    created_by=creator_id,
                    is_active=True,
                )
                db.add(q)
                db.commit()
                db.refresh(q)

                for opt_text, is_corr in q_data.get("options", []):
                    opt = Option(
                        question_id=q.id,
                        option_text=opt_text,
                        is_correct=is_corr,
                    )
                    db.add(opt)
                db.commit()
                created_questions.append(q)
                print(f"Added question: {q.question_text[:40]}")
            else:
                created_questions.append(existing)

        # 3. Ensure a Demo Exam exists
        now = datetime.now(timezone.utc).replace(tzinfo=None)
        demo_exam = db.query(Exam).filter(Exam.title == "Python & AI Proctoring Assessment").first()
        if not demo_exam:
            demo_exam = Exam(
                title="Python & AI Proctoring Assessment",
                description="Comprehensive evaluation covering data types, generators, concurrency, and OOP.",
                subject="Python",
                duration_minutes=60,
                total_marks=50,
                pass_marks=20,
                negative_marking=True,
                shuffle_questions=True,
                shuffle_options=True,
                start_time=now - timedelta(days=1),
                end_time=now + timedelta(days=30),
                is_active=True,
                created_by=creator_id,
            )
            db.add(demo_exam)
            db.commit()
            db.refresh(demo_exam)
            print("Created default demo exam: Python & AI Proctoring Assessment")

        # 4. Assign questions to all exams
        exams = db.query(Exam).all()
        all_questions = db.query(QuestionBank).all()

        for ex in exams:
            current_count = db.query(ExamQuestion).filter(ExamQuestion.exam_id == ex.id).count()
            if current_count < 3:
                for idx, q in enumerate(all_questions):
                    already = db.query(ExamQuestion).filter(
                        ExamQuestion.exam_id == ex.id,
                        ExamQuestion.question_id == q.id
                    ).first()
                    if not already:
                        eq = ExamQuestion(
                            exam_id=ex.id,
                            question_id=q.id,
                            question_order=idx + 1,
                        )
                        db.add(eq)
                db.commit()
                print(f"Assigned questions to exam {ex.id}: {ex.title}")

        print("Database seeding completed successfully with all default roles!")
    finally:
        db.close()


if __name__ == "__main__":
    seed_data()
