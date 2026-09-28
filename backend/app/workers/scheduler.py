"""Restart-safe reminder scheduler. Polls the database every REMINDER_POLL_SECONDS for
reminders whose scheduled_for has passed, rather than scheduling one in-memory job per
interview (which would be lost on restart and drift on reschedule)."""
import logging

from apscheduler.schedulers.background import BackgroundScheduler

from app.config import settings
from app.db.session import SessionLocal
from app.services.reminder_service import claim_due_reminders

logger = logging.getLogger("reminder_scheduler")

scheduler = BackgroundScheduler()


def _poll_due_reminders() -> None:
    db = SessionLocal()
    try:
        due = claim_due_reminders(db)
        if due:
            logger.info("Delivered %d reminder(s): %s", len(due), [str(r.id) for r in due])
    except Exception:
        logger.exception("Reminder poll failed")
    finally:
        db.close()


def start_scheduler() -> None:
    scheduler.add_job(
        _poll_due_reminders,
        "interval",
        seconds=settings.REMINDER_POLL_SECONDS,
        id="poll_due_reminders",
        replace_existing=True,
    )
    scheduler.start()
    logger.info("Reminder scheduler started (polling every %ss)", settings.REMINDER_POLL_SECONDS)


def stop_scheduler() -> None:
    scheduler.shutdown(wait=False)
