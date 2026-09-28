import shutil
import tempfile
import unittest
import uuid
from datetime import datetime, timedelta, timezone
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import patch

from fastapi.testclient import TestClient
from sqlalchemy import func, select
from sqlalchemy.orm import sessionmaker

from app.config import settings
from app.db.session import engine, get_db
from app.main import app
from app.models.candidate import Candidate
from app.models.interview import Interview
from app.models.interview_note import InterviewNote
from app.models.reminder import Reminder
from app.models.user import User
from app.services import ai_service, reminder_service


def build_test_pdf() -> bytes:
    content_stream = b"BT /F1 12 Tf 72 720 Td (Meetwise resume evidence) Tj ET\n"
    objects = [
        b"<< /Type /Catalog /Pages 2 0 R >>",
        b"<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
        b"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>",
        f"<< /Length {len(content_stream)} >>\nstream\n".encode()
        + content_stream
        + b"endstream",
        b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    ]
    chunks = [b"%PDF-1.4\n"]
    offsets = [0]
    for index, item in enumerate(objects, start=1):
        offsets.append(sum(map(len, chunks)))
        chunks.extend([f"{index} 0 obj\n".encode(), item, b"\nendobj\n"])
    xref_offset = sum(map(len, chunks))
    chunks.append(f"xref\n0 {len(objects) + 1}\n0000000000 65535 f \n".encode())
    chunks.extend(f"{offset:010d} 00000 n \n".encode() for offset in offsets[1:])
    chunks.append(
        f"trailer\n<< /Size {len(objects) + 1} /Root 1 0 R >>\nstartxref\n{xref_offset}\n%%EOF\n".encode()
    )
    return b"".join(chunks)


