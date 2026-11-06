"""
CertClerk: Core data models.

All Pydantic models and dataclasses used across the system.
"""

from __future__ import annotations

import enum
from dataclasses import dataclass, field
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict


# ---------------------------------------------------------------------------
# PDF Engine models (dataclasses for performance in hot paths)
# ---------------------------------------------------------------------------

@dataclass
class PlaceholderSpec:
    """Describes the placeholder text found in a certificate template."""
    text: str
    bbox: tuple[float, float, float, float]
    origin: tuple[float, float]          # baseline start (x, y)
    size: float
    color: tuple[float, float, float]    # RGB 0-1
    max_width: float
    other_rects: list[tuple[float, float, float, float]] = field(default_factory=list)


@dataclass
class FitReport:
    """Result of fitting a name into the placeholder area."""
    ok: bool
    final_size: float
    scale: float                         # final_size / original size
    lines: int
    missing_glyphs: list[str]
    overlaps_content: bool
    used_fallback_font: bool
    notes: list[str]


# ---------------------------------------------------------------------------
# Agent Execution & Trace Models (Interpretability & Auditability)
# ---------------------------------------------------------------------------

class TraceStep(BaseModel):
    """A single discrete step executed by the agent pipeline."""
    step_num: int
    tool: str
    action: str
    input_summary: str
    output_summary: str
    verdict: Literal["success", "warning", "rejected", "info"] = "info"
    details: dict[str, Any] = {}


class AgentExecutionTrace(BaseModel):
    """Full inspectable trace of an agent's reasoning and tool calls for a recipient."""
    raw_input: str
    candidate_output: str
    invariant_passed: bool
    verdict_summary: str
    steps: list[TraceStep] = []
    latency_ms: float = 0.0


# ---------------------------------------------------------------------------
# Recipient model (Pydantic for validation + serialization)
# ---------------------------------------------------------------------------

class RecipientStatus(str, enum.Enum):
    PENDING   = "pending"
    READY     = "ready"
    GENERATED = "generated"
    QUEUED    = "queued"
    SENDING   = "sending"
    SENT      = "sent"
    FAILED    = "failed"
    SKIPPED   = "skipped"
    UNKNOWN   = "unknown"


class Recipient(BaseModel):
    """One row from the attendee list."""
    model_config = ConfigDict(use_enum_values=True)

    row_id: int                          # original row number in the file
    raw_name: str
    clean_name: str = ""
    name_changed: bool = False
    email: str | None = None
    email_status: Literal["ok", "fixable", "invalid", "missing"] = "missing"
    email_suggestion: str | None = None
    flags: list[str] = []
    status: str = RecipientStatus.PENDING
    fit: FitReport | None = None
    trace: AgentExecutionTrace | None = None
    error: str | None = None


# ---------------------------------------------------------------------------
# Job model
# ---------------------------------------------------------------------------

class JobStatus(str, enum.Enum):
    CREATED    = "created"
    ANALYZED   = "analyzed"
    MAPPED     = "mapped"
    GENERATING = "generating"
    GENERATED  = "generated"
    APPROVED   = "approved"
    SENDING    = "sending"
    PAUSED     = "paused"
    DONE       = "done"
    FAILED     = "failed"


# Valid state transitions
VALID_TRANSITIONS: dict[str, set[str]] = {
    JobStatus.CREATED:    {JobStatus.ANALYZED, JobStatus.FAILED},
    JobStatus.ANALYZED:   {JobStatus.MAPPED, JobStatus.FAILED},
    JobStatus.MAPPED:     {JobStatus.GENERATING, JobStatus.MAPPED, JobStatus.FAILED},
    JobStatus.GENERATING: {JobStatus.GENERATED, JobStatus.FAILED},
    JobStatus.GENERATED:  {JobStatus.APPROVED, JobStatus.GENERATING, JobStatus.GENERATED, JobStatus.FAILED},
    JobStatus.APPROVED:   {JobStatus.SENDING, JobStatus.GENERATED, JobStatus.FAILED},
    JobStatus.SENDING:    {JobStatus.PAUSED, JobStatus.DONE, JobStatus.FAILED},
    JobStatus.PAUSED:     {JobStatus.SENDING, JobStatus.FAILED},
    JobStatus.DONE:       set(),
    JobStatus.FAILED:     {JobStatus.ANALYZED, JobStatus.MAPPED, JobStatus.GENERATING, JobStatus.SENDING},
}


class Job(BaseModel):
    """Full state of a certificate generation job."""
    model_config = ConfigDict(use_enum_values=True)

    job_id: str
    user_id: str = "local_organizer"
    org_id: str = "local_device"
    status: str = JobStatus.CREATED
    placeholder: str = "AGENT"
    headers: list[str] = []
    name_column: str | None = None
    email_column: str | None = None
    recipients: list[Recipient] = []
    subject: str = ""
    body: str = ""
    template_sha: str = ""
    font_sha: str = ""
    approved_hash: str | None = None
    progress: int = 0
    total: int = 0
    error: str | None = None
    demo_mode: bool = False
    created_at: str = ""
    updated_at: str = ""


# ---------------------------------------------------------------------------
# LLM output schemas (strict, extra="forbid")
# ---------------------------------------------------------------------------

class ColumnMapping(BaseModel):
    """LLM output: which columns are name and email."""
    model_config = ConfigDict(extra="forbid")

    name: str
    email: str | None = None


class NameFix(BaseModel):
    """A single name fix suggestion from the LLM."""
    row_id: int
    clean: str


class NameFixBatch(BaseModel):
    """Batch of name fix suggestions."""
    fixes: list[NameFix]


class FitAction(BaseModel):
    """LLM choice for handling a name that doesn't fit."""
    action: Literal["shrink_more", "two_lines", "fallback_font", "flag_human"]


# ---------------------------------------------------------------------------
# API request/response models
# ---------------------------------------------------------------------------

class SmtpConfig(BaseModel):
    """SMTP credentials (never persisted to disk)."""
    host: str
    port: int
    user: str
    password: str
    sender: str


class EmailTemplate(BaseModel):
    """Email template with variable placeholders."""
    subject: str
    body: str


class ErrorResponse(BaseModel):
    """Standard error response."""
    code: str
    message: str


class JobSummary(BaseModel):
    """Summary returned when listing or creating a job."""
    job_id: str
    status: str
    total: int = 0
    progress: int = 0

