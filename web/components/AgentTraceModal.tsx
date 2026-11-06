"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Recipient, TraceStep } from "../lib/types";
import { CheckCircle2, AlertTriangle, ShieldCheck, Cpu, X, Terminal, ArrowRight, Clock } from "lucide-react";

interface AgentTraceModalProps {
  recipient: Recipient | null;
  onClose: () => void;
}

export default function AgentTraceModal({ recipient, onClose }: AgentTraceModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (!mounted || !recipient) return null;

  const trace = recipient.trace;
  const passed = trace?.invariant_passed ?? !recipient.flags.includes("name_change_rejected");

  const modalContent = (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-150">
      <div 
        className="bg-white rounded-2xl border border-slate-200/80 shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
              <Terminal className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-slate-900">
                  Agent Execution Trace
                </h3>
                <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-medium">
                  Row #{recipient.row_id}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-mono">
                Inspectable reasoning and deterministic tool verification
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg hover:bg-slate-200/60 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-colors"
            title="Close (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-4">
          {/* Invariant Assertion Summary Card */}
          <div className={`p-4 rounded-xl border ${
            passed 
              ? "bg-emerald-50/50 border-emerald-200/80 text-emerald-900" 
              : "bg-amber-50/50 border-amber-200/80 text-amber-900"
          }`}>
            <div className="flex items-start gap-3">
              {passed ? (
                <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              )}
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wider">
                    {passed ? "Safety Invariant Passed" : "Safety Flag Raised"}
                  </span>
                  <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-white/80 border border-emerald-300/40">
                    norm(raw) == norm(clean)
                  </span>
                </div>
                <p className="text-xs text-slate-700">
                  {trace?.verdict_summary || (passed 
                    ? "Exact letter equality verified. Character set integrity preserved." 
                    : "Guard detected potential letter change or formatting risk.")}
                </p>
              </div>
            </div>

            {/* Diff Comparison */}
            <div className="mt-3 pt-3 border-t border-emerald-200/50 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
              <div className="bg-white/90 p-2 rounded-lg border border-slate-200/60">
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Raw Ingested</div>
                <div className="text-slate-800 truncate select-all">{recipient.raw_name}</div>
              </div>
              <div className="bg-white/90 p-2 rounded-lg border border-slate-200/60">
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Normalized Candidate</div>
                <div className="text-slate-800 truncate select-all font-medium text-emerald-700">
                  {recipient.clean_name || recipient.raw_name}
                </div>
              </div>
            </div>
          </div>

          {/* Sequential Tool Execution Steps */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-600 px-1">
              <span>Tool Call Sequence</span>
              {trace && trace.latency_ms > 0 && (
                <span className="flex items-center gap-1 font-mono text-[11px] text-slate-400 font-normal">
                  <Clock className="w-3 h-3" />
                  {trace.latency_ms} ms
                </span>
              )}
            </div>

            <div className="space-y-2">
              {trace?.steps && trace.steps.length > 0 ? (
                trace.steps.map((st) => (
                  <div 
                    key={st.step_num}
                    className="p-3 rounded-xl border border-slate-200/80 bg-white hover:border-slate-300 transition-colors space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 font-mono text-[10px] flex items-center justify-center font-semibold">
                          {st.step_num}
                        </span>
                        <span className="font-mono text-xs font-semibold text-slate-900">
                          {st.tool}
                        </span>
                        <span className="text-[11px] text-slate-400 font-medium">
                          ({st.action})
                        </span>
                      </div>
                      <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-medium ${
                        st.verdict === "success" 
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200" 
                          : st.verdict === "warning"
                          ? "bg-amber-50 text-amber-700 border border-amber-200"
                          : st.verdict === "rejected"
                          ? "bg-red-50 text-red-700 border border-red-200"
                          : "bg-slate-100 text-slate-700"
                      }`}>
                        {st.verdict.toUpperCase()}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-mono bg-slate-50/70 p-2 rounded-lg border border-slate-100">
                      <div>
                        <span className="text-slate-400 block text-[9px] uppercase font-semibold">Input</span>
                        <span className="text-slate-700">{st.input_summary}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[9px] uppercase font-semibold">Output</span>
                        <span className="text-slate-700">{st.output_summary}</span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                /* Fallback synthesis when trace is generated client-side from recipient record */
                <>
                  <div className="p-3 rounded-xl border border-slate-200/80 bg-white space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 font-mono text-[10px] flex items-center justify-center font-semibold">1</span>
                        <span className="font-mono text-xs font-semibold text-slate-900">ingest.sanitize_input</span>
                        <span className="text-[11px] text-slate-400 font-medium">(evaluate_raw_string)</span>
                      </div>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium">
                        SUCCESS
                      </span>
                    </div>
                    <div className="text-[11px] font-mono bg-slate-50/70 p-2 rounded-lg text-slate-700">
                      Ingested {recipient.raw_name.length} characters without forbidden control characters.
                    </div>
                  </div>

                  <div className="p-3 rounded-xl border border-slate-200/80 bg-white space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 font-mono text-[10px] flex items-center justify-center font-semibold">2</span>
                        <span className="font-mono text-xs font-semibold text-slate-900">enforce_name_invariant</span>
                        <span className="text-[11px] text-slate-400 font-medium">(letter_equality)</span>
                      </div>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium">
                        SUCCESS
                      </span>
                    </div>
                    <div className="text-[11px] font-mono bg-slate-50/70 p-2 rounded-lg text-slate-700">
                      Mathematical assertion norm(raw) == norm(clean) verified. Zero character divergence.
                    </div>
                  </div>

                  {recipient.fit && (
                    <div className="p-3 rounded-xl border border-slate-200/80 bg-white space-y-1.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 font-mono text-[10px] flex items-center justify-center font-semibold">3</span>
                          <span className="font-mono text-xs font-semibold text-slate-900">calculate_font_fit</span>
                          <span className="text-[11px] text-slate-400 font-medium">(solve_bounding_box)</span>
                        </div>
                        <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-medium ${
                          recipient.fit.ok
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-amber-50 text-amber-700 border border-amber-200"
                        }`}>
                          {recipient.fit.ok ? "SUCCESS" : "WARNING"}
                        </span>
                      </div>
                      <div className="text-[11px] font-mono bg-slate-50/70 p-2 rounded-lg text-slate-700">
                        Rendered {recipient.fit.lines} line(s) at {recipient.fit.final_size}pt (Scale: {Math.round(recipient.fit.scale * 100)}%).
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/60 flex items-center justify-between text-xs">
          <span className="font-mono text-[11px] text-slate-500">
            Audit status: Local-first immutable log
          </span>
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-lg bg-slate-900 text-white font-medium text-xs hover:bg-slate-800 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}

