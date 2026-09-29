import uuid
from pathlib import Path

from fastapi import File, HTTPException, Request, UploadFile

UPLOAD_DIR = Path(__file__).resolve().parents[2] / "static" / "uploads"
ALLOWED_TYPES = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/gif": ".gif",
}
MAX_UPLOAD_BYTES = 5 * 1024 * 1024


async def save_upload(request: Request, file: UploadFile = File(...)) -> str:
    extension = ALLOWED_TYPES.get(file.content_type or "")
    if extension is None:
        raise HTTPException(status_code=400, detail="Upload a JPEG, PNG, WEBP, or GIF image.")
    content = await file.read()
    if not content:
        raise HTTPException(status_code=400, detail="The uploaded file is empty.")
    if len(content) > MAX_UPLOAD_BYTES:
        raise HTTPException(status_code=400, detail="Image must be 5 MB or smaller.")
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    filename = f"{uuid.uuid4().hex}{extension}"
    (UPLOAD_DIR / filename).write_bytes(content)
    base = str(request.base_url).rstrip("/")
    return f"{base}/static/uploads/{filename}"
