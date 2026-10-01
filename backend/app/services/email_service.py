import resend

from app.config import settings


def send_email(
    to_email: str,
    subject: str,
    body: str,
) -> None:
    if not settings.RESEND_API_KEY:
        raise RuntimeError("RESEND_API_KEY is not configured")

    resend.api_key = settings.RESEND_API_KEY

    params = {
        "from": "Meetwise AI HR Interview Assistant <onboarding@resend.dev>",
        "to": [to_email],
        "subject": subject,
        "text": body,
    }

    resend.Emails.send(params)