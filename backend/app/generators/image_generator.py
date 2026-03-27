"""
Image generation engine for Instagram content.

Generates branded fact cards, stat cards, and carousel slides
using Pillow. All brand-specific values are parameterized via BrandConfig.
"""

from __future__ import annotations

import math
import os
import uuid
from dataclasses import dataclass, field
from functools import lru_cache
from pathlib import Path
from typing import Any

from PIL import Image, ImageDraw, ImageFilter, ImageFont

# ---------------------------------------------------------------------------
# Output directory
# ---------------------------------------------------------------------------
OUTPUT_DIR = Path(os.environ.get("IGCREATOR_OUTPUT_DIR", "output"))
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

# ---------------------------------------------------------------------------
# Font search paths (in priority order)
# ---------------------------------------------------------------------------
_FONT_DIRS: list[Path] = [
    Path("assets/fonts"),
    Path("/usr/share/fonts/truetype"),
    Path("C:/Windows/Fonts"),
]

# ---------------------------------------------------------------------------
# BrandConfig
# ---------------------------------------------------------------------------

@dataclass
class BrandConfig:
    """Visual identity parameters for content generation."""

    primary_color: tuple[int, int, int] = (139, 92, 246)   # violet
    secondary_color: tuple[int, int, int] = (6, 182, 212)  # teal
    accent_color: tuple[int, int, int] = (249, 115, 22)    # orange
    background_color: tuple[int, int, int] = (10, 14, 26)
    text_color: tuple[int, int, int] = (255, 255, 255)
    text_muted_color: tuple[int, int, int] = (140, 150, 170)
    font_headline: str = "Inter-Bold.ttf"
    font_body: str = "Inter-Regular.ttf"
    brand_name: str = ""
    logo_url: str = ""

    # Derived color map for highlight keywords in templates
    def highlight_map(self) -> dict[str, tuple[int, int, int]]:
        return {
            "orange": self.accent_color,
            "violet": self.primary_color,
            "purple": self.primary_color,
            "teal": self.secondary_color,
            "cyan": self.secondary_color,
            "primary": self.primary_color,
            "secondary": self.secondary_color,
            "accent": self.accent_color,
            "white": self.text_color,
            "muted": self.text_muted_color,
        }


# ---------------------------------------------------------------------------
# Zone layout helpers
# ---------------------------------------------------------------------------

@dataclass
class Zones:
    """Layout zones for a 1080x1080 square post."""

    width: int = 1080
    height: int = 1080
    # Vertical zone boundaries
    top_margin: int = 80
    headline_y: int = 160
    body_y: int = 480
    footer_y: int = 1000
    # Horizontal
    left_pad: int = 80
    right_pad: int = 80

    @property
    def content_width(self) -> int:
        return self.width - self.left_pad - self.right_pad


@dataclass
class StatZones(Zones):
    """Layout zones for stat-highlight cards (1080x1080)."""

    stat_y: int = 300
    label_y: int = 520
    context_y: int = 620


@dataclass
class CarouselZones:
    """Layout zones for carousel slides (1080x1350)."""

    width: int = 1080
    height: int = 1350
    top_margin: int = 80
    headline_y: int = 140
    body_y: int = 400
    footer_y: int = 1260
    left_pad: int = 80
    right_pad: int = 80

    @property
    def content_width(self) -> int:
        return self.width - self.left_pad - self.right_pad


# ---------------------------------------------------------------------------
# Font utilities
# ---------------------------------------------------------------------------

@lru_cache(maxsize=64)
def _load_font(name: str, size: int) -> ImageFont.FreeTypeFont:
    """Load a TrueType font with fallback chain.

    Searches asset directories, then system fonts, then falls back to
    Pillow's default font.
    """
    # Direct path
    if os.path.isfile(name):
        return ImageFont.truetype(name, size)

    # Search font directories
    for font_dir in _FONT_DIRS:
        candidate = font_dir / name
        if candidate.is_file():
            return ImageFont.truetype(str(candidate), size)

    # Try without extension variants
    base = Path(name).stem
    for font_dir in _FONT_DIRS:
        for ext in (".ttf", ".otf", ".TTF", ".OTF"):
            candidate = font_dir / (base + ext)
            if candidate.is_file():
                return ImageFont.truetype(str(candidate), size)

    # System fallback names
    fallbacks = ["arial.ttf", "Arial.ttf", "DejaVuSans.ttf", "LiberationSans-Regular.ttf"]
    for fb in fallbacks:
        for font_dir in _FONT_DIRS:
            candidate = font_dir / fb
            if candidate.is_file():
                return ImageFont.truetype(str(candidate), size)

    # Ultimate fallback: Pillow default (bitmap font, ignores size)
    return ImageFont.load_default()


