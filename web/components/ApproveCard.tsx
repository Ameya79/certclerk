"use client";

import React, { useState } from "react";
import { Job } from "../lib/types";
import { approveJob } from "../lib/api";
import { ShieldCheck, CheckCircle2, AlertTriangle, ArrowRight, Loader2, Lock, FileCheck, Check, Sparkles } from "lucide-react";

interface ApproveCardProps {
  job: Job;
  onRefresh: () => void;
  onProceed: () => void;
}

export default function ApproveCard({ job, onRefresh, onProceed }: ApproveCardProps) {
  const [approving, setApproving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const recipients = job.recipients || [];
  const sendable = recipients.filter((r) => r.status !== "skipped" && r.email);
  const skipped = recipients.filter((r) => r.status === "skipped");
  const missingEmail = recipients.filter((r) => r.status !== "skipped" && !r.email);

  const isApproved = job.status === "approved" || !!job.approved_hash;

  const handleApprove = async () => {
    setApproving(true);
    setError(null);
    try {
      await approveJob(job.job_id);
      onRefresh();
    } catch (err: any) {
      setError(err.message || "Failed to approve batch");
    } finally {
      setApproving(false);
    }
  };

  return (
    <div className="w-full space-y-4">
      {/* 2-Column Balanced Verification Studio (Stable Height & Width) */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-stretch">
        {/* Left Column: Cryptographic Checklist (7 cols) */}
        <div className="md:col-span-7 bg-white border border-slate-200 rounded-xl p-4 sm:p-6 flex flex-col justify-between shadow-sm">
          <div>
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-800">
                <ShieldCheck className="w-4 h-4 text-indigo-600" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900">Safety & Quality Verification</h3>
                <p className="text-[11px] text-slate-500">Every recipient has been validated through our 4-layer guardrails</p>
              </div>
            </div>

            <div className="space-y-2.5 my-4">
              <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                <div className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="w-2.5 h-2.5 stroke-[3]" />
                </div>
                <div>
                  <span className="text-xs font-semibold text-slate-800 block">Exact Name Accuracy</span>
                  <span className="text-[11px] text-slate-500">
                    Names match original roster with zero spelling mistakes.
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                <div className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="w-2.5 h-2.5 stroke-[3]" />
                </div>
                <div>
                  <span className="text-xs font-semibold text-slate-800 block">Layout Fit & Margin Protection</span>
                  <span className="text-[11px] text-slate-500">
                    All recipient text fits within the placeholder area with no clipped boundaries.
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                <div className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="w-2.5 h-2.5 stroke-[3]" />
                </div>
                <div>
                  <span className="text-xs font-semibold text-slate-800 block">Anti-Injection Header Guard</span>
                  <span className="text-[11px] text-slate-500">
                    Email addresses and subjects are sanitized against CRLF header exploits.
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-slate-400 font-mono">
              {isApproved ? (
                <span className="text-emerald-700 font-semibold flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  SHA-256 Lock: {job.approved_hash?.slice(0, 20)}...
                </span>
              ) : (
                "Status: Awaiting Organizer Signature"
              )}
            </span>
            <span className="text-slate-400">Canva PDF Standard</span>
          </div>
        </div>

        {/* Right Column: Dispatch Scope & Confirmation (5 cols) */}
        <div className="md:col-span-5 bg-white border border-slate-200 rounded-xl p-4 sm:p-6 flex flex-col justify-between shadow-sm">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-bold text-sm text-slate-900">Delivery Scope</h4>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Step 5 of 7
              </span>
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                <span className="text-xs font-medium text-slate-600">Will receive email</span>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  {sendable.length} verified
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                <span className="text-xs font-medium text-slate-600">Certificate only (in ZIP)</span>
                <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                  {missingEmail.length} no email
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                <span className="text-xs font-medium text-slate-600">Skipped by organizer</span>
                <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                  {skipped.length}
                </span>
              </div>
            </div>

            {error && (
              <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs mb-3 flex items-start gap-2">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}
          </div>

          {/* Action Zone: Fixed height & smooth morphing */}
          <div className="pt-3 border-t border-slate-100">
            {isApproved ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
                  <span className="flex items-center gap-1.5 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Batch Approved
                  </span>
                  <span className="text-[10px] text-emerald-600 font-mono">Immutable</span>
                </div>
                <button
                  type="button"
                  onClick={onProceed}
                  className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-black text-white font-medium text-xs flex items-center justify-center gap-1.5 transition-all duration-150 active:scale-95 cursor-pointer shadow-xs"
                >
                  Continue to SMTP Dispatch
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleApprove}
                disabled={approving || sendable.length === 0}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-black text-white font-medium text-xs flex items-center justify-center gap-2 transition-all duration-150 active:scale-95 cursor-pointer disabled:opacity-40 shadow-xs"
              >
                {approving ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Computing SHA-256 Lock...
                  </>
                ) : (
                  <>
                    <Lock className="w-3.5 h-3.5" />
                    Approve & Lock Batch ({sendable.length} Recipients)
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
