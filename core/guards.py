"""
CertClerk — Guards.

Code-enforced invariants: name change validation, approval hash,
CSV sanitization, and the "needs review" prefilter.

These are the guardrails the LLM cannot bypass.
"""

from __future__ import annotations

import hashlib
import json
import re
import unicodedata


def norm(s: str) -> str:
    """
    Normalize a string for letter-only comparison.

    Strips whitespace, punctuation (. - ' '), and casefolds.
    Used to verify the LLM hasn't added, removed, or changed letters.
    """
    s = unicodedata.normalize("NFKC", s).casefold()
    return re.sub(r"[\s.\-'']+", "", s)


def has_control(s: str) -> bool:
    """Check if a string contains control characters."""
    return any(unicodedata.category(c) == "Cc" for c in s)


def change_allowed(raw: str, clean: str) -> bool:
    """
    The key name-change invariant.

    A cleaned name is only accepted if:
    1. It has 1-120 characters
    2. It contains no control characters
    3. It has exactly the same letters as the raw name (ignoring case,
       spacing, and punctuation)

    This prevents the LLM from hallucinating extra names, expanding
    abbreviations, or making any other letter-changing modification.
    """
    clean_stripped = clean.strip()
    if not (1 <= len(clean_stripped) <= 120):
        return False
    if has_control(clean_stripped):
        return False
    return norm(raw) == norm(clean_stripped)


def needs_review(name: str) -> bool:
    """
    Determine if a name needs LLM review.

    Names that already look properly formatted are never sent to the LLM.
    This cuts cost, latency, and damage risk.

    A name needs review if:
    - It has leading/trailing/multiple spaces
    - It's all uppercase or all lowercase
    - Any individual word has improper casing (e.g. mixed casing across words)
    - It contains characters outside letters, space, . - ' '
    """
    if name != name.strip():
        return True
    if "  " in name:
        return True
    if name.isupper() or name.islower():
        return True
    # Allow letters (any script), spaces, dots, hyphens, apostrophes
    if any(
        not (c.isalpha() or c in " .-''")
        for c in name
    ):
        return True

    # Word-level casing check: catch mixed cases like "rahul SHARMA"
    particles = {"de", "del", "la", "las", "le", "les", "von", "van", "der", "den", "di", "da", "dos", "das", "el", "al"}
    words = name.split()
    for w in words:
        subwords = re.findall(r"[A-Za-z]+", w)
        for sw in subwords:
            if len(sw) >= 2:
                if sw.lower() in particles or sw.lower() in {"ii", "iii", "iv", "v"}:
                    continue
                if sw.isupper() or sw.islower():
                    return True

    return False


def batch_hash(
    recipients: list,
    template_sha: str,
    font_sha: str,
    subject: str,
    body: str,
) -> str:
    """
    Compute a SHA-256 hash of the entire batch for approval.

    Any change to names, emails, skip status, template, font, or
    email template invalidates the approval.
    """
    payload = {
        "rows": [
            [r.row_id, r.clean_name, r.email, r.status == "skipped"]
            for r in recipients
        ],
        "template_sha": template_sha,
        "font_sha": font_sha,
        "subject": subject,
        "body": body,
    }
    return hashlib.sha256(
        json.dumps(payload, sort_keys=True).encode()
    ).hexdigest()


def sanitize_csv_cell(value: str) -> str:
    """
    Prevent CSV formula injection.

    Cells starting with = + - @ \\t \\r are prefixed with a single quote.
    """
    if value and value[0] in "=+-@\t\r":
        return "'" + value
    return value


def validate_job_id(job_id: str) -> bool:
    """Validate a job ID against the safe pattern."""
    return bool(re.match(r"^[A-Za-z0-9_-]{16,32}$", job_id))