def _text_size(draw: ImageDraw.ImageDraw, text: str, font: ImageFont.FreeTypeFont) -> tuple[int, int]:
    """Get (width, height) of rendered text."""
    bbox = draw.textbbox((0, 0), text, font=font)
    return bbox[2] - bbox[0], bbox[3] - bbox[1]


def _wrap_text(
    text: str,
    font: ImageFont.FreeTypeFont,
    max_width: int,
    draw: ImageDraw.ImageDraw,
) -> list[str]:
    """Word-wrap text to fit within max_width pixels."""
    words = text.split()
    if not words:
        return [""]
    lines: list[str] = []
    current_line = words[0]
    for word in words[1:]:
        test = f"{current_line} {word}"
        w, _ = _text_size(draw, test, font)
        if w <= max_width:
            current_line = test
        else:
            lines.append(current_line)
            current_line = word
    lines.append(current_line)
    return lines


def _fit_text(
    text: str,
    font_name: str,
    max_size: int,
    min_size: int,
    max_width: int,
    max_lines: int,
    draw: ImageDraw.ImageDraw,
) -> tuple[ImageFont.FreeTypeFont, list[str]]:
    """Adaptively size text to fit within constraints.

    Returns the best (font, wrapped_lines) that fits within max_width
    and max_lines. Steps down font size from max_size to min_size.
    """
    for size in range(max_size, min_size - 1, -2):
        font = _load_font(font_name, size)
        lines = _wrap_text(text, font, max_width, draw)
        if len(lines) <= max_lines:
            return font, lines
    # At min size, just return whatever we get
    font = _load_font(font_name, min_size)
    lines = _wrap_text(text, font, max_width, draw)
    return font, lines[:max_lines]


# ---------------------------------------------------------------------------
# Drawing helpers
# ---------------------------------------------------------------------------

def _draw_centered(
    draw: ImageDraw.ImageDraw,
    y: int,
    text: str,
    font: ImageFont.FreeTypeFont,
    fill: tuple[int, int, int],
    width: int,
) -> int:
    """Draw centered text and return the y position after the text."""
    tw, th = _text_size(draw, text, font)
    x = (width - tw) // 2
    draw.text((x, y), text, font=font, fill=fill)
    return y + th


def _draw_headline_highlighted(
    draw: ImageDraw.ImageDraw,
    y: int,
    lines: list[str],
    highlights: list[dict[str, str]],
    font: ImageFont.FreeTypeFont,
    width: int,
    brand: BrandConfig,
    line_spacing: int = 12,
) -> int:
    """Draw multi-line headline with highlighted words.

    highlights is a list of {"word": "...", "color": "orange"} dicts.
    Color names are mapped through brand.highlight_map().
    """
    color_map = brand.highlight_map()
    highlight_lookup: dict[str, tuple[int, int, int]] = {}
    for h in highlights:
        word = h.get("word", "").lower()
        color_name = h.get("color", "accent")
        highlight_lookup[word] = color_map.get(color_name, brand.accent_color)

    current_y = y
    for line in lines:
        # Measure full line for centering
        line_w, line_h = _text_size(draw, line, font)
        cursor_x = (width - line_w) // 2

        # Draw word by word
        words = line.split()
        for i, word in enumerate(words):
            color = highlight_lookup.get(word.lower().strip(".,!?:;"), brand.text_color)
            draw.text((cursor_x, current_y), word, font=font, fill=color)
            word_w, _ = _text_size(draw, word, font)
            space_w, _ = _text_size(draw, " ", font)
            cursor_x += word_w + space_w

        current_y += line_h + line_spacing

    return current_y


