"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import UploadForm from "../../components/UploadForm";
import { ArrowLeft, Layers, ShieldCheck, HardDrive, Lock } from "lucide-react";

export default function StudioPage() {
  const router = useRouter();

  const handleUploadSuccess = (jobId: string) => {
    router.push(`/jobs/${jobId}`);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-fade-in-up">
      {/* Top Header & Breadcrumb */}
      <div className="space-y-4">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors group"
        >
          <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
          <span>Back to Documentation & Guide</span>
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/80">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <Layers className="w-4 h-4" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-950">
                Batch Studio Workstation
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">
              Drop your Canva PDF certificate template and attendee spreadsheet below to initialize the invariant pipeline.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="font-pixel text-[10px] font-medium px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200/80">
              STUDIO READY
            </span>
          </div>
        </div>
      </div>

      {/* Main Studio Ingest Station */}
      <section
        aria-label="Upload and Parameters Dock"
        className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-8 shadow-flat"
      >
        <UploadForm onSuccess={handleUploadSuccess} />
      </section>

      {/* Invariant Guarantees Strip */}
      <section
        aria-label="Active Engine Guardrails"
        className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs"
      >
        <div className="p-3.5 rounded-xl bg-white border border-slate-200/80 shadow-flat space-y-1">
          <div className="flex items-center gap-1.5 font-semibold text-slate-900">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>Character Invariant</span>
          </div>
          <p className="text-[11px] text-slate-500 leading-normal">
            Hard check enforces <code className="font-mono text-slate-700">norm(raw) == norm(clean)</code>.
          </p>
        </div>

        <div className="p-3.5 rounded-xl bg-white border border-slate-200/80 shadow-flat space-y-1">
          <div className="flex items-center gap-1.5 font-semibold text-slate-900">
            <HardDrive className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <span>Ephemeral Local Storage</span>
          </div>
          <p className="text-[11px] text-slate-500 leading-normal">
            Stored locally in <code className="font-mono text-slate-700">data/jobs/</code> with 24h auto-expiry.
          </p>
        </div>

        <div className="p-3.5 rounded-xl bg-white border border-slate-200/80 shadow-flat space-y-1">
          <div className="flex items-center gap-1.5 font-semibold text-slate-900">
            <Lock className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <span>SHA-256 Gate</span>
          </div>
          <p className="text-[11px] text-slate-500 leading-normal">
            Cryptographic batch lock required before dispatch.
          </p>
        </div>
      </section>
    </div>
  );
}
