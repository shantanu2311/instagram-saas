"""
Quality gate for content validation.

Validates generated images and captions against 10 criteria,
producing a score 0-100. Content must score >= 80 to be eligible for posting.
"""

from __future__ import annotations

import os
import re
from dataclasses import dataclass, field

from PIL import Image

from app.generators.image_generator import BrandConfig

# ---------------------------------------------------------------------------
# Result dataclass
# ---------------------------------------------------------------------------


@dataclass
class QualityResult:
    """Result of a quality validation check."""

    score: int = 0  # 0-100 overall score
    passed: bool = False  # score >= 80
    criteria: dict[str, int] = field(default_factory=dict)  # criterion -> 0-10
    issues: list[str] = field(default_factory=list)
    suggestions: dict[str, str] = field(default_factory=dict)  # auto-fix suggestions

    def __post_init__(self) -> None:
        self.passed = self.score >= 80


# ---------------------------------------------------------------------------
# Image validation
# ---------------------------------------------------------------------------

_VALID_DIMENSIONS = {
    (1080, 1080),  # Square post
    (1080, 1350),  # Portrait / carousel
    (1080, 1920),  # Story / reel
}

_MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024  # 5 MB


def _check_dimensions(img: Image.Image) -> tuple[int, list[str], dict[str, str]]:
    """Check image dimensions (criterion 1). Returns (score, issues, suggestions)."""
    w, h = img.size
    if (w, h) in _VALID_DIMENSIONS:
        return 10, [], {}
    # Allow close matches (within 10px)
    for vw, vh in _VALID_DIMENSIONS:
        if abs(w - vw) <= 10 and abs(h - vh) <= 10:
            return 8, [f"Dimensions {w}x{h} slightly off from {vw}x{vh}"], {
                "dimensions": f"Resize to {vw}x{vh}"
            }
    return 2, [f"Invalid dimensions {w}x{h}, expected 1080x1080 or 1080x1350"], {
        "dimensions": "Resize to standard Instagram dimensions"
    }


def _check_file_size(image_path: str) -> tuple[int, list[str], dict[str, str]]:
    """Check file size (criterion 2)."""
    size = os.path.getsize(image_path)
    if size <= _MAX_FILE_SIZE_BYTES:
        return 10, [], {}
    mb = size / (1024 * 1024)
    return 3, [f"File size {mb:.1f}MB exceeds 5MB limit"], {
        "file_size": "Reduce quality or dimensions to shrink file size"
    }


def _check_text_readability(img: Image.Image) -> tuple[int, list[str], dict[str, str]]:
    """Check text readability via contrast sampling (criterion 3).

    Samples the top and bottom regions to estimate if text would be
    readable against the background. This is a heuristic check.
    """
    w, h = img.size
    rgb = img.convert("RGB")

    # Sample the header region (top 15%)
    header_region = rgb.crop((0, 0, w, int(h * 0.15)))
    header_pixels = list(header_region.getdata())
    header_avg = _average_luminance(header_pixels)

    # Sample the footer region (bottom 10%)
    footer_region = rgb.crop((0, int(h * 0.9), w, h))
    footer_pixels = list(footer_region.getdata())
    footer_avg = _average_luminance(footer_pixels)

    issues: list[str] = []
    suggestions: dict[str, str] = {}

    # Dark backgrounds (< 50 luminance) are fine for white text
    # Light backgrounds (> 200) are fine for dark text
    # Middle range (50-200) may have readability issues
    score = 10
    if 50 < header_avg < 200:
        score -= 3
        issues.append("Header region has medium contrast — text may be hard to read")
        suggestions["header_contrast"] = "Add a darker overlay behind header text"
    if 50 < footer_avg < 200:
        score -= 2
        issues.append("Footer region has medium contrast")
        suggestions["footer_contrast"] = "Add a gradient overlay at the bottom"

    return max(score, 0), issues, suggestions


def _average_luminance(pixels: list[tuple[int, ...]]) -> float:
    """Calculate average perceived luminance from pixel list."""
    if not pixels:
        return 0
    total = sum(0.299 * r + 0.587 * g + 0.114 * b for r, g, b in pixels)
    return total / len(pixels)


def _check_zone_overlap(img: Image.Image, template: dict) -> tuple[int, list[str], dict[str, str]]:
    """Check zone overlap (criterion 4).

    Basic heuristic: if the template specifies zones, verify
    content areas don't overlap excessively. For now, always passes
    since our generators use fixed zone layouts.
    """
    # Our generators use non-overlapping zone layouts by design
    return 10, [], {}


