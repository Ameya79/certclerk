"""
galeus: FastAPI Backend.

All API endpoints, with validation, rate limiting, security headers,
and background job execution.
"""

from __future__ import annotations

import asyncio
import hashlib
import io
import json
import logging
import os
import time
import zipfile
from concurrent.futures import ProcessPoolExecutor, ThreadPoolExecutor
from datetime import datetime, timezone
from pathlib import Path
from threading import Event
from typing import Any

from dotenv import load_dotenv

# Ensure environment variables from .env are loaded
load_dotenv(override=True)

from fastapi import (
    FastAPI,
    File,
    Form,
    HTTPException,
    Request,
    Response,
    UploadFile,
)
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse
from pydantic import BaseModel

from core.agent import clean_names, map_columns, render_with_policy
from core.agent_tools import build_recipient_trace
from core.guards import batch_hash, sanitize_csv_cell, validate_job_id
from core.ingest import IngestError, read_table
from core.mailer import MailerError, recover_send_state, send_all
from core.models import (
    EmailTemplate,
    Job,
    JobStatus,
    Recipient,
    SmtpConfig,
    VALID_TRANSITIONS,
)
from core.pdf_engine import TemplateError, analyze_template, preview_png, render
from core.store import JobStore, StoreError, TransitionError
from core.validators import check_email, find_duplicates

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

DATA_DIR = os.getenv("DATA_DIR", "./data")
MAX_UPLOAD_MB = int(os.getenv("MAX_UPLOAD_MB", "5"))
MAX_ROWS = int(os.getenv("MAX_ROWS", "2000"))
DEMO_MODE = os.getenv("DEMO_MODE", "false").lower() == "true"
SEND_DELAY = float(os.getenv("SEND_DELAY_SECONDS", "1.5"))
RETENTION_HOURS = int(os.getenv("RETENTION_HOURS", "24"))

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s %(message)s",
)
logger = logging.getLogger("galeus")

# ---------------------------------------------------------------------------
# App setup
# ---------------------------------------------------------------------------

app = FastAPI(
    title="galeus API",
    description="Turn Canva certificates + messy attendee lists into personalized, emailed certificates.",
    version="1.0.0",
)

# CORS: only allow configured origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=[orig.strip() for orig in os.getenv("FRONTEND_URL", "http://localhost:3000").split(",") if orig.strip()],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global store and executors
store = JobStore(os.path.join(DATA_DIR, "jobs"))
thread_pool = ThreadPoolExecutor(max_workers=4)
# Active send events (for pause/resume)
_send_events: dict[str, Event] = {}


# ---------------------------------------------------------------------------
# Security middleware
# ---------------------------------------------------------------------------

@app.middleware("http")
async def security_headers(request: Request, call_next):
    """Add security headers to all responses."""
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    return response


# ---------------------------------------------------------------------------
# Error handling
# ---------------------------------------------------------------------------

@app.exception_handler(StoreError)
async def store_error_handler(request: Request, exc: StoreError):
    return JSONResponse(
        status_code=404,
        content={"error": {"code": "not_found", "message": str(exc)}},
    )


@app.exception_handler(TransitionError)
async def transition_error_handler(request: Request, exc: TransitionError):
    return JSONResponse(
        status_code=409,
        content={"error": {"code": "invalid_transition", "message": str(exc)}},
    )


@app.exception_handler(Exception)
async def unhandled_error_handler(request: Request, exc: Exception):
    logger.exception("Unhandled error")
    return JSONResponse(
        status_code=500,
        content={"error": {"code": "internal", "message": "Something went wrong"}},
    )


# ---------------------------------------------------------------------------
# Helper functions
# ---------------------------------------------------------------------------

async def read_limited(f: UploadFile, max_bytes: int) -> bytes:
    """Read an upload file with a size limit, streaming."""
    buf = bytearray()
    while chunk := await f.read(256 * 1024):
        buf += chunk
        if len(buf) > max_bytes:
            raise HTTPException(
                413,
                f"File too large (limit {max_bytes // 1_000_000} MB).",
            )
    if not buf:
        raise HTTPException(422, "Empty file.")
    return bytes(buf)