def _draw_smooth_glow(
    img: Image.Image,
    cx: int,
    cy: int,
    radius: int,
    color: tuple[int, int, int],
    intensity: float = 0.35,
) -> None:
    """Draw a soft radial glow effect on the image (in-place).

    Creates a gradient circle with gaussian blur for a smooth neon-like
    glow centered at (cx, cy).
    """
    glow = Image.new("RGBA", img.size, (0, 0, 0, 0))
    glow_draw = ImageDraw.Draw(glow)

    # Draw concentric circles with decreasing alpha
    steps = 20
    for i in range(steps):
        frac = i / steps
        r = int(radius * (1 - frac * 0.7))
        alpha = int(255 * intensity * (1 - frac))
        c = (*color, alpha)
        glow_draw.ellipse(
            [cx - r, cy - r, cx + r, cy + r],
            fill=c,
        )

    glow = glow.filter(ImageFilter.GaussianBlur(radius=radius // 3))

    # Composite onto the main image
    if img.mode != "RGBA":
        img_rgba = img.convert("RGBA")
        img_rgba = Image.alpha_composite(img_rgba, glow)
        img.paste(img_rgba.convert(img.mode))
    else:
        composite = Image.alpha_composite(img, glow)
        img.paste(composite)


def _draw_footer(
    draw: ImageDraw.ImageDraw,
    width: int,
    height: int,
    brand: BrandConfig,
    font_size: int = 18,
) -> None:
    """Draw a brand footer at the bottom of the image."""
    if not brand.brand_name:
        return

    font = _load_font(brand.font_body, font_size)
    text = brand.brand_name

    # Brand dot + name
    dot_radius = 4
    tw, th = _text_size(draw, text, font)
    total_w = dot_radius * 2 + 8 + tw
    start_x = (width - total_w) // 2
    text_y = height - 50

    # Dot
    dot_cx = start_x + dot_radius
    dot_cy = text_y + th // 2
    draw.ellipse(
        [dot_cx - dot_radius, dot_cy - dot_radius,
         dot_cx + dot_radius, dot_cy + dot_radius],
        fill=brand.primary_color,
    )

    # Brand name
    draw.text(
        (start_x + dot_radius * 2 + 8, text_y),
        text,
        font=font,
        fill=brand.text_muted_color,
    )


def _draw_divider(
    draw: ImageDraw.ImageDraw,
    y: int,
    width: int,
    color: tuple[int, int, int],
    margin: int = 80,
    thickness: int = 1,
) -> None:
    """Draw a horizontal divider line."""
    draw.line(
        [(margin, y), (width - margin, y)],
        fill=(*color, 80) if len(color) == 3 else color,
        width=thickness,
    )


# ---------------------------------------------------------------------------
# Card generators
# ---------------------------------------------------------------------------

def generate_fact_card(
    template: dict[str, Any],
    brand: BrandConfig,
    output_path: str | None = None,
) -> str:
    """Generate a fact-card style image (1080x1080).

    template keys:
        - category: str (e.g. "DID YOU KNOW?")
        - headline: str (main text)
        - highlights: list[{"word": str, "color": str}]
        - body: str (supporting text)
        - source: str (attribution)
        - glow: dict {"x": int, "y": int, "radius": int, "color": str} (optional)
    """
    zones = Zones()
    img = Image.new("RGB", (zones.width, zones.height), brand.background_color)
    draw = ImageDraw.Draw(img)

    # Optional glow
    glow_cfg = template.get("glow")
    if glow_cfg:
        color_map = brand.highlight_map()
        glow_color = color_map.get(glow_cfg.get("color", "primary"), brand.primary_color)
        _draw_smooth_glow(
            img,
            glow_cfg.get("x", zones.width // 2),
            glow_cfg.get("y", zones.height // 3),
            glow_cfg.get("radius", 300),
            glow_color,
        )
        # Refresh draw after glow compositing
        draw = ImageDraw.Draw(img)

    # Category label
    category = template.get("category", "")
    if category:
        cat_font = _load_font(brand.font_body, 16)
        cat_text = category.upper()
        _draw_centered(draw, zones.top_margin, cat_text, cat_font, brand.primary_color, zones.width)

    # Headline
    headline = template.get("headline", "")
    highlights = template.get("highlights", [])
    h_font, h_lines = _fit_text(
        headline, brand.font_headline, 52, 28, zones.content_width, 5, draw,
    )
    current_y = _draw_headline_highlighted(
        draw, zones.headline_y, h_lines, highlights, h_font, zones.width, brand,
    )

    # Body text
    body = template.get("body", "")
    if body:
        b_font, b_lines = _fit_text(
            body, brand.font_body, 22, 16, zones.content_width, 6, draw,
        )
        current_y = max(current_y + 30, zones.body_y)
        for line in b_lines:
            current_y = _draw_centered(
                draw, current_y, line, b_font, brand.text_muted_color, zones.width,
            )
            current_y += 6

    # Source
    source = template.get("source", "")
    if source:
        src_font = _load_font(brand.font_body, 14)
        src_text = f"Source: {source}"
        _draw_centered(draw, current_y + 20, src_text, src_font, brand.text_muted_color, zones.width)

    # Divider
    _draw_divider(draw, zones.footer_y - 30, zones.width, brand.text_muted_color)

    # Footer
    _draw_footer(draw, zones.width, zones.height, brand)

    # Save
    if output_path is None:
        output_path = str(OUTPUT_DIR / f"fact_{uuid.uuid4().hex[:8]}.png")
    img.save(output_path, "PNG", optimize=True)
    return output_path


def generate_stat_card(
    template: dict[str, Any],
    brand: BrandConfig,
    output_path: str | None = None,
) -> str:
    """Generate a stat-highlight card (1080x1080).

    template keys:
        - category: str
        - stat: str (e.g. "73%")
        - stat_label: str (e.g. "of businesses")
        - body: str (context text)
        - source: str
        - glow: dict (optional)
    """
    zones = StatZones()
    img = Image.new("RGB", (zones.width, zones.height), brand.background_color)
    draw = ImageDraw.Draw(img)

    # Optional glow
    glow_cfg = template.get("glow")
    if glow_cfg:
        color_map = brand.highlight_map()
        glow_color = color_map.get(glow_cfg.get("color", "accent"), brand.accent_color)
        _draw_smooth_glow(
            img,
            glow_cfg.get("x", zones.width // 2),
            glow_cfg.get("y", zones.stat_y),
            glow_cfg.get("radius", 250),
            glow_color,
        )
        draw = ImageDraw.Draw(img)

    # Category
    category = template.get("category", "")
    if category:
        cat_font = _load_font(brand.font_body, 16)
        _draw_centered(draw, zones.top_margin, category.upper(), cat_font, brand.primary_color, zones.width)

    # Big stat number
    stat_text = template.get("stat", "")
    stat_font = _load_font(brand.font_headline, 120)
    _draw_centered(draw, zones.stat_y, stat_text, stat_font, brand.accent_color, zones.width)

    # Stat label
    label = template.get("stat_label", "")
    if label:
        label_font = _load_font(brand.font_body, 28)
        _draw_centered(draw, zones.label_y, label, label_font, brand.text_color, zones.width)

    # Context body
    body = template.get("body", "")
    if body:
        b_font, b_lines = _fit_text(
            body, brand.font_body, 20, 14, zones.content_width, 4, draw,
        )
        cy = zones.context_y
        for line in b_lines:
            cy = _draw_centered(draw, cy, line, b_font, brand.text_muted_color, zones.width)
            cy += 4

    # Source
    source = template.get("source", "")
    if source:
        src_font = _load_font(brand.font_body, 14)
        _draw_centered(draw, zones.footer_y - 70, f"Source: {source}", src_font, brand.text_muted_color, zones.width)

    # Divider + footer
    _draw_divider(draw, zones.footer_y - 30, zones.width, brand.text_muted_color)
    _draw_footer(draw, zones.width, zones.height, brand)

    if output_path is None:
        output_path = str(OUTPUT_DIR / f"stat_{uuid.uuid4().hex[:8]}.png")
    img.save(output_path, "PNG", optimize=True)
    return output_path


def generate_carousel_slide(
    slide: dict[str, Any],
    slide_num: int,
    total: int,
    brand: BrandConfig,
    is_title: bool = False,
    output_path: str | None = None,
) -> str:
    """Generate a single carousel slide (1080x1350).

    slide keys:
        - headline: str
        - highlights: list[{"word": str, "color": str}]
        - body: str
        - number: str (optional, e.g. "01")
        - glow: dict (optional)

    For title slides (is_title=True), the headline is rendered larger
    and centered vertically.
    """
    zones = CarouselZones()
    img = Image.new("RGB", (zones.width, zones.height), brand.background_color)
    draw = ImageDraw.Draw(img)

    # Optional glow
    glow_cfg = slide.get("glow")
    if glow_cfg:
        color_map = brand.highlight_map()
        glow_color = color_map.get(glow_cfg.get("color", "primary"), brand.primary_color)
        _draw_smooth_glow(
            img,
            glow_cfg.get("x", zones.width // 2),
            glow_cfg.get("y", zones.height // 3),
            glow_cfg.get("radius", 350),
            glow_color,
        )
        draw = ImageDraw.Draw(img)

    # Slide number indicator
    if not is_title and total > 1:
        indicator_font = _load_font(brand.font_body, 14)
        indicator = f"{slide_num}/{total}"
        _draw_centered(draw, zones.top_margin - 30, indicator, indicator_font, brand.text_muted_color, zones.width)

    # Headline
    headline = slide.get("headline", "")
    highlights = slide.get("highlights", [])

    if is_title:
        h_font, h_lines = _fit_text(
            headline, brand.font_headline, 64, 36, zones.content_width, 4, draw,
        )
        headline_y = (zones.height - len(h_lines) * 80) // 2 - 40
    else:
        h_font, h_lines = _fit_text(
            headline, brand.font_headline, 44, 24, zones.content_width, 4, draw,
        )
        headline_y = zones.headline_y

    # Number badge (for non-title content slides)
    number = slide.get("number", "")
    if number and not is_title:
        num_font = _load_font(brand.font_headline, 60)
        num_w, num_h = _text_size(draw, number, num_font)
        num_x = (zones.width - num_w) // 2
        num_y = headline_y - 80
        # Circle behind number
        cr = max(num_w, num_h) // 2 + 15
        draw.ellipse(
            [num_x + num_w // 2 - cr, num_y + num_h // 2 - cr,
             num_x + num_w // 2 + cr, num_y + num_h // 2 + cr],
            fill=brand.primary_color,
        )
        draw.text((num_x, num_y), number, font=num_font, fill=brand.text_color)

    current_y = _draw_headline_highlighted(
        draw, headline_y, h_lines, highlights, h_font, zones.width, brand,
    )

    # Body text
    body = slide.get("body", "")
    if body:
        b_font, b_lines = _fit_text(
            body, brand.font_body, 22, 16, zones.content_width, 8, draw,
        )
        body_y = max(current_y + 30, zones.body_y)
        for line in b_lines:
            body_y = _draw_centered(
                draw, body_y, line, b_font, brand.text_muted_color, zones.width,
            )
            body_y += 6

    # Divider + footer
    _draw_divider(draw, zones.footer_y - 30, zones.width, brand.text_muted_color)
    _draw_footer(draw, zones.width, zones.height, brand)

    if output_path is None:
        output_path = str(OUTPUT_DIR / f"carousel_{slide_num}_{uuid.uuid4().hex[:8]}.png")
    img.save(output_path, "PNG", optimize=True)
    return output_path


# ---------------------------------------------------------------------------
# Router
# ---------------------------------------------------------------------------

def generate_post_image(
    template: dict[str, Any],
    brand: BrandConfig,
    output_path: str | None = None,
) -> str | list[str]:
    """Route to the correct generator based on template type.

    template["type"] can be:
        - "fact_card" / "fact"
        - "stat_card" / "stat"
        - "carousel"

    For carousels, template["slides"] is a list of slide dicts and
    a list of output paths is returned.
    """
    content_type = template.get("type", "fact_card").lower()

    if content_type in ("fact_card", "fact"):
        return generate_fact_card(template, brand, output_path)

    elif content_type in ("stat_card", "stat"):
        return generate_stat_card(template, brand, output_path)

    elif content_type == "carousel":
        slides = template.get("slides", [])
        if not slides:
            raise ValueError("Carousel template must include 'slides' list")
        paths: list[str] = []
        for i, slide in enumerate(slides):
            is_title = (i == 0) and template.get("title_slide", True)
            path = generate_carousel_slide(
                slide,
                slide_num=i + 1,
                total=len(slides),
                brand=brand,
                is_title=is_title,
            )
            paths.append(path)
        return paths

    else:
        # Default to fact card
        return generate_fact_card(template, brand, output_path)
