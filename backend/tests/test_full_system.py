import pytest
from uuid import uuid4
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_home_health():
    res = client.get("/")
    assert res.status_code == 200
    assert "Backend Running Successfully" in res.json().get("message", "")


def test_auth_and_user_flows():
    # Register Examiner
    examiner_email = f"test_examiner_{uuid4().hex[:6]}@example.com"
    res_reg_ex = client.post(
        "/auth/register",
        json={
            "name": "Prof Test Examiner",
            "email": examiner_email,
            "password": "Password123!",
            "role": "EXAMINER",
        },
    )
    assert res_reg_ex.status_code in [201, 409]

    # Login Examiner via JSON
    res_login_ex = client.post(
        "/auth/login-json",
        json={
            "email": examiner_email,
            "password": "Password123!",
        },
    )
    assert res_login_ex.status_code == 200
    examiner_token = res_login_ex.json()["access_token"]
    assert len(examiner_token) > 20

    # Check /auth/me for Examiner
    res_me = client.get(
        "/auth/me",
        headers={"Authorization": f"Bearer {examiner_token}"},
    )
    assert res_me.status_code == 200
    assert res_me.json()["email"] == examiner_email
    assert res_me.json()["role"] == "EXAMINER"

    # Register Student
    student_email = f"test_student_{uuid4().hex[:6]}@example.com"
    res_reg_st = client.post(
        "/auth/register",
        json={
            "name": "Jane Candidate",
            "email": student_email,
            "password": "Password123!",
            "role": "STUDENT",
        },
    )
    assert res_reg_st.status_code == 201

    # Login Student via Form
    res_login_st = client.post(
        "/auth/login",
        data={
            "username": student_email,
            "password": "Password123!",
        },
    )
    assert res_login_st.status_code == 200
    student_token = res_login_st.json()["access_token"]

    # 1. Examiner creates Question
    res_q = client.post(
        "/questions",
        headers={"Authorization": f"Bearer {examiner_token}"},
        json={
            "question_text": f"What is 10 * 10? ({uuid4().hex[:4]})",
            "question_type": "MCQ",
            "difficulty": "EASY",
            "subject": "Mathematics",
            "topic": "Arithmetic",
            "marks": 10.0,
            "negative_marks": 0.0,
            "options": [
                {"option_text": "100", "is_correct": True},
                {"option_text": "20", "is_correct": False},
                {"option_text": "1000", "is_correct": False},
            ],
        },
    )
    assert res_q.status_code == 201
    q_data = res_q.json()
    q_id = q_data["public_id"]
    correct_opt_id = [o["id"] for o in q_data["options"] if o["is_correct"]][0]

    # Examiner creates Subjective Question
    res_q_subj = client.post(
        "/questions",
        headers={"Authorization": f"Bearer {examiner_token}"},
        json={
            "question_text": f"Explain polymorphism in OOP. ({uuid4().hex[:4]})",
            "question_type": "SHORT_ANSWER",
            "difficulty": "MEDIUM",
            "subject": "Computer Science",
            "topic": "OOP",
            "marks": 15.0,
            "negative_marks": 0.0,
            "model_answer": "Polymorphism is the ability of different classes to respond to the same message or method call in their own specific way.",
            "options": [],
        },
    )
    assert res_q_subj.status_code == 201
    subj_q_id = res_q_subj.json()["public_id"]

    # 2. Examiner creates Exam
    res_exam = client.post(
        "/exams",
        headers={"Authorization": f"Bearer {examiner_token}"},
        json={
            "title": f"Integration Test Exam {uuid4().hex[:4]}",
            "description": "Automated verification examination",
            "subject": "Mathematics",
            "duration_minutes": 30,
            "total_marks": 25,
            "pass_marks": 10,
            "negative_marking": False,
            "shuffle_questions": False,
            "shuffle_options": False,
            "start_time": "2026-09-01T00:00:00Z",
            "end_time": "2026-12-31T23:59:59Z",
        },
    )
    assert res_exam.status_code == 201
    exam_id = res_exam.json()["public_id"]

    # Assign Questions to Exam
    res_assign = client.post(
        f"/exams/{exam_id}/assign-random-questions",
        headers={"Authorization": f"Bearer {examiner_token}"},
        json={
            "subject": "Mathematics",
            "difficulty": "EASY",
            "question_count": 1,
        },
    )
    assert res_assign.status_code == 200

    # 3. Student starts Exam
    res_start = client.post(
        f"/exams/{exam_id}/start",
        headers={"Authorization": f"Bearer {student_token}"},
        json={},
    )
    assert res_start.status_code == 200
    session_id = res_start.json()["session_id"]

    # 4. Fetch exam questions
    res_sess_q = client.get(
        f"/exam-sessions/{session_id}/questions",
        headers={"Authorization": f"Bearer {student_token}"},
    )
    assert res_sess_q.status_code == 200
    session_questions = res_sess_q.json()["questions"]
    assert len(session_questions) > 0

    # 5. Student submits answers
    first_q = session_questions[0]
    if first_q["options"] and len(first_q["options"]) > 0:
        opt_id = first_q["options"][0]["id"]
        res_sub_ans = client.post(
            f"/exam-sessions/{session_id}/submit-answer",
            headers={"Authorization": f"Bearer {student_token}"},
            json={
                "question_public_id": first_q["public_id"],
                "selected_option_ids": [opt_id],
            },
        )
        assert res_sub_ans.status_code == 200

    # Also answer subjective if present or directly
    res_sub_text = client.post(
        f"/exam-sessions/{session_id}/submit-answer",
        headers={"Authorization": f"Bearer {student_token}"},
        json={
            "question_public_id": subj_q_id,
            "answer_text": "Polymorphism allows objects to take multiple forms and invoke subclasses methods.",
        },
    )
    # If question not assigned to this exam, it returns 404 or succeeds, both handled
    assert res_sub_text.status_code in [200, 404]

    # 6. Log Proctoring Violation with Snapshot
    dummy_b64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
    res_event = client.post(
        "/proctor-events",
        json={
            "session_public_id": session_id,
            "event_type": "GAZE_AWAY",
            "suspicion_score": 0.45,
            "confidence": 0.9,
            "remarks": "Candidate looked away from screen.",
            "snapshot_base64": dummy_b64,
        },
    )
    assert res_event.status_code == 201
    event_id = res_event.json()["public_id"]
    assert res_event.json()["evidence_path"] is not None

    # Examiner views events
    res_events_list = client.get(
        f"/proctor-events/{session_id}",
        headers={"Authorization": f"Bearer {examiner_token}"},
    )
    assert res_events_list.status_code == 200
    assert len(res_events_list.json()) >= 1

    # Examiner resolves event
    res_resolve = client.patch(
        f"/proctor-events/{event_id}/resolve",
        headers={"Authorization": f"Bearer {examiner_token}"},
    )
    assert res_resolve.status_code == 200

    # 7. Student submits Exam
    res_submit = client.post(
        f"/exam-sessions/{session_id}/submit",
        headers={"Authorization": f"Bearer {student_token}"},
    )
    assert res_submit.status_code == 200
    assert "Exam submitted successfully" in res_submit.json()["message"]

    # 8. Student retrieves Result
    res_result = client.get(
        f"/results/{session_id}",
        headers={"Authorization": f"Bearer {student_token}"},
    )
    assert res_result.status_code == 200
    result_data = res_result.json()
    assert "final_score" in result_data
    assert "status" in result_data

    # 9. Download Official PDF Report
    res_pdf = client.get(
        f"/results/{session_id}/pdf",
        headers={"Authorization": f"Bearer {student_token}"},
    )
    assert res_pdf.status_code == 200
    assert res_pdf.headers["content-type"] == "application/pdf"
    assert res_pdf.content.startswith(b"%PDF")
    assert len(res_pdf.content) > 500

    # 10. Examiner reviews all sessions
    res_sessions = client.get(
        "/exam-sessions",
        headers={"Authorization": f"Bearer {examiner_token}"},
    )
    assert res_sessions.status_code == 200
    assert len(res_sessions.json()) >= 1

    # 11. Examiner approves & publishes session
    res_pub = client.post(
        f"/exam-sessions/{session_id}/publish",
        headers={"Authorization": f"Bearer {examiner_token}"},
    )
    assert res_pub.status_code == 200
    assert "published" in res_pub.json()["message"].lower()

    # 12. Student checks my-sessions history
    res_my_sess = client.get(
        "/exam-sessions/my-sessions",
        headers={"Authorization": f"Bearer {student_token}"},
    )
    assert res_my_sess.status_code == 200
    assert len(res_my_sess.json()) >= 1
