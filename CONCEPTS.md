# CertAgent: Concepts Explained (Docker, Hugging Face, Email, FastAPI)

Plain-language answers to "why do we need this?" Each section says what it is, why it exists, whether you need it now, and what to do instead.

---

## 1. Why FastAPI, and how it works

### The problem it solves
Your core logic is **Python**: PyMuPDF edits PDFs, pandas reads spreadsheets, `smtplib` sends email. Your website is **JavaScript** (Next.js) running in a browser. A browser cannot run PyMuPDF. So the website needs a way to say "here's a PDF and a CSV, please process them" to a program that can. That program is a **web server** and the way they talk is **HTTP**.

```
Browser  ──HTTP request: "POST /api/jobs + files"──►  Python server  ──►  your core code
Browser  ◄──HTTP response: {"job_id": "abc..."}────   Python server
```

### Why FastAPI specifically
It is a Python library for writing that server. It's a good fit because:

| Feature | Why it matters here |
|---|---|
| **Type-based validation** (Pydantic) | You describe the shape of a request once; bad requests are rejected automatically with a clear error |
| **File uploads** | Handles multipart uploads of your PDF/CSV |
| **Async support** | The server can answer `/healthz` while other work runs |
| **Auto-generated docs** at `/docs` | An interactive page to test every endpoint, free |
| **Simple** | A working endpoint is 5 lines |

Alternatives: **Flask** (older, simpler, no built-in validation or async) and **Django** (heavier, built around databases). Flask would work. FastAPI just gives more for this use case. **Next.js API routes cannot replace it**, because they run JavaScript, and your PDF/AI logic is in Python.

### How it looks

```python
from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI()

class EmailTemplate(BaseModel):
    subject: str
    body: str

@app.put("/api/jobs/{job_id}/email-template")
def set_template(job_id: str, t: EmailTemplate):
    # t.subject and t.body are already validated strings here
    ...
    return {"ok": True}
```

Run it: `uvicorn api.main:app --reload`, then open `http://localhost:8000/docs`.

What happens on a request: Uvicorn (the server program) receives the HTTP request → FastAPI matches the URL and method to your function → Pydantic checks the data → your function runs → the return value becomes the JSON response.

### The one tricky bit: slow work
Generating 500 certificates takes minutes, and an HTTP request shouldn't hang that long. The pattern: the endpoint **starts the work in the background and returns immediately** (`202 Accepted`). The browser then **polls** `GET /api/jobs/{id}` every second to see progress. Your TRD does exactly this.

---

## 2. Why Docker (and do you need it?)

### The problem it solves
"It works on my machine." Your app needs a specific Python version, PyMuPDF (which has native components), certain fonts, and particular library versions. On someone else's computer, or on a server, any mismatch can break things in confusing ways.

### What Docker is
A **container** is a sealed box holding your app plus everything it needs: OS libraries, Python, packages, fonts. You describe the box in a text file (`Dockerfile`), and anyone can build and run an identical box anywhere Docker is installed.

```dockerfile
FROM python:3.12-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY core/ core/
COPY api/ api/
ENV DATA_DIR=/data
VOLUME /data
EXPOSE 8000
CMD ["uvicorn", "api.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "1"]
```

`docker-compose.yml` runs several containers together (backend + frontend) with one command: `docker compose up`.

### Why it matters for this project
1. **Open-source promise:** "`docker compose up` and it works" is the best thing you can put in a README. Self-hosters don't need to install Python, PyMuPDF, or Node.
2. **Hosting:** most places that host a backend (cloud servers, many free platforms) accept a Docker image as the deployment unit.
3. **Reproducibility:** your tests in CI and your production run in the same environment.

### Do you need it now?
**No.** While developing, run `uvicorn` and `npm run dev` directly. Add Docker in Phase 11, when you're ready to share it.

---

## 3. Why Hugging Face (and why you don't need it)

### What it is
Hugging Face is best known as a place to share AI models and datasets. It also offers **Spaces**: free hosting for small apps, including ones packaged as a Docker container.

### Why I mentioned it earlier
Because of one problem: **Vercel is great for websites but is a poor home for a Python backend** that processes PDFs and runs long jobs. Vercel's serverless functions have limits on run time, size, and memory (check their current limits), and they don't keep files between requests, which fights with your job-folder design. So your backend needs to live on a *different* kind of host: one that runs a Docker container continuously.

Hugging Face Spaces is **one** option that has offered a free container host. Others have included Render, Fly.io, Railway, or your own small server. Free tiers change, so check them when you're ready.

### Do you need it?
**No.** It is not part of the product. It's only a possible place to run your backend container for the public demo. Your project is complete without it:

| Stage | Where it runs |
|---|---|
| Building and testing | Your laptop |
| Open-source users | Their own machines via Docker |
| Public demo (optional, Phase 11) | Frontend on Vercel + backend on any container host |

