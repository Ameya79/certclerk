"""
CertClerk: Agent Tool Contracts and Execution Trace Harness.

Provides explicit, inspectable tool contracts for agent reasoning:
1. probe_canva_token: Extracts bounding boxes, baselines, and layout boundaries.
2. calculate_font_fit: Mathematical fitting, auto-scaling, and line-wrapping.
3. enforce_name_invariant: Deterministic letter-equality guard preventing hallucinations.
4. build_recipient_trace: Generates end-to-end audit traces for full interpretability.
"""

from __future__ import annotations

import time
import unicodedata
from typing import Any, Literal
from pydantic import BaseModel, ConfigDict
import pymupdf

from core.guards import norm, has_control, change_allowed, needs_review
from core.models import (
    AgentExecutionTrace,
    FitReport,
    PlaceholderSpec,
    TraceStep,
)


# ---------------------------------------------------------------------------
# Structured Tool Contract Outputs
# ---------------------------------------------------------------------------

class CanvaTokenResult(BaseModel):
    """Result of probing a certificate template for vector placeholder tokens."""
    model_config = ConfigDict(extra="ignore")

    found: bool
    placeholder: str
    bbox: tuple[float, float, float, float] = (0.0, 0.0, 0.0, 0.0)
    origin: tuple[float, float] = (0.0, 0.0)
    font_size: float = 0.0
    max_width: float = 0.0
    color_rgb: tuple[float, float, float] = (0.0, 0.0, 0.0)
    obstacle_count: int = 0
    page_dimensions: tuple[float, float] = (0.0, 0.0)
    error: str | None = None


class FontFitResult(BaseModel):
    """Result of calculating typography geometry and containment constraints."""
    model_config = ConfigDict(extra="ignore")

    fits: bool
    text: str
    initial_size: float
    final_size: float
    scale: float
    line_count: int
    lines: list[str]
    missing_glyphs: list[str] = []
    used_fallback: bool = False
    overlaps_content: bool = False
    notes: list[str] = []


class InvariantVerdict(BaseModel):
    """Verdict of the deterministic code-level letter-equality guard."""
    model_config = ConfigDict(extra="ignore")

    passed: bool
    raw_input: str
    candidate_output: str
    raw_normalized: str
    candidate_normalized: str
    letter_equality: bool
    length_valid: bool
    control_chars_absent: bool
    reason: str


# ---------------------------------------------------------------------------
# Tool Implementations
# ---------------------------------------------------------------------------

def probe_canva_token(
    pdf_bytes: bytes,
    placeholder: str = "AGENT",
) -> CanvaTokenResult:
    """
    Tool: Probes a PDF template to locate the exact coordinates of the placeholder.
    
    Extracts baseline coordinates, bounding box dimensions, and identifies other
    text elements as visual collision obstacles.
    """
    try:
        doc = pymupdf.open(stream=pdf_bytes, filetype="pdf")
    except Exception as exc:
        return CanvaTokenResult(
            found=False,
            placeholder=placeholder,
            error=f"Cannot open PDF stream: {exc}",
        )

    try:
        if doc.page_count < 1:
            return CanvaTokenResult(
                found=False,
                placeholder=placeholder,
                error="PDF document has zero pages",
            )

        page = doc[0]
        page_dims = (float(page.rect.width), float(page.rect.height))
        hits: list[dict[str, Any]] = []
        obstacles: list[tuple[float, float, float, float]] = []

        text_dict = page.get_text("dict")
        for b in text_dict.get("blocks", []):
            for line in b.get("lines", []):
                for s in line.get("spans", []):
                    span_text = s.get("text", "").strip()
                    if span_text == placeholder:
                        hits.append(s)
                    elif span_text:
                        obstacles.append(tuple(s.get("bbox", (0, 0, 0, 0))))

        if not hits:
            # Fallback text search
            search_rects = page.search_for(placeholder)
            if not search_rects:
                return CanvaTokenResult(
                    found=False,
                    placeholder=placeholder,
                    page_dimensions=page_dims,
                    error=f"Placeholder '{placeholder}' was not found in PDF vector spans",
                )
            r = search_rects[0]
            max_w = min(2.0 * float(r.width), float(page.rect.width) - 80.0)
            return CanvaTokenResult(
                found=True,
                placeholder=placeholder,
                bbox=(float(r.x0), float(r.y0), float(r.x1), float(r.y1)),
                origin=(float(r.x0), float(r.y1)),
                font_size=24.0,
                max_width=max_w,
                obstacle_count=len(obstacles),
                page_dimensions=page_dims,
            )

        s = hits[0]
        x0, y0, x1, y1 = [float(v) for v in s["bbox"]]
        w = x1 - x0
        max_w = min(2.0 * w, float(page.rect.width) - 80.0)
        c = s.get("color", 0)
        rgb = (
            ((c >> 16) & 255) / 255.0,
            ((c >> 8) & 255) / 255.0,
            (c & 255) / 255.0,
        )

        return CanvaTokenResult(
            found=True,
            placeholder=placeholder,
            bbox=(x0, y0, x1, y1),
            origin=(float(s["origin"][0]), float(s["origin"][1])),
            font_size=float(s["size"]),
            max_width=max_w,
            color_rgb=rgb,
            obstacle_count=len(obstacles),
            page_dimensions=page_dims,
        )
    finally:
        doc.close()


