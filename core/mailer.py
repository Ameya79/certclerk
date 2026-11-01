"""
CertClerk — Mailer.

Safe email sending with write-ahead logging, throttling,
header-injection protection, and crash recovery.

Credentials are held in memory only — never written to disk or logs.
"""

from __future__ import annotations

import logging
import smtplib
import ssl
import time
from email.message import EmailMessage
from email.utils import formatdate, make_msgid
from threading import Event
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from core.models import SmtpConfig
    from core.store import JobStore

logger = logging.getLogger(__name__)


class MailerError(Exception):
    """Raised on mailer configuration or sending errors."""
    pass


def _reject_header_injection(value: str, field: str) -> None:
    """Reject values containing newlines (header injection attempt)."""
    if "\r" in value or "\n" in value:
        raise MailerError(
            f"Header injection attempt detected in {field}: "
            "newline characters are not allowed."
        )


def build_message(
    sender: str,
    to: str,
    subject: str,
    body: str,
    pdf_bytes: bytes,
    filename: str,
) -> EmailMessage:
    """
    Build a MIME email message with a PDF attachment.

    Rejects header-injection attempts in all header fields.
    """
    _reject_header_injection(sender, "From")
    _reject_header_injection(to, "To")
    _reject_header_injection(subject, "Subject")

    msg = EmailMessage()
    msg["From"] = sender
    msg["To"] = to
    msg["Subject"] = subject
    msg["Date"] = formatdate(localtime=True)
    msg["Message-ID"] = make_msgid()
    msg.set_content(body)
    msg.add_attachment(
        pdf_bytes,
        maintype="application",
        subtype="pdf",
        filename=filename,
    )
    return msg


def connect(host: str, port: int, user: str, password: str) -> smtplib.SMTP:
    """
    Connect to an SMTP server with encryption.

    Port 465 → SMTP_SSL; port 587 → STARTTLS. Refuses unencrypted.
    """
    ctx = ssl.create_default_context()

    if port == 465:
        smtp = smtplib.SMTP_SSL(host, port, context=ctx, timeout=30)
    elif port in (587, 25):
        smtp = smtplib.SMTP(host, port, timeout=30)
        smtp.starttls(context=ctx)
    else:
        smtp = smtplib.SMTP(host, port, timeout=30)
        smtp.starttls(context=ctx)

    smtp.login(user, password)
    return smtp


def render_template(template: str, name: str, event: str = "") -> str:
    """Render an email template with variable substitution."""
    result = template.replace("{name}", name).replace("{event}", event)
    return result


