# CertAgent: Product Requirements Document (PRD)

| | |
|---|---|
| **Status** | Draft v1 |
| **Scope** | Web platform, v1.0 (no database, no QR verification) |
| **Owner** | You |
| **Last updated** | 2026-11-01 |

> Numbers marked **(target)** are goals to validate, not claims. Replace them with measured values as you go.

---

## 1. Summary

CertAgent turns **one Canva certificate design + one messy attendee list** into **verified, personalized certificates**, then emails them after a human approves. An AI agent handles the messy parts (which column is the name, fixing casing, bad emails, names that don't fit), checks its own output, and logs every decision.

**One-line pitch:** *Upload a Canva PDF and a messy attendee sheet. Review. Approve. Every attendee gets their certificate.*

## 2. Problem

Anyone who runs a workshop, hackathon, or club event has to hand out certificates. Today they either:

1. Edit the name in Canva by hand, one certificate at a time, then email each one manually (hours of work, mistakes, wrong spellings), or
2. Use Canva's bulk-create or a paid certificate service, which may cost money, require rigid data formats, and don't help when the attendee list is messy.

Real attendee lists are never clean: `rahul SHARMA`, `  amit  `, `Dr. priya iyer`, headers like `Full Name` / `E-mail ID`, duplicate rows, `rahul@gmial.com`. Organizers fix these by hand, and the mistakes show up on the certificates.

> **Validation task (do this before building):** interview 5 organizers. Ask: how many certificates did you make last time, how long did it take, what went wrong, what did you use? Save the notes in `docs/research/`. Edit this section with real quotes.

## 3. Users

| Persona | Needs | Constraints |
|---|---|---|
| **Aarav, club coordinator** (primary) | 150-400 certificates after each event, quickly, with no spelling errors | Non-technical, uses Canva and Gmail, has little time |
| **Meera, faculty / HR lead** | Same, but cares that student data stays private | Won't paste attendee data into unknown tools |
| **Dev, open-source self-hoster** | Run it on his own machine or server, free | Comfortable with Docker, wants to inspect the code |

## 4. Goals and non-goals

### Goals (v1)
- G1. First preview certificate in under 3 minutes from landing on the site **(target)**.
- G2. Handle realistically messy attendee data without damaging correct names.
- G3. Never send an email that a human did not approve, and never send the same email twice.
- G4. Free to self-host, with a hosted demo that cannot be abused for spam.
- G5. Produce measurable, reproducible quality numbers (see `TESTING.md`).

### Non-goals (v1)
- No database or user accounts (a job is a temporary workspace with an unguessable URL).
- No QR codes or verification pages.
- No multi-page templates, no multiple placeholders (only one: the name).
- No template editor (design stays in Canva).
- No bounce handling, WhatsApp, or LinkedIn integrations.
- No payments.

## 5. User flow

```
1 Upload  →  2 Review data  →  3 Preview certs  →  4 Write email  →  5 Approve  →  6 Send  →  7 Report
```

1. **Upload**: template PDF, attendee CSV/XLSX, optional font file; the placeholder word (default `AGENT`).
2. **Review data**: agent's proposed column mapping and cleaned names shown as a table (original → cleaned), with flagged rows pinned to the top. User can edit any cell, un-skip, or skip a row.
3. **Preview**: thumbnail grid of rendered certificates, with warning badges (shrunk font, two lines, missing glyphs). Click for full size.
4. **Email**: subject/body with `{name}` and `{event}` variables. Optional "draft with AI" button.
5. **Approve**: summary ("212 will be emailed, 3 skipped, 2 need review"), one explicit confirm button.
6. **Send**: user enters SMTP credentials (kept in memory only). Live progress, pause, per-row retry.
7. **Report**: counts, downloadable ZIP of certificates, downloadable audit log.

## 6. Functional requirements

Priority: **P0** = must ship, **P1** = ship if time allows.

| ID | Requirement | Acceptance criteria | Pri |
|---|---|---|---|
| FR-1 | Upload template PDF | Single page, ≤ 5 MB. Placeholder found exactly once. 0 hits → clear error ("export as PDF, not image; text must be selectable"). >1 hits → user picks. | P0 |
| FR-2 | Upload attendee file | CSV or XLSX, ≤ 2 MB, ≤ 2,000 rows. Encoding and delimiter auto-detected. Header row auto-detected. | P0 |
| FR-3 | Optional font upload | `.ttf`/`.otf` ≤ 5 MB. Without it, fallback font + visible warning. | P0 |
| FR-4 | Column mapping | Agent proposes `name` (+ optional `email`); user can override via dropdown. Proposal must reference real headers. | P0 |
| FR-5 | Name cleaning | Each row shows original and cleaned. Unsafe changes (see TRD §7.3) are rejected automatically. User can edit any value. | P0 |
| FR-6 | Email validation | Syntax check, typo suggestions (`gmial.com`), duplicates flagged, optional MX check. Invalid rows cannot be sent until fixed or skipped. | P0 |
| FR-7 | Certificate generation | One PDF per non-skipped row. Fit loop (shrink → two lines → fallback → flag). Each certificate gets a FitReport. | P0 |
| FR-8 | Preview | PNG thumbnails ≤ 500 ms each; full-size view; filter by "has warnings". | P0 |
| FR-9 | Email template | Variables `{name}`, `{event}`. Preview with a sample row. Optional AI draft. | P0 |
| FR-10 | Approval gate | Send is impossible unless the current batch exactly matches what the user approved. Any edit after approval invalidates it. | P0 |
| FR-11 | Sending | User-supplied SMTP. Throttled. Pause/resume. Per-row status. Never sends the same row twice, even after a crash. | P0 |
| FR-12 | Report and export | ZIP of certificates, audit log (JSON lines), summary counts. Cells starting with `= + - @` are neutralized in any CSV export. | P0 |
| FR-13 | Data deletion | Automatic deletion 24 hours after last activity, plus a "delete my data now" button. | P0 |
| FR-14 | Demo mode | Hosted instance: dry-run only, or sends only to one address the user types and confirms. Hard caps per IP/day. | P0 |
| FR-15 | No-LLM fallback | If the LLM is unavailable or unconfigured, the app still works using rules (title-casing with exceptions, regex validators) and says so. | P1 |
| FR-16 | Local LLM support | Works with any OpenAI-compatible endpoint, including a local Ollama. | P1 |

## 7. Non-functional requirements

| Area | Requirement **(target)** |
|---|---|
| Performance | Generate 500 certificates in ≤ 3 min on a 2-core machine. Preview PNG ≤ 500 ms. Analysis of 500 rows ≤ 30 s. |
| Responsiveness | `/healthz` p95 ≤ 200 ms **while** a 500-certificate job is running. |
| Reliability | `kill -9` during a send, then restart: zero duplicates, zero silently lost rows. |
| Security | See TRD §10. Credentials never written to disk or logs. |
| Privacy | No attendee data stored beyond the retention window. Names sent to an LLM provider only if configured; UI discloses this. |
| Accessibility | Keyboard-navigable flow, readable contrast, status not conveyed by color alone. |
| Compatibility | Latest Chrome, Firefox, Safari; mobile view usable for review (not required for upload). |

## 8. Success metrics

| Metric | How measured | Target |
|---|---|---|
| Time to first preview | Timestamp from upload to first preview render | ≤ 3 min |
| Name damage rate | `evals/` on correct tricky names (McDonald, D'Souza, A. P. J. Kumar) | ≤ 1% |
| Name fix rate | `evals/` on corrupted names | ≥ 95% |
| Fit success | `evals/` on 100 names of length 5-70 | ≥ 98% fit cleanly or are flagged (never silently overflow) |
| Duplicate sends | Chaos tests | 0 |
| Real-world usage | Count of events and certificates from real clubs | Report honestly |
| Time saved | Interview baseline minus measured run time | Report honestly |

## 9. Risks and mitigations

| Risk | Mitigation |
|---|---|
| Canva exports flatten text, so the placeholder can't be found | Detect early, show an actionable error, document export settings |
| Canva's custom fonts aren't available, so output looks different | Font upload + fallback with a warning + preview before sending |
| LLM changes a name incorrectly | Invariant check in code, rules-first filtering, human review table |
| Hosted demo abused as a spam relay | Dry-run only, per-IP caps, no stored credentials |
| Sender's Gmail account gets rate-limited or flagged | Throttle, daily-limit warning, resume support |
| Free LLM tier rate limits | Batching, caching, rules prefilter, local model option |
| Attendee privacy | Retention limit, local-LLM option, clear disclosure |

## 10. Milestones

| Milestone | Outcome |
|---|---|
| M1 | PDF engine + ingestion + validators pass unit tests |
| M2 | Agent layer with guards; first eval table |
| M3 | API with job pipeline, approval gate, mailer tested against a fake SMTP server |
| M4 | Web UI end to end on localhost |
| M5 | Break-it rounds 1-3 complete, bugs fixed, perf targets met |
| M6 | Docker image, hosted demo, README with eval tables, 3 real events run |

## 11. Open questions

1. Is the placeholder always a separate text span in Canva exports? (Test with 5 real designs.)
2. Which free LLM tier is reliable enough for batch name cleaning? (Benchmark in M2.)
3. Which hosting option should run the backend demo? (Decide in M6; free tiers change.)