def _validate_job_id(job_id: str) -> None:
    """Validate job ID format."""
    if not validate_job_id(job_id):
        raise HTTPException(404, "Job not found.")


def _load_job(job_id: str) -> dict:
    """Load a job, raising 404 if not found."""
    _validate_job_id(job_id)
    if not store.exists(job_id):
        raise HTTPException(404, "Job not found.")
    return store.load(job_id)


def _make_audit(job_id: str):
    """Create an audit callback for a job."""
    def audit(event: str, **kwargs):
        store.audit(job_id, event, **kwargs)
    return audit


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@app.get("/")
async def root():
    return {"service": "galeus", "status": "online", "docs": "/docs", "health": "/healthz"}


@app.get("/healthz")
async def health():
    """Liveness check: must stay fast even during heavy jobs."""
    return {"ok": True, "service": "galeus", "ts": datetime.now(timezone.utc).isoformat()}


@app.post("/api/jobs")
async def create_job(
    request: Request,
    template: UploadFile = File(..., description="Certificate PDF template"),
    data: UploadFile = File(..., description="Attendee CSV or XLSX file"),
    font: UploadFile | None = File(None, description="Custom font file (.ttf/.otf)"),
    placeholder: str = Form("AGENT", description="Placeholder text to find in the template"),
):
    """Create a new certificate job with uploaded files."""
    user_id = request.headers.get("x-user-id", "local_organizer").strip() or "local_organizer"
    org_id = request.headers.get("x-org-id", "local_device").strip() or "local_device"

    # Read and validate template
    template_bytes = await read_limited(template, MAX_UPLOAD_MB * 1_000_000)
    if not template_bytes.startswith(b"%PDF"):
        raise HTTPException(422, "Template is not a PDF file.")

    # Read and validate data file
    data_bytes = await read_limited(data, 2_000_000)
    data_filename = data.filename or "data.csv"
    ext = ".xlsx" if data_bytes.startswith(b"PK") else ".csv"
    if data_filename.lower().endswith(".xlsx"):
        ext = ".xlsx"

    # Read optional font
    font_bytes = None
    if font:
        font_bytes = await read_limited(font, 5_000_000)

    # Create job
    job_id = store.create(user_id=user_id, org_id=org_id)
    audit = _make_audit(job_id)

    try:
        # Save files with fixed names (never use user-supplied filenames in paths)
        store.save_file(job_id, "template.pdf", template_bytes)
        store.save_file(job_id, f"input{ext}", data_bytes)
        if font_bytes:
            store.save_file(job_id, "font.ttf", font_bytes)

        # Analyze template
        spec = analyze_template(template_bytes, placeholder)

        # Save job state
        job_data = store.load(job_id)
        job_data["placeholder"] = placeholder
        job_data["template_sha"] = hashlib.sha256(template_bytes).hexdigest()
        job_data["font_sha"] = hashlib.sha256(font_bytes).hexdigest() if font_bytes else ""
        job_data["has_font"] = font_bytes is not None
        # Store spec for later rendering
        job_data["spec"] = {
            "text": spec.text,
            "bbox": list(spec.bbox),
            "origin": list(spec.origin),
            "size": spec.size,
            "color": list(spec.color),
            "max_width": spec.max_width,
            "other_rects": [list(r) for r in spec.other_rects],
        }
        store.save(job_id, job_data)

        audit("job_created", placeholder=placeholder, has_font=font_bytes is not None)

    except TemplateError as e:
        store.delete(job_id)
        raise HTTPException(422, str(e))
    except IngestError as e:
        store.delete(job_id)
        raise HTTPException(422, str(e))
    except Exception as e:
        store.delete(job_id)
        logger.exception("Failed to create job")
        raise HTTPException(500, "Failed to create job.")

    return {"job_id": job_id}


