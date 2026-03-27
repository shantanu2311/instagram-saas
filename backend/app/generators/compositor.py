"""
Brand overlay compositor.

Takes AI-generated images and composites branding elements on top:
- Brand footer (name + dot)
- Category label at top
- Colored border frame
- Optional logo overlay
"""

from __future__ import annotations

import os
import uuid
from pathlib import Path

from PIL import Image, ImageDraw

from app.generators.image_generator import (
    OUTPUT_DIR,
    BrandConfig,
    _draw_footer,
    _load_font,
    _text_size,
)

# ---------------------------------------------------------------------------
# Overlay types
# ---------------------------------------------------------------------------


def _overlay_minimal(
    img: Image.Image,
    brand: BrandConfig,
) -> Image.Image:
    """Minimal overlay: just the brand footer at the bottom.

    Adds a subtle gradient fade at the bottom so the footer text
    is readable over any background.
    """
    # Ensure RGBA for compositing
    if img.mode != "RGBA":
        img = img.convert("RGBA")

    width, height = img.size

    # Bottom gradient overlay for readability
    gradient = Image.new("RGBA", (width, 120), (0, 0, 0, 0))
    gradient_draw = ImageDraw.Draw(gradient)
    for y in range(120):
        alpha = int(180 * (y / 120))
        gradient_draw.line([(0, y), (width, y)], fill=(0, 0, 0, alpha))
    img.paste(gradient, (0, height - 120), gradient)

    draw = ImageDraw.Draw(img)
    _draw_footer(draw, width, height, brand, font_size=16)

    return img


def _overlay_full(
    img: Image.Image,
    brand: BrandConfig,
    category: str,
) -> Image.Image:
    """Full overlay: category label at top, footer at bottom, colored border frame.

    Adds:
    - Thin colored border using primary_color
    - Top category pill/label
    - Bottom gradient + footer
    """
    if img.mode != "RGBA":
        img = img.convert("RGBA")

    width, height = img.size
    draw = ImageDraw.Draw(img)

    # Colored border frame (4px)
    border_w = 4
    border_color = (*brand.primary_color, 200)
    # Top
    draw.rectangle([0, 0, width, border_w], fill=border_color)
    # Bottom
    draw.rectangle([0, height - border_w, width, height], fill=border_color)
    # Left
    draw.rectangle([0, 0, border_w, height], fill=border_color)
    # Right
    draw.rectangle([width - border_w, 0, width, height], fill=border_color)

    # Top category label with background pill
    if category:
        cat_font = _load_font(brand.font_body, 14)
        cat_text = category.upper()
        tw, th = _text_size(draw, cat_text, cat_font)

        pill_w = tw + 24
        pill_h = th + 12
        pill_x = (width - pill_w) // 2
        pill_y = 20

        # Semi-transparent pill background
        pill = Image.new("RGBA", (pill_w, pill_h), (0, 0, 0, 0))
        pill_draw = ImageDraw.Draw(pill)
        pill_draw.rounded_rectangle(
            [0, 0, pill_w, pill_h],
            radius=pill_h // 2,
            fill=(*brand.primary_color, 180),
        )
        img.paste(pill, (pill_x, pill_y), pill)

        # Refresh draw after paste
        draw = ImageDraw.Draw(img)
        text_x = pill_x + 12
        text_y = pill_y + 6
        draw.text((text_x, text_y), cat_text, font=cat_font, fill=brand.text_color)

    # Bottom gradient overlay
    gradient = Image.new("RGBA", (width, 100), (0, 0, 0, 0))
    gradient_draw = ImageDraw.Draw(gradient)
    for y in range(100):
        alpha = int(160 * (y / 100))
        gradient_draw.line([(0, y), (width, y)], fill=(0, 0, 0, alpha))
    img.paste(gradient, (0, height - 100), gradient)

    # Footer
    draw = ImageDraw.Draw(img)
    _draw_footer(draw, width, height, brand, font_size=16)

    return img


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def composite_branding(
    image_path: str,
    brand: BrandConfig,
    overlay_type: str = "minimal",
    category: str = "",
    output_path: str | None = None,
) -> str:
    """Overlay branding on an AI-generated image.

    Args:
        image_path: Path to the source image file.
        brand: Brand configuration for colors, fonts, name.
        overlay_type: "minimal" (footer only) or "full" (category + frame + footer).
        category: Category label text (used with "full" overlay).
        output_path: Optional output path. Auto-generated if None.

    Returns:
        Path to the composited output image.
    """
    img = Image.open(image_path)

    overlay_lower = overlay_type.lower()
    if overlay_lower == "full":
        result = _overlay_full(img, brand, category)
    else:
        result = _overlay_minimal(img, brand)

    # Convert back to RGB for PNG/JPEG saving
    if result.mode == "RGBA":
        # Create a background with brand background color
        bg = Image.new("RGB", result.size, brand.background_color)
        bg.paste(result, mask=result.split()[3])
        result = bg

    if output_path is None:
        ext = Path(image_path).suffix or ".png"
        output_path = str(OUTPUT_DIR / f"composite_{uuid.uuid4().hex[:8]}{ext}")

    result.save(output_path, optimize=True)
    return output_path