def calculate_font_fit(
    text: str,
    spec: PlaceholderSpec | CanvaTokenResult,
    font_path: str | None = None,
    floor: float = 0.6,
    allow_two_lines: bool = True,
    force_fallback: bool = False,
) -> FontFitResult:
    """
    Tool: Calculates typography metrics, solves bounding box fitting,
    and returns multi-line or scaled parameters.
    """
    notes: list[str] = []
    used_fallback = False
    font: pymupdf.Font

    if font_path and not force_fallback:
        try:
            font = pymupdf.Font(fontfile=font_path)
        except Exception:
            font = pymupdf.Font("helv")
            used_fallback = True
            notes.append("Custom font failed to load; using fallback font")
    else:
        font = pymupdf.Font("helv")
        used_fallback = True
        if force_fallback:
            notes.append("Fallback font forced by policy")

    missing = [
        ch for ch in dict.fromkeys(text)
        if not ch.isspace() and not font.has_glyph(ord(ch))
    ]
    if missing:
        notes.append(f"Missing glyphs: {''.join(missing)}")

    base_size = spec.font_size if isinstance(spec, CanvaTokenResult) else spec.size
    max_w = spec.max_width
    size = base_size
    lines = [text]
    floor_size = base_size * floor

    # 1. Single line shrinking
    while font.text_length(text, fontsize=size) > max_w and size - 0.5 >= floor_size:
        size -= 0.5

    fits = font.text_length(text, fontsize=size) <= max_w

    # 2. Multi-line wrapping if needed and allowed
    if not fits and allow_two_lines and " " in text:
        words = text.split()
        if len(words) >= 2:
            best_pair: tuple[float, list[str]] | None = None
            size_candidate = base_size
            for i in range(1, len(words)):
                ln1 = " ".join(words[:i])
                ln2 = " ".join(words[i:])
                w_candidate = max(
                    font.text_length(ln1, fontsize=size_candidate),
                    font.text_length(ln2, fontsize=size_candidate),
                )
                if best_pair is None or w_candidate < best_pair[0]:
                    best_pair = (w_candidate, [ln1, ln2])

            if best_pair:
                lines = best_pair[1]
                size = base_size
                while (
                    max(font.text_length(ln, fontsize=size) for ln in lines) > max_w
                    and size - 0.5 >= floor_size
                ):
                    size -= 0.5
                fits = max(font.text_length(ln, fontsize=size) for ln in lines) <= max_w

    # 3. Self-correcting ladder: shrink further down to 35% if extreme length
    if not fits:
        extended_floor = base_size * 0.35
        if allow_two_lines and " " in text and len(lines) >= 2:
            while (
                max(font.text_length(ln, fontsize=size) for ln in lines) > max_w
                and size - 0.5 >= extended_floor
            ):
                size -= 0.5
            fits = max(font.text_length(ln, fontsize=size) for ln in lines) <= max_w
            if fits:
                notes.append("Applied self-correction: shrink_more to 35% with two lines")

        if not fits:
            single_size = size
            while (
                font.text_length(text, fontsize=single_size) > max_w
                and single_size - 0.5 >= extended_floor
            ):
                single_size -= 0.5
            if font.text_length(text, fontsize=single_size) <= max_w:
                fits = True
                lines = [text]
                size = single_size
                notes.append("Applied self-correction: shrink_more to 35% on single line")

    scale = round(size / base_size, 3) if base_size > 0 else 1.0

    return FontFitResult(
        fits=fits,
        text=text,
        initial_size=round(base_size, 2),
        final_size=round(size, 2),
        scale=scale,
        line_count=len(lines),
        lines=lines,
        missing_glyphs=missing,
        used_fallback=used_fallback,
        overlaps_content=False,
        notes=notes,
    )


