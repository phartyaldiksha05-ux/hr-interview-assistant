import secrets
import uuid
from datetime import datetime, timedelta, timezone

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.config import settings
from app.core.security import hash_password, verify_password
from app.models.user import User
from app.schemas.auth import UserRegister
from app.services.email_service import send_email


def get_user_by_email(db: Session, email: str) -> User | None:
    stmt = select(User).where(func.lower(User.email) == email.lower())
    return db.execute(stmt).scalar_one_or_none()


def get_user_by_id(db: Session, user_id: uuid.UUID) -> User | None:
    return db.get(User, user_id)


def generate_otp() -> str:
    return f"{secrets.randbelow(1_000_000):06d}"


def send_verification_otp(db: Session, user: User) -> None:
    otp = generate_otp()

    now = datetime.now(timezone.utc)

    user.otp_hash = hash_password(otp)
    user.otp_expires_at = now + timedelta(
        minutes=settings.OTP_EXPIRE_MINUTES
    )
    user.otp_last_sent_at = now

    db.commit()

    send_email(
        to_email=user.email,
        subject="Verify your Meetwise account",
        body=(
            f"Hello {user.full_name},\n\n"
            f"Your Meetwise verification OTP is: {otp}\n\n"
            f"This OTP expires in {settings.OTP_EXPIRE_MINUTES} minutes.\n\n"
            "If you did not create this account, you can ignore this email.\n\n"
            "Regards,\n"
            "Meetwise AI HR Interview Assistant"
        ),
    )


def register_user(db: Session, data: UserRegister) -> User:
    user = User(
        email=data.email,
        full_name=data.full_name,
        hashed_password=hash_password(data.password),
        email_verified=False,
        otp_resend_count=0,
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    send_verification_otp(db, user)

    return user


def verify_otp(db: Session, user: User, otp: str) -> bool:
    if user.email_verified:
        return True

    if not user.otp_hash or not user.otp_expires_at:
        return False

    now = datetime.now(timezone.utc)

    if now >= user.otp_expires_at:
        return False

    if not verify_password(otp, user.otp_hash):
        return False

    user.email_verified = True
    user.otp_hash = None
    user.otp_expires_at = None
    user.otp_last_sent_at = None
    user.otp_resend_count = 0

    db.commit()

    return True


def resend_verification_otp(db: Session, user: User) -> str:
    if user.email_verified:
        raise ValueError("Email is already verified.")

    now = datetime.now(timezone.utc)

    if user.otp_last_sent_at is not None:
        elapsed_seconds = (now - user.otp_last_sent_at).total_seconds()

        if elapsed_seconds < settings.OTP_RESEND_COOLDOWN_SECONDS:
            remaining = int(
                settings.OTP_RESEND_COOLDOWN_SECONDS - elapsed_seconds
            )
            raise ValueError(
                f"Please wait {remaining} seconds before requesting another OTP."
            )

    if user.otp_resend_count >= settings.OTP_MAX_RESENDS:
        raise ValueError(
            "Maximum OTP resend limit reached. Please try again later."
        )

    otp = generate_otp()

    user.otp_hash = hash_password(otp)
    user.otp_expires_at = now + timedelta(
        minutes=settings.OTP_EXPIRE_MINUTES
    )
    user.otp_last_sent_at = now
    user.otp_resend_count += 1

    db.commit()

    send_email(
        to_email=user.email,
        subject="Your new Meetwise verification OTP",
        body=(
            f"Hello {user.full_name},\n\n"
            f"Your new Meetwise verification OTP is: {otp}\n\n"
            f"This OTP expires in {settings.OTP_EXPIRE_MINUTES} minutes.\n\n"
            "If you did not request this OTP, you can ignore this email.\n\n"
            "Regards,\n"
            "Meetwise AI HR Interview Assistant"
        ),
    )

    return "OTP resent successfully."


def authenticate_user(db: Session, email: str, password: str) -> User | None:
    user = get_user_by_email(db, email)

    if user is None or not user.is_active:
        return None

    if not user.email_verified:
        return None

    if not verify_password(password, user.hashed_password):
        return None

    return user