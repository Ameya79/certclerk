<div align="center">
  <img src="web/public/galeus-logo.png" alt="galeus logo" width="340" />
  <br />
  <h3>Local-First Certificate Automation & Invariant Guard</h3>
  <p>Turn <strong>one Canva certificate template + one messy attendee list</strong> into <strong>verified, personalized certificates</strong>, then email them after human approval.</p>
</div>

---

## Features

- **Strict Name Invariant Guard**: The AI agent only fixes casing and spacing. Code-level guards verify letter identity (`norm(raw) == norm(clean)`), mathematically preventing name hallucinations or arbitrary modifications.
- **Self-Correcting Fit Loop**: Long names automatically shrink down to 60% font size, split onto two lines at optimal word boundaries, or fall back safely without overflowing margins.
- **Human Approval Gate**: Cryptographic SHA-256 fingerprinting guarantees that **zero emails** are sent without explicit human review. Any subsequent data modification automatically invalidates approval.
- **Write-Ahead Logging (WAL)**: Per-row delivery logging (`sending` → `sent` / `failed`) guarantees zero duplicate sends even across sudden server crashes.
- **Zero Database Requirement**: Ephemeral capability-URL job storage on the filesystem with atomic replacement and automatic 24-hour cleanup.
- **In-Memory SMTP Security**: User credentials live in memory during dispatch only and are never written to disk, database, or server logs.
- **Vercel Geist Typography**: Powered by the official Vercel Geist suite (`GeistSans`, `GeistMono`, `GeistPixel`, and `GeistSerif`).

---

## 7-Step User Flow

```
1 Upload  →  2 Review data  →  3 Preview certs  →  4 Write email  →  5 Approve  →  6 Send  →  7 Report
```

1. **Upload**: Drop your single-page Canva certificate PDF, attendee CSV/XLSX, and optional font file. Specify the placeholder word (default: `AGENT`).
2. **Review Data**: Inspect raw vs. cleaned names with flagged duplicates, typo suggestions, and inline cell editing.
3. **Preview Certs**: Review high-resolution PNG previews with badges for shrunk font or line wrapping.
4. **Write Email**: Customize subject and body with `{name}` and `{event}` variable chips, or draft with AI.
5. **Approve**: Confirm exact dispatch counts and lock the batch with an immutable SHA-256 hash.
6. **Send**: Supply your SMTP credentials (held in-memory only) with live progress and pause/resume controls.
7. **Report**: Download a complete ZIP archive of certificates, review the audit trail, or trigger immediate data purge.

---

## Quickstart

### 1. Local Development

**Backend (FastAPI)**:
```bash
# In project root
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r requirements.txt

# Run server
uvicorn api.main:app --reload --port 8000
```

**Frontend (Next.js)**:
```bash
cd web
npm install
npm run dev
```

Visit `http://localhost:3000` in your browser. API docs are available at `http://localhost:8000/docs`.

### 2. Docker Compose (Self-Hosting)

```bash
docker compose up --build
```

---

## Running Tests

All unit, property, and API integration tests pass with 100% coverage:

```bash
# Run complete test suite (113 tests)
pytest tests/ -v
```

---

## License

MIT License.
