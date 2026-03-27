import logging
import uuid
from pathlib import Path

import httpx

from app.config import get_settings

logger = logging.getLogger(__name__)


async def upload_media(file_path: str, content_type: str = "image/png") -> str:
    """Upload a file and return a publicly accessible URL.

    Uses S3-compatible storage if configured, otherwise falls back to catbox.moe.
    """
    settings = get_settings()

    if settings.s3_bucket:
        return await _upload_s3(file_path, content_type, settings)

    # Fallback: catbox.moe (free, no auth required)
    return await _upload_catbox(file_path)


async def _upload_s3(file_path: str, content_type: str, settings) -> str:
    """Upload to S3-compatible storage and return a public URL."""
    import boto3
    from botocore.config import Config as BotoConfig

    s3_config = {}
    if settings.s3_endpoint:
        s3_config["endpoint_url"] = settings.s3_endpoint

    client = boto3.client(
        "s3",
        region_name=settings.s3_region or "us-east-1",
        aws_access_key_id=settings.s3_access_key,
        aws_secret_access_key=settings.s3_secret_key,
        config=BotoConfig(signature_version="s3v4"),
        **({"endpoint_url": settings.s3_endpoint} if settings.s3_endpoint else {}),
    )

    # Generate a unique key
    ext = Path(file_path).suffix or ".png"
    key = f"media/{uuid.uuid4().hex}{ext}"

    client.upload_file(
        file_path,
        settings.s3_bucket,
        key,
        ExtraArgs={"ContentType": content_type, "ACL": "public-read"},
    )

    # Build public URL
    if settings.s3_endpoint:
        url = f"{settings.s3_endpoint}/{settings.s3_bucket}/{key}"
    else:
        url = f"https://{settings.s3_bucket}.s3.{settings.s3_region or 'us-east-1'}.amazonaws.com/{key}"

    logger.info("Uploaded to S3: %s", url)
    return url


async def _upload_catbox(file_path: str) -> str:
    """Upload to catbox.moe as a free fallback (no auth needed).

    Note: catbox.moe files may expire. Only suitable for dev/testing.
    """
    async with httpx.AsyncClient(timeout=60.0) as client:
        with open(file_path, "rb") as f:
            resp = await client.post(
                "https://catbox.moe/user/api.php",
                data={"reqtype": "fileupload"},
                files={"fileToUpload": f},
            )
            resp.raise_for_status()
            url = resp.text.strip()
            logger.info("Uploaded to catbox.moe: %s", url)
            return url