@app.post("/api/jobs/{job_id}/analyze")
async def analyze_job(job_id: str):
    """Start analysis: column mapping + name cleaning + email validation."""
    with store.lock(job_id):
        job_data = _load_job(job_id)

        if job_data["status"] not in ("created", "failed"):
            raise HTTPException(409, f"Job is not in 'created' or 'failed' state, currently '{job_data['status']}'.")

        job_data = store.transition(job_data, JobStatus.ANALYZED)
        store.save(job_id, job_data)

    # Run analysis in background
    loop = asyncio.get_event_loop()
    loop.run_in_executor(thread_pool, _run_analysis, job_id)

    return JSONResponse(
        status_code=202,
        content={"job_id": job_id, "message": "Analysis started. Poll GET /api/jobs/{id} for progress."},
    )


def _run_analysis(job_id: str) -> None:
    """Background task: analyze attendee data."""
    audit = _make_audit(job_id)
    lock = store.lock(job_id)

    try:
        with lock:
            job_data = store.load(job_id)

            # Read attendee file
            for ext in (".csv", ".xlsx"):
                try:
                    data_bytes = store.read_file(job_id, f"input{ext}")
                    headers, rows = read_table(data_bytes, ext)
                    break
                except StoreError:
                    continue
            else:
                raise IngestError("No attendee file found.")

            # Column mapping
            mapping = map_columns(headers, rows[:5] if rows else [], audit)
            job_data["headers"] = headers
            job_data["name_column"] = mapping.name
            job_data["email_column"] = mapping.email

            # Build recipients
            recipients = []
            for row in rows:
                name = row["cells"].get(mapping.name, "").strip()
                email_raw = row["cells"].get(mapping.email, "").strip() if mapping.email else ""

                email_status, email_suggestion = check_email(email_raw) if email_raw else ("missing", None)

                r = Recipient(
                    row_id=row["row_id"],
                    raw_name=name,
                    clean_name=name,
                    email=email_raw.strip().lower() if email_raw else None,
                    email_status=email_status,
                    email_suggestion=email_suggestion,
                    flags=[],
                    status="pending",
                )
                recipients.append(r)

            # Name cleaning
            clean_names(recipients, audit)

            # Find duplicates
            duplicates = find_duplicates(recipients)
            for r in recipients:
                if r.row_id in duplicates:
                    r.flags.append("duplicate")

            # Mark ready
            for r in recipients:
                if r.email_status in ("ok", "fixable") and not r.flags:
                    r.status = "ready"
                elif r.email_status == "missing" and not r.email:
                    r.flags.append("no_email")

            job_data["recipients"] = [r.model_dump() for r in recipients]
            job_data["total"] = len(recipients)
            job_data = store.transition(job_data, JobStatus.MAPPED)
            store.save(job_id, job_data)

            audit("analysis_complete", total=len(recipients),
                  flagged=sum(1 for r in recipients if r.flags))

    except Exception as e:
        logger.exception("Analysis failed for job %s", job_id)
        try:
            with lock:
                job_data = store.load(job_id)
                job_data["error"] = str(e)
                job_data = store.transition(job_data, JobStatus.FAILED)
                store.save(job_id, job_data)
        except Exception:
            pass


@app.get("/api/jobs/{job_id}")
async def get_job(job_id: str, page: int = 1, size: int = 50):
    """Get full job state with paginated recipients."""
    job_data = _load_job(job_id)

    # Paginate recipients
    recipients = job_data.get("recipients", [])
    total = len(recipients)
    start = (page - 1) * size
    end = start + size
    job_data["recipients"] = recipients[start:end]
    job_data["pagination"] = {
        "page": page,
        "size": size,
        "total": total,
        "pages": (total + size - 1) // size if size > 0 else 0,
    }

    return job_data


