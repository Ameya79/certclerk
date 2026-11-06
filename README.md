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

## 🤖 Agent Architecture & Evaluation Spec

`galeus` is designed as a deterministic agentic system where AI provides formatting proposals while strict code invariants guarantee safety, layout integrity, and zero character drift.

```
+-------------------------------------------------------------------------------+
|                       galeus Deterministic Agent Loop                         |
|                                                                               |
|  [Tabular Ingest]  -->  probe_canva_token()  -->  normalize_casing()          |
|                                                          |                    |
|  [ZIP / Dispatch]  <--  calculate_font_fit() <--  enforce_name_invariant()    |
|                               (Auto-Scale & Wrap)     (Code Assertion)        |
+-------------------------------------------------------------------------------+
```

### 1. Explicit Tool Contracts
Every action in the pipeline executes through typed, inspectable tool contracts:
- [`probe_canva_token`](file:///core/agent_tools.py): Probes Canva vector PDFs to extract baseline coordinates, bounding boxes, font sizes, and obstacle collisions.
- [`enforce_name_invariant`](file:///core/agent_tools.py): Mathematical guard asserting that normalized letter sequences match identically (`norm(raw) == norm(clean)`). Any hallucination triggers immediate self-correction or rules-based fallback.
- [`calculate_font_fit`](file:///core/agent_tools.py): Iteratively solves typography scaling and line-wrapping constraints to guarantee that text never overflows template borders.
- [`build_recipient_trace`](file:///core/agent_tools.py): Assembles an inspectable execution trace recording each tool call, parameter, verdict, and latency for human auditability.

### 2. Critical Failure Modes & Mitigations Matrix

| Failure Mode | Root Cause | Agent Mitigation |
| :--- | :--- | :--- |
| **Typo & Character Hallucination** | LLM normalizer subtly alters unusual names (e.g. changing `Jonathon` to `Jonathan` or dropping characters). | Deterministic Python guard: if `norm(raw) != norm(clean)`, the suggestion is automatically rejected and local rules format the name instead. |
| **Visual Border Clipping** | Long attendee names (50+ characters) overflow Canva certificate borders and collide with design elements. | Multi-tier self-correcting font engine: probes vector boundary, tries single-line shrink down to 60%, falls back to two lines, and dynamically shrinks down to 35% if extreme length persists. |
| **Mid-Batch Dispatch Crash** | System crash or network loss mid-batch causes duplicate sends or lost status tracking. | Transactional SQLite WAL state machine: atomic per-row status transitions (`pending` &rarr; `sending` &rarr; `sent` / `failed`). Resumes exactly from the last confirmed delivery without re-sending. |
| **Adversarial CSV Injection** | Malicious inputs in spreadsheet cells (formula prefixes `=cmd`, SQL strings, prompt injections). | Multi-layer input sanitization: prepends single-quotes to formula characters, rejects strings with control characters, and enforces strict Pydantic schemas. |

### 3. Automated Benchmark Harness (`evals/benchmark.py`)
To objectively evaluate reliability, `galeus` includes an automated 100-case adversarial evaluation suite spanning casing irregularities, cultural particles (`van der`, `de la`), punctuation/apostrophes (`D'Souza`, `O'Brien`), accented names (`Renée`, `Jürgen`), CSV prompt injections, and extreme lengths (up to 80 characters).

```bash
# Run the evaluation benchmark harness
python -m evals.benchmark
```

**Benchmark Results:**
```
==================================================================
       LEXSI LABS AGENT EVALUATION BENCHMARK SCORECARD            
==================================================================
 Total Adversarial Cases Evaluated : 100
 Invariant Pass Rate (Target 100%) : 100.0%
 Hallucination Rate (Target 0.0%)  : 0.0%
 Layout Containment Rate           : 100.0%
 Latency P50 / P95                 : 2.058 ms / 53.828 ms
------------------------------------------------------------------
 CATEGORY BREAKDOWN:
   Casing Irregularities          : 14/14 passed | 14/14 fit
   Cultural Particles             : 13/13 passed | 13/13 fit
   Punctuation And Apostrophes    : 27/27 passed | 27/27 fit
   Honorifics And Titles          : 10/10 passed | 10/10 fit
   Accents And Unicode            : 12/12 passed | 12/12 fit
   Csv Injection And Adversarial  : 12/12 passed | 12/12 fit
   Extreme Lengths                : 12/12 passed | 12/12 fit
------------------------------------------------------------------
 VERDICT: PASSED (100/100 Quality Gate)
==================================================================
```

---

## 🔄 The 7-Step Verified Pipeline

```
1 Ingest  ->  2 Review  ->  3 Preview  ->  4 Draft  ->  5 Approve  ->  6 Dispatch  ->  7 Audit
```

1. **Ingest**: Drop your single-page Canva certificate PDF and attendee sheet (CSV/XLSX). Specify the template placeholder token (default: `AGENT`).
2. **Review**: Inspect raw vs. cleaned names with automatic flag detection for duplicates, casing errors, and particle honorifics (`Dr.`, `O'Connor`, `van der`). Click "Trace" on any row to view the full agent tool execution timeline.
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