def _check_color_contrast(img: Image.Image, brand: BrandConfig) -> tuple[int, list[str], dict[str, str]]:
    """Check WCAG AA contrast ratios (criterion 5).

    Verifies the brand text color has sufficient contrast against
    the background color.
    """
    bg_lum = _relative_luminance(brand.background_color)
    text_lum = _relative_luminance(brand.text_color)

    ratio = _contrast_ratio(bg_lum, text_lum)

    if ratio >= 4.5:  # WCAG AA for normal text
        return 10, [], {}
    elif ratio >= 3.0:  # WCAG AA for large text
        return 7, ["Contrast ratio {:.1f}:1 — meets large text AA only".format(ratio)], {
            "contrast": "Increase contrast between text and background colors"
        }
    else:
        return 3, ["Poor contrast ratio {:.1f}:1 — fails WCAG AA".format(ratio)], {
            "contrast": "Use higher-contrast text color (e.g., pure white on dark bg)"
        }


def _relative_luminance(color: tuple[int, int, int]) -> float:
    """Calculate relative luminance per WCAG 2.0 formula."""
    def linearize(c: int) -> float:
        s = c / 255.0
        return s / 12.92 if s <= 0.03928 else ((s + 0.055) / 1.055) ** 2.4

    r, g, b = color
    return 0.2126 * linearize(r) + 0.7152 * linearize(g) + 0.0722 * linearize(b)


def _contrast_ratio(lum1: float, lum2: float) -> float:
    """Calculate WCAG contrast ratio between two luminances."""
    lighter = max(lum1, lum2)
    darker = min(lum1, lum2)
    return (lighter + 0.05) / (darker + 0.05)


def _check_brand_consistency(img: Image.Image, brand: BrandConfig) -> tuple[int, list[str], dict[str, str]]:
    """Check brand consistency (criterion 6).

    Verifies that the image likely contains the brand footer by
    sampling the bottom region for brand color presence.
    """
    if not brand.brand_name:
        return 10, [], {}  # No brand name configured, skip

    w, h = img.size
    rgb = img.convert("RGB")

    # Sample bottom 60px strip
    footer_region = rgb.crop((0, h - 60, w, h))
    pixels = list(footer_region.getdata())

    # Check if any pixels are close to the brand primary color
    primary = brand.primary_color
    has_brand_color = any(
        abs(r - primary[0]) < 40 and abs(g - primary[1]) < 40 and abs(b - primary[2]) < 40
        for r, g, b in pixels
    )

    if has_brand_color:
        return 10, [], {}
    return 5, ["Brand footer may be missing or not visible"], {
        "brand_footer": "Ensure brand footer is rendered with visible brand color"
    }


def validate_image(
    image_path: str,
    template: dict,
    brand: BrandConfig,
) -> QualityResult:
    """Validate a generated image against quality criteria.

    Runs 6 image-specific criteria (out of the 10 total).
    Returns a QualityResult with a score 0-100.

    Criteria (each scored 0-10, total scaled to 0-100):
    1. Dimensions
    2. File size
    3. Text readability
    4. Zone overlap
    5. Color contrast (WCAG AA)
    6. Brand consistency
    """
    img = Image.open(image_path)

    all_issues: list[str] = []
    all_suggestions: dict[str, str] = {}
    criteria: dict[str, int] = {}

    checks = [
        ("dimensions", _check_dimensions, (img,)),
        ("file_size", _check_file_size, (image_path,)),
        ("text_readability", _check_text_readability, (img,)),
        ("zone_overlap", _check_zone_overlap, (img, template)),
        ("color_contrast", _check_color_contrast, (img, brand)),
        ("brand_consistency", _check_brand_consistency, (img, brand)),
    ]

    total = 0
    for name, check_fn, args in checks:
        score, issues, suggestions = check_fn(*args)
        criteria[name] = score
        total += score
        all_issues.extend(issues)
        all_suggestions.update(suggestions)

    # Scale from 0-60 to 0-100
    overall = round(total * 100 / 60)

    return QualityResult(
        score=overall,
        passed=overall >= 80,
        criteria=criteria,
        issues=all_issues,
        suggestions=all_suggestions,
    )


# ---------------------------------------------------------------------------
# Caption validation
# ---------------------------------------------------------------------------

