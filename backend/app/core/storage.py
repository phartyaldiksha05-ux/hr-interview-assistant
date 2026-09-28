"""Local-disk file storage. Swap this module out for S3 later without touching callers."""
import uuid
from pathlib import Path

from app.config import settings


def save_upload(candidate_id: uuid.UUID, filename: str, content: bytes) -> str:
    upload_dir = Path(settings.UPLOAD_DIR) / str(candidate_id)
    upload_dir.mkdir(parents=True, exist_ok=True)
    safe_name = f"{uuid.uuid4().hex}_{filename}"
    path = upload_dir / safe_name
    path.write_bytes(content)
    return str(path)


def read_file(storage_path: str) -> bytes:
    return Path(storage_path).read_bytes()
