"use client";

import React, { useState } from "react";
import { Job, Recipient } from "../lib/types";
import { AlertTriangle, CheckCircle, X, ZoomIn, ArrowRight } from "lucide-react";

interface PreviewGridProps {
  job: Job;
  onProceed: () => void;
}

export default function PreviewGrid({ job, onProceed }: PreviewGridProps) {
  const [filter, setFilter] = useState<"all" | "warnings">("all");
  const [modalRow, setModalRow] = useState<Recipient | null>(null);

  const nonSkipped = (job.recipients || []).filter((r) => r.status !== "skipped");

  const filtered = nonSkipped.filter((r) => {
    if (filter === "warnings") {
      return (
        r.fit &&
        (!r.fit.ok ||
          r.fit.scale < 0.85 ||
          r.fit.lines > 1 ||
          r.fit.missing_glyphs.length > 0 ||
          r.fit.used_fallback_font)
      );
    }
    return true;
  });

  return (
    <div className="space-y-5">
      {/* Filter and stats bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4 shadow-sm">
        <div>
          <h3 className="font-semibold text-slate-900 text-sm">Rendered Previews</h3>
          <p className="text-xs text-slate-500">
            {nonSkipped.length} certificates generated. Click any card to inspect full resolution.
          </p>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setFilter("all")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 active:scale-95 cursor-pointer ${
              filter === "all"
                ? "bg-slate-900 text-white"
                : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            All Previews ({nonSkipped.length})
          </button>
          <button
            onClick={() => setFilter("warnings")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 active:scale-95 flex items-center gap-1.5 cursor-pointer ${
              filter === "warnings"
                ? "bg-amber-600 text-white"
                : "bg-white text-amber-800 border border-amber-200 hover:bg-amber-50"
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
            Fit Warnings (
            {
              nonSkipped.filter(
                (r) =>
                  r.fit &&
                  (!r.fit.ok ||
                    r.fit.scale < 0.85 ||
                    r.fit.lines > 1 ||
                    r.fit.missing_glyphs.length > 0 ||
                    r.fit.used_fallback_font)
              ).length
            }
            )
          </button>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filtered.map((r) => {
          const fit = r.fit;
          const hasWarning =
            fit &&
            (!fit.ok ||
              fit.scale < 0.85 ||
              fit.lines > 1 ||
              fit.missing_glyphs.length > 0 ||
              fit.used_fallback_font);

          return (
            <div
              key={r.row_id}
              onClick={() => setModalRow(r)}
              className="group bg-white border border-slate-200 hover:border-slate-400 rounded-xl p-3 cursor-pointer transition-all duration-150 hover:-translate-y-0.5 flex flex-col justify-between"
            >
              <div className="relative aspect-[1.414] bg-slate-100 rounded-lg overflow-hidden border border-slate-100 mb-2.5">
                <img
                  src={`/api/jobs/${job.job_id}/preview/${r.row_id}.png`}
                  alt={`Certificate for ${r.clean_name}`}
                  className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-[1.02]"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-slate-900/10 transition-opacity flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <div className="w-8 h-8 rounded-full bg-white text-slate-800 flex items-center justify-center shadow-sm">
                    <ZoomIn className="w-4 h-4" />
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <h4 className="font-semibold text-xs text-slate-900 truncate">
                    {r.clean_name}
                  </h4>
                  <span className="text-[10px] font-mono text-slate-400">#{r.row_id}</span>
                </div>

                <div className="flex flex-wrap gap-1">
                  {fit?.lines && fit.lines > 1 && (
                    <span className="text-[10px] bg-amber-50 text-amber-800 border border-amber-200 px-1.5 py-0.5 rounded font-medium">
                      2 lines
                    </span>
                  )}
                  {fit?.scale && fit.scale < 0.85 && (
                    <span className="text-[10px] bg-amber-50 text-amber-800 border border-amber-200 px-1.5 py-0.5 rounded font-medium">
                      {Math.round(fit.scale * 100)}% font
                    </span>
                  )}
                  {fit?.missing_glyphs && fit.missing_glyphs.length > 0 && (
                    <span className="text-[10px] bg-red-50 text-red-800 border border-red-200 px-1.5 py-0.5 rounded font-medium">
                      missing glyph
                    </span>
                  )}
                  {!hasWarning && (
                    <span className="text-[10px] bg-emerald-50 text-emerald-800 border border-emerald-200 px-1.5 py-0.5 rounded font-medium flex items-center gap-1">
                      <CheckCircle className="w-3 h-3 text-emerald-600" /> Perfect fit
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal */}
      {modalRow && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 backdrop-blur-xs flex min-h-full items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150"
          onClick={() => setModalRow(null)}
        >
          <div
            className="bg-white border border-slate-200 rounded-2xl max-w-4xl w-full my-auto p-5 sm:p-6 shadow-2xl relative max-h-[calc(100vh-2rem)] flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-3 shrink-0">
              <div>
                <h3 className="font-bold text-base text-slate-900">{modalRow.clean_name}</h3>
                <p className="text-xs text-slate-500 font-mono">Row #{modalRow.row_id}</p>
              </div>
              <button
                onClick={() => setModalRow(null)}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                aria-label="Close preview"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto flex flex-col items-center justify-center min-h-0 mb-3">
              <div className="w-full aspect-[1.414] max-h-[60vh] bg-slate-50 rounded-xl overflow-hidden border border-slate-200 flex items-center justify-center">
                <img
                  src={`/api/jobs/${job.job_id}/preview/${modalRow.row_id}.png`}
                  alt={modalRow.clean_name}
                  className="max-w-full max-h-full object-contain"
                />
              </div>
            </div>

            {modalRow.fit && (
              <div className="p-3 rounded-lg bg-slate-50 text-xs text-slate-600 flex flex-wrap gap-4 border border-slate-100 shrink-0">
                <span>
                  Scale: <strong className="text-slate-900">{Math.round(modalRow.fit.scale * 100)}%</strong>
                </span>
                <span>
                  Lines: <strong className="text-slate-900">{modalRow.fit.lines}</strong>
                </span>
                <span>
                  Font:{" "}
                  <strong className="text-slate-900">{modalRow.fit.used_fallback_font ? "Fallback Helvetica" : "Template Font"}</strong>
                </span>
                {modalRow.fit.notes.length > 0 && (
                  <span>
                    Notes: <em>{modalRow.fit.notes.join("; ")}</em>
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Action Footer */}
      <div className="flex items-center justify-between pt-2">
        <p className="text-xs text-slate-500">Previews reflect pixel-accurate PDF rendering with custom typography.</p>
        <button
          onClick={onProceed}
          className="py-2.5 px-5 rounded-xl bg-slate-900 hover:bg-black text-white font-medium text-xs sm:text-sm flex items-center gap-1.5 transition-all duration-150 active:scale-95 cursor-pointer"
        >
          Proceed to Email Setup
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
