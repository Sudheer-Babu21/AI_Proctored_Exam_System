from io import BytesIO
from datetime import datetime, timezone
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    HRFlowable,
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT


def generate_exam_pdf_report(session, result, proctor_events) -> BytesIO:
    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=40,
        leftMargin=40,
        topMargin=40,
        bottomMargin=40,
    )

    styles = getSampleStyleSheet()

    # Custom styles
    header_style = ParagraphStyle(
        "HeaderTitle",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=20,
        leading=24,
        textColor=colors.HexColor("#1e1b4b"),
        alignment=TA_CENTER,
    )

    subtitle_style = ParagraphStyle(
        "HeaderSubtitle",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=10,
        leading=13,
        textColor=colors.HexColor("#4f46e5"),
        alignment=TA_CENTER,
    )

    section_heading = ParagraphStyle(
        "SectionHeading",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=12,
        leading=16,
        textColor=colors.HexColor("#1e293b"),
    )

    body_style = ParagraphStyle(
        "BodyDark",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=9,
        leading=13,
        textColor=colors.HexColor("#334155"),
    )

    bold_body = ParagraphStyle(
        "BoldBody",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=9,
        leading=13,
        textColor=colors.HexColor("#0f172a"),
    )

    pass_status_style = ParagraphStyle(
        "PassStatus",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=14,
        leading=18,
        textColor=colors.HexColor("#059669"),
        alignment=TA_CENTER,
    )

    fail_status_style = ParagraphStyle(
        "FailStatus",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=14,
        leading=18,
        textColor=colors.HexColor("#dc2626"),
        alignment=TA_CENTER,
    )

    story = []

    # 1. Header Banner
    story.append(Paragraph("AI PROCTORED EXAMINATION SYSTEM", header_style))
    story.append(Spacer(1, 4))
    story.append(
        Paragraph("OFFICIAL ASSESSMENT TRANSCRIPT & INTEGRITY AUDIT REPORT", subtitle_style)
    )
    story.append(Spacer(1, 12))
    story.append(
        HRFlowable(width="100%", thickness=2, color=colors.HexColor("#4f46e5"), spaceAfter=14)
    )

    # 2. Candidate & Exam Meta Table
    student = session.student if session else None
    exam = session.exam if session else None

    student_name = student.name if student else "N/A"
    student_email = student.email if student else "N/A"
    exam_title = exam.title if exam else "General Exam"
    subject = exam.subject if exam else "General"
    date_str = session.start_time.strftime("%B %d, %Y - %H:%M UTC") if session.start_time else datetime.utcnow().strftime("%B %d, %Y")

    meta_data = [
        [
            Paragraph("<b>Candidate Name:</b>", body_style),
            Paragraph(student_name, bold_body),
            Paragraph("<b>Assessment Title:</b>", body_style),
            Paragraph(exam_title, bold_body),
        ],
        [
            Paragraph("<b>Candidate Email:</b>", body_style),
            Paragraph(student_email, body_style),
            Paragraph("<b>Subject Domain:</b>", body_style),
            Paragraph(subject, bold_body),
        ],
        [
            Paragraph("<b>Session ID:</b>", body_style),
            Paragraph(str(session.public_id)[:18] + "...", body_style),
            Paragraph("<b>Date of Examination:</b>", body_style),
            Paragraph(date_str, body_style),
        ],
    ]

    meta_table = Table(meta_data, colWidths=[110, 155, 115, 150])
    meta_table.setStyle(
        TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#f8fafc")),
            ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
            ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
            ("TOPPADDING", (0, 0), (-1, -1), 6),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
            ("LEFTPADDING", (0, 0), (-1, -1), 8),
            ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ])
    )
    story.append(meta_table)
    story.append(Spacer(1, 16))

    # 3. Score & Outcome Card
    story.append(Paragraph("ACADEMIC PERFORMANCE SUMMARY", section_heading))
    story.append(Spacer(1, 8))

    final_score = result.final_score if result else 0.0
    max_score = result.max_score if result else (exam.total_marks if exam else 100.0)
    percentage = result.percentage if result else 0.0
    status_text = result.status.value if result and result.status else ("PASS" if percentage >= 40 else "FAIL")
    is_passed = status_text == "PASS"

    status_paragraph = (
        Paragraph(f"RESULT: {status_text}", pass_status_style)
        if is_passed
        else Paragraph(f"RESULT: {status_text}", fail_status_style)
    )

    score_data = [
        [
            Paragraph("<b>Maximum Marks</b>", body_style),
            Paragraph("<b>Marks Obtained</b>", body_style),
            Paragraph("<b>Percentage Score</b>", body_style),
            Paragraph("<b>Outcome Status</b>", body_style),
        ],
        [
            Paragraph(f"{max_score:.1f}", bold_body),
            Paragraph(f"{final_score:.1f}", bold_body),
            Paragraph(f"{percentage:.1f}%", bold_body),
            status_paragraph,
        ],
    ]

    score_table = Table(score_data, colWidths=[120, 120, 130, 160])
    score_table.setStyle(
        TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#eef2ff")),
            ("BACKGROUND", (0, 1), (-1, 1), colors.HexColor("#ffffff")),
            ("BOX", (0, 0), (-1, -1), 1, colors.HexColor("#6366f1")),
            ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
            ("ALIGN", (0, 0), (-1, -1), "CENTER"),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ("TOPPADDING", (0, 0), (-1, -1), 8),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
        ])
    )
    story.append(score_table)
    story.append(Spacer(1, 18))

    # 4. AI Proctoring & Security Telemetry
    story.append(Paragraph("AI PROCTORING & INTEGRITY AUDIT", section_heading))
    story.append(Spacer(1, 8))

    events_list = proctor_events or []
    violation_count = len(events_list)
    unresolved_count = len([e for e in events_list if not e.is_resolved])
    max_suspicion = max([e.suspicion_score or 0.0 for e in events_list], default=0.0)

    integrity_verdict = "AUDITED & CLEARED" if (violation_count == 0 or max_suspicion < 0.6) else "FLAGGED FOR EXAMINER REVIEW"

    proctor_summary = [
        [
            Paragraph("<b>Continuous Face Presence Monitoring:</b>", body_style),
            Paragraph("Active (MediaPipe AI Detection)", bold_body),
        ],
        [
            Paragraph("<b>Gaze & Focus Direction Tracking:</b>", body_style),
            Paragraph("Active & Logged", bold_body),
        ],
        [
            Paragraph("<b>Environment & Window Security:</b>", body_style),
            Paragraph("Fullscreen Lock & Tab Switch Sensor Active", bold_body),
        ],
        [
            Paragraph("<b>Total Security Flags Recorded:</b>", body_style),
            Paragraph(f"{violation_count} events ({unresolved_count} unresolved)", bold_body),
        ],
        [
            Paragraph("<b>Peak Suspicion Score:</b>", body_style),
            Paragraph(f"{max_suspicion * 100:.0f}%", bold_body),
        ],
        [
            Paragraph("<b>Integrity Decision Verdict:</b>", body_style),
            Paragraph(f"<b>{integrity_verdict}</b>", bold_body),
        ],
    ]

    proctor_table = Table(proctor_summary, colWidths=[240, 290])
    proctor_table.setStyle(
        TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#f8fafc")),
            ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
            ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
            ("TOPPADDING", (0, 0), (-1, -1), 5),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
            ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ])
    )
    story.append(proctor_table)
    story.append(Spacer(1, 24))

    # 5. Sign-off / Verification Seal
    story.append(
        HRFlowable(width="100%", thickness=1, color=colors.HexColor("#cbd5e1"), spaceAfter=14)
    )

    sign_data = [
        [
            Paragraph("<b>System Evaluation:</b><br/>FastAPI Auto-Scoring + GPT-4o Evaluator", body_style),
            Paragraph("<b>Examiner Review Portal:</b><br/>Verified & Authenticated", body_style),
            Paragraph(f"<b>Generated On:</b><br/>{datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S UTC')}", body_style),
        ]
    ]
    sign_table = Table(sign_data, colWidths=[180, 180, 170])
    sign_table.setStyle(
        TableStyle([
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("TOPPADDING", (0, 0), (-1, -1), 2),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 2),
        ])
    )
    story.append(sign_table)

    doc.build(story)
    buffer.seek(0)
    return buffer
