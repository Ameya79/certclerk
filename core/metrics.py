"""
Global aggregate metrics tracker for CertClerk.
Persists aggregate statistics across all jobs to disk safely.
"""

from __future__ import annotations

import json
import logging
import os
import time
from pathlib import Path
from typing import Any

logger = logging.getLogger(__name__)

METRICS_PATH = Path("data/metrics.json")


def _ensure_metrics_file() -> dict[str, Any]:
    """Ensure data/metrics.json exists with default zeroed counters."""
    default_metrics = {
        "total_certs_generated": 0,
        "total_emails_dispatched": 0,
        "total_batches_processed": 0,
        "total_users": 1,
        "last_updated": time.time(),
    }
    if not METRICS_PATH.parent.exists():
        METRICS_PATH.parent.mkdir(parents=True, exist_ok=True)

    if not METRICS_PATH.exists():
        try:
            METRICS_PATH.write_text(json.dumps(default_metrics, indent=2), encoding="utf-8")
        except Exception as e:
            logger.warning("Could not initialize metrics file: %s", e)
        return default_metrics

    try:
        data = json.loads(METRICS_PATH.read_text(encoding="utf-8"))
        for k, v in default_metrics.items():
            data.setdefault(k, v)
        return data
    except Exception as e:
        logger.warning("Failed to parse metrics file, resetting: %s", e)
        return default_metrics


def get_global_metrics(active_jobs_count: int = 0) -> dict[str, Any]:
    """Return the current aggregate metrics."""
    data = _ensure_metrics_file()
    return {
        "total_certs_generated": int(data.get("total_certs_generated", 0)),
        "total_emails_dispatched": int(data.get("total_emails_dispatched", 0)),
        "total_batches_processed": int(data.get("total_batches_processed", 0)),
        "total_users": max(1, int(data.get("total_users", 1))),
        "active_jobs": active_jobs_count,
        "last_updated": data.get("last_updated", time.time()),
    }


def record_metrics_increment(
    certs_generated: int = 0,
    emails_dispatched: int = 0,
    batches_processed: int = 0,
    users_increment: int = 0,
) -> None:
    """Atomically increment aggregate counters."""
    if certs_generated == 0 and emails_dispatched == 0 and batches_processed == 0 and users_increment == 0:
        return

    data = _ensure_metrics_file()
    data["total_certs_generated"] = int(data.get("total_certs_generated", 0)) + max(0, certs_generated)
    data["total_emails_dispatched"] = int(data.get("total_emails_dispatched", 0)) + max(0, emails_dispatched)
    data["total_batches_processed"] = int(data.get("total_batches_processed", 0)) + max(0, batches_processed)
    data["total_users"] = int(data.get("total_users", 1)) + max(0, users_increment)
    data["last_updated"] = time.time()

    tmp_path = METRICS_PATH.with_suffix(".json.tmp")
    try:
        tmp_path.write_text(json.dumps(data, indent=2), encoding="utf-8")
        for attempt in range(8):
            try:
                os.replace(str(tmp_path), str(METRICS_PATH))
                break
            except (PermissionError, OSError):
                if attempt == 7:
                    import shutil
                    shutil.copyfile(str(tmp_path), str(METRICS_PATH))
                    tmp_path.unlink(missing_ok=True)
                    break
                time.sleep(0.05 * (attempt + 1))
    except Exception as e:
        logger.warning("Failed to persist updated metrics: %s", e)
        if tmp_path.exists():
            try:
                tmp_path.unlink()
            except Exception:
                pass

