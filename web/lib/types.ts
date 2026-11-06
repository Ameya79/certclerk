export type FitReport = {
  ok: boolean;
  final_size: number;
  scale: number;
  lines: number;
  missing_glyphs: string[];
  overlaps_content: boolean;
  used_fallback_font: boolean;
  notes: string[];
};

export type TraceStep = {
  step_num: number;
  tool: string;
  action: string;
  input_summary: string;
  output_summary: string;
  verdict: "success" | "warning" | "rejected" | "info";
  details?: Record<string, any>;
};

export type AgentExecutionTrace = {
  raw_input: string;
  candidate_output: string;
  invariant_passed: boolean;
  verdict_summary: string;
  steps: TraceStep[];
  latency_ms: number;
};

export type Recipient = {
  row_id: number;
  raw_name: string;
  clean_name: string;
  name_changed: boolean;
  email: string | null;
  email_status: "ok" | "fixable" | "invalid" | "missing";
  email_suggestion: string | null;
  flags: string[];
  status: "pending" | "ready" | "generated" | "queued" | "sending" | "sent" | "failed" | "skipped" | "unknown";
  fit?: FitReport;
  trace?: AgentExecutionTrace;
  error?: string | null;
};

export type Job = {
  job_id: string;
  status:
    | "created"
    | "analyzed"
    | "mapped"
    | "generating"
    | "generated"
    | "approved"
    | "sending"
    | "paused"
    | "done"
    | "failed";
  placeholder: string;
  headers: string[];
  name_column: string | null;
  email_column: string | null;
  recipients: Recipient[];
  subject: string;
  body: string;
  template_sha: string;
  font_sha: string;
  approved_hash: string | null;
  progress: number;
  total: number;
  error: string | null;
  demo_mode?: boolean;
  pagination?: {
    page: number;
    size: number;
    total: number;
    pages: number;
  };
};

export type SmtpConfig = {
  host: string;
  port: number;
  user: string;
  password: string;
  sender: string;
};

export type LlmStatus = {
  configured: boolean;
  provider: string;
  base_url: string;
  model: string;
  has_key: boolean;
  masked_key: string;
};

export type GlobalMetrics = {
  total_certs_generated: number;
  total_emails_dispatched: number;
  total_batches_processed: number;
  total_users?: number;
  active_jobs: number;
  last_updated: number;
};