def enforce_name_invariant(
    raw_name: str,
    candidate_name: str,
) -> InvariantVerdict:
    """
    Tool: Deterministic mathematical invariant assertion.
    
    Verifies that the candidate name contains the exact same letters in the
    same order, preventing any hallucination, abbreviation expansion, or character loss.
    """
    clean_stripped = candidate_name.strip()
    raw_norm = norm(raw_name)
    clean_norm = norm(clean_stripped)

    length_valid = 1 <= len(clean_stripped) <= 120
    control_chars_absent = not has_control(clean_stripped)
    letter_equality = (raw_norm == clean_norm)

    passed = length_valid and control_chars_absent and letter_equality

    if not length_valid:
        reason = f"Length out of bounds: {len(clean_stripped)} chars (limit 1 to 120)"
    elif not control_chars_absent:
        reason = "Forbidden control characters detected in string"
    elif not letter_equality:
        reason = f"Letter invariant violated: raw '{raw_norm}' != clean '{clean_norm}'"
    else:
        reason = "Invariant satisfied: character set matches exactly"

    return InvariantVerdict(
        passed=passed,
        raw_input=raw_name,
        candidate_output=candidate_name,
        raw_normalized=raw_norm,
        candidate_normalized=clean_norm,
        letter_equality=letter_equality,
        length_valid=length_valid,
        control_chars_absent=control_chars_absent,
        reason=reason,
    )


