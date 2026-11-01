"""
CertClerk — PDF Engine.

Analyzes certificate templates, finds placeholders, renders personalized
certificates, and generates preview images.
"""

from __future__ import annotations

import pymupdf  # PyMuPDF

from core.models import PlaceholderSpec, FitReport


class TemplateError(Exception):
    """Raised when the template PDF is invalid or unusable."""
    pass


def _rgb(c: int) -> tuple[float, float, float]:
    """Convert an integer color to (r, g, b) floats 0-1."""
    return (((c >> 16) & 255) / 255, ((c >> 8) & 255) / 255, (c & 255) / 255)


def analyze_template(pdf_bytes: bytes, word: str = "AGENT") -> PlaceholderSpec:
    """
    Open a PDF template and locate the placeholder text.

    Returns a PlaceholderSpec describing where and how to insert names.
    Raises TemplateError with an actionable message on failure.
    """
    try:
        doc = pymupdf.open(stream=pdf_bytes, filetype="pdf")
    except Exception as e:
        raise TemplateError(f"Cannot open PDF: {e}")

    if doc.is_encrypted:
        doc.close()
        raise TemplateError("PDF is encrypted. Please use an unencrypted file.")

    page_count = doc.page_count
    if page_count != 1:
        doc.close()
        raise TemplateError(
            f"Template must be a single page, but this PDF has {page_count} pages."
        )

    page = doc[0]
    if max(page.rect.width, page.rect.height) > 2000:
        doc.close()
        raise TemplateError(
            "Page is too large (max 2000 pt per side). "
            "Export at a standard size like A4 or Letter."
        )

    hits: list[dict] = []
    others: list[tuple[float, float, float, float]] = []

    for b in page.get_text("dict")["blocks"]:
        for line in b.get("lines", []):
            for s in line["spans"]:
                if s["text"].strip() == word:
                    hits.append(s)
                elif s["text"].strip():
                    others.append(tuple(s["bbox"]))

    if not hits:
        # Fallback: try search_for
        search_results = page.search_for(word)
        if not search_results:
            doc.close()
            raise TemplateError(
                f"'{word}' not found as selectable text in the PDF. "
                "Make sure you export from Canva as 'PDF Standard' (not flattened/image), "
                "and that you can select the placeholder word with a PDF viewer."
            )
        # If search found it but get_text didn't, it might be split across spans
        doc.close()
        raise TemplateError(
            f"'{word}' was found visually but not as a single text span. "
            "In Canva, make sure the placeholder is a single text element, "
            "not split across multiple objects."
        )

    if len(hits) > 1:
        doc.close()
        raise TemplateError(
            f"'{word}' appears {len(hits)} times in the template. "
            "Keep exactly one placeholder."
        )

    s = hits[0]
    x0, y0, x1, y1 = s["bbox"]
    w = x1 - x0
    max_w = min(2.0 * w, page.rect.width - 80)

    spec = PlaceholderSpec(
        text=word,
        bbox=(x0, y0, x1, y1),
        origin=tuple(s["origin"]),
        size=s["size"],
        color=_rgb(s["color"]),
        max_width=max_w,
        other_rects=others,
    )

    doc.close()
    return spec


def _split_two_lines(
    text: str,
    font: pymupdf.Font,
    size: float,
) -> list[str]:
    """Split text into two lines at the optimal word boundary."""
    words = text.split()
    if len(words) < 2:
        return [text]

    best: tuple[float, list[str]] | None = None
    for i in range(1, len(words)):
        a = " ".join(words[:i])
        b = " ".join(words[i:])
        w = max(
            font.text_length(a, fontsize=size),
            font.text_length(b, fontsize=size),
        )
        if best is None or w < best[0]:
            best = (w, [a, b])

    return best[1] if best else [text]


