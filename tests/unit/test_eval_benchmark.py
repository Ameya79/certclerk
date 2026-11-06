"""
Test to ensure evals benchmark suite runs cleanly and meets quality gates.
"""

from __future__ import annotations

from evals.benchmark import run_benchmark


def test_evals_benchmark_quality_gates():
    scorecard = run_benchmark()
    assert scorecard["total_test_cases"] == 100
    metrics = scorecard["metrics"]
    assert metrics["invariant_pass_rate_pct"] == 100.0
    assert metrics["hallucination_rate_pct"] == 0.0
    assert metrics["layout_containment_rate_pct"] == 100.0
    assert metrics["latency_p50_ms"] < 25.0
    assert scorecard["verdict"] == "PASSED"

