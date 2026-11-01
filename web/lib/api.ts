import { Job, SmtpConfig, LlmStatus, GlobalMetrics } from "./types";

const API_BASE = "/api";

export async function createJob(formData: FormData): Promise<{ job_id: string }> {
  const res = await fetch(`${API_BASE}/jobs`, {
    method: "POST",
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: { message: "Failed to upload" } }));
    throw new Error(err.detail || err.error?.message || "Failed to create job");
  }
  return res.json();
}

export async function getJob(jobId: string, page = 1, size = 100): Promise<Job> {
  const res = await fetch(`${API_BASE}/jobs/${jobId}?page=${page}&size=${size}`);
  if (!res.ok) throw new Error("Job not found");
  return res.json();
}

export async function startAnalysis(jobId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/jobs/${jobId}/analyze`, { method: "POST" });
  if (!res.ok) throw new Error("Failed to start analysis");
}

export async function updateMapping(
  jobId: string,
  mapping: { name: string; email: string | null }
): Promise<void> {
  const res = await fetch(`${API_BASE}/jobs/${jobId}/mapping`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(mapping),
  });
  if (!res.ok) throw new Error("Failed to update mapping");
}

export async function updateRecipient(
  jobId: string,
  rowId: number,
  update: { clean_name?: string; email?: string; skip?: boolean }
): Promise<void> {
  const res = await fetch(`${API_BASE}/jobs/${jobId}/recipients/${rowId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(update),
  });
  if (!res.ok) throw new Error("Failed to update recipient");
}

export async function updateEmailTemplate(
  jobId: string,
  template: { subject: string; body: string }
): Promise<void> {
  const res = await fetch(`${API_BASE}/jobs/${jobId}/email-template`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(template),
  });
  if (!res.ok) throw new Error("Failed to update email template");
}

export async function draftEmail(
  jobId: string,
  eventName: string,
  tone = "professional"
): Promise<{ subject: string; body: string }> {
  const res = await fetch(`${API_BASE}/jobs/${jobId}/draft-email`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ event_name: eventName, tone }),
  });
  if (!res.ok) throw new Error("Failed to draft email");
  return res.json();
}

export async function startGeneration(jobId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/jobs/${jobId}/generate`, { method: "POST" });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || err.error || "Failed to start certificate generation");
  }
}

export async function approveJob(jobId: string): Promise<{ ok: boolean; hash: string }> {
  const res = await fetch(`${API_BASE}/jobs/${jobId}/approve`, { method: "POST" });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Approval failed");
  }
  return res.json();
}

export async function sendJob(jobId: string, smtp: SmtpConfig): Promise<void> {
  const res = await fetch(`${API_BASE}/jobs/${jobId}/send`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(smtp),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Sending failed");
  }
}

export async function pauseSend(jobId: string): Promise<void> {
  await fetch(`${API_BASE}/jobs/${jobId}/pause`, { method: "POST" });
}

export async function resumeSend(jobId: string, smtp: SmtpConfig): Promise<void> {
  const res = await fetch(`${API_BASE}/jobs/${jobId}/resume`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(smtp),
  });
  if (!res.ok) throw new Error("Resume failed");
}

export async function getAudit(jobId: string): Promise<{ entries: any[] }> {
  const res = await fetch(`${API_BASE}/jobs/${jobId}/audit`);
  return res.json();
}

export async function deleteJob(jobId: string): Promise<void> {
  await fetch(`${API_BASE}/jobs/${jobId}`, { method: "DELETE" });
}

export async function getLlmSettings(): Promise<LlmStatus> {
  const res = await fetch(`${API_BASE}/settings/llm`);
  if (!res.ok) throw new Error("Failed to get LLM settings");
  return res.json();
}

export async function saveLlmSettings(settings: {
  base_url: string;
  api_key: string;
  model: string;
  persist?: boolean;
}): Promise<{ ok: boolean; settings: LlmStatus }> {
  const res = await fetch(`${API_BASE}/settings/llm`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(settings),
  });
  if (!res.ok) throw new Error("Failed to save LLM settings");
  return res.json();
}

export async function testLlmSettings(settings: {
  base_url?: string;
  api_key?: string;
  model?: string;
}): Promise<{ ok: boolean; latency_ms?: number; provider?: string; error?: string; model?: string }> {
  try {
    const res = await fetch(`${API_BASE}/settings/llm/test`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { ok: false, error: data.error || data.detail || `Server error (HTTP ${res.status})` };
    }
    return data;
  } catch (err: any) {
    return { ok: false, error: err.message || "Failed to reach server. Please check your backend connection." };
  }
}

export async function getGlobalMetrics(): Promise<GlobalMetrics> {
  try {
    const res = await fetch(`${API_BASE}/metrics`);
    if (!res.ok) throw new Error("Failed");
    return await res.json();
  } catch {
    return {
      total_certs_generated: 0,
      total_emails_dispatched: 0,
      total_batches_processed: 0,
      active_jobs: 0,
      last_updated: Date.now() / 1000,
    };
  }
}