If a free container host sleeps when idle, the first request is slow. That is why the UI shows a "waking up" message.

---

## 4. How the email works

### The basic idea
Email is sent with **SMTP** (Simple Mail Transfer Protocol). Your program connects to your email provider's SMTP server, logs in, and hands over a message. The provider delivers it. You aren't running a mail server; you're a client asking Gmail (or Outlook, or your college's server) to send on your behalf.

```
CertAgent ──(login + message)──► smtp.gmail.com:587 ──► recipient's mail server ──► inbox
```

### Pieces involved

| Piece | What it is |
|---|---|
| **SMTP host and port** | e.g. Gmail's host, port 587 (STARTTLS) or 465 (SSL). Check your provider's docs. |
| **Encryption** | The connection must be encrypted so your password isn't visible. The code refuses unencrypted connections. |
| **Login** | Gmail and others don't let you use your normal password for apps. You turn on 2-step verification and create an **app password** (a separate 16-character password just for this tool). Providers change these rules, so follow their current instructions. |
| **MIME message** | An email is structured text: headers (From, To, Subject), a body, and an **attachment** (your certificate PDF, encoded). Python's `EmailMessage` builds this for you. |
| **Sender limits** | Providers cap how many emails you can send per day (check your provider's current number) and may flag sudden bursts. So the app **throttles** (a pause between messages) and warns about limits. |
| **Spam filters** | Mail from your own Gmail account, sent through Gmail's servers, carries Gmail's reputation and signatures, which helps delivery. Sending from a random server pretending to be your Gmail address would fail. This is why users supply their *own* SMTP login. |

### The code, in plain steps

```python
msg = EmailMessage()
msg["From"] = "club@gmail.com"
msg["To"] = "rahul@example.com"
msg["Subject"] = "Your certificate for Workshop X"
msg.set_content("Hi Rahul,\n\nYour certificate is attached.")
msg.add_attachment(pdf_bytes, maintype="application", subtype="pdf", filename="certificate.pdf")

with smtplib.SMTP("smtp.gmail.com", 587) as s:
    s.starttls()                         # encrypt the connection
    s.login("club@gmail.com", app_password)
    s.send_message(msg)                  # provider delivers it
```

Loop that over every approved recipient, with a delay, and you have the mailer.

### Why the rest of the mailer design looks paranoid
Sending email is **irreversible**. You can't unsend 300 emails. So:

1. **Approval gate:** sending is refused unless the approved batch hash matches the current batch.
2. **Write-ahead log:** before each send, write "sending row 17" to disk; afterward write "sent". If the server crashes between the two, row 17 is `unknown`: the system doesn't know whether it was delivered, so it **never auto-resends**; a human checks the Sent folder.
3. **Header-injection protection:** a malicious cell like `a@b.com\r\nBcc: someone@x.com` could add hidden recipients. `EmailMessage` and explicit checks reject newlines in headers.
4. **Credentials in memory only:** the SMTP password arrives in the send request, lives in memory while sending, and is never written to disk or logs.
5. **Demo-mode limits:** if the public site could send arbitrary emails, spammers would use it as a free relay. The hosted demo is dry-run only or limited to the user's own address. Real sending is for self-hosters with their own credentials.

### Where the email is *drafted*
The subject and body are a template with `{name}` and `{event}` filled in by code. The AI can draft a template for you, but you edit it and approve it. It's never AI-written per recipient at send time.

---

## 5. Why no database works (and where it stops working)

Without a database, each job is a **folder on disk** containing JSON and log files. That's enough because:
- A job is a short-lived workspace (hours, not months).
- Only one person uses a given job (they hold the secret URL).
- No cross-job queries are needed (no dashboards, no accounts).

It stops working when you need: multiple server processes, user accounts, permanent records (like QR verification), or analytics across jobs. Those are the cases where you'd add a database later. The `JobStore` class is the single place that would change, which is why the TRD isolates it.

---

## 6. Quick glossary

| Term | Meaning |
|---|---|
| **HTTP / REST API** | The way browser and server exchange requests and JSON responses |
| **Endpoint** | One URL + method, like `POST /api/jobs` |
| **Pydantic** | Library that defines data shapes and rejects wrong ones |
| **Uvicorn** | The program that actually listens for HTTP and runs FastAPI |
| **Background job** | Work that continues after the HTTP response is sent |
| **Polling** | The browser repeatedly asking "done yet?" |
| **Idempotent** | Doing it twice has the same effect as doing it once (critical for sending) |
| **Capability URL** | A hard-to-guess URL that acts as the access key |
| **Guardrail** | A rule enforced in code that the AI cannot override |
| **Eval** | A repeatable measurement of how well the agent performs |
| **Golden test** | Compare output to a stored known-good result |
| **Chaos test** | Deliberately cause failures (kill the server, drop the network) to see what breaks |
