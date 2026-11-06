"""
galeus: Agent Evaluation and Invariant Benchmark Suite.

Measures:
1. Invariant Pass Rate: Deterministic letter-equality guard success.
2. Hallucination Rate: Zero tolerance for character insertion/deletion/substitution.
3. Layout Border Containment Rate: Visual fit within template constraints.
4. Latency Metrics: P50, P95, and average execution latency per attendee.

Usage:
    python -m evals.benchmark
"""

from __future__ import annotations

import json
import os
import sys
import time
from pathlib import Path
from typing import Any

import pymupdf

from core.agent_tools import (
    CanvaTokenResult,
    calculate_font_fit,
    enforce_name_invariant,
    probe_canva_token,
)
from core.guards import norm, sanitize_csv_cell
from core.models import PlaceholderSpec
from core.validators import rules_clean


def build_synthetic_benchmark_template() -> bytes:
    """Builds a standardized single-page certificate PDF with a placeholder token."""
    doc = pymupdf.open()
    page = doc.new_page(width=842.0, height=595.0)  # A4 Landscape in points
    # Insert decorative boundary
    page.draw_rect(pymupdf.Rect(40, 40, 802, 555), color=(0.2, 0.3, 0.5), width=2)
    # Insert title
    page.insert_text((300, 140), "CERTIFICATE OF ACHIEVEMENT", fontsize=20, color=(0.1, 0.1, 0.2))
    # Insert placeholder for attendee name (centered slot around y=280)
    page.insert_text((300, 280), "AGENT NAME HERE", fontsize=32, color=(0.05, 0.05, 0.05))
    # Insert subtitle
    page.insert_text((260, 360), "For outstanding contribution to autonomous agent research", fontsize=14, color=(0.3, 0.3, 0.3))
    
    pdf_bytes = doc.tobytes()
    doc.close()
    return pdf_bytes


def run_benchmark() -> dict[str, Any]:
    """Runs the 100-case adversarial evaluation suite."""
    dataset_path = Path(__file__).parent / "datasets" / "adversarial_names.json"
    if not dataset_path.exists():
        raise FileNotFoundError(f"Benchmark dataset missing at {dataset_path}")

    with open(dataset_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    cases = data.get("cases", [])
    total_cases = len(cases)
    if total_cases == 0:
        raise ValueError("Benchmark dataset contains zero test cases")

    pdf_bytes = build_synthetic_benchmark_template()
    token_res = probe_canva_token(pdf_bytes, placeholder="AGENT NAME HERE")
    if not token_res.found:
        raise RuntimeError("Failed to probe placeholder token in benchmark template")

    latencies_ms: list[float] = []
    invariant_passed_count = 0
    hallucination_detected_count = 0
    layout_contained_count = 0
    injection_neutralized_count = 0

    category_stats: dict[str, dict[str, int]] = {}

    for c in cases:
        raw_name = c["raw_name"]
        cat = c.get("category", "general")
        expected_behavior = c.get("expected_behavior", "normalize")

        if cat not in category_stats:
            category_stats[cat] = {"total": 0, "invariant_passed": 0, "contained": 0}
        category_stats[cat]["total"] += 1

        t0 = time.perf_counter()

        # Step 1: Ingestion & CSV Sanitization
        sanitized = sanitize_csv_cell(raw_name)
        if cat == "csv_injection_and_adversarial":
            # Check if formula prefixes are neutralized
            if raw_name.startswith(("=", "+", "-", "@", "\t", "\r")):
                if sanitized.startswith("'"):
                    injection_neutralized_count += 1
            else:
                injection_neutralized_count += 1

        # Step 2: Casing Normalization
        clean_name = rules_clean(raw_name)

        # Step 3: Invariant Verification
        verdict = enforce_name_invariant(raw_name, clean_name)
        if verdict.passed:
            invariant_passed_count += 1
            category_stats[cat]["invariant_passed"] += 1
        else:
            # Check if it was an actual hallucination (letter divergence)
            if not verdict.letter_equality:
                hallucination_detected_count += 1

        # Step 4: Font Fitting and Layout Containment
        fit_res = calculate_font_fit(clean_name, token_res, allow_two_lines=True)
        if fit_res.fits:
            layout_contained_count += 1
            category_stats[cat]["contained"] += 1

        t1 = time.perf_counter()
        latencies_ms.append((t1 - t0) * 1000.0)

    latencies_ms.sort()
    p50_latency = latencies_ms[len(latencies_ms) // 2]
    p95_latency = latencies_ms[int(len(latencies_ms) * 0.95)]
    avg_latency = sum(latencies_ms) / len(latencies_ms)

    invariant_rate = (invariant_passed_count / total_cases) * 100.0
    hallucination_rate = (hallucination_detected_count / total_cases) * 100.0
    containment_rate = (layout_contained_count / total_cases) * 100.0

    scorecard: dict[str, Any] = {
        "suite_version": "1.0.0",
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "total_test_cases": total_cases,
        "metrics": {
            "invariant_pass_rate_pct": round(invariant_rate, 2),
            "hallucination_rate_pct": round(hallucination_rate, 2),
            "layout_containment_rate_pct": round(containment_rate, 2),
            "latency_p50_ms": round(p50_latency, 3),
            "latency_p95_ms": round(p95_latency, 3),
            "latency_avg_ms": round(avg_latency, 3),
        },
        "category_breakdown": category_stats,
        "verdict": "PASSED" if invariant_rate == 100.0 and containment_rate == 100.0 else "REVIEW_NEEDED",
    }

    # Save scorecard
    reports_dir = Path(__file__).parent / "reports"
    reports_dir.mkdir(parents=True, exist_ok=True)
    report_file = reports_dir / "benchmark_scorecard.json"
    with open(report_file, "w", encoding="utf-8") as f:
        json.dump(scorecard, f, indent=2)

    return scorecard


def print_scorecard(scorecard: dict[str, Any]) -> None:
    """Prints a structured ASCII terminal table of the evaluation results."""
    m = scorecard["metrics"]
    print("==================================================================")
    print("             GALEUS AGENT EVALUATION BENCHMARK                    ")
    print("==================================================================")
    print(f" Total Adversarial Cases Evaluated : {scorecard['total_test_cases']}")
    print(f" Invariant Pass Rate (Target 100%) : {m['invariant_pass_rate_pct']}%")
    print(f" Hallucination Rate (Target 0.0%)  : {m['hallucination_rate_pct']}%")
    print(f" Layout Containment Rate           : {m['layout_containment_rate_pct']}%")
    print(f" Latency P50 / P95                 : {m['latency_p50_ms']} ms / {m['latency_p95_ms']} ms")
    print("------------------------------------------------------------------")
    print(" CATEGORY BREAKDOWN:")
    for cat, stats in scorecard["category_breakdown"].items():
        tot = stats["total"]
        inv = stats["invariant_passed"]
        fit = stats["contained"]
        cat_label = cat.replace("_", " ").title().ljust(30)
        print(f"   {cat_label} : {inv}/{tot} invariants passed | {fit}/{tot} fit")
    print("------------------------------------------------------------------")
    print(f" VERDICT: {scorecard['verdict']}")
    print(" Report persisted to evals/reports/benchmark_scorecard.json")
    print("==================================================================")


if __name__ == "__main__":
    card = run_benchmark()
    print_scorecard(card)
    if card["verdict"] != "PASSED":
        sys.exit(1)
