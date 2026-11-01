"""
CertClerk — Job Store.

Filesystem-based job storage with atomic writes, per-job locks,
append-only logs, and a retention sweeper.

No database required — each job is a folder on disk.
"""

from __future__ import annotations

import hashlib
import json
import logging
import os
import re
import secrets
import shutil
import threading
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from core.models import Job, JobStatus, Recipient, VALID_TRANSITIONS

logger = logging.getLogger(__name__)

ID_RE = re.compile(r"^[A-Za-z0-9_-]{16,32}$")


class StoreError(Exception):
    """Raised on storage errors."""
    pass


class TransitionError(Exception):
    """Raised on invalid state transitions."""
    pass


class JobStore:
    """
    Filesystem-based job store.

    Each job is a folder under the root directory:
        data/jobs/<job_id>/
        ├── job.json          # status, config, mapping, recipients
        ├── template.pdf
        ├── input.csv|xlsx
        ├── font.ttf          # optional
        ├── certs/<row_id>.pdf
        ├── previews/<row_id>.png
        ├── send_log.jsonl    # append-only
        └── audit.jsonl       # append-only
    """

    def __init__(self, root: str | Path) -> None:
        self.root = Path(root)
        self._locks: dict[str, threading.RLock] = {}
        self._lock_lock = threading.Lock()
        self.root.mkdir(parents=True, exist_ok=True)

    def _dir(self, job_id: str) -> Path:
        """Get the directory for a job, validating the ID."""
        if not ID_RE.match(job_id):
            raise StoreError(f"Invalid job ID: {job_id!r}")
        return self.root / job_id

    def _log_path(self, job_id: str, filename: str) -> Path | None:
        """Get the path to a log file."""
        d = self._dir(job_id)
        p = d / filename
        return p

    def lock(self, job_id: str) -> threading.RLock:
        """Get or create a per-job lock."""
        with self._lock_lock:
            if job_id not in self._locks:
                self._locks[job_id] = threading.RLock()
            return self._locks[job_id]

    def create(self, user_id: str = "local_organizer", org_id: str = "local_device") -> str:
        """Create a new job and return its ID."""
        job_id = secrets.token_urlsafe(16)
        job_dir = self._dir(job_id)
        job_dir.mkdir(parents=True, exist_ok=True)
        (job_dir / "certs").mkdir(exist_ok=True)
        (job_dir / "previews").mkdir(exist_ok=True)

        now = datetime.now(timezone.utc).isoformat()
        job = Job(
            job_id=job_id,
            user_id=user_id,
            org_id=org_id,
            status=JobStatus.CREATED,
            created_at=now,
            updated_at=now,
        )
        self.save(job_id, job.model_dump())
        return job_id

    def save(self, job_id: str, data: dict) -> None:
        """
        Atomically save job.json.

        Writes to a temp file, fsyncs, then atomically replaces.
        A crash never leaves a half-written file.
        """
        job_dir = self._dir(job_id)
        p = job_dir / "job.json"
        tmp = job_dir / "job.json.tmp"

        try:
            with open(tmp, "w", encoding="utf-8") as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
                f.flush()
                os.fsync(f.fileno())
            
            # Robust atomic replace on Windows (with retry for OneDrive/antivirus file locks)
            for attempt in range(8):
                try:
                    os.replace(str(tmp), str(p))
                    break
                except (PermissionError, OSError) as pe:
                    if attempt == 7:
                        # Fallback for Windows file locks
                        import shutil
                        shutil.copyfile(str(tmp), str(p))
                        if tmp.exists():
                            try:
                                tmp.unlink()
                            except Exception:
                                pass
                        break
                    time.sleep(0.05 * (attempt + 1))
        except Exception as e:
            # Clean up temp file
            if tmp.exists():
                try:
                    tmp.unlink()
                except Exception:
                    pass
            raise StoreError(f"Failed to save job {job_id}: {e}")

    def load(self, job_id: str) -> dict:
        """Load job.json for a job."""
        job_dir = self._dir(job_id)
        p = job_dir / "job.json"
        if not p.exists():
            raise StoreError(f"Job {job_id} not found")
        try:
            with open(p, encoding="utf-8") as f:
                return json.load(f)
        except json.JSONDecodeError as e:
            raise StoreError(f"Corrupt job data for {job_id}: {e}")

    def exists(self, job_id: str) -> bool:
        """Check if a job exists."""
        try:
            return (self._dir(job_id) / "job.json").exists()
        except StoreError:
            return False

    def append(self, job_id: str, filename: str, obj: dict) -> None:
        """
        Append a JSON line to an append-only log (audit.jsonl, send_log.jsonl).

        Fsyncs after write to ensure durability.
        """
        job_dir = self._dir(job_id)
        p = job_dir / filename
        with open(p, "a", encoding="utf-8") as f:
            f.write(json.dumps(obj, ensure_ascii=False) + "\n")
            f.flush()
            os.fsync(f.fileno())

    def audit(self, job_id: str, event: str, **kwargs: Any) -> None:
        """Write an audit log entry."""
        entry = {
            "event": event,
            "ts": time.time(),
            **kwargs,
        }
        self.append(job_id, "audit.jsonl", entry)

    def save_file(self, job_id: str, filename: str, data: bytes) -> Path:
        """Save a binary file to the job directory."""
        job_dir = self._dir(job_id)
        p = job_dir / filename
        with open(p, "wb") as f:
            f.write(data)
            f.flush()
            os.fsync(f.fileno())
        return p

    def read_file(self, job_id: str, filename: str) -> bytes:
        """Read a binary file from the job directory."""
        job_dir = self._dir(job_id)
        p = job_dir / filename
        if not p.exists():
            raise StoreError(f"File not found: {filename}")
        return p.read_bytes()

    def save_cert(self, job_id: str, row_id: int, data: bytes) -> Path:
        """Save a generated certificate PDF."""
        return self.save_file(job_id, f"certs/{row_id}.pdf", data)

    def read_cert(self, job_id: str, row_id: int) -> bytes:
        """Read a generated certificate PDF."""
        return self.read_file(job_id, f"certs/{row_id}.pdf")

    def save_preview(self, job_id: str, row_id: int, data: bytes) -> Path:
        """Save a preview PNG."""
        return self.save_file(job_id, f"previews/{row_id}.png", data)

    def read_preview(self, job_id: str, row_id: int) -> bytes:
        """Read a preview PNG."""
        return self.read_file(job_id, f"previews/{row_id}.png")

    def file_sha256(self, job_id: str, filename: str) -> str:
        """Compute SHA-256 hash of a file."""
        data = self.read_file(job_id, filename)
        return hashlib.sha256(data).hexdigest()

    def transition(self, job_data: dict, new_status: str) -> dict:
        """
        Validate and perform a state transition.

        Returns the updated job data.
        Raises TransitionError on invalid transitions.
        """
        current = job_data.get("status", "")
        valid = VALID_TRANSITIONS.get(current, set())

        if new_status not in valid:
            raise TransitionError(
                f"Invalid transition: {current} → {new_status}. "
                f"Valid transitions: {valid or 'none'}"
            )

        job_data["status"] = new_status
        job_data["updated_at"] = datetime.now(timezone.utc).isoformat()
        return job_data

    def delete(self, job_id: str) -> None:
        """Delete all data for a job."""
        job_dir = self._dir(job_id)
        if job_dir.exists():
            shutil.rmtree(job_dir, ignore_errors=True)
        # Clean up lock
        with self._lock_lock:
            self._locks.pop(job_id, None)

    def list_jobs(self) -> list[str]:
        """List all job IDs."""
        result = []
        if self.root.exists():
            for d in self.root.iterdir():
                if d.is_dir() and ID_RE.match(d.name):
                    result.append(d.name)
        return result

    def sweep(self, max_age_seconds: int) -> list[str]:
        """
        Delete jobs older than max_age_seconds.

        Returns list of deleted job IDs. Never deletes a job in
        'sending' state.
        """
        deleted = []
        now = time.time()

        for job_id in self.list_jobs():
            job_dir = self._dir(job_id)
            try:
                mtime = os.path.getmtime(job_dir / "job.json")
            except OSError:
                mtime = os.path.getmtime(job_dir)

            if now - mtime > max_age_seconds:
                # Don't delete active jobs
                try:
                    data = self.load(job_id)
                    if data.get("status") == "sending":
                        continue
                except Exception:
                    pass

                self.delete(job_id)
                deleted.append(job_id)

        return deleted

    def disk_usage(self) -> int:
        """Get total disk usage of all jobs in bytes."""
        total = 0
        for job_id in self.list_jobs():
            job_dir = self._dir(job_id)
            for f in job_dir.rglob("*"):
                if f.is_file():
                    total += f.stat().st_size
        return total

