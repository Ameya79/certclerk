"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import UploadForm from "../components/UploadForm";
import InteractiveSandbox from "../components/InteractiveSandbox";
import { getGlobalMetrics } from "../lib/api";
import { GlobalMetrics } from "../lib/types";
import {
  ShieldCheck,
  Scale,
  Lock,
  Layers,
  ArrowRight,
  HardDrive,
  CheckCircle2,
  FileCheck,
  Send,
  Eye,
  Sliders,
  Mail,
  FileSpreadsheet,
} from "lucide-react";

export default function Home() {
  const router = useRouter();
  const [metrics, setMetrics] = useState<GlobalMetrics | null>(null);

  useEffect(() => {
    getGlobalMetrics()
      .then((m) => setMetrics(m))
      .catch(() => {});
  }, []);

  const handleUploadSuccess = (jobId: string) => {
    router.push(`/jobs/${jobId}`);
  };

  return (
    <div className="space-y-16 sm:space-y-24">
      {/* 1. HERO SECTION */}
      <section aria-label="Introduction" className="text-center pt-4 sm:pt-10 space-y-6 max-w-4xl mx-auto">
        {/* Subtle Announcement Pill */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 border border-slate-200/80 text-xs font-medium text-slate-700 shadow-2xs">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
          <span>Local-First Certificate Automation</span>
          <span className="text-slate-300">•</span>
          <span className="text-slate-500 font-mono text-[11px]">Zero Hallucinations</span>
        </div>

        {/* Primary Headline in Geist Sans */}
        <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-slate-950 leading-[1.12]">
          One Canva template.<br />
          One messy sheet.<br />
          <span className="text-slate-400">Zero mistakes.</span>
        </h1>

        {/* Hero Subhead */}
        <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed font-normal">
          CertClerk turns unformatted attendee spreadsheets and Canva certificate PDFs into verified, personalized certificates—with mathematical name invariants, auto-scaling typography, and human approval before sending.
        </p>

        {/* Call to Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <a
            href="#studio"
            className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-medium text-sm flex items-center justify-center gap-2 transition-all duration-150 active:scale-[0.99] shadow-xs cursor-pointer"
          >
            <span>Launch Batch Studio</span>
            <ArrowRight className="w-4 h-4 shrink-0" />
          </a>

          <a
            href="#playground"
            className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-medium text-sm flex items-center justify-center gap-2 transition-all duration-150 active:scale-[0.99] shadow-2xs cursor-pointer"
          >
            <span>Try Interactive Playground</span>
          </a>
        </div>

        {/* Trust Badges Bar */}
        <div className="pt-6 border-t border-slate-200/70 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-medium text-slate-600">
          <div className="flex items-center justify-center gap-1.5">
            <HardDrive className="w-4 h-4 text-slate-800 shrink-0" />
            <span>100% On-Device</span>
          </div>
          <div className="flex items-center justify-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>Letter Invariant</span>
          </div>
          <div className="flex items-center justify-center gap-1.5">
            <Lock className="w-4 h-4 text-slate-800 shrink-0" />
            <span>SHA-256 Gate</span>
          </div>
          <div className="flex items-center justify-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>WAL Crash-Safe</span>
          </div>
        </div>
      </section>

      {/* 2. INTERACTIVE PLAYGROUND SHOWCASE */}
      <section id="playground" aria-label="Interactive Invariant Playground" className="space-y-4">
        <div className="text-center max-w-xl mx-auto space-y-2">
          <h2 className="text-2xl font-bold tracking-tight text-slate-950">
            See the Invariant Guard in action
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 leading-normal">
            Test any irregular attendee string. CertClerk repairs casing, particles, and honorifics while strictly guaranteeing letter identity.
          </p>
        </div>

        <InteractiveSandbox />
      </section>

      {/* 3. CORE ARCHITECTURAL GUARANTEES */}
      <section id="guarantees" aria-label="Architectural Guarantees" className="space-y-6">
        <div className="text-center max-w-xl mx-auto space-y-2">
          <h2 className="text-2xl font-bold tracking-tight text-slate-950">
            Engineered for zero tolerance errors
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 leading-normal">
            Most batch certificate tools silently misspell names, clip long text, or fail halfway through dispatches. CertClerk eliminates every failure mode with code-level guards.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Card 1 */}
          <article className="bg-white border border-slate-200 rounded-2xl p-6 space-y-3 shadow-xs hover:border-slate-300 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-800">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-slate-950 tracking-tight">
              Strict Mathematical Name Invariant
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              AI models are powerful at formatting, but prone to creative hallucinations. CertClerk wraps all formatting in a strict Python assertion: <code className="font-mono text-slate-800 bg-slate-100 px-1 py-0.5 rounded text-xs">norm(raw) == norm(clean)</code>. Alphanumeric letters cannot be added, omitted, or rearranged.
            </p>
          </article>

          {/* Card 2 */}
          <article className="bg-white border border-slate-200 rounded-2xl p-6 space-y-3 shadow-xs hover:border-slate-300 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-800">
              <Scale className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-slate-950 tracking-tight">
              Self-Correcting Font Fit Loop
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              PyMuPDF calculates exact bounding boxes before rendering. If a recipient has a long name, CertClerk automatically shrinks the font scale down to 60% or neatly splits the text onto two centered lines, preventing clipped borders and ruined Canva designs.
            </p>
          </article>

          {/* Card 3 */}
          <article className="bg-white border border-slate-200 rounded-2xl p-6 space-y-3 shadow-xs hover:border-slate-300 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-800">
              <Lock className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-slate-950 tracking-tight">
              Cryptographic Human Approval Gate
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Before a single email is dispatched, you review every row and preview generated PNG certificates. Locking the batch generates a cryptographic SHA-256 fingerprint. Any subsequent change automatically invalidates approval, guaranteeing zero accidental dispatches.
            </p>
          </article>

          {/* Card 4 */}
          <article className="bg-white border border-slate-200 rounded-2xl p-6 space-y-3 shadow-xs hover:border-slate-300 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-800">
              <HardDrive className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-slate-950 tracking-tight">
              100% Local & Ephemeral Storage
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Zero cloud databases, zero telemetry. Your templates and attendee data are stored in a local capability directory and automatically purged after 24 hours. Your SMTP credentials live in memory during dispatch only and are never saved to disk.
            </p>
          </article>
        </div>
      </section>

      {/* 4. THE 7-STEP WORKFLOW PROGRESSION */}
      <section id="workflow" aria-label="7-Step Workflow Progression" className="space-y-6">
        <div className="text-center max-w-xl mx-auto space-y-2">
          <h2 className="text-2xl font-bold tracking-tight text-slate-950">
            The 7-Step Verified Workflow
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 leading-normal">
            A linear, foolproof journey from raw files to verified dispatches.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3">
          {[
            { step: "01", title: "Ingest", desc: "Canva PDF & roster sheet", icon: FileSpreadsheet },
            { step: "02", title: "Review", desc: "Invariant & typo check", icon: Sliders },
            { step: "03", title: "Preview", desc: "High-res PNG renders", icon: Eye },
            { step: "04", title: "Draft", desc: "Personalized email template", icon: Mail },
            { step: "05", title: "Approve", desc: "SHA-256 batch lock", icon: Lock },
            { step: "06", title: "Dispatch", desc: "WAL crash-proof SMTP", icon: Send },
            { step: "07", title: "Report", desc: "ZIP archive & audit log", icon: FileCheck },
          ].map((item, idx) => (
            <div
              key={item.step}
              className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col justify-between text-left shadow-2xs hover:border-slate-300 transition-colors"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] font-bold text-slate-400">
                    {item.step}
                  </span>
                  <item.icon className="w-4 h-4 text-slate-600" />
                </div>
                <h4 className="text-xs font-semibold text-slate-900">
                  {item.title}
                </h4>
              </div>
              <p className="text-[11px] text-slate-500 mt-2 leading-tight">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* 5. BATCH STUDIO WORKSTATION (UPLOAD FORM) */}
      <section id="studio" aria-label="Batch Studio" className="space-y-6 pt-4">
        <div className="text-center max-w-xl mx-auto space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-medium mb-1">
            <Layers className="w-3.5 h-3.5" />
            <span>Local Studio Workstation</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-950">
            Create New Certificate Batch
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 leading-normal">
            Drop your single-page Canva PDF template and attendee spreadsheet below to begin.
          </p>
        </div>

        <div className="max-w-3xl mx-auto bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs">
          <UploadForm onSuccess={handleUploadSuccess} />
        </div>
      </section>

      {/* 6. SEMANTIC FOOTER */}
      <footer aria-label="Site Footer" className="pt-10 pb-8 border-t border-slate-200/80 text-center space-y-3 text-xs text-slate-500">
        <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-medium text-slate-600">
          <a href="#playground" className="hover:text-slate-900 transition-colors">
            Playground
          </a>
          <span>•</span>
          <a href="#guarantees" className="hover:text-slate-900 transition-colors">
            Guarantees
          </a>
          <span>•</span>
          <a href="#workflow" className="hover:text-slate-900 transition-colors">
            Workflow
          </a>
          <span>•</span>
          <a href="#studio" className="hover:text-slate-900 transition-colors">
            Studio
          </a>
          <span>•</span>
          <a
            href="https://github.com/Ameya79/certclerk"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-slate-900 transition-colors"
          >
            GitHub
          </a>
        </div>

        <p className="text-[11px] text-slate-400">
          CertClerk © {new Date().getFullYear()} • 100% On-Device Invariant Execution • Licensed under MIT
        </p>
      </footer>
    </div>
  );
}