@app.put("/api/jobs/{job_id}/mapping")
async def update_mapping(job_id: str, mapping: dict):
    """Override column mapping."""
    job_data = _load_job(job_id)

    name_col = mapping.get("name")
    email_col = mapping.get("email")

    if not name_col or name_col not in job_data.get("headers", []):
        raise HTTPException(422, f"Column '{name_col}' not found in headers.")
    if email_col and email_col not in job_data.get("headers", []):
        raise HTTPException(422, f"Column '{email_col}' not found in headers.")

    with store.lock(job_id):
        job_data = store.load(job_id)
        job_data["name_column"] = name_col
        job_data["email_column"] = email_col
        job_data["approved_hash"] = None  # Invalidate approval
        if job_data["status"] == "approved":
            job_data = store.transition(job_data, JobStatus.GENERATED)
        store.save(job_id, job_data)
        store.audit(job_id, "mapping_updated", name=name_col, email=email_col)

    return {"ok": True}


@app.patch("/api/jobs/{job_id}/recipients/{row_id}")
async def update_recipient(job_id: str, row_id: int, update: dict):
    """Edit a recipient's name/email or skip/unskip."""
    with store.lock(job_id):
        job_data = store.load(job_id)

        recipients = job_data.get("recipients", [])
        target = None
        for r in recipients:
            if r["row_id"] == row_id:
                target = r
                break

        if target is None:
            raise HTTPException(404, f"Row {row_id} not found.")

        if "clean_name" in update:
            target["clean_name"] = update["clean_name"]
            target["name_changed"] = True
        if "email" in update:
            target["email"] = update["email"]
            status, suggestion = check_email(update["email"])
            target["email_status"] = status
            target["email_suggestion"] = suggestion
        if "skip" in update:
            target["status"] = "skipped" if update["skip"] else "ready"

        # Invalidate approval
        job_data["approved_hash"] = None
        if job_data["status"] == "approved":
            job_data = store.transition(job_data, JobStatus.GENERATED)
        store.save(job_id, job_data)
        store.audit(job_id, "recipient_updated", row=row_id, changes=update)

    return {"ok": True}


@app.put("/api/jobs/{job_id}/email-template")
async def set_email_template(job_id: str, template: EmailTemplate):
    """Set the email subject and body template."""
    with store.lock(job_id):
        job_data = store.load(job_id)
        job_data["subject"] = template.subject
        job_data["body"] = template.body
        job_data["approved_hash"] = None  # Invalidate approval
        if job_data["status"] == "approved":
            job_data = store.transition(job_data, JobStatus.GENERATED)
        store.save(job_id, job_data)
        store.audit(job_id, "email_template_set")

    return {"ok": True}


@app.post("/api/jobs/{job_id}/generate")
async def generate_certificates(job_id: str):
    """Start generating certificates for all non-skipped rows."""
    with store.lock(job_id):
        job_data = _load_job(job_id)
        if job_data["status"] not in ("mapped", "generated", "failed"):
            raise HTTPException(409, f"Job must be in 'mapped', 'generated', or 'failed' state, not '{job_data['status']}'.")
        job_data = store.transition(job_data, JobStatus.GENERATING)
        store.save(job_id, job_data)

    loop = asyncio.get_event_loop()
    loop.run_in_executor(thread_pool, _run_generation, job_id)

    return JSONResponse(
        status_code=202,
        content={"job_id": job_id, "message": "Generation started."},
    )