def render(
    template: bytes,
    spec: PlaceholderSpec,
    name: str,
    font_path: str | None = None,
    floor: float = 0.6,
    allow_two_lines: bool = True,
    force_fallback: bool = False,
) -> tuple[bytes, FitReport]:
    """
    Render a certificate with the given name.

    Returns (pdf_bytes, FitReport).
    """
    doc = pymupdf.open(stream=template, filetype="pdf")
    page = doc[0]

    # Remove placeholder text
    page.add_redact_annot(pymupdf.Rect(spec.bbox), fill=False)
    page.apply_redactions(images=pymupdf.PDF_REDACT_IMAGE_NONE)

    # Load font
    notes: list[str] = []
    used_fallback = False
    font: pymupdf.Font

    if font_path and not force_fallback:
        try:
            font = pymupdf.Font(fontfile=font_path)
        except Exception:
            font = pymupdf.Font("helv")
            used_fallback = True
            notes.append("custom font failed to load; fallback font used")
    else:
        font = pymupdf.Font("helv")
        used_fallback = True
        if not force_fallback:
            notes.append("no custom font provided; fallback font used")
        else:
            notes.append("fallback font used (forced)")

    # Check for missing glyphs
    missing = [
        ch for ch in dict.fromkeys(name)
        if not ch.isspace() and not font.has_glyph(ord(ch))
    ]

    # Fit algorithm
    size = spec.size
    lines = [name]
    floor_size = spec.size * floor

    # Step 1: Try shrinking single line
    while (
        font.text_length(name, fontsize=size) > spec.max_width
        and size - 0.5 >= floor_size
    ):
        size -= 0.5

    fits = font.text_length(name, fontsize=size) <= spec.max_width

    # Step 2: Try two lines if single line doesn't fit
    if not fits and allow_two_lines and " " in name:
        size = spec.size
        lines = _split_two_lines(name, font, size)
        while (
            max(font.text_length(ln, fontsize=size) for ln in lines) > spec.max_width
            and size - 0.5 >= floor_size
        ):
            size -= 0.5
        fits = max(font.text_length(ln, fontsize=size) for ln in lines) <= spec.max_width

    # Insert text
    cx = (spec.bbox[0] + spec.bbox[2]) / 2
    line_h = size * 1.15
    base_y = spec.origin[1] - (len(lines) - 1) * line_h / 2
    boxes: list[pymupdf.Rect] = []

    for i, ln in enumerate(lines):
        w = font.text_length(ln, fontsize=size)
        x = cx - w / 2
        y = base_y + i * line_h

        kwargs: dict = dict(fontsize=size, color=spec.color)
        if font_path and not used_fallback:
            kwargs.update(fontname="custom", fontfile=font_path)
        else:
            kwargs.update(fontname="helv")

        page.insert_text((x, y), ln, **kwargs)
        boxes.append(pymupdf.Rect(x, y - size, x + w, y + size * 0.25))

    # Overlap check
    overlaps = any(
        b.intersects(pymupdf.Rect(r))
        for b in boxes
        for r in spec.other_rects
    )

    ok = fits and not missing and not overlaps
    if not fits:
        notes.append("name too wide even after shrinking/splitting")
    if missing:
        notes.append(f"missing glyphs: {''.join(missing)}")
    if overlaps:
        notes.append("overlaps other content")

    report = FitReport(
        ok=ok,
        final_size=size,
        scale=size / spec.size if spec.size > 0 else 1.0,
        lines=len(lines),
        missing_glyphs=missing,
        overlaps_content=overlaps,
        used_fallback_font=used_fallback,
        notes=notes,
    )

    out = doc.tobytes(garbage=4, deflate=True)
    doc.close()
    return out, report


def preview_png(pdf_bytes: bytes, dpi: int = 100) -> bytes:
    """Render the first page of a PDF as a PNG image."""
    doc = pymupdf.open(stream=pdf_bytes, filetype="pdf")
    page = doc[0]

    # Cap pixmap dimensions to avoid memory blowups
    pix = page.get_pixmap(dpi=dpi)
    if pix.width > 4000 or pix.height > 4000:
        # Scale down
        scale = min(4000 / pix.width, 4000 / pix.height)
        pix = page.get_pixmap(dpi=int(dpi * scale))

    data = pix.tobytes("png")
    doc.close()
    return data

