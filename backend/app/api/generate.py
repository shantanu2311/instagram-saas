"""
Content generation API endpoints.

Handles image generation, caption generation, AI image/video creation,
and quality validation.
"""

from __future__ import annotations

from typing import Any

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.generators.ai_image import generate_ai_image as _generate_ai_image
from app.generators.ai_video import generate_ai_video as _generate_ai_video
from app.generators.caption_generator import generate_caption as _generate_caption
from app.generators.compositor import composite_branding
from app.generators.image_generator import BrandConfig, generate_post_image
from app.quality.gate import QualityResult, validate_caption, validate_image

router = APIRouter(prefix="/generate", tags=["generate"])


# ---------------------------------------------------------------------------
# Request / Response models
# ---------------------------------------------------------------------------


class BrandConfigRequest(BaseModel):
    primary_color: list[int] = Field(default=[139, 92, 246], min_length=3, max_length=3)
    secondary_color: list[int] = Field(default=[6, 182, 212], min_length=3, max_length=3)
    accent_color: list[int] = Field(default=[249, 115, 22], min_length=3, max_length=3)
    background_color: list[int] = Field(default=[10, 14, 26], min_length=3, max_length=3)
    text_color: list[int] = Field(default=[255, 255, 255], min_length=3, max_length=3)
    text_muted_color: list[int] = Field(default=[140, 150, 170], min_length=3, max_length=3)
    font_headline: str = "Inter-Bold.ttf"
    font_body: str = "Inter-Regular.ttf"
    brand_name: str = ""
    logo_url: str = ""


class GenerateImageRequest(BaseModel):
    template: dict[str, Any]
    brand: BrandConfigRequest = BrandConfigRequest()
    output_format: str = "png"


class GenerateImageResponse(BaseModel):
    status: str
    path: str | list[str]
    type: str


class GenerateCaptionRequest(BaseModel):
    topic: str
    pillar: str = "facts"
    brand_voice: str = ""
    niche: str = ""
    tone_formality: int = Field(default=50, ge=0, le=100)
    tone_humor: int = Field(default=50, ge=0, le=100)
    brand_hashtag: str = ""
    max_length: int = Field(default=2200, ge=50, le=2200)


class GenerateCaptionResponse(BaseModel):
    status: str
    caption: str
    hashtags: list[str]


class GenerateAIImageRequest(BaseModel):
    prompt: str
    style: str = "general"
    aspect_ratio: str = "1:1"
    brand_config: BrandConfigRequest | None = None
    composite: bool = False  # Whether to overlay branding
    composite_type: str = "minimal"
    category: str = ""


class GenerateAIImageResponse(BaseModel):
    status: str
    url: str
    composited_path: str | None = None


class GenerateAIVideoRequest(BaseModel):
    prompt: str
    duration: int = Field(default=6, ge=2, le=10)
    quality: str = "standard"
    aspect_ratio: str = "9:16"


class GenerateAIVideoResponse(BaseModel):
    status: str
    url: str


class ValidateImageRequest(BaseModel):
    image_path: str
    template: dict[str, Any] = {}
    brand: BrandConfigRequest = BrandConfigRequest()


class ValidateCaptionRequest(BaseModel):
    caption: str
    hashtags: list[str] = []
    brand_hashtag: str = ""


class ValidateResponse(BaseModel):
    score: int
    passed: bool
    criteria: dict[str, int]
    issues: list[str]
    suggestions: dict[str, str]


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _to_brand_config(req: BrandConfigRequest) -> BrandConfig:
    """Convert API request model to internal BrandConfig dataclass."""
    return BrandConfig(
        primary_color=tuple(req.primary_color),  # type: ignore[arg-type]
        secondary_color=tuple(req.secondary_color),  # type: ignore[arg-type]
        accent_color=tuple(req.accent_color),  # type: ignore[arg-type]
        background_color=tuple(req.background_color),  # type: ignore[arg-type]
        text_color=tuple(req.text_color),  # type: ignore[arg-type]
        text_muted_color=tuple(req.text_muted_color),  # type: ignore[arg-type]
        font_headline=req.font_headline,
        font_body=req.font_body,
        brand_name=req.brand_name,
        logo_url=req.logo_url,
    )


def _quality_to_response(result: QualityResult) -> ValidateResponse:
    return ValidateResponse(
        score=result.score,
        passed=result.passed,
        criteria=result.criteria,
        issues=result.issues,
        suggestions=result.suggestions,
    )


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------