def _run_generation(job_id: str) -> None:
    """Background task: generate certificate PDFs."""
    audit = _make_audit(job_id)
    lock = store.lock(job_id)

    try:
        job_data = store.load(job_id)

        # Load template and font
        template_bytes = store.read_file(job_id, "template.pdf")
        font_path = None
        try:
            store.read_file(job_id, "font.ttf")
            font_path = str(store._dir(job_id) / "font.ttf")
        except StoreError:
            pass

        # Reconstruct spec
        spec_data = job_data["spec"]
        from core.models import PlaceholderSpec
        spec = PlaceholderSpec(
            text=spec_data["text"],
            bbox=tuple(spec_data["bbox"]),
            origin=tuple(spec_data["origin"]),
            size=spec_data["size"],
            color=tuple(spec_data["color"]),
            max_width=spec_data["max_width"],
            other_rects=[tuple(r) for r in spec_data.get("other_rects", [])],
        )

        recipients = job_data.get("recipients", [])
        non_skipped = [r for r in recipients if r.get("status") != "skipped"]
        total = len(non_skipped)
        generated = 0

        # Generate in chunks
        chunk_size = 25
        for i in range(0, len(non_skipped), chunk_size):
            chunk = non_skipped[i:i + chunk_size]

            for r in chunk:
                try:
                    name = r.get("clean_name", r.get("raw_name", ""))
                    pdf_bytes, fit_report = render_with_policy(
                        template_bytes, spec, name, font_path, audit,
                    )
                    # Save certificate
                    store.save_cert(job_id, r["row_id"], pdf_bytes)

                    # Generate preview
                    png_bytes = preview_png(pdf_bytes)
                    store.save_preview(job_id, r["row_id"], png_bytes)

                    # Update recipient status
                    r["status"] = "generated"
                    r["fit"] = {
                        "ok": fit_report.ok,
                        "final_size": fit_report.final_size,
                        "scale": fit_report.scale,
                        "lines": fit_report.lines,
                        "missing_glyphs": fit_report.missing_glyphs,
                        "overlaps_content": fit_report.overlaps_content,
                        "used_fallback_font": fit_report.used_fallback_font,
                        "notes": fit_report.notes,
                    }
                    generated += 1
                    r["trace"] = build_recipient_trace(
                        raw_name=r.get("raw_name", ""),
                        clean_name=name,
                        spec=spec,
                        fit=fit_report,
                        llm_invoked=bool(r.get("name_changed", False)),
                    ).model_dump()

                except Exception as e:
                    logger.error("Failed to generate cert for row %d: %s", r["row_id"], e)
                    r["status"] = "failed"
                    r["error"] = str(e)

            # Update progress after each chunk
            with lock:
                job_data = store.load(job_id)
                job_data["recipients"] = recipients
                job_data["progress"] = generated
                store.save(job_id, job_data)

        # Mark complete
        with lock:
            job_data = store.load(job_id)
            job_data["recipients"] = recipients
            job_data["progress"] = generated
            job_data = store.transition(job_data, JobStatus.GENERATED)
            store.save(job_id, job_data)

        audit("generation_complete", total=total, generated=generated)
        try:
            from core.metrics import record_metrics_increment
            record_metrics_increment(certs_generated=generated, batches_processed=1)
        except Exception:
            pass

    except Exception as e:
        logger.exception("Generation failed for job %s", job_id)
        try:
            with lock:
                job_data = store.load(job_id)
                job_data["error"] = str(e)
                job_data = store.transition(job_data, JobStatus.FAILED)
                store.save(job_id, job_data)
        except Exception:
            pass


@app.get("/api/jobs/{job_id}/preview/{row_id}.png")
async def get_preview(job_id: str, row_id: int):
    """Get a preview PNG for a certificate."""
    _validate_job_id(job_id)
    try:
        png_bytes = store.read_preview(job_id, row_id)
        return Response(content=png_bytes, media_type="image/png")
    except StoreError:
        raise HTTPException(404, "Preview not found.")


@app.post("/api/jobs/{job_id}/approve")
async def approve_job(job_id: str):
    """Approve the batch for sending. Stores the batch hash."""
    with store.lock(job_id):
        job_data = store.load(job_id)

        if job_data["status"] != "generated":
            raise HTTPException(409, f"Job must be in 'generated' state, not '{job_data['status']}'.")

        # Compute batch hash
        recipients = [Recipient(**r) for r in job_data.get("recipients", [])]
        h = batch_hash(
            recipients,
            job_data.get("template_sha", ""),
            job_data.get("font_sha", ""),
            job_data.get("subject", ""),
            job_data.get("body", ""),
        )

        job_data["approved_hash"] = h
        job_data = store.transition(job_data, JobStatus.APPROVED)
        store.save(job_id, job_data)
        store.audit(job_id, "approved", hash=h)

    return {"ok": True, "hash": h}


