import smtplib
from email.message import EmailMessage

from app.core.config import settings


def send_verification_email(
    recipient_email: str,
    recipient_name: str,
    verification_token: str,
) -> None:

    verification_link = (
        f"{settings.FRONTEND_URL}/verify-email"
        f"?token={verification_token}"
    )

    message = EmailMessage()

    message["Subject"] = "Verify Your Email - AI Proctored Exam System"
    message["From"] = settings.SMTP_FROM_EMAIL
    message["To"] = recipient_email

    message.set_content(
        f"""
Hello {recipient_name},

Thank you for registering for the AI Proctored Online Examination System.

Please verify your email address by clicking the link below:

{verification_link}

This verification link will expire in 24 hours.

If you did not create this account, you can safely ignore this email.

Regards,
AI Proctored Examination System
"""
    )

    with smtplib.SMTP(
        settings.SMTP_HOST,
        settings.SMTP_PORT,
    ) as server:

        server.starttls()

        server.login(
            settings.SMTP_USERNAME,
            settings.SMTP_PASSWORD,
        )

        server.send_message(message)