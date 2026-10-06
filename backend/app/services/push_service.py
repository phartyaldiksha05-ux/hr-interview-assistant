import json
import logging
import uuid

from sqlalchemy import delete, select
from sqlalchemy.orm import Session
from pywebpush import WebPushException, webpush

from app.config import settings
from app.models.candidate import Candidate
from app.models.interview import Interview
from app.models.push_subscription import PushSubscription
from app.models.reminder import Reminder

logger = logging.getLogger("web_push")

_REMINDER_COPY = {
    "24_hour": "is tomorrow.",
    "1_hour": "starts in 1 hour.",
    "15_minute": "starts in 15 minutes.",
    "at_time": "starts now.",
}


def _notification_body(candidate_name: str, reminder_type: str) -> str:
    suffix = _REMINDER_COPY.get(reminder_type, "has an upcoming interview.")
    return f"{candidate_name}'s interview {suffix}"


def _subscription_info(subscription: PushSubscription) -> dict:
    return {
        "endpoint": subscription.endpoint,
        "keys": {
            "p256dh": subscription.p256dh,
            "auth": subscription.auth,
        },
    }


def _send_to_subscription(subscription: PushSubscription, payload: dict) -> None:
    if not settings.VAPID_PRIVATE_KEY:
        raise RuntimeError("VAPID_PRIVATE_KEY is not configured")
    if not settings.VAPID_CLAIMS_EMAIL:
        raise RuntimeError("VAPID_CLAIMS_EMAIL is not configured")

    webpush(
        subscription_info=_subscription_info(subscription),
        data=json.dumps(payload),
        vapid_private_key=settings.VAPID_PRIVATE_KEY,
        vapid_claims={"sub": settings.VAPID_CLAIMS_EMAIL},
        ttl=3600,
    )


def send_web_push_for_reminders(db: Session, reminders: list[Reminder]) -> None:
    """Send each newly-delivered reminder to every registered device for its HR owner.

    Web Push is an additional delivery channel. Reminder rows are already marked
    delivered by claim_due_reminders(), so a push failure does not remove or delay
    the existing in-app reminder behavior.
    """
    if not reminders:
        return

    reminder_ids = [reminder.id for reminder in reminders]
    rows = db.execute(
        select(Reminder, Interview, Candidate)
        .join(Interview, Reminder.interview_id == Interview.id)
        .join(Candidate, Interview.candidate_id == Candidate.id)
        .where(Reminder.id.in_(reminder_ids), Interview.status == "scheduled")
    ).all()

    for reminder, interview, candidate in rows:
        subscriptions = list(
            db.scalars(
                select(PushSubscription)
                .where(PushSubscription.user_id == interview.owner_id)
                .order_by(PushSubscription.created_at.asc())
            ).all()
        )

        if not subscriptions:
            logger.info(
                "No push subscriptions for reminder %s (owner=%s)",
                reminder.id,
                interview.owner_id,
            )
            continue

        payload = {
            "title": "Meetwise",
            "body": _notification_body(candidate.name, reminder.reminder_type),
            "interview_id": str(interview.id),
        }

        for subscription in subscriptions:
            try:
                _send_to_subscription(subscription, payload)
                logger.info(
                    "Web Push sent for reminder %s to subscription %s",
                    reminder.id,
                    subscription.id,
                )
            except WebPushException as exc:
                status_code = getattr(exc, "status_code", None)
                if status_code is None and getattr(exc, "response", None) is not None:
                    status_code = getattr(exc.response, "status_code", None)

                if status_code in {404, 410}:
                    logger.info(
                        "Removing expired push subscription %s (HTTP %s)",
                        subscription.id,
                        status_code,
                    )
                    db.execute(
                        delete(PushSubscription).where(PushSubscription.id == subscription.id)
                    )
                    db.commit()
                else:
                    logger.warning(
                        "Web Push failed for reminder %s, subscription %s (HTTP %s): %s",
                        reminder.id,
                        subscription.id,
                        status_code,
                        exc,
                    )
            except Exception:
                logger.exception(
                    "Unexpected Web Push failure for reminder %s, subscription %s",
                    reminder.id,
                    subscription.id,
                )