@app.post("/api/jobs/{job_id}/send")
async def send_job(job_id: str, smtp_config: SmtpConfig):
    """Start sending emails. SMTP credentials are held in memory only."""
    with store.lock(job_id):
        job_data = store.load(job_id)

        if job_data["status"] != "approved":
            raise HTTPException(409, f"Job must be in 'approved' state, not '{job_data['status']}'.")

        # Verify batch hash
        recipients = [Recipient(**r) for r in job_data.get("recipients", [])]
        current_hash = batch_hash(
            recipients,
            job_data.get("template_sha", ""),
            job_data.get("font_sha", ""),
            job_data.get("subject", ""),
            job_data.get("body", ""),
        )

        if current_hash != job_data.get("approved_hash"):
            raise HTTPException(
                409,
                "Batch has changed since approval. Please re-approve.",
            )

        # Demo mode restrictions
        if DEMO_MODE:
            sendable = [r for r in recipients if r.status != "skipped" and r.email]
            if len(sendable) > 1:
                raise HTTPException(
                    403,
                    "Demo mode: can only send to one address. "
                    "Skip all but one recipient, or self-host for full sending.",
                )

        # Check not already sending
        if job_id in _send_events:
            raise HTTPException(409, "Already sending.")

        # Transition to sending
        job_data = store.transition(job_data, JobStatus.SENDING)
        store.save(job_id, job_data)

    # Start send in background
    stop_event = Event()
    _send_events[job_id] = stop_event

    loop = asyncio.get_event_loop()
    loop.run_in_executor(
        thread_pool,
        _run_send,
        job_id,
        smtp_config,
        stop_event,
    )

    return JSONResponse(
        status_code=202,
        content={"job_id": job_id, "message": "Sending started."},
    )


def _run_send(job_id: str, smtp_config: SmtpConfig, stop_event: Event) -> None:
    """Background task: send emails."""
    audit = _make_audit(job_id)
    lock = store.lock(job_id)

    try:
        job_data = store.load(job_id)
        recipients = [Recipient(**r) for r in job_data.get("recipients", [])]
        sendable = [r for r in recipients if r.status != "skipped" and r.email]

        def cert_reader(row_id: int) -> bytes:
            return store.read_cert(job_id, row_id)

        # Audit SMTP host (never the password!)
        audit("send_started",
              smtp_host=smtp_config.host,
              smtp_port=smtp_config.port,
              sender=smtp_config.sender,
              count=len(sendable))

        counts = send_all(
            job_id=job_id,
            store=store,
            recipients=sendable,
            smtp_config=smtp_config,
            stop_event=stop_event,
            delay=SEND_DELAY,
            subject_template=job_data.get("subject", ""),
            body_template=job_data.get("body", ""),
            cert_reader=cert_reader,
        )

        # Update job
        with lock:
            job_data = store.load(job_id)
            # Update recipient statuses
            status_map = {r.row_id: r.status for r in sendable}
            for rd in job_data.get("recipients", []):
                if rd["row_id"] in status_map:
                    rd["status"] = status_map[rd["row_id"]]

            if stop_event.is_set():
                job_data = store.transition(job_data, JobStatus.PAUSED)
            else:
                job_data = store.transition(job_data, JobStatus.DONE)
            store.save(job_id, job_data)

        audit("send_complete", counts=counts)
        try:
            from core.metrics import record_metrics_increment
            record_metrics_increment(emails_dispatched=counts.get("sent", 0))
        except Exception:
            pass

    except MailerError as e:
        logger.error("Send failed for job %s: %s", job_id, e)
        try:
            with lock:
                job_data = store.load(job_id)
                job_data["error"] = str(e)
                job_data = store.transition(job_data, JobStatus.FAILED)
                store.save(job_id, job_data)
        except Exception:
            pass

    except Exception as e:
        logger.exception("Send failed for job %s", job_id, e)
        try:
            with lock:
                job_data = store.load(job_id)
                job_data["error"] = str(e)
                job_data = store.transition(job_data, JobStatus.FAILED)
                store.save(job_id, job_data)
        except Exception:
            pass

    finally:
        _send_events.pop(job_id, None)


