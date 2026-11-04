"use client";

import React, { useState, useEffect } from "react";
import { Job } from "../lib/types";
import { getAudit, deleteJob } from "../lib/api";
import { Download, FileText, Trash2, CheckCircle2, RotateCcw, ShieldCheck, ChevronDown, ChevronUp } from "lucide-react";

interface ReportProps {
  job: Job;
  onRestart: () => void;
}

export default function Report({ job, onRestart }: ReportProps) {
  const [auditEntries, setAuditEntries] = useState<any[]>([]);
  const [showAudit, setShowAudit] = useState(false);
  const [deleted, setDeleted] = useState(false);

  useEffect(() => {
    getAudit(job.job_id)
      .then((data) => setAuditEntries(data.entries || []))
      .catch(() => {});
  }, [job.job_id]);

  const recipients = job.recipients || [];
  const sentCount = recipients.filter((r) => r.status === "sent").length;
  const failedCount = recipients.filter((r) => r.status === "failed").length;
  const skippedCount = recipients.filter((r) => r.status === "skipped").length;

  const handleDelete = async () => {
    if (confirm("Are you sure you want to permanently delete all data, certificates, and logs for this job?")) {
      await deleteJob(job.job_id);
      setDeleted(true);
    }
  };

  if (deleted) {
    return (
      <div className="max-w-md mx-auto p-6 rounded-2xl bg-white border border-slate-200 text-center space-y-3.5 shadow-sm">
        <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-800 mx-auto flex items-center justify-center">
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
        </div>
        <h3 className="font-bold text-base text-slate-900">All Job Data Purged</h3>
        <p className="text-xs text-slate-500">
          Generated certificate PDFs, recipient records, and capability tokens have been deleted from disk.
        </p>
        <button
          onClick={onRestart}
          className="mt-2 px-5 py-2 rounded-xl bg-slate-900 hover:bg-black text-white font-medium text-xs transition-all duration-150 active:scale-95 cursor-pointer"
        >
          Create New Batch
        </button>
      </div>
    );
  }

  return (
    <div className="w-full space-y-4">
      {/* Overview Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 text-center shadow-sm">
        <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-800 mx-auto flex items-center justify-center mb-3">
          <CheckCircle2 className="w-6 h-6 text-emerald-600" />
        </div>
        <h3 className="text-lg font-bold text-slate-900 mb-1">Dispatch Complete</h3>
        <p className="text-xs text-slate-500 max-w-md mx-auto mb-5 leading-relaxed">
          All certificates were verified, generated, and dispatched according to your approved parameters.
        </p>

        {/* Counts summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 max-w-lg mx-auto p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-left mb-5">
          <div>
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Sent</span>
            <span className="text-lg font-bold text-emerald-700">{sentCount}</span>
          </div>
          <div>
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Failed</span>
            <span className="text-lg font-bold text-red-700">{failedCount}</span>
          </div>
          <div>
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Skipped</span>
            <span className="text-lg font-bold text-slate-700">{skippedCount}</span>
          </div>
          <div>
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Total</span>
            <span className="text-lg font-bold text-slate-900">{recipients.length}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-2.5">
          <a
            href={`/api/jobs/${job.job_id}/download.zip`}
            className="w-full sm:w-auto justify-center px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-black text-white font-medium text-xs flex items-center gap-2 transition-all duration-150 active:scale-95 cursor-pointer"
          >
            <Download className="w-4 h-4" /> Download All Certificates (.ZIP)
          </a>

          <button
            onClick={() => setShowAudit(!showAudit)}
            className="w-full sm:w-auto justify-center px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 font-medium text-xs text-slate-700 flex items-center gap-1.5 transition-all duration-150 active:scale-95 cursor-pointer"
          >
            <FileText className="w-4 h-4 text-slate-400" />
            Audit Log ({auditEntries.length})
            {showAudit ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Audit Log Viewer */}
      {showAudit && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <h4 className="font-semibold text-xs text-slate-900 mb-2.5 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-indigo-600" />
            Cryptographic Audit Trail
          </h4>
          <div className="max-h-64 overflow-y-auto space-y-1.5 rounded-lg bg-slate-50 p-3 font-mono text-[11px] text-slate-600 border border-slate-200">
            {auditEntries.map((entry, idx) => (
              <div key={idx} className="border-b border-slate-200/60 pb-1.5 last:border-0">
                <span className="text-slate-900 font-semibold">{entry.event}</span>{" "}
                <span className="text-slate-400 text-[10px]">({new Date(entry.ts * 1000).toLocaleTimeString()})</span>:{" "}
                {JSON.stringify(
                  Object.fromEntries(Object.entries(entry).filter(([k]) => k !== "event" && k !== "ts"))
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Privacy and Danger Zone */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
        <div>
          <span className="font-semibold text-slate-700 block">Automatic Retention</span>
          <span className="text-slate-400">All data automatically purges 24 hours after completion.</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleDelete}
            className="px-3 py-1.5 rounded-lg bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 font-medium text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" /> Delete Job Now
          </button>
          <button
            onClick={onRestart}
            className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 font-medium text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Start New Batch
          </button>
        </div>
      </div>
    </div>
  );
}
