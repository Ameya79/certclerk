"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
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
  BookOpen,
  FileText,
  Sparkles,
  HelpCircle,
  ExternalLink,
} from "lucide-react";

export default function Home() {
  return (
    <div className="space-y-20 sm:space-y-28">
      {/* 1. HERO SECTION WITH ACCURATE STAGGERED INTRO ANIMATIONS */}
      <section aria-label="Introduction" className="text-center pt-4 sm:pt-10 space-y-6 max-w-4xl mx-auto">
        {/* Intro 1: Status Pill */}
        <div className="animate-intro-1 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-100/90 border border-slate-200/90 text-xs font-medium text-slate-800 shadow-flat">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse shrink-0" />
          <span className="font-medium text-slate-900">galeus 1.0</span>
          <span className="text-slate-300">•</span>
          <span className="font-pixel text-[10px] text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200/60">
            ZERO HALLUCINATIONS
          </span>
        </div>

        {/* Intro 2: Main Headline in Geist Sans */}
        <h1 className="animate-intro-2 text-4xl sm:text-6xl font-bold tracking-tight text-slate-950 leading-[1.12]">
          One Canva template.<br />
          One messy sheet.<br />
          <span className="text-blue-600">Zero mistakes.</span>
        </h1>

        {/* Intro 3: Explanatory Subhead */}
        <p className="animate-intro-3 text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed font-normal">
          <strong className="text-slate-950 font-semibold">galeus</strong> is a local-first certificate workstation that turns unformatted attendee spreadsheets and Canva PDFs into verified, personalized certificates—with mathematical name invariants, auto-scaling typography, and human approval before sending.
        </p>

        {/* Intro 4: Dual Action Buttons */}
        <div className="animate-intro-4 flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link
            href="/studio"
            className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-slate-950 hover:bg-blue-600 text-white font-medium text-sm flex items-center justify-center gap-2 transition-all duration-150 active:scale-[0.98] shadow-tactile hover:shadow-juicy"
          >
            <Layers className="w-4 h-4 shrink-0" />
            <span>Open Studio Workstation</span>
            <ArrowRight className="w-4 h-4 shrink-0" />
          </Link>

          <a
            href="#guide"
            className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-medium text-sm flex items-center justify-center gap-2 transition-all duration-150 active:scale-[0.98] shadow-flat"
          >
            <BookOpen className="w-4 h-4 text-slate-500 shrink-0" />
            <span>Read How-To Documentation</span>
          </a>
        </div>

        {/* Intro 5: Trust Strip */}
        <div className="animate-intro-5 pt-8 border-t border-slate-200/80 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-medium text-slate-600">
          <div className="flex items-center justify-center gap-1.5">
            <HardDrive className="w-4 h-4 text-blue-600 shrink-0" />
            <span>100% On-Device</span>
          </div>
          <div className="flex items-center justify-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Letter Invariant</span>
          </div>
          <div className="flex items-center justify-center gap-1.5">
            <Lock className="w-4 h-4 text-blue-600 shrink-0" />
            <span>SHA-256 Gate</span>
          </div>
          <div className="flex items-center justify-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>WAL Crash-Safe</span>
          </div>
        </div>
      </section>

      {/* 2. COMPREHENSIVE HOW-TO-USE DOCUMENTATION */}
      <section id="guide" aria-label="Documentation and How-To Guide" className="space-y-12">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-medium border border-blue-200/60">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Comprehensive Documentation</span>
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-950">
            How to Use galeus
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            Follow this guide to prepare your Canva template, format attendee sheets, review invariants, and safely dispatch bulk certificates.
          </p>
        </div>

        {/* Step-by-Step Documentation Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Guide Step 1: Canva Blueprint */}
          <article className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-7 space-y-4 shadow-flat hover:shadow-tactile transition-all">
            <div className="flex items-center justify-between">
              <span className="font-pixel text-[11px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200/60">
                STEP 01
              </span>
              <FileText className="w-4 h-4 text-slate-400" />
            </div>

            <h3 className="text-base font-semibold text-slate-950 tracking-tight">
              Preparing Your Canva PDF Template
            </h3>

            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Design your certificate layout normally in Canva. In the text box where the recipient name should appear, type your placeholder word (default: <code className="font-mono text-slate-800 bg-slate-100 px-1 py-0.5 rounded text-xs">AGENT</code>).
            </p>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2 text-xs text-slate-600">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>Export as PDF Standard</strong> (single page, &le; 5MB).</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span>Keep the placeholder text centered so auto-fit balances names properly.</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span>(Optional) Upload your matching font (<code className="font-mono text-[11px]">.ttf</code> or <code className="font-mono text-[11px]">.otf</code>) in the studio.</span>
              </div>
            </div>
          </article>

          {/* Guide Step 2: Attendee Spreadsheet */}
          <article className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-7 space-y-4 shadow-flat hover:shadow-tactile transition-all">
            <div className="flex items-center justify-between">
              <span className="font-pixel text-[11px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200/60">
                STEP 02
              </span>
              <FileSpreadsheet className="w-4 h-4 text-slate-400" />
            </div>

            <h3 className="text-base font-semibold text-slate-950 tracking-tight">
              Formatting the Attendee Spreadsheet
            </h3>

            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              galeus ingests raw <code className="font-mono text-slate-800 bg-slate-100 px-1 py-0.5 rounded text-xs">.csv</code> and <code className="font-mono text-slate-800 bg-slate-100 px-1 py-0.5 rounded text-xs">.xlsx</code> spreadsheets. Column names like <code className="font-mono text-xs">name</code>, <code className="font-mono text-xs">full_name</code>, <code className="font-mono text-xs">email</code>, and <code className="font-mono text-xs">e-mail</code> are automatically detected.
            </p>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2 text-xs text-slate-600">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>No manual cleanup needed</strong>: Irregular casing (<code className="font-mono text-[11px]">mrs. sARAh o'connor</code>) is auto-fixed.</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span>Duplicate emails and common domain typos (<code className="font-mono text-[11px]">gmial.com</code>) are flagged.</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span>Supports up to 2,000 attendees per batch with zero memory lag.</span>
              </div>
            </div>
          </article>

          {/* Guide Step 3: Invariant Guard & Human Review */}
          <article className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-7 space-y-4 shadow-flat hover:shadow-tactile transition-all">
            <div className="flex items-center justify-between">
              <span className="font-pixel text-[11px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200/60">
                STEP 03
              </span>
              <ShieldCheck className="w-4 h-4 text-slate-400" />
            </div>

            <h3 className="text-base font-semibold text-slate-950 tracking-tight">
              The Strict Name Invariant & Review Table
            </h3>

            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              AI models frequently hallucinate or modify letters. In galeus, an unbypassable Python rule checks <code className="font-mono text-slate-800 bg-slate-100 px-1 py-0.5 rounded text-xs">norm(raw) == norm(clean)</code>. Alphanumeric characters cannot be inserted, altered, or dropped.
            </p>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2 text-xs text-slate-600">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>Inline editing</strong>: Double-click any cell in Step 2 to manually override names.</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span>Skip individual attendees with a single toggle if their data is invalid.</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span>Full audit comparison showing original vs cleaned strings side-by-side.</span>
              </div>
            </div>
          </article>

          {/* Guide Step 4: Font Fitting Loop */}
          <article className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-7 space-y-4 shadow-flat hover:shadow-tactile transition-all">
            <div className="flex items-center justify-between">
              <span className="font-pixel text-[11px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200/60">
                STEP 04
              </span>
              <Scale className="w-4 h-4 text-slate-400" />
            </div>

            <h3 className="text-base font-semibold text-slate-950 tracking-tight">
              Self-Correcting Sub-Pixel Font Fitting
            </h3>

            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              PyMuPDF calculates glyph bounding boxes to ensure names fit inside the placeholder region without clipping ornate certificate borders.
            </p>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2 text-xs text-slate-600">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>Auto-Scaling</strong>: Font size dynamically scales down to 60% if text is wide.</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>Two-Line Wrapping</strong>: Very long names split gracefully across two centered lines.</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span>Step 3 displays high-res PNG previews with visual badges for all scaled certificates.</span>
              </div>
            </div>
          </article>

          {/* Guide Step 5: Email Customization */}
          <article className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-7 space-y-4 shadow-flat hover:shadow-tactile transition-all">
            <div className="flex items-center justify-between">
              <span className="font-pixel text-[11px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200/60">
                STEP 05
              </span>
              <Mail className="w-4 h-4 text-slate-400" />
            </div>

            <h3 className="text-base font-semibold text-slate-950 tracking-tight">
              Personalized Email Composition
            </h3>

            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              In Step 4, craft the email that each attendee receives with their personalized PDF attached.
            </p>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2 text-xs text-slate-600">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span>Use variable merge chips like <code className="font-mono text-[11px]">{'{name}'}</code> and <code className="font-mono text-[11px]">{'{event}'}</code> in subject and body.</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span>One-click AI drafting generates professional, personalized templates in seconds.</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span>Instant live preview shows exactly how the email renders for the first recipient.</span>
              </div>
            </div>
          </article>

          {/* Guide Step 6: SHA-256 Gate & Crash-Safe SMTP */}
          <article className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-7 space-y-4 shadow-flat hover:shadow-tactile transition-all">
            <div className="flex items-center justify-between">
              <span className="font-pixel text-[11px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200/60">
                STEP 06 & 07
              </span>
              <Send className="w-4 h-4 text-slate-400" />
            </div>

            <h3 className="text-base font-semibold text-slate-950 tracking-tight">
              Approval Lock, Secure SMTP & ZIP Export
            </h3>

            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Step 5 locks the batch with a cryptographic SHA-256 fingerprint. Zero emails can leave your computer without explicit human approval.
            </p>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2 text-xs text-slate-600">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>In-Memory Credentials</strong>: SMTP details exist only in RAM during dispatch; never written to disk.</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>Write-Ahead Logging (WAL)</strong>: Recovers from dropped Wi-Fi with zero duplicate sends.</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span>Download all certificates as a single ZIP and inspect the CSV audit trail.</span>
              </div>
            </div>
          </article>
        </div>
      </section>

      {/* 3. CORE ARCHITECTURAL GUARANTEES */}
      <section id="guarantees" aria-label="Architectural Guarantees" className="space-y-6">
        <div className="text-center max-w-xl mx-auto space-y-2">
          <h2 className="text-2xl font-bold tracking-tight text-slate-950">
            Engineered for Zero Tolerance Errors
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 leading-normal">
            Eliminating name misspellings, canvas collisions, and duplicate email dispatches with code-level assertions.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <article className="bg-white border border-slate-200/90 rounded-2xl p-6 space-y-3 shadow-flat hover:shadow-tactile hover:border-blue-200 transition-all">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-slate-950 tracking-tight">
              Strict Mathematical Name Invariant
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              AI models are powerful at formatting, but prone to creative hallucinations. galeus wraps all formatting in a strict Python assertion: <code className="font-mono text-slate-800 bg-slate-100 px-1 py-0.5 rounded text-xs">norm(raw) == norm(clean)</code>. Alphanumeric letters cannot be added, omitted, or rearranged.
            </p>
          </article>

          <article className="bg-white border border-slate-200/90 rounded-2xl p-6 space-y-3 shadow-flat hover:shadow-tactile hover:border-blue-200 transition-all">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
              <Scale className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-slate-950 tracking-tight">
              Self-Correcting Font Fit Loop
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              PyMuPDF calculates exact bounding boxes before rendering. If a recipient has a long name, galeus automatically shrinks font scale down to 60% or neatly splits the text onto two centered lines, preventing clipped borders and ruined Canva designs.
            </p>
          </article>

          <article className="bg-white border border-slate-200/90 rounded-2xl p-6 space-y-3 shadow-flat hover:shadow-tactile hover:border-blue-200 transition-all">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
              <Lock className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-slate-950 tracking-tight">
              Cryptographic Human Approval Gate
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Before a single email is dispatched, you review every row and preview generated PNG certificates. Locking the batch generates a cryptographic SHA-256 fingerprint. Any subsequent change automatically invalidates approval, guaranteeing zero accidental dispatches.
            </p>
          </article>

          <article className="bg-white border border-slate-200/90 rounded-2xl p-6 space-y-3 shadow-flat hover:shadow-tactile hover:border-blue-200 transition-all">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
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

      {/* 4. CALL TO ACTION BANNER (TRANSITION TO STUDIO) */}
      <section aria-label="Launch Studio Call to Action" className="bg-gradient-to-b from-slate-950 to-slate-900 rounded-3xl p-8 sm:p-12 text-center text-white space-y-5 shadow-juicy">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-400/20 text-xs font-medium text-blue-300">
          <Sparkles className="w-3.5 h-3.5 text-blue-400" />
          <span>Ready to Process Certificates?</span>
        </div>

        <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-white max-w-xl mx-auto">
          Start your certificate batch in the galeus studio.
        </h2>

        <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
          Upload your single-page Canva PDF and attendee list to generate, preview, and dispatch in minutes.
        </p>

        <div className="pt-2">
          <Link
            href="/studio"
            className="inline-flex items-center gap-2 px-7 py-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm transition-all duration-150 active:scale-[0.98] shadow-tactile cursor-pointer"
          >
            <Layers className="w-4 h-4 shrink-0" />
            <span>Open Studio Workstation</span>
            <ArrowRight className="w-4 h-4 shrink-0" />
          </Link>
        </div>
      </section>

      {/* 5. SEMANTIC FOOTER */}
      <footer aria-label="Site Footer" className="pt-10 pb-8 border-t border-slate-200/80 text-center space-y-3 text-xs text-slate-500">
        <div className="flex items-center justify-center mb-2">
          <Image
            src="/galeus-logo.png"
            alt="galeus"
            width={100}
            height={33}
            className="h-6 w-auto opacity-70 hover:opacity-100 transition-opacity"
          />
        </div>

        <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-medium text-slate-600">
          <a href="#guide" className="hover:text-blue-600 transition-colors">
            Documentation & How-To
          </a>
          <span>•</span>
          <a href="#guarantees" className="hover:text-blue-600 transition-colors">
            Guarantees
          </a>
          <span>•</span>
          <Link href="/studio" className="hover:text-blue-600 transition-colors">
            Studio
          </Link>
          <span>•</span>
          <a
            href="https://github.com/Ameya79/certclerk"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-blue-600 transition-colors"
          >
            GitHub
          </a>
        </div>

        <p className="text-[11px] text-slate-400">
          galeus © {new Date().getFullYear()} • 100% On-Device Invariant Execution • Licensed under MIT
        </p>
      </footer>
    </div>
  );
}
