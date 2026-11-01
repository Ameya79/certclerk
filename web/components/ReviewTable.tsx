"use client";

import React, { useState } from "react";
import { Recipient, Job } from "../lib/types";
import { updateRecipient, updateMapping } from "../lib/api";
import { AlertTriangle, CheckCircle, Edit2, Check, X, ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";

interface ReviewTableProps {
  job: Job;
  onRefresh: () => void;
  onProceed: () => void;
}

export default function ReviewTable({ job, onRefresh, onProceed }: ReviewTableProps) {
  const [filter, setFilter] = useState<"all" | "flagged" | "skipped">("all");
  const [page, setPage] = useState(1);
  const pageSize = 15;

  // Editing state
  const [editingRow, setEditingRow] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");

  const recipients = job.recipients || [];

  const filtered = recipients.filter((r) => {
    if (filter === "flagged") return r.flags.length > 0 || r.email_status === "invalid" || r.email_status === "fixable";
    if (filter === "skipped") return r.status === "skipped";
    return true;
  });

  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const currentRows = filtered.slice((page - 1) * pageSize, page * pageSize);

  const startEdit = (r: Recipient) => {
    setEditingRow(r.row_id);
    setEditName(r.clean_name);
    setEditEmail(r.email || "");
  };

  const saveEdit = async (rowId: number) => {
    try {
      await updateRecipient(job.job_id, rowId, {
        clean_name: editName.trim(),
        email: editEmail.trim() || undefined,
      });
      setEditingRow(null);
      onRefresh();
    } catch (err: any) {
      alert("Failed to update: " + err.message);
    }
  };

  const toggleSkip = async (r: Recipient) => {
    try {
      await updateRecipient(job.job_id, r.row_id, {
        skip: r.status !== "skipped",
      });
      onRefresh();
    } catch (err: any) {
      alert("Failed to toggle skip: " + err.message);
    }
  };

  const applyEmailSuggestion = async (r: Recipient) => {
    if (!r.email_suggestion) return;
    try {
      await updateRecipient(job.job_id, r.row_id, {
        email: r.email_suggestion,
      });
      onRefresh();
    } catch (err: any) {
      alert("Failed to apply suggestion: " + err.message);
    }
  };

  return (
    <div className="space-y-5">
      {/* Column Mapping Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-4">
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Name Column
            </label>
            <select
              value={job.name_column || ""}
              onChange={async (e) => {
                await updateMapping(job.job_id, { name: e.target.value, email: job.email_column });
                onRefresh();
              }}
              className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-800 hover:border-slate-300 focus:border-slate-400 transition-colors"
            >
              {job.headers.map((h) => (
                <option key={h} value={h}>
                  {h}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Email Column
            </label>
            <select
              value={job.email_column || ""}
              onChange={async (e) => {
                await updateMapping(job.job_id, { name: job.name_column || job.headers[0], email: e.target.value || null });
                onRefresh();
              }}
              className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-800 hover:border-slate-300 focus:border-slate-400 transition-colors"
            >
              <option value="">(None - generate only)</option>
              {job.headers.map((h) => (
                <option key={h} value={h}>
                  {h}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Filter Buttons */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => { setFilter("all"); setPage(1); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 active:scale-95 cursor-pointer ${
              filter === "all"
                ? "bg-slate-900 text-white"
                : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            All ({recipients.length})
          </button>
          <button
            onClick={() => { setFilter("flagged"); setPage(1); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 active:scale-95 flex items-center gap-1.5 cursor-pointer ${
              filter === "flagged"
                ? "bg-amber-600 text-white"
                : "bg-white text-amber-800 border border-amber-200 hover:bg-amber-50"
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
            Needs Review (
            {recipients.filter((r) => r.flags.length > 0 || r.email_status === "invalid" || r.email_status === "fixable").length}
            )
          </button>
          <button
            onClick={() => { setFilter("skipped"); setPage(1); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 active:scale-95 cursor-pointer ${
              filter === "skipped"
                ? "bg-slate-800 text-white"
                : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            Skipped ({recipients.filter((r) => r.status === "skipped").length})
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                <th className="py-2.5 px-4">Row</th>
                <th className="py-2.5 px-4">Raw Name</th>
                <th className="py-2.5 px-4">Standardized Name</th>
                <th className="py-2.5 px-4">Email Address</th>
                <th className="py-2.5 px-4">Quality Diagnostics</th>
                <th className="py-2.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {currentRows.map((r) => {
                const isEditing = editingRow === r.row_id;
                const isSkipped = r.status === "skipped";

                return (
                  <tr
                    key={r.row_id}
                    className={`hover:bg-slate-50/70 transition-colors ${
                      isSkipped ? "opacity-50 bg-slate-50/40" : ""
                    }`}
                  >
                    <td className="py-2.5 px-4 font-mono text-slate-400">{r.row_id}</td>
                    <td className="py-2.5 px-4 font-mono text-slate-500">{r.raw_name}</td>

                    <td className="py-2.5 px-4 font-medium text-slate-900">
                      {isEditing ? (
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="px-2.5 py-1 text-xs rounded-md border border-slate-300 bg-white w-full focus:border-slate-500"
                          autoFocus
                        />
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <span>{r.clean_name}</span>
                          {r.name_changed && (
                            <span className="text-[10px] bg-slate-100 text-slate-700 font-medium px-1.5 py-0.5 rounded border border-slate-200">
                              Fixed
                            </span>
                          )}
                        </div>
                      )}
                    </td>

                    <td className="py-2.5 px-4">
                      {isEditing ? (
                        <input
                          type="text"
                          value={editEmail}
                          onChange={(e) => setEditEmail(e.target.value)}
                          className="px-2.5 py-1 text-xs rounded-md border border-slate-300 bg-white w-full focus:border-slate-500"
                        />
                      ) : (
                        <div className="space-y-0.5">
                          <div className="font-mono text-slate-700">
                            {r.email || <span className="text-slate-400 italic">None</span>}
                          </div>
                          {r.email_status === "fixable" && r.email_suggestion && (
                            <button
                              onClick={() => applyEmailSuggestion(r)}
                              className="text-[11px] text-amber-700 hover:text-amber-800 underline flex items-center gap-1 cursor-pointer"
                            >
                              Fix typo to: {r.email_suggestion}
                            </button>
                          )}
                        </div>
                      )}
                    </td>

                    <td className="py-2.5 px-4">
                      <div className="flex flex-wrap gap-1">
                        {r.flags.map((flag) => (
                          <span
                            key={flag}
                            className="text-[10px] font-medium px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200"
                          >
                            {flag}
                          </span>
                        ))}
                        {r.email_status === "invalid" && (
                          <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-red-50 text-red-800 border border-red-200">
                            invalid email
                          </span>
                        )}
                        {r.flags.length === 0 && r.email_status !== "invalid" && (
                          <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                            <CheckCircle className="w-3 h-3 text-emerald-600" /> Ready
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-2.5 px-4 text-right">
                      {isEditing ? (
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => saveEdit(r.row_id)}
                            className="p-1 rounded text-emerald-600 hover:bg-emerald-50 cursor-pointer"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setEditingRow(null)}
                            className="p-1 rounded text-slate-400 hover:bg-slate-100 cursor-pointer"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => startEdit(r)}
                            className="text-xs text-slate-600 hover:text-slate-900 flex items-center gap-1 cursor-pointer hover:underline"
                          >
                            <Edit2 className="w-3 h-3" /> Edit
                          </button>
                          <button
                            onClick={() => toggleSkip(r)}
                            className={`text-xs px-2 py-0.5 rounded border transition-colors cursor-pointer ${
                              isSkipped
                                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                                : "text-slate-600 hover:text-slate-900 border-slate-200 bg-white"
                            }`}
                          >
                            {isSkipped ? "Unskip" : "Skip"}
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-3.5 border-t border-slate-200 bg-slate-50/50 flex items-center justify-between text-xs text-slate-500">
          <span>
            Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, filtered.length)} of {filtered.length} entries
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-1 rounded border border-slate-200 bg-white disabled:opacity-40 hover:bg-slate-50 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-medium text-slate-700">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="p-1 rounded border border-slate-200 bg-white disabled:opacity-40 hover:bg-slate-50 cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="flex items-center justify-between pt-2">
        <p className="text-xs text-slate-500">
          All flagged rows can be edited inline or skipped. When ready, generate the certificate layout.
        </p>
        <button
          onClick={onProceed}
          className="py-2.5 px-5 rounded-xl bg-slate-900 hover:bg-black text-white font-medium text-xs sm:text-sm flex items-center gap-1.5 transition-all duration-150 active:scale-95 cursor-pointer"
        >
          Generate Certificate Previews
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
