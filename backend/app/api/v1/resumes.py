import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.resume import ResumeResponse
from app.services import candidate_service, resume_service

router = APIRouter(tags=["resumes"])

MAX_SIZE = 10 * 1024 * 1024


@router.post("/candidates/{candidate_id}/resume", response_model=ResumeResponse, status_code=status.HTTP_201_CREATED)
async def upload_resume(
    candidate_id: uuid.UUID,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    candidate = candidate_service.get_candidate(db, candidate_id, owner_id=current_user.id)
    if candidate is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Candidate not found")

    if file.content_type != "application/pdf" and not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Only PDF files are accepted.")

    content = await file.read()
    if len(content) > MAX_SIZE:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "File exceeds 10 MB limit.")
    if len(content) == 0:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Uploaded file is empty.")

    return resume_service.upload_and_extract(db, candidate_id, file.filename, content)


@router.get("/candidates/{candidate_id}/resumes", response_model=list[ResumeResponse])
def list_resumes(
    candidate_id: uuid.UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    candidate = candidate_service.get_candidate(db, candidate_id, owner_id=current_user.id)
    if candidate is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Candidate not found")
    return resume_service.list_resumes(db, candidate_id)


@router.get("/candidates/{candidate_id}/resumes/{resume_id}/file")
def download_resume(
    candidate_id: uuid.UUID,
    resume_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    candidate = candidate_service.get_candidate(db, candidate_id, owner_id=current_user.id)
    if candidate is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Candidate not found")
    resume = resume_service.get_resume(db, candidate_id, resume_id)
    if resume is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Resume not found")
    path = Path(resume.storage_path)
    if not path.is_file():
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Resume file is no longer available")
    return FileResponse(path, media_type="application/pdf", filename=resume.original_filename)