@router.post("/image", response_model=GenerateImageResponse)
async def api_generate_image(req: GenerateImageRequest) -> GenerateImageResponse:
    """Generate a branded image (fact card, stat card, or carousel)."""
    brand = _to_brand_config(req.brand)
    try:
        path = generate_post_image(req.template, brand)
    except Exception as e:
        raise HTTPException(status_code=422, detail=str(e))

    content_type = req.template.get("type", "fact_card")
    if isinstance(path, list):
        return GenerateImageResponse(status="generated", path=path, type="carousel")
    return GenerateImageResponse(status="generated", path=path, type=content_type)


@router.post("/caption", response_model=GenerateCaptionResponse)
async def api_generate_caption(req: GenerateCaptionRequest) -> GenerateCaptionResponse:
    """Generate an AI-powered caption with hashtags."""
    try:
        result = await _generate_caption(
            topic=req.topic,
            pillar=req.pillar,
            brand_voice=req.brand_voice,
            niche=req.niche,
            tone_formality=req.tone_formality,
            tone_humor=req.tone_humor,
            brand_hashtag=req.brand_hashtag,
            max_length=req.max_length,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    return GenerateCaptionResponse(
        status="generated",
        caption=result["caption"],
        hashtags=result["hashtags"],
    )


@router.post("/ai-image", response_model=GenerateAIImageResponse)
async def api_generate_ai_image(req: GenerateAIImageRequest) -> GenerateAIImageResponse:
    """Generate an AI image via Ideogram or Flux."""
    brand_dict = None
    if req.brand_config:
        brand_dict = {
            "primary_color": tuple(req.brand_config.primary_color),
            "secondary_color": tuple(req.brand_config.secondary_color),
            "accent_color": tuple(req.brand_config.accent_color),
        }

    try:
        url = await _generate_ai_image(
            prompt=req.prompt,
            style=req.style,
            aspect_ratio=req.aspect_ratio,
            brand_config=brand_dict,
        )
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except TimeoutError as e:
        raise HTTPException(status_code=504, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    composited_path = None
    if req.composite and req.brand_config and url:
        try:
            brand = _to_brand_config(req.brand_config)
            # Download the AI image to a temp file for compositing
            import tempfile

            import httpx

            async with httpx.AsyncClient() as client:
                img_response = await client.get(url)
                img_response.raise_for_status()
                with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as tmp:
                    tmp.write(img_response.content)
                    tmp_path = tmp.name

            composited_path = composite_branding(
                image_path=tmp_path,
                brand=brand,
                overlay_type=req.composite_type,
                category=req.category,
            )
        except Exception:
            pass  # Compositing is best-effort, don't fail the request

    return GenerateAIImageResponse(
        status="generated",
        url=url,
        composited_path=composited_path,
    )


@router.post("/ai-video", response_model=GenerateAIVideoResponse)
async def api_generate_ai_video(req: GenerateAIVideoRequest) -> GenerateAIVideoResponse:
    """Generate an AI video via MiniMax Hailuo or Runway."""
    try:
        url = await _generate_ai_video(
            prompt=req.prompt,
            duration=req.duration,
            quality=req.quality,
            aspect_ratio=req.aspect_ratio,
        )
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except TimeoutError as e:
        raise HTTPException(status_code=504, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    return GenerateAIVideoResponse(status="generated", url=url)


@router.post("/reel")
async def api_generate_reel() -> dict[str, str]:
    """Generate a reel (placeholder — uses MoviePy pipeline, coming soon)."""
    return {"status": "not_implemented", "type": "reel"}


@router.post("/validate/image", response_model=ValidateResponse)
async def api_validate_image(req: ValidateImageRequest) -> ValidateResponse:
    """Validate a generated image against quality criteria."""
    brand = _to_brand_config(req.brand)
    try:
        result = validate_image(req.image_path, req.template, brand)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Image file not found")
    except Exception as e:
        raise HTTPException(status_code=422, detail=str(e))

    return _quality_to_response(result)


@router.post("/validate/caption", response_model=ValidateResponse)
async def api_validate_caption(req: ValidateCaptionRequest) -> ValidateResponse:
    """Validate a caption and hashtags against quality criteria."""
    result = validate_caption(req.caption, req.hashtags, req.brand_hashtag)
    return _quality_to_response(result)


@router.post("/validate")
async def api_validate_content() -> dict[str, str]:
    """Legacy validate endpoint — use /validate/image or /validate/caption instead."""
    return {"status": "deprecated", "message": "Use /validate/image or /validate/caption"}