def send_all(
    job_id: str,
    store: "JobStore",
    recipients: list,
    smtp_config: "SmtpConfig",
    stop_event: Event,
    delay: float = 1.5,
    subject_template: str = "",
    body_template: str = "",
    event_name: str = "",
    cert_reader=None,
) -> dict[str, int]:
    """
    Send certificates to all recipients.

    Uses write-ahead logging: before each send, write "sending" to the
    send log; after, write "sent" or "failed". On crash recovery, rows
    with "sending" but no terminal entry become "unknown".

    Returns a summary dict: {sent, failed, unknown, skipped}.
    """
    counts = {"sent": 0, "failed": 0, "unknown": 0, "skipped": 0}

    smtp = None
    try:
        smtp = connect(
            smtp_config.host,
            smtp_config.port,
            smtp_config.user,
            smtp_config.password,
        )
    except Exception as e:
        # Log the host but NEVER the password
        logger.error("SMTP connection failed to %s:%d: %s",
                     smtp_config.host, smtp_config.port, e)
        raise MailerError(f"Could not connect to SMTP server: {e}")

    try:
        for r in recipients:
            # Check for pause
            if stop_event.is_set():
                store.append(job_id, "send_log.jsonl", {
                    "event": "paused",
                    "ts": time.time(),
                })
                break

            # Skip rows without email or already sent
            if not r.email or r.status in ("sent", "skipped"):
                counts["skipped"] += 1
                continue

            # Write-ahead: mark as "sending"
            store.append(job_id, "send_log.jsonl", {
                "row": r.row_id,
                "state": "sending",
                "ts": time.time(),
            })

            try:
                # Render email
                subject = render_template(subject_template, r.clean_name, event_name)
                body = render_template(body_template, r.clean_name, event_name)

                # Reject newlines in rendered subject
                _reject_header_injection(subject, "rendered Subject")

                # Read certificate
                cert_bytes = b""
                if cert_reader:
                    cert_bytes = cert_reader(r.row_id)

                # Build and send
                msg = build_message(
                    sender=smtp_config.sender,
                    to=r.email,
                    subject=subject,
                    body=body,
                    pdf_bytes=cert_bytes,
                    filename=f"certificate_{r.row_id}.pdf",
                )

                smtp.send_message(msg)

                # Success
                store.append(job_id, "send_log.jsonl", {
                    "row": r.row_id,
                    "state": "sent",
                    "ts": time.time(),
                })
                r.status = "sent"
                counts["sent"] += 1

            except smtplib.SMTPServerDisconnected:
                # Connection lost — row status is unknown
                store.append(job_id, "send_log.jsonl", {
                    "row": r.row_id,
                    "state": "unknown",
                    "ts": time.time(),
                })
                r.status = "unknown"
                counts["unknown"] += 1

                # Try to reconnect for remaining rows
                try:
                    smtp = connect(
                        smtp_config.host,
                        smtp_config.port,
                        smtp_config.user,
                        smtp_config.password,
                    )
                except Exception:
                    logger.error("SMTP reconnect failed; aborting send")
                    break

            except smtplib.SMTPRecipientsRefused:
                store.append(job_id, "send_log.jsonl", {
                    "row": r.row_id,
                    "state": "failed",
                    "error": "recipient refused",
                    "ts": time.time(),
                })
                r.status = "failed"
                r.error = "recipient refused"
                counts["failed"] += 1

            except smtplib.SMTPResponseException as e:
                is_retryable = 400 <= e.smtp_code < 500
                state = "failed"
                store.append(job_id, "send_log.jsonl", {
                    "row": r.row_id,
                    "state": state,
                    "error": f"SMTP {e.smtp_code}",
                    "retryable": is_retryable,
                    "ts": time.time(),
                })
                r.status = "failed"
                r.error = f"SMTP error {e.smtp_code}"
                counts["failed"] += 1

                # If rate limited, stop sending
                if e.smtp_code in (421, 450, 452):
                    logger.warning("SMTP rate limit hit (%d); pausing", e.smtp_code)
                    stop_event.set()
                    break

            except Exception as e:
                store.append(job_id, "send_log.jsonl", {
                    "row": r.row_id,
                    "state": "failed",
                    "error": str(e),
                    "ts": time.time(),
                })
                r.status = "failed"
                r.error = str(e)
                counts["failed"] += 1

            time.sleep(delay)

    finally:
        if smtp:
            try:
                smtp.quit()
            except Exception:
                pass

    return counts


def recover_send_state(
    job_id: str,
    store: "JobStore",
    recipients: list,
) -> None:
    """
    Recover send state after a crash.

    Rows whose last entry in send_log.jsonl is "sending" (no terminal
    entry) become "unknown". The system NEVER auto-resends them.
    """
    import json

    log_path = store._log_path(job_id, "send_log.jsonl")
    if not log_path or not log_path.exists():
        return

    # Build last-known state per row from the log
    last_state: dict[int, str] = {}
    try:
        with open(log_path) as f:
            for line in f:
                line = line.strip()
                if not line:
                    continue
                entry = json.loads(line)
                if "row" in entry:
                    last_state[entry["row"]] = entry["state"]
    except Exception:
        return

    # Update recipients
    for r in recipients:
        if r.row_id in last_state:
            state = last_state[r.row_id]
            if state == "sending":
                r.status = "unknown"
                r.error = (
                    "Server crashed during send. Check your Sent folder, "
                    "then mark as sent or retry."
                )
            elif state in ("sent", "failed", "unknown"):
                r.status = state

