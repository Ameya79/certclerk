"""
CertClerk — Validators.

Pure functions for email validation, domain typo detection,
MX lookups, and rules-based name cleaning.
"""

from __future__ import annotations

import re
import unicodedata

import dns.resolver

# ---------------------------------------------------------------------------
# Email validation
# ---------------------------------------------------------------------------

EMAIL_RE = re.compile(
    r"^[A-Za-z0-9._%+\-']{1,64}@[A-Za-z0-9\-]+(\.[A-Za-z0-9\-]+)*\.[A-Za-z]{2,}$"
)

DOMAIN_TYPOS: dict[str, str] = {
    "gmial.com": "gmail.com",
    "gmai.com": "gmail.com",
    "gamil.com": "gmail.com",
    "gmail.co": "gmail.com",
    "gmil.com": "gmail.com",
    "gmal.com": "gmail.com",
    "gnail.com": "gmail.com",
    "yaho.com": "yahoo.com",
    "yahooo.com": "yahoo.com",
    "yhaoo.com": "yahoo.com",
    "hotmial.com": "hotmail.com",
    "hotmai.com": "hotmail.com",
    "hotmal.com": "hotmail.com",
    "outlok.com": "outlook.com",
    "outloo.com": "outlook.com",
    "outlool.com": "outlook.com",
    "protonmai.com": "protonmail.com",
}


def check_email(raw: str) -> tuple[str, str | None]:
    """
    Validate an email address.

    Returns (status, suggestion) where:
    - status: "ok", "fixable", "invalid", "missing"
    - suggestion: corrected email if status is "fixable", else None
    """
    e = raw.strip().lower()

    if not e:
        return ("missing", None)

    # Reject whitespace, control chars, double dots
    if any(c in e for c in "\r\n\t "):
        return ("invalid", None)
    if ".." in e:
        return ("invalid", None)

    if not EMAIL_RE.match(e):
        return ("invalid", None)

    # Check domain typos
    local, _, domain = e.partition("@")
    if domain in DOMAIN_TYPOS:
        suggested = f"{local}@{DOMAIN_TYPOS[domain]}"
        return ("fixable", suggested)

    return ("ok", None)


def mx_status(domain: str, timeout: float = 2.0) -> str:
    """
    Check if a domain has MX records.

    Returns "ok", "invalid", or "unknown".
    A timeout is "unknown", NOT "invalid".
    """
    resolver = dns.resolver.Resolver()
    resolver.lifetime = timeout
    try:
        resolver.resolve(domain, "MX")
        return "ok"
    except dns.resolver.NXDOMAIN:
        return "invalid"
    except dns.resolver.NoAnswer:
        return "invalid"
    except Exception:
        return "unknown"


# ---------------------------------------------------------------------------
# Rules-based name cleaning
# ---------------------------------------------------------------------------

# Prefixes that get special capitalization
_MC_PREFIX = re.compile(r"^(mc)(.)", re.IGNORECASE)
_O_PREFIX = re.compile(r"^(o[''])(.)", re.IGNORECASE)
_D_PREFIX = re.compile(r"^(d[''])(.)", re.IGNORECASE)

# Words that stay lowercase (unless first word)
_LOWERCASE_WORDS = {"de", "del", "la", "las", "le", "les", "von", "van", "der", "den", "di", "da", "dos", "das", "el", "al"}

# Titles/suffixes that keep their form
_TITLES = {"dr", "mr", "mrs", "ms", "prof", "jr", "sr", "ii", "iii", "iv", "v"}


def rules_clean(name: str) -> str:
    """
    Clean a name using deterministic rules only (no LLM).

    Handles: title case with exceptions for prefixes (Mc, O', D'),
    lowercase particles (de, van, etc.), and initials.
    """
    # Normalize whitespace
    name = " ".join(name.split())
    if not name:
        return name

    words = name.split()
    result: list[str] = []

    for i, word in enumerate(words):
        # Handle lowercase particles (not as first word)
        if i > 0 and word.lower() in _LOWERCASE_WORDS:
            result.append(word.lower())
            continue

        # Handle titles and suffixes
        word_lower = word.lower().rstrip(".")
        if word_lower in _TITLES:
            if word_lower in ("ii", "iii", "iv", "v"):
                result.append(word_lower.upper())
            else:
                result.append(word_lower.capitalize() + ".")
            continue

        # Handle initials (single letter e.g. 'A' or 'A.')
        if (len(word) == 1 and word.isalpha()) or (len(word) == 2 and word[0].isalpha() and word[1] == "."):
            result.append(word[0].upper() + ".")
            continue

        # Handle Mc prefix
        mc_match = _MC_PREFIX.match(word)
        if mc_match:
            rest = word[2:]
            result.append("Mc" + rest.capitalize())
            continue

        # Handle O' and D' prefixes
        for prefix_re, prefix_str in [(_O_PREFIX, "O'"), (_D_PREFIX, "D'")]:
            m = prefix_re.match(word)
            if m:
                rest = word[len(m.group(1)):]
                result.append(prefix_str + rest.capitalize())
                break
        else:
            # Handle hyphenated names
            if "-" in word:
                parts = word.split("-")
                result.append("-".join(p.capitalize() for p in parts))
            else:
                result.append(word.capitalize())

    return " ".join(result)


def find_duplicates(
    recipients: list,
    use_email: bool = True,
) -> dict[int, list[int]]:
    """
    Find duplicate recipients.

    If use_email is True and emails are present, duplicates are by email
    (case-insensitive). Otherwise by normalized name.

    Returns {row_id: [other_row_ids_that_are_duplicates]}.
    """
    from core.guards import norm

    groups: dict[str, list[int]] = {}
    for r in recipients:
        if use_email and r.email:
            key = r.email.strip().lower()
        else:
            key = norm(r.raw_name)
        groups.setdefault(key, []).append(r.row_id)

    duplicates: dict[int, list[int]] = {}
    for key, row_ids in groups.items():
        if len(row_ids) > 1:
            for rid in row_ids:
                duplicates[rid] = [x for x in row_ids if x != rid]

    return duplicates

