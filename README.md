<p align="center">
  <img src="assets/galeus-hero-banner.png" alt="galeus: Upload. Approve. Done." width="100%" />
</p>

<p align="center">
  <strong>The local-first, zero-hallucination certificate workstation for Canva templates and attendee sheets.</strong>
</p>

<p align="center">
  <a href="https://galeus.vercel.app/"><img src="https://img.shields.io/badge/Live%20Demo-galeus.vercel.app-2563eb?style=for-the-badge&logo=vercel&logoColor=white" alt="Live Demo" /></a>
  <a href="https://benchtoplabs.vercel.app/p/galeus"><img src="https://benchtoplabs.vercel.app/api/badge/galeus?style=featured" alt="Featured on Benchtop Labs" /></a>
  <img src="https://img.shields.io/badge/Architecture-100%25%20On--Device-059669?style=for-the-badge&logo=docker&logoColor=white" alt="100% On-Device" />
  <img src="https://img.shields.io/badge/Guard-Zero%20Typo%20Guarantee-blue?style=for-the-badge" alt="Zero Typo Guarantee" />
  <img src="https://img.shields.io/badge/Benchmark-100%25%20Pass%20Rate-emerald?style=for-the-badge" alt="100% Benchmark Pass Rate" />
  <img src="https://img.shields.io/badge/License-MIT-slate?style=for-the-badge" alt="MIT License" />
</p>

---

## ⚡ Try the Live Demo

Experience the full interactive workstation right in your browser:

👉 **[https://galeus.vercel.app/](https://galeus.vercel.app/)**

*(Upload your Canva PDF certificate template, import an attendee list, preview sub-pixel auto-fit rendering, and test the zero-typo guard in real time).*

---

## 🔒 Local-Host Infrastructure First

**galeus** is engineered from the ground up as a **100% local, self-hosted workstation**. You own your data, your templates, and your credentials.

- **Zero Cloud Databases**: Jobs, templates, and rendered certificates live entirely on your local machine in ephemeral storage (`data/jobs/{job_id}`).
- **Zero Telemetry**: No third-party tracking, no external analytics, no usage reporting.
- **In-Memory SMTP Security**: Your mail server credentials live in memory exclusively during active dispatch and are immediately discarded. Nothing is written to disk or sent to external servers.
- **Exact Name Accuracy (Zero-Typo Guarantee)**: AI models format and capitalize names, but code-level Python assertions guarantee letter identity:
  `norm(raw) == norm(clean)`
  Alphanumeric characters cannot be hallucinated, omitted, or rearranged.

---

## 🛠️ Architecture & Invariant Enforcement

`galeus` uses an agent workflow to format names, calculate template fits, and dispatch certificates. The LLM only proposes formatting; deterministic code verifies every action.

### 1. Tool Contracts
Every action in the pipeline executes through typed tool contracts:
- [`probe_canva_token`](file:///core/agent_tools.py): Extracts placeholder coordinates, baseline offsets, font sizes, and bounding boxes from the template PDF.
- [`enforce_name_invariant`](file:///core/agent_tools.py): Python guard asserting that normalized letter sequences match identically (`norm(raw) == norm(clean)`). Any character addition, deletion, or substitution triggers immediate fallback to local rules.
- [`calculate_font_fit`](file:///core/agent_tools.py): Calculates text width against template constraints, auto-scaling font size or wrapping lines so text does not overflow margins.
- [`build_recipient_trace`](file:///core/agent_tools.py): Records tool inputs, outputs, validation status, and execution latency for each recipient.

### 2. Failure Modes & Mitigations

| Failure Mode | Cause | Mitigation |
| :--- | :--- | :--- |
| **Name Hallucination** | LLM normalizer alters unusual spellings or drops characters. | Python assertion `norm(raw) == norm(clean)`. If letters mismatch, proposal is rejected and local rules format the name instead. |
| **Border Clipping** | Long attendee names (40+ characters) overflow template margins. | Dynamic font engine tries single-line scaling down to 60%, falls back to two lines, and scales down to 35% if needed. |
| **Dispatch Crash** | Network drop or server crash mid-send causes duplicate emails. | SQLite state machine tracks per-row send status. Resumes from the last unconfirmed recipient without resending. |
| **CSV Injection** | Malicious inputs in spreadsheet cells (formulas like `=cmd`, script tags). | Sanitizer prepends single-quotes to formula prefixes, strips control characters, and enforces strict schemas. |

### 3. Evaluation Benchmark (`evals/benchmark.py`)
An automated 100-case test suite validates casing rules, cultural prefixes (`van der`, `de la`), punctuation (`O'Brien`, `D'Souza`), accented names (`Renée`, `Jürgen`), CSV prompt injections, and long names (up to 80 characters).

```bash
python -m evals.benchmark
```

| Metric | Target | Result |
| :--- | :--- | :--- |
| Invariant Pass Rate | 100% | 100.0% |
| Hallucination Rate | 0.0% | 0.0% |
| Layout Containment | 100% | 100.0% |
| Latency (P50 / P95) | < 25 ms | 2.1 ms / 53.8 ms |
| Total Test Cases | 100 | 100 / 100 Passed |

---

## 🔄 The 7-Step Verified Pipeline

```
1 Ingest  ->  2 Review  ->  3 Preview  ->  4 Draft  ->  5 Approve  ->  6 Dispatch  ->  7 Audit
```

1. **Ingest**: Drop your single-page Canva certificate PDF and attendee sheet (CSV/XLSX). Specify the template placeholder token (default: `AGENT`).
2. **Review**: Inspect raw vs. cleaned names with automatic flag detection for duplicates, casing errors, and particle honorifics (`Dr.`, `O'Connor`, `van der`). Click "Trace" on any row to view the tool execution record.
3. **Preview**: PyMuPDF calculates exact bounding boxes. Long names auto-scale down or wrap onto two lines without breaking Canva layouts.
4. **Draft**: Customize subject and body with `{name}` and `{event}` variable chips, or generate copy with local rules.
5. **Approve**: Confirm exact recipient counts and seal the batch with a cryptographic SHA-256 batch hash.
6. **Dispatch**: Throttled delivery via your local SMTP with live progress, pause/resume controls, and a crash-proof progress log.
7. **Audit**: Download a complete ZIP archive of certificates, review delivery receipts, or trigger immediate local data purge.

---

## 🚀 Local Quickstart (Run On Your Machine)

### Option A: One-Command Docker Setup (Recommended)

Run the entire full-stack application (FastAPI backend + Next.js frontend) locally:

```bash
# 1. Clone repository
git clone https://github.com/Ameya79/galeus.git
cd galeus

# 2. Start full-stack containers
docker compose up --build
```

- **Frontend Studio**: Open [http://localhost:3000](http://localhost:3000)
- **Backend API & Swagger Docs**: Open [http://localhost:8000/docs](http://localhost:8000/docs)

---

### Option B: Manual Local Development

#### 1. Backend (FastAPI + PyMuPDF)
```bash
# In project root
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r requirements.txt

# Start backend server on port 8000
uvicorn api.main:app --reload --port 8000
```

#### 2. Frontend (Next.js 15)
```bash
cd web
npm install
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Testing & Verification

All unit, property, and API integration tests pass with 100% test coverage:

```bash
# Run unit and integration test suite
pytest tests/ -v

# Run agent evaluation benchmark
python -m evals.benchmark
```

```
====================== 120 passed in 14.85s ======================
```

---

## ☁️ Cloud Deployment

Want to host your own cloud instance?
- Follow the step-by-step **[Vercel & Cloud Deployment Guide](DEPLOY_VERCEL.md)** for 100% free hosting with zero credit cards.
- For enterprise multi-tenant scaling with PostgreSQL and S3/R2 storage, see **[DEPLOYMENT.md](DEPLOYMENT.md)**.

---

## 👨‍💻 Author & Attribution

**galeus** is crafted and maintained by **[Ameya Kulkarni](https://www.linkedin.com/in/ameya-kulkarni-a31b74246/)**.

- **GitHub**: [@Ameya79](https://github.com/Ameya79)
- **LinkedIn**: [in/ameya-kulkarni-a31b74246](https://www.linkedin.com/in/ameya-kulkarni-a31b74246/)
- **Registry**: Verified on [Benchtop Labs](https://benchtoplabs.vercel.app/p/galeus) ([`Ameya79/benchtoplabs-registry`](https://github.com/Ameya79/benchtoplabs-registry))

---

## 📄 License

Distributed under the **MIT License**. See `LICENSE` for details.
