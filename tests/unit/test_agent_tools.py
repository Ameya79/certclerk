"""
Tests for Agent Tool Contracts and Invariant Enforcement.
"""

from __future__ import annotations

import pytest
import pymupdf

from core.agent_tools import (
    CanvaTokenResult,
    FontFitResult,
    InvariantVerdict,
    build_recipient_trace,
    calculate_font_fit,
    enforce_name_invariant,
    probe_canva_token,
)
from core.models import PlaceholderSpec


def make_dummy_template(text: str = "AGENT") -> bytes:
    doc = pymupdf.open()
    page = doc.new_page(width=600, height=400)
    # Insert placeholder text
    page.insert_text((150, 200), text, fontsize=28)
    # Insert another text obstacle
    page.insert_text((150, 260), "Certificate of Excellence", fontsize=16)
    b = doc.tobytes()
    doc.close()
    return b


def test_probe_canva_token_found():
    pdf_bytes = make_dummy_template("AGENT")
    res = probe_canva_token(pdf_bytes, "AGENT")
    assert res.found is True
    assert res.placeholder == "AGENT"
    assert res.font_size > 0
    assert res.max_width > 0
    assert res.page_dimensions == (600.0, 400.0)


def test_probe_canva_token_missing():
    pdf_bytes = make_dummy_template("AGENT")
    res = probe_canva_token(pdf_bytes, "NONEXISTENT")
    assert res.found is False
    assert res.error is not None


def test_calculate_font_fit_scaling():
    spec = PlaceholderSpec(
        text="AGENT",
        bbox=(100.0, 100.0, 300.0, 140.0),
        origin=(100.0, 130.0),
        size=32.0,
        color=(0.0, 0.0, 0.0),
        max_width=180.0,
    )
    # Short name fits at scale 1.0
    res_short = calculate_font_fit("Alice", spec)
    assert res_short.fits is True
    assert res_short.scale == 1.0

    # Very long name requires scaling or 2 lines
    res_long = calculate_font_fit("Dr. Bartholomew Montgomery-Smith III", spec, allow_two_lines=True)
    assert res_long.scale <= 1.0
    assert res_long.final_size <= 32.0


def test_enforce_name_invariant():
    # Identical letters with formatting changes: PASSED
    v1 = enforce_name_invariant("rahul SHARMA", "Rahul Sharma")
    assert v1.passed is True
    assert v1.letter_equality is True

    v2 = enforce_name_invariant("  amit  ", "Amit")
    assert v2.passed is True

    # Punctuation / particles
    v3 = enforce_name_invariant("o'brien", "O'Brien")
    assert v3.passed is True

    # Added / changed letters: REJECTED
    v_hallucinated = enforce_name_invariant("Jonathon", "Jonathan")
    assert v_hallucinated.passed is False
    assert v_hallucinated.letter_equality is False

    # Expanded abbreviation: REJECTED
    v_expanded = enforce_name_invariant("A. Smith", "Arthur Smith")
    assert v_expanded.passed is False

    # Control chars: REJECTED
    v_ctrl = enforce_name_invariant("Amit", "Amit\x00")
    assert v_ctrl.passed is False


def test_build_recipient_trace():
    trace = build_recipient_trace(
        raw_name="  jane DOE  ",
        clean_name="Jane Doe",
        llm_invoked=True,
    )
    assert trace.raw_input == "  jane DOE  "
    assert trace.candidate_output == "Jane Doe"
    assert trace.invariant_passed is True
    assert len(trace.steps) >= 3
    # Verify steps contain tools
    tool_names = [s.tool for s in trace.steps]
    assert "ingest.sanitize_input" in tool_names
    assert "enforce_name_invariant" in tool_names