@app.post("/api/jobs/{job_id}/pause")
async def pause_send(job_id: str):
    """Pause sending."""
    if job_id not in _send_events:
        raise HTTPException(409, "Not currently sending.")
    _send_events[job_id].set()
    return {"ok": True, "message": "Pause requested."}


@app.post("/api/jobs/{job_id}/resume")
async def resume_send(job_id: str, smtp_config: SmtpConfig):
    """Resume sending after pause."""
    with store.lock(job_id):
        job_data = store.load(job_id)
        if job_data["status"] != "paused":
            raise HTTPException(409, "Job is not paused.")
        job_data = store.transition(job_data, JobStatus.SENDING)
        store.save(job_id, job_data)

    stop_event = Event()
    _send_events[job_id] = stop_event

    loop = asyncio.get_event_loop()
    loop.run_in_executor(thread_pool, _run_send, job_id, smtp_config, stop_event)

    return JSONResponse(
        status_code=202,
        content={"job_id": job_id, "message": "Resumed sending."},
    )


@app.post("/api/jobs/{job_id}/rows/{row_id}/retry")
async def retry_row(job_id: str, row_id: int):
    """Retry a failed row."""
    with store.lock(job_id):
        job_data = store.load(job_id)
        for r in job_data.get("recipients", []):
            if r["row_id"] == row_id:
                if r["status"] not in ("failed",):
                    raise HTTPException(409, f"Row is in '{r['status']}' state, not 'failed'.")
                r["status"] = "generated"
                r["error"] = None
                break
        else:
            raise HTTPException(404, f"Row {row_id} not found.")
        store.save(job_id, job_data)
        store.audit(job_id, "row_retry", row=row_id)

    return {"ok": True}


@app.post("/api/jobs/{job_id}/rows/{row_id}/resolve")
async def resolve_row(job_id: str, row_id: int, resolution: dict):
    """Resolve an 'unknown' row: human decides if it was sent or needs retry."""
    with store.lock(job_id):
        job_data = store.load(job_id)
        action = resolution.get("action")
        if action not in ("mark_sent", "retry"):
            raise HTTPException(422, "Action must be 'mark_sent' or 'retry'.")

        for r in job_data.get("recipients", []):
            if r["row_id"] == row_id:
                if r["status"] != "unknown":
                    raise HTTPException(409, f"Row is not in 'unknown' state.")
                r["status"] = "sent" if action == "mark_sent" else "generated"
                r["error"] = None
                break
        else:
            raise HTTPException(404, f"Row {row_id} not found.")
        store.save(job_id, job_data)
        store.audit(job_id, "row_resolved", row=row_id, action=action)

    return {"ok": True}


@app.get("/api/jobs/{job_id}/download.zip")
async def download_zip(job_id: str):
    """Download all generated certificates as a ZIP file."""
    _validate_job_id(job_id)
    job_data = store.load(job_id)

    # Stream ZIP
    def generate_zip():
        buf = io.BytesIO()
        with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as zf:
            for r in job_data.get("recipients", []):
                if r.get("status") in ("generated", "sent", "queued"):
                    try:
                        cert = store.read_cert(job_id, r["row_id"])
                        # Sanitized filename using row_id (never user data)
                        name = sanitize_csv_cell(r.get("clean_name", f"row_{r['row_id']}"))
                        safe_name = "".join(c for c in name if c.isalnum() or c in " _-").strip()
                        zf.writestr(f"{safe_name}_{r['row_id']}.pdf", cert)
                    except StoreError:
                        pass
        buf.seek(0)
        return buf.read()

    zip_bytes = await asyncio.get_event_loop().run_in_executor(thread_pool, generate_zip)

    return Response(
        content=zip_bytes,
        media_type="application/zip",
        headers={"Content-Disposition": f'attachment; filename="galeus_{job_id[:8]}_certificates.zip"'},
    )


