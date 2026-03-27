"""
Media serving endpoint.

Serves generated images/videos from the output directory so the frontend
can display real generated content.
"""

from __future__ import annotations

import os
from pathlib import Path

from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse

router = APIRouter(tags=["media"])

OUTPUT_DIR = Path(os.environ.get("IGCREATOR_OUTPUT_DIR", "output"))


@router.get("/media/{filename}")
async def serve_media(filename: str) -> FileResponse:
    """Serve generated images/videos from output directory."""
    # Security: prevent path traversal
    if ".." in filename or "/" in filename or "\\" in filename:
        raise HTTPException(status_code=400, detail="Invalid filename")

    file_path = OUTPUT_DIR / filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found")

    # Determine content type from extension
    suffix = file_path.suffix.lower()
    content_type_map = {
        ".png": "image/png",
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".webp": "image/webp",
        ".mp4": "video/mp4",
        ".gif": "image/gif",
    }
    content_type = content_type_map.get(suffix, "application/octet-stream")

    return FileResponse(str(file_path), media_type=content_type)
