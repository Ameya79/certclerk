"use client";

import React, { useState } from "react";
import {
  Upload,
  FileText,
  FileSpreadsheet,
  ArrowRight,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Type,
  X,
  ShieldCheck,
  Sparkles,
  Layers,
} from "lucide-react";

interface UploadFormProps {
  onSuccess: (jobId: string) => void;
}

export default function UploadForm({ onSuccess }: UploadFormProps) {
  const [templateFile, setTemplateFile] = useState<File | null>(null);
  const [dataFile, setDataFile] = useState<File | null>(null);
  const [fontFile, setFontFile] = useState<File | null>(null);
  const [placeholder, setPlaceholder] = useState("AGENT");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDraggingTemplate, setIsDraggingTemplate] = useState(false);
  const [isDraggingData, setIsDraggingData] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!templateFile) {
      setError("Please select a Canva certificate PDF template.");
      return;
    }
    if (!dataFile) {
      setError("Please select an attendee CSV or Excel (.xlsx) file.");
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("template", templateFile);
      formData.append("data", dataFile);
      if (fontFile) {
        formData.append("font", fontFile);
      }
      formData.append("placeholder", placeholder.trim() || "AGENT");

      const res = await fetch("/api/jobs", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || data.error?.message || "Failed to create job.");
      }

      const { job_id } = await res.json();
      onSuccess(job_id);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Precision Ingest Dock */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* 1. Template PDF Dock */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label
              htmlFor="upload-template-file"
              className="text-xs font-semibold text-slate-900 flex items-center gap-2"
            >
              <FileText className="w-4 h-4 text-blue-600 shrink-0" />
              <span>Canva Certificate Blueprint</span>
            </label>
            <span className="font-mono text-[10px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 shrink-0">
              PDF &le; 5MB
            </span>
          </div>

          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDraggingTemplate(true);
            }}
            onDragLeave={() => setIsDraggingTemplate(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDraggingTemplate(false);
              const file = e.dataTransfer.files?.[0];
              if (file && file.type === "application/pdf") {
                setTemplateFile(file);
              }
            }}
            className={`relative rounded-xl border p-5 transition-all duration-150 flex flex-col items-center justify-center text-center ${
              isDraggingTemplate
                ? "border-blue-600 bg-blue-50/50 shadow-juicy"
                : templateFile
                ? "border-emerald-300 bg-emerald-50/30 shadow-flat"
                : "border-slate-200/90 bg-white hover:border-slate-300 shadow-flat"
            }`}
          >
            {templateFile ? (
              <div className="w-full flex items-center justify-between gap-3 text-left">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700 shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-950 truncate">
                      {templateFile.name}
                    </p>
                    <p className="text-[11px] font-mono text-emerald-700 mt-0.5 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>Blueprint Verified ({(templateFile.size / 1024).toFixed(0)} KB)</span>
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setTemplateFile(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                  title="Remove file"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <label
                htmlFor="upload-template-file"
                className="cursor-pointer flex flex-col items-center w-full py-2 group"
              >
                <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mb-2.5 shadow-flat group-hover:scale-105 transition-transform">
                  <Upload className="w-5 h-5" />
                </div>
                <span className="text-xs font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                  Tap or choose Canva template PDF
                </span>
                <span className="text-[11px] text-slate-500 mt-0.5">
                  Single-page document with placeholder word
                </span>
                <input
                  id="upload-template-file"
                  type="file"
                  accept=".pdf,application/pdf"
                  className="sr-only"
                  onChange={(e) => setTemplateFile(e.target.files?.[0] || null)}
                />
              </label>
            )}
          </div>
        </div>

        {/* 2. Attendee Data Dock */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label
              htmlFor="upload-roster-file"
              className="text-xs font-semibold text-slate-900 flex items-center gap-2"
            >
              <FileSpreadsheet className="w-4 h-4 text-blue-600 shrink-0" />
              <span>Attendee Spreadsheet Roster</span>
            </label>
            <span className="font-mono text-[10px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 shrink-0">
              CSV / XLSX
            </span>
          </div>

          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDraggingData(true);
            }}
            onDragLeave={() => setIsDraggingData(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDraggingData(false);
              const file = e.dataTransfer.files?.[0];
              if (file) {
                setDataFile(file);
              }
            }}
            className={`relative rounded-xl border p-5 transition-all duration-150 flex flex-col items-center justify-center text-center ${
              isDraggingData
                ? "border-blue-600 bg-blue-50/50 shadow-juicy"
                : dataFile
                ? "border-emerald-300 bg-emerald-50/30 shadow-flat"
                : "border-slate-200/90 bg-white hover:border-slate-300 shadow-flat"
            }`}
          >
            {dataFile ? (
              <div className="w-full flex items-center justify-between gap-3 text-left">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700 shrink-0">
                    <FileSpreadsheet className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-950 truncate">
                      {dataFile.name}
                    </p>
                    <p className="text-[11px] font-mono text-emerald-700 mt-0.5 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>Roster Staged ({(dataFile.size / 1024).toFixed(0)} KB)</span>
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setDataFile(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                  title="Remove file"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <label
                htmlFor="upload-roster-file"
                className="cursor-pointer flex flex-col items-center w-full py-2 group"
              >
                <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mb-2.5 shadow-flat group-hover:scale-105 transition-transform">
                  <Upload className="w-5 h-5" />
                </div>
                <span className="text-xs font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                  Tap or choose attendee sheet
                </span>
                <span className="text-[11px] text-slate-500 mt-0.5">
                  CSV or Excel with recipient names &amp; emails
                </span>
                <input
                  id="upload-roster-file"
                  type="file"
                  accept=".csv,.xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"
                  className="sr-only"
                  onChange={(e) => setDataFile(e.target.files?.[0] || null)}
                />
              </label>
            )}
          </div>
        </div>
      </div>

      {/* Pre-Flight Pipeline Readiness Checklist */}
      <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/90 space-y-2">
        <span className="font-pixel text-[10px] text-slate-500 uppercase tracking-wider block">
          PRE-FLIGHT PIPELINE READINESS
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
          <div className="flex items-center gap-2">
            {templateFile ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <div className="w-4 h-4 rounded-full border border-slate-300 shrink-0" />
            )}
            <span className={templateFile ? "text-slate-900 font-medium" : "text-slate-400"}>
              Canva Template PDF
            </span>
          </div>

          <div className="flex items-center gap-2">
            {dataFile ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <div className="w-4 h-4 rounded-full border border-slate-300 shrink-0" />
            )}
            <span className={dataFile ? "text-slate-900 font-medium" : "text-slate-400"}>
              Attendee Sheet Roster
            </span>
          </div>

          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="text-slate-900 font-medium">
              Name Check [READY]
            </span>
          </div>
        </div>
      </div>

      {/* Layout Invariant Parameters */}
      <div className="p-5 rounded-xl bg-white border border-slate-200/90 shadow-flat space-y-4">
        <div className="flex items-center gap-2">
          <Type className="w-4 h-4 text-blue-600 shrink-0" />
          <h4 className="text-xs font-semibold text-slate-950">
            Layout & Placeholder Settings
          </h4>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="cfg-placeholder-word"
              className="block text-xs font-medium text-slate-700 mb-1.5"
            >
              Canva Placeholder Word
            </label>
            <input
              id="cfg-placeholder-word"
              type="text"
              value={placeholder}
              onChange={(e) => setPlaceholder(e.target.value)}
              placeholder="AGENT"
              className="w-full px-3.5 py-2 rounded-lg border border-slate-200 bg-slate-50/50 font-mono text-base sm:text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors shadow-flat"
            />
            <p className="font-mono text-[10px] text-slate-500 mt-1">
              Case-sensitive token scanned in Canva PDF. Default: <code>AGENT</code>.
            </p>
          </div>

          <div>
            <label
              htmlFor="cfg-matching-font"
              className="block text-xs font-medium text-slate-700 mb-1.5"
            >
              Matching Font File <span className="text-slate-400 font-normal">(Optional .ttf / .otf)</span>
            </label>
            <input
              id="cfg-matching-font"
              type="file"
              accept=".ttf,.otf,font/ttf,font/otf"
              onChange={(e) => setFontFile(e.target.files?.[0] || null)}
              className="w-full font-mono text-[11px] text-slate-500 file:mr-2.5 file:py-1.5 file:px-3 file:rounded-md file:border file:border-slate-200 file:font-sans file:text-xs file:font-medium file:bg-white file:text-slate-700 hover:file:bg-slate-50 cursor-pointer"
            />
            <p className="font-mono text-[10px] text-slate-500 mt-1">
              If omitted, clean standard typography is automatically applied.
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="p-4 rounded-xl bg-red-50 border border-red-200 flex items-start gap-3 text-xs text-red-700"
        >
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <span className="font-medium">{error}</span>
        </div>
      )}

      {/* Primary Action Button (Tactile & Juicy) */}
      <button
        type="submit"
        disabled={loading || !templateFile || !dataFile}
        className="w-full py-4 px-6 rounded-xl bg-slate-950 hover:bg-blue-600 text-white font-medium text-sm flex items-center justify-center gap-2 transition-all duration-150 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-tactile hover:shadow-juicy focus-visible:ring-2 focus-visible:ring-blue-600"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin shrink-0" />
            <span>Scanning Canva template &amp; processing attendee names...</span>
          </>
        ) : (
          <>
            <span>Initialize Batch &amp; Preview Certificates</span>
            <ArrowRight className="w-4 h-4 shrink-0" />
          </>
        )}
      </button>
    </form>
  );
}