class ExistingWorkflowTests(unittest.TestCase):
    def setUp(self) -> None:
        self.original_upload_dir = settings.UPLOAD_DIR
        self.upload_dir = tempfile.mkdtemp(prefix="meetwise-workflow-test-")
        settings.UPLOAD_DIR = self.upload_dir
        self.connection = engine.connect()
        self.transaction = self.connection.begin()
        self.TestSession = sessionmaker(
            bind=self.connection,
            autoflush=False,
            autocommit=False,
            join_transaction_mode="create_savepoint",
        )
        with self.TestSession() as db:
            owner = User(
                email=f"workflow-test-{uuid.uuid4().hex}@example.com",
                hashed_password="test-only",
                full_name="Workflow Test",
                is_active=True,
            )
            db.add(owner)
            db.commit()
            self.owner_id = owner.id

        def override_db():
            db = self.TestSession()
            try:
                yield db
            finally:
                db.close()

        app.dependency_overrides[get_db] = override_db
        from app.api.deps import get_current_user

        app.dependency_overrides[get_current_user] = lambda: SimpleNamespace(id=self.owner_id)
        self.client = TestClient(app)
        self.pdf = build_test_pdf()

    def tearDown(self) -> None:
        app.dependency_overrides.clear()
        self.transaction.rollback()
        self.connection.close()
        settings.UPLOAD_DIR = self.original_upload_dir
        shutil.rmtree(self.upload_dir, ignore_errors=True)

    def create_candidate(self, email: str) -> dict:
        response = self.client.post(
            "/api/v1/candidates",
            json={"name": "Workflow Candidate", "email": email, "job_role": "Platform Engineer"},
        )
        self.assertEqual(response.status_code, 201, response.text)
        return response.json()

    def test_create_upload_and_read_candidate_profile(self) -> None:
        email = f"candidate-{uuid.uuid4().hex}@example.com"
        candidate = self.create_candidate(email)
        candidate_id = candidate["id"]

        profile = self.client.get(f"/api/v1/candidates/{candidate_id}")
        self.assertEqual(profile.status_code, 200, profile.text)
        self.assertEqual(profile.json()["email"], email)
        self.assertFalse(profile.json()["has_resume"])

        uploaded = self.client.post(
            f"/api/v1/candidates/{candidate_id}/resume",
            files={"file": ("resume.pdf", self.pdf, "application/pdf")},
        )
        self.assertEqual(uploaded.status_code, 201, uploaded.text)
        self.assertEqual(uploaded.json()["parse_status"], "completed")

        refreshed_profile = self.client.get(f"/api/v1/candidates/{candidate_id}")
        resumes = self.client.get(f"/api/v1/candidates/{candidate_id}/resumes")
        self.assertEqual(refreshed_profile.status_code, 200)
        self.assertTrue(refreshed_profile.json()["has_resume"])
        self.assertIn("Meetwise resume evidence", resumes.json()[0]["extracted_text"])

        duplicate = self.client.post(
            "/api/v1/candidates",
            json={"name": "Duplicate", "email": email, "job_role": "Platform Engineer"},
        )
        self.assertEqual(duplicate.status_code, 409)
        with self.TestSession() as db:
            count = db.scalar(
                select(func.count()).select_from(Candidate).where(Candidate.owner_id == self.owner_id)
            )
        self.assertEqual(count, 1)

    def test_interview_reminders_feedback_and_summary_persist(self) -> None:
        candidate = self.create_candidate(f"interview-{uuid.uuid4().hex}@example.com")
        candidate_id = candidate["id"]
        scheduled_at = (datetime.now(timezone.utc) + timedelta(hours=26)).isoformat()
        created = self.client.post(
            "/api/v1/interviews",
            json={
                "candidate_id": candidate_id,
                "scheduled_at": scheduled_at,
                "duration_minutes": 45,
                "interview_type": "video",
                "meeting_link": "https://meet.google.com/test-room",
                "interviewer": "Workflow Test",
            },
        )
        self.assertEqual(created.status_code, 201, created.text)
        interview_id = created.json()["id"]
        with self.TestSession() as db:
            reminders = list(
                db.scalars(select(Reminder).where(Reminder.interview_id == uuid.UUID(interview_id))).all()
            )
        self.assertEqual(len(reminders), 4)
        self.assertEqual(
            {reminder.reminder_type for reminder in reminders},
            {"24_hour", "1_hour", "15_minute", "at_time"},
        )

        new_time = (datetime.now(timezone.utc) + timedelta(hours=50)).isoformat()
        rescheduled = self.client.patch(
            f"/api/v1/interviews/{interview_id}", json={"scheduled_at": new_time}
        )
        self.assertEqual(rescheduled.status_code, 200, rescheduled.text)

        note = self.client.post(
            f"/api/v1/interviews/{interview_id}/notes",
            json={"content": "Discussed a database migration.", "rating": 5, "recommendation": "hold"},
        )
        self.assertEqual(note.status_code, 201, note.text)
        edited_note = self.client.patch(
            f"/api/v1/interviews/notes/{note.json()['id']}",
            json={"content": "Discussed migration tradeoffs.", "rating": 5, "recommendation": "hold"},
        )
        self.assertEqual(edited_note.status_code, 200, edited_note.text)

        def generate_summary(notes_text: str) -> tuple[dict, str, int]:
            self.assertIn("Discussed migration tradeoffs.", notes_text)
            self.assertIn("Interviewer rating: 5", notes_text)
            return (
                {
                    "overview": "The notes record migration tradeoffs.",
                    "skills_discussed": ["Database migration"],
                    "candidate_responses_observations": ["Discussed migration tradeoffs"],
                    "strengths": [],
                    "areas_for_further_assessment": ["Rollback testing"],
                    "suggested_follow_up_topics": ["Ask about rollback testing"],
                },
                "test-model",
                1,
            )

        with patch.object(ai_service, "generate_post_interview_summary", generate_summary):
            generated = self.client.post(f"/api/v1/ai/interviews/{interview_id}/post-summary", json={})
        self.assertEqual(generated.status_code, 200, generated.text)
        self.assertEqual(generated.json()["status"], "completed")

        final_summary = generated.json()["content"] | {"overview": "HR-edited final summary."}
        saved = self.client.put(
            f"/api/v1/ai/interviews/{interview_id}/post-summary", json=final_summary
        )
        self.assertEqual(saved.status_code, 200, saved.text)
        loaded = self.client.get(f"/api/v1/ai/interviews/{interview_id}/post-summary")
        self.assertEqual(loaded.status_code, 200, loaded.text)
        self.assertEqual(loaded.json()["content"]["overview"], "HR-edited final summary.")

        cancelled = self.client.patch(
            f"/api/v1/interviews/{interview_id}", json={"status": "cancelled"}
        )
        self.assertEqual(cancelled.status_code, 200, cancelled.text)
        with self.TestSession() as db:
            reminders = list(
                db.scalars(select(Reminder).where(Reminder.interview_id == uuid.UUID(interview_id))).all()
            )
        self.assertTrue(all(reminder.status in {"cancelled", "skipped"} for reminder in reminders))


if __name__ == "__main__":
    unittest.main()