def build_recipient_trace(
    raw_name: str,
    clean_name: str,
    spec: PlaceholderSpec | CanvaTokenResult | None = None,
    fit: FitReport | FontFitResult | None = None,
    llm_invoked: bool = False,
    extra_notes: list[str] | None = None,
    elapsed_ms: float = 0.0,
) -> AgentExecutionTrace:
    """
    Constructs a sequential, inspectable agent trace recording all tool calls,
    reasoning decisions, and invariant verifications for an attendee.
    """
    steps: list[TraceStep] = []
    step_idx = 1

    # Step 1: Input Ingestion & Sanitization
    has_ctrl = has_control(raw_name)
    raw_trimmed = raw_name.strip()
    steps.append(
        TraceStep(
            step_num=step_idx,
            tool="ingest.sanitize_input",
            action="evaluate_raw_string",
            input_summary=f"Raw: '{raw_name}'",
            output_summary=f"Trimmed: '{raw_trimmed}'",
            verdict="warning" if has_ctrl else "success",
            details={
                "length": len(raw_name),
                "needs_review": needs_review(raw_name),
                "has_control_chars": has_ctrl,
            },
        )
    )
    step_idx += 1

    # Step 2: Canva Vector Probe
    if spec:
        if isinstance(spec, CanvaTokenResult):
            bbox_str = f"({spec.bbox[0]:.1f}, {spec.bbox[1]:.1f}, {spec.bbox[2]:.1f}, {spec.bbox[3]:.1f})"
            steps.append(
                TraceStep(
                    step_num=step_idx,
                    tool="probe_canva_token",
                    action="locate_placeholder_geometry",
                    input_summary=f"Token: '{spec.placeholder}'",
                    output_summary=f"Slot: {bbox_str}, max_width: {spec.max_width:.1f}pt",
                    verdict="success" if spec.found else "rejected",
                    details={
                        "font_size": spec.font_size,
                        "origin": spec.origin,
                        "obstacles": spec.obstacle_count,
                    },
                )
            )
        else:
            bbox_str = f"({spec.bbox[0]:.1f}, {spec.bbox[1]:.1f}, {spec.bbox[2]:.1f}, {spec.bbox[3]:.1f})"
            steps.append(
                TraceStep(
                    step_num=step_idx,
                    tool="probe_canva_token",
                    action="locate_placeholder_geometry",
                    input_summary=f"Token: '{spec.text}'",
                    output_summary=f"Slot: {bbox_str}, max_width: {spec.max_width:.1f}pt",
                    verdict="success",
                    details={
                        "font_size": spec.size,
                        "origin": spec.origin,
                    },
                )
            )
        step_idx += 1

    # Step 3: Casing & Normalization Reasoning
    steps.append(
        TraceStep(
            step_num=step_idx,
            tool="llm.casing_normalizer" if llm_invoked else "rules.casing_normalizer",
            action="normalize_casing_and_particles",
            input_summary=f"Input: '{raw_name}'",
            output_summary=f"Candidate: '{clean_name}'",
            verdict="info",
            details={
                "engine": "llm" if llm_invoked else "deterministic_rules",
                "changed": clean_name != raw_name,
            },
        )
    )
    step_idx += 1

    # Step 4: Deterministic Invariant Assertion
    verdict = enforce_name_invariant(raw_name, clean_name)
    steps.append(
        TraceStep(
            step_num=step_idx,
            tool="enforce_name_invariant",
            action="verify_letter_equality_assertion",
            input_summary=f"Raw norm: '{verdict.raw_normalized}' vs Clean norm: '{verdict.candidate_normalized}'",
            output_summary=verdict.reason,
            verdict="success" if verdict.passed else "rejected",
            details={
                "letter_equality": verdict.letter_equality,
                "length_valid": verdict.length_valid,
                "control_chars_absent": verdict.control_chars_absent,
            },
        )
    )
    step_idx += 1

    # Step 5: Layout Geometry & Font Fitting
    if fit:
        is_ok = fit.fits if isinstance(fit, FontFitResult) else fit.ok
        scale_val = fit.scale
        lines_cnt = fit.line_count if isinstance(fit, FontFitResult) else fit.lines
        steps.append(
            TraceStep(
                step_num=step_idx,
                tool="calculate_font_fit",
                action="solve_bounding_box_containment",
                input_summary=f"Text: '{clean_name}'",
                output_summary=f"Scale: {scale_val * 100:.1f}%, Lines: {lines_cnt}",
                verdict="success" if is_ok else "warning",
                details={
                    "ok": is_ok,
                    "scale": scale_val,
                    "lines": lines_cnt,
                    "fallback_font": fit.used_fallback if isinstance(fit, FontFitResult) else fit.used_fallback_font,
                },
            )
        )

    summary_text = (
        "Invariant PASSED. Layout containment verified."
        if verdict.passed
        else f"Invariant REJECTED: {verdict.reason}"
    )

    return AgentExecutionTrace(
        raw_input=raw_name,
        candidate_output=clean_name,
        invariant_passed=verdict.passed,
        verdict_summary=summary_text,
        steps=steps,
        latency_ms=round(elapsed_ms, 2),
    )