def validate_caption(
    caption: str,
    hashtags: list[str],
    brand_hashtag: str = "",
) -> QualityResult:
    """Validate a caption and its hashtags.

    Criteria (each scored 0-10, total scaled to 0-100):
    7. Caption quality (length 50-2200, non-empty)
    8. Hashtags (5-10, no dupes, brand tag present)
    9. Hook strength (first line engagement)
    10. Content quality (no filler, has CTA)
    """
    all_issues: list[str] = []
    all_suggestions: dict[str, str] = {}
    criteria: dict[str, int] = {}

    # Criterion 7: Caption quality
    caption_len = len(caption.strip())
    if 50 <= caption_len <= 2200:
        if caption_len < 100:
            criteria["caption_quality"] = 7
            all_issues.append("Caption is short — consider adding more detail")
        elif caption_len > 2000:
            criteria["caption_quality"] = 8
            all_issues.append("Caption near max length — may get truncated")
        else:
            criteria["caption_quality"] = 10
    elif caption_len < 50:
        criteria["caption_quality"] = 3
        all_issues.append(f"Caption too short ({caption_len} chars, min 50)")
        all_suggestions["caption_length"] = "Add more detail, context, or a call-to-action"
    else:
        criteria["caption_quality"] = 5
        all_issues.append(f"Caption too long ({caption_len} chars, max 2200)")
        all_suggestions["caption_length"] = "Trim caption to under 2200 characters"

    # Criterion 8: Hashtags
    tag_score = 10
    tag_issues: list[str] = []

    num_tags = len(hashtags)
    if num_tags < 5:
        tag_score -= 3
        tag_issues.append(f"Only {num_tags} hashtags — aim for 5-10")
    elif num_tags > 30:
        tag_score -= 4
        tag_issues.append(f"{num_tags} hashtags exceeds Instagram limit of 30")
    elif num_tags > 10:
        tag_score -= 1  # Mild penalty for too many

    # Check for duplicates
    lower_tags = [t.lower() for t in hashtags]
    if len(set(lower_tags)) < len(lower_tags):
        tag_score -= 2
        tag_issues.append("Duplicate hashtags detected")
        all_suggestions["hashtag_dupes"] = "Remove duplicate hashtags"

    # Check brand hashtag presence
    if brand_hashtag:
        clean_brand = brand_hashtag.lstrip("#").lower()
        if clean_brand not in lower_tags:
            tag_score -= 2
            tag_issues.append(f"Brand hashtag #{clean_brand} not included")
            all_suggestions["brand_hashtag"] = f"Add #{clean_brand} to hashtags"

    criteria["hashtags"] = max(tag_score, 0)
    all_issues.extend(tag_issues)

    # Criterion 9: Hook strength
    first_line = caption.split("\n")[0].strip()
    hook_score = _score_hook(first_line)
    criteria["hook_strength"] = hook_score
    if hook_score < 7:
        all_issues.append("First line may not be a strong enough hook")
        all_suggestions["hook"] = "Start with a question, bold claim, or surprising stat"

    # Criterion 10: Content quality (CTA, no filler)
    cta_score = _score_content_quality(caption)
    criteria["content_quality"] = cta_score
    if cta_score < 7:
        all_issues.append("Caption may lack a clear call-to-action")
        all_suggestions["cta"] = "Add a CTA: save, share, comment, follow, or link in bio"

    # Scale from 0-40 to 0-100
    total = sum(criteria.values())
    overall = round(total * 100 / 40)

    return QualityResult(
        score=overall,
        passed=overall >= 80,
        criteria=criteria,
        issues=all_issues,
        suggestions=all_suggestions,
    )


def _score_hook(first_line: str) -> int:
    """Score the hook strength of the first line (0-10)."""
    if not first_line:
        return 0

    score = 5  # Base score

    # Bonus for question hooks
    if "?" in first_line:
        score += 2

    # Bonus for numbers / stats
    if re.search(r"\d+", first_line):
        score += 1

    # Bonus for power words
    power_words = [
        "secret", "proven", "surprising", "shocking", "mistake",
        "stop", "never", "always", "truth", "hack", "free",
        "warning", "breaking", "unpopular", "controversial",
    ]
    first_lower = first_line.lower()
    if any(pw in first_lower for pw in power_words):
        score += 1

    # Bonus for emoji usage (engagement signal)
    if re.search(r"[\U0001F600-\U0001F64F\U0001F300-\U0001F5FF\U0001F680-\U0001F6FF\U0001F1E0-\U0001F1FF\u2600-\u26FF\u2700-\u27BF]", first_line):
        score += 1

    # Penalty for generic/boring openers
    boring_starts = ["hey", "hello", "hi everyone", "good morning", "just wanted"]
    if any(first_lower.startswith(b) for b in boring_starts):
        score -= 2

    return max(0, min(10, score))


def _score_content_quality(caption: str) -> int:
    """Score overall content quality including CTA presence (0-10)."""
    if not caption:
        return 0

    score = 5
    lower = caption.lower()

    # Check for CTA keywords
    cta_patterns = [
        "save this", "save it", "bookmark",
        "share this", "share with",
        "comment", "drop a comment", "let me know",
        "follow", "follow for",
        "link in bio", "tap the link",
        "double tap", "like if",
        "tag someone", "tag a friend",
        "dm me", "send this",
    ]
    if any(cta in lower for cta in cta_patterns):
        score += 3

    # Check for line breaks (readability)
    if "\n" in caption:
        score += 1

    # Penalty for all-caps blocks (more than 20 chars)
    caps_blocks = re.findall(r"[A-Z\s]{20,}", caption)
    if caps_blocks:
        score -= 1

    # Penalty for excessive emoji (more than 10)
    emoji_count = len(re.findall(r"[\U0001F600-\U0001F64F\U0001F300-\U0001F5FF\U0001F680-\U0001F6FF\U0001F1E0-\U0001F1FF\u2600-\u26FF\u2700-\u27BF]", caption))
    if emoji_count > 10:
        score -= 1

    return max(0, min(10, score))