@app.get("/api/jobs/{job_id}/audit")
async def get_audit(job_id: str):
    """Get the audit log for a job."""
    _validate_job_id(job_id)
    log_path = store._log_path(job_id, "audit.jsonl")
    entries = []
    if log_path and log_path.exists():
        with open(log_path) as f:
            for line in f:
                line = line.strip()
                if line:
                    entries.append(json.loads(line))
    return {"entries": entries}


@app.delete("/api/jobs/{job_id}")
async def delete_job(job_id: str):
    """Delete all data for a job. Idempotent."""
    _validate_job_id(job_id)

    # If sending, stop first
    if job_id in _send_events:
        _send_events[job_id].set()
        # Give it a moment to stop
        await asyncio.sleep(0.5)

    store.delete(job_id)
    return {"ok": True}


@app.post("/api/jobs/{job_id}/draft-email")
async def draft_email_endpoint(job_id: str, params: dict):
    """Draft an email template using AI."""
    from core.agent import draft_email
    event_name = params.get("event_name", "")
    tone = params.get("tone", "professional")
    result = draft_email(event_name, tone)
    if result:
        return result
    return {"subject": f"Your Certificate - {event_name}",
            "body": f"Dear {{name}},\n\nPlease find attached your certificate for {event_name}.\n\nBest regards"}


# ---------------------------------------------------------------------------
# LLM Settings & Provider Endpoints
# ---------------------------------------------------------------------------

class LlmSettingsPayload(BaseModel):
    base_url: str
    api_key: str
    model: str
    persist: bool = True


@app.get("/api/metrics")
async def get_metrics_endpoint():
    """Return live aggregate statistics across all jobs."""
    from core.metrics import get_global_metrics
    active_jobs = sum(1 for e in _send_events.values() if not e.is_set())
    return get_global_metrics(active_jobs_count=active_jobs)


@app.get("/api/settings/llm")
async def get_llm_settings_endpoint():
    """Get the current LLM status and active provider."""
    from core.llm import get_llm_status
    return get_llm_status()


@app.post("/api/settings/llm")
async def save_llm_settings_endpoint(payload: LlmSettingsPayload):
    """Save LLM configuration (base_url, api_key, model) dynamically."""
    from core.llm import set_llm_config
    updated = set_llm_config(
        base_url=payload.base_url,
        api_key=payload.api_key,
        model=payload.model,
        persist_env=payload.persist,
    )
    return {"ok": True, "settings": updated}


@app.post("/api/settings/llm/test")
async def test_llm_settings_endpoint(payload: dict):
    """Test LLM credentials and connection."""
    from core.llm import test_llm_connection
    base_url = payload.get("base_url")
    api_key = payload.get("api_key")
    model = payload.get("model")
    res = test_llm_connection(base_url=base_url, api_key=api_key, model=model)
    return res


# ---------------------------------------------------------------------------
# Startup / shutdown
# ---------------------------------------------------------------------------

@app.on_event("startup")
async def startup():
    """Recovery on startup: handle jobs that were sending when server crashed."""
    for job_id in store.list_jobs():
        try:
            job_data = store.load(job_id)
            if job_data.get("status") == "sending":
                recipients = [Recipient(**r) for r in job_data.get("recipients", [])]
                recover_send_state(job_id, store, recipients)
                job_data["recipients"] = [r.model_dump() for r in recipients]
                job_data["status"] = "paused"
                store.save(job_id, job_data)
                logger.info("Recovered job %s from crash (now paused)", job_id)
        except Exception as e:
            logger.error("Failed to recover job %s: %s", job_id, e)


@app.on_event("shutdown")
async def shutdown():
    """Clean shutdown."""
    # Signal all senders to stop
    for event in _send_events.values():
        event.set()

