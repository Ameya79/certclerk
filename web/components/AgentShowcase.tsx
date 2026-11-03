"use client";

import React, { useState, useEffect } from "react";
import {
  FileSpreadsheet,
  Cpu,
  Scale,
  Send,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Lock,
  ArrowRight,
  Terminal,
  Zap,
  Award,
  RefreshCw,
} from "lucide-react";

export default function AgentShowcase() {
  const [activeStage, setActiveStage] = useState<number>(0);
  const [autoPlay, setAutoPlay] = useState<boolean>(true);

  const stages = [
    {
      id: "input",
      title: "01. Raw Messy Input",
      shortTitle: "Raw Input",
      badge: "THE CHAOS",
      icon: FileSpreadsheet,
      desc: "Typical unformatted spreadsheets from Google Forms or Eventbrite.",
    },
    {
      id: "agent",
      title: "02. Invariant Intercept",
      shortTitle: "Agent Invariant",
      badge: "ZERO HALLUCINATIONS",
      icon: Cpu,
      desc: "AI standardizes casing while Python guards enforce letter identity.",
    },
    {
      id: "fit",
      title: "03. Sub-Pixel Auto-Fit",
      shortTitle: "Canva Auto-Fit",
      badge: "CANVA BINDING",
      icon: Scale,
      desc: "PyMuPDF measures bounds, auto-scaling long text without clipping.",
    },
    {
      id: "dispatch",
      title: "04. Cryptographic Dispatch",
      shortTitle: "Safe Dispatch",
      badge: "CRASH-PROOF WAL",
      icon: Send,
      desc: "SHA-256 batch lock and in-memory SMTP prevent duplicate sends.",
    },
  ];

  // Auto-play timer (can be paused on user interaction)
  useEffect(() => {
    if (!autoPlay) return;
    const interval = setInterval(() => {
      setActiveStage((prev) => (prev + 1) % stages.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [autoPlay, stages.length]);

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl shadow-flat overflow-hidden transition-all">
      {/* Top Navigation Tabs */}
      <div className="border-b border-slate-200/80 bg-slate-50/80 px-3 py-2 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
          {stages.map((s, idx) => {
            const Icon = s.icon;
            const isActive = activeStage === idx;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => {
                  setAutoPlay(false);
                  setActiveStage(idx);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-2 transition-all duration-150 active:scale-[0.98] cursor-pointer whitespace-nowrap ${
                  isActive
                    ? "bg-slate-950 text-white shadow-tactile font-semibold"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? "text-blue-400" : "text-slate-500"}`} />
                <span>{s.shortTitle}</span>
                {isActive && (
                  <span className="font-pixel text-[9px] bg-blue-500/20 text-blue-300 px-1 py-0.2 rounded hidden sm:inline">
                    ACTIVE
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2 pr-1">
          <button
            type="button"
            onClick={() => setAutoPlay(!autoPlay)}
            className={`text-[10px] font-mono px-2 py-0.5 rounded border transition-colors cursor-pointer ${
              autoPlay
                ? "bg-blue-50 text-blue-700 border-blue-200"
                : "bg-slate-100 text-slate-500 border-slate-200"
            }`}
          >
            {autoPlay ? "● AUTO-PLAYING" : "PAUSED"}
          </button>
        </div>
      </div>

      {/* Main Interactive Stage Body */}
      <div className="p-5 sm:p-7 min-h-[360px] flex flex-col justify-between">
        {/* STAGE 1: RAW INPUT */}
        {activeStage === 0 && (
          <div className="space-y-4 animate-fade-in-up">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
              <div>
                <span className="font-pixel text-[10px] text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">
                  RAW INPUT SPREADSHEET
                </span>
                <h4 className="text-sm font-semibold text-slate-950 mt-1">
                  Attendee Roster with Inherent Real-World Noise
                </h4>
              </div>
              <span className="text-xs text-slate-500 font-mono">
                Showing 3 of 124 uncleaned rows
              </span>
            </div>

            {/* Mock Table */}
            <div className="rounded-xl border border-slate-200 overflow-x-auto text-xs font-mono shadow-flat">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 border-b border-slate-200 text-[11px]">
                    <th className="py-2.5 px-3 font-medium">ROW</th>
                    <th className="py-2.5 px-3 font-medium">RAW NAME STRING</th>
                    <th className="py-2.5 px-3 font-medium">EMAIL VALUE</th>
                    <th className="py-2.5 px-3 font-medium">RISK FACTOR</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800">
                  <tr className="bg-amber-50/30">
                    <td className="py-2.5 px-3 text-slate-400">#01</td>
                    <td className="py-2.5 px-3 font-semibold text-slate-950">
                      mrs. sARAh o&apos;connor
                    </td>
                    <td className="py-2.5 px-3 text-red-600 font-medium">
                      sarah.oconnor@gmial.com
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="inline-flex items-center gap-1 text-[10px] text-amber-700 bg-amber-100/70 px-1.5 py-0.5 rounded">
                        <AlertTriangle className="w-3 h-3 text-amber-600" /> Irregular Caps + Typo Domain
                      </span>
                    </td>
                  </tr>
                  <tr className="bg-blue-50/20">
                    <td className="py-2.5 px-3 text-slate-400">#02</td>
                    <td className="py-2.5 px-3 font-semibold text-slate-950">
                      Dr. Alexander von Humboldt-Smith
                    </td>
                    <td className="py-2.5 px-3 text-slate-600">
                      alex.humboldt@uni.edu
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="inline-flex items-center gap-1 text-[10px] text-blue-700 bg-blue-100/70 px-1.5 py-0.5 rounded">
                        <Scale className="w-3 h-3 text-blue-600" /> 32 Chars (Canva Frame Overflow)
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 text-slate-400">#03</td>
                    <td className="py-2.5 px-3 font-semibold text-slate-950">
                      jean-luc picard
                    </td>
                    <td className="py-2.5 px-3 text-slate-600">
                      captain@starfleet.org
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="inline-flex items-center gap-1 text-[10px] text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                        Lowercase Casing &amp; Missing Honorific Dot
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              <strong>The Problem:</strong> Spreadsheets from Google Forms or Eventbrite are filled with irregular casing, missing dots, and typo domains. Traditional tools blindly print these typos on certificates or crash during dispatch.
            </p>
          </div>
        )}

        {/* STAGE 2: INVARIANT INTERCEPT */}
        {activeStage === 1 && (
          <div className="space-y-4 animate-fade-in-up">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
              <div>
                <span className="font-pixel text-[10px] text-emerald-800 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
                  AGENT EXECUTION STREAM
                </span>
                <h4 className="text-sm font-semibold text-slate-950 mt-1">
                  Real-Time Invariant Verification &amp; Typo Repair
                </h4>
              </div>
              <span className="font-pixel text-xs text-emerald-700 font-medium">
                GUARD: norm(raw) == norm(clean)
              </span>
            </div>

            {/* Terminal Mockup */}
            <div className="rounded-xl bg-slate-950 text-slate-100 p-4 font-mono text-xs space-y-2 border border-slate-800 shadow-tactile">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2 text-[10px] text-slate-400">
                <span className="flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-blue-400" />
                  galeus_agent_engine.py
                </span>
                <span className="text-emerald-400 font-pixel">● RUNTIME GUARD ACTIVE</span>
              </div>

              <div className="space-y-1 pt-1 text-[11px] leading-relaxed">
                <p className="text-slate-400">
                  &gt; [INSPECTOR] Ingesting Row #01: &quot;mrs. sARAh o&apos;connor&quot;
                </p>
                <p className="text-blue-300">
                  &gt; [TRANSFORM] Standardized casing: <strong className="text-white">&quot;Mrs. Sarah O&apos;Connor&quot;</strong>
                </p>
                <p className="text-amber-300">
                  &gt; [REPAIR] Fixed common email domain typo: &quot;@gmial.com&quot; &rarr; <strong className="text-white">&quot;@gmail.com&quot;</strong>
                </p>
                <div className="p-2 rounded bg-emerald-950/40 border border-emerald-800/60 text-emerald-300 flex items-center justify-between mt-2">
                  <span>&gt; ASSERTION: norm(&quot;mrs. sARAh o&apos;connor&quot;) == norm(&quot;Mrs. Sarah O&apos;Connor&quot;)</span>
                  <span className="font-pixel text-[10px] bg-emerald-900/60 text-emerald-200 px-1.5 py-0.5 rounded border border-emerald-700">
                    PASS: 100% MATCH
                  </span>
                </div>
                <p className="text-slate-400 pt-1">
                  &gt; [VERIFIED] Zero letters invented, substituted, or dropped. Hallucination impossible.
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              <strong>The Guardrail:</strong> AI models are powerful at formatting but prone to hallucinations. galeus restricts AI strictly to capitalization and honorifics, running hard mathematical character identity checks before anything can generate.
            </p>
          </div>
        )}

        {/* STAGE 3: SUB-PIXEL AUTO-FIT */}
        {activeStage === 2 && (
          <div className="space-y-4 animate-fade-in-up">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
              <div>
                <span className="font-pixel text-[10px] text-blue-700 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded">
                  PYMUPDF BLUEPRINT BINDING
                </span>
                <h4 className="text-sm font-semibold text-slate-950 mt-1">
                  Dynamic Auto-Fitting Bounding Box Engine
                </h4>
              </div>
              <span className="text-xs text-blue-700 font-mono font-medium">
                Auto-Scaled 76% (No Border Collision)
              </span>
            </div>

            {/* Simulated Canvas with Bounding Box Overlay */}
            <div className="rounded-xl border border-slate-300 bg-gradient-to-b from-white to-slate-50/70 p-6 sm:p-8 text-center space-y-3 relative shadow-tactile overflow-hidden">
              {/* Corner Accents */}
              <div className="absolute top-2.5 left-2.5 w-3.5 h-3.5 border-t-2 border-l-2 border-slate-300" />
              <div className="absolute top-2.5 right-2.5 w-3.5 h-3.5 border-t-2 border-r-2 border-slate-300" />
              <div className="absolute bottom-2.5 left-2.5 w-3.5 h-3.5 border-b-2 border-l-2 border-slate-300" />
              <div className="absolute bottom-2.5 right-2.5 w-3.5 h-3.5 border-b-2 border-r-2 border-slate-300" />

              <div className="space-y-1">
                <Award className="w-5 h-5 text-blue-600 mx-auto mb-1" />
                <p className="font-serif text-xs font-semibold tracking-wide text-slate-700">
                  Certificate of Academic Achievement
                </p>
              </div>

              {/* Name Area with Simulated Bounding Box */}
              <div className="py-2 relative max-w-md mx-auto">
                <div className="border border-dashed border-blue-400 bg-blue-50/40 rounded-lg p-2.5 relative">
                  <span className="absolute -top-2 left-2 font-mono text-[9px] text-blue-700 bg-white px-1 border border-blue-200 rounded">
                    CANVA PLACEHOLDER FRAME [AGENT]
                  </span>
                  <h3 className="text-lg sm:text-xl font-bold text-slate-950 font-sans tracking-tight">
                    Dr. Alexander von Humboldt-Smith
                  </h3>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between text-[10px] font-mono text-slate-500 pt-2 border-t border-slate-200">
                <span>STANDARD: 36pt (OVERFLOW: +104px ❌)</span>
                <span className="text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                  RESOLVED: 27.4pt (76% AUTO-FIT ✅)
                </span>
                <span>MARGIN CLEARANCE: 100%</span>
              </div>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              <strong>The Fix:</strong> PyMuPDF calculates exact glyph collisions before stamping. If a long name exceeds bounds, galeus smoothly down-scales the font or splits onto two centered lines, preventing clipped ornate Canva borders.
            </p>
          </div>
        )}

        {/* STAGE 4: CRYPTOGRAPHIC DISPATCH */}
        {activeStage === 3 && (
          <div className="space-y-4 animate-fade-in-up">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
              <div>
                <span className="font-pixel text-[10px] text-blue-700 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded">
                  SAFE DISPATCH LEDGER
                </span>
                <h4 className="text-sm font-semibold text-slate-950 mt-1">
                  Cryptographic SHA-256 Approval Gate &amp; Write-Ahead Log
                </h4>
              </div>
              <span className="font-pixel text-xs text-blue-700 font-medium">
                WAL APPEND-ONLY
              </span>
            </div>

            {/* WAL & Gate Mockup */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              {/* Left: Fingerprint Gate */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-blue-600 shrink-0" />
                  <span className="font-semibold text-slate-900">Cryptographic Seal</span>
                </div>
                <p className="text-[11px] text-slate-500 font-mono break-all bg-white p-2 rounded border border-slate-200">
                  SHA-256: 8f3b2a90e4f8c14d9b7a...e12a
                </p>
                <div className="flex items-center gap-2 text-[11px] text-emerald-800 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Approved by Human Organizer</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Zero emails can dispatch without explicit approval. Any subsequent modification breaks the hash.
                </p>
              </div>

              {/* Right: Write-Ahead Log Progress */}
              <div className="p-4 rounded-xl bg-slate-950 text-slate-200 font-mono space-y-2 border border-slate-800 shadow-tactile">
                <div className="flex items-center justify-between text-[10px] text-slate-400 border-b border-slate-800 pb-1.5">
                  <span>DISPATCH LEDGER (RAM-ONLY SMTP)</span>
                  <span className="text-emerald-400">100% CRASH-SAFE</span>
                </div>
                <div className="space-y-1 text-[11px]">
                  <p className="text-emerald-400">
                    &gt; [WAL #01] SENT &rarr; Mrs. Sarah O&apos;Connor (134ms)
                  </p>
                  <p className="text-emerald-400">
                    &gt; [WAL #02] SENT &rarr; Dr. Alexander von Humboldt (148ms)
                  </p>
                  <p className="text-blue-300">
                    &gt; [WAL #03] SENDING &rarr; Elizabeth de la Rosa...
                  </p>
                </div>
                <p className="text-[10px] text-slate-400 pt-1 border-t border-slate-800">
                  Append-only WAL guarantees zero duplicate sends even on sudden Wi-Fi drops.
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              <strong>The Guarantee:</strong> Your SMTP credentials live in memory during dispatch only and are never saved to disk. If your connection drops, resumption is seamless without sending duplicates.
            </p>
          </div>
        )}

        {/* Bottom Stage Progress Indicator */}
        <div className="pt-4 mt-2 border-t border-slate-100 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            {stages.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setAutoPlay(false);
                  setActiveStage(idx);
                }}
                className={`h-1.5 rounded-full transition-all duration-200 cursor-pointer ${
                  activeStage === idx ? "w-8 bg-blue-600" : "w-2 bg-slate-200 hover:bg-slate-300"
                }`}
                aria-label={`Jump to stage ${idx + 1}`}
              />
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setAutoPlay(false);
                setActiveStage((prev) => (prev - 1 + stages.length) % stages.length);
              }}
              className="px-2.5 py-1 rounded-md text-slate-500 hover:text-slate-900 hover:bg-slate-100 text-xs transition-colors cursor-pointer"
            >
              Previous
            </button>
            <button
              type="button"
              onClick={() => {
                setAutoPlay(false);
                setActiveStage((prev) => (prev + 1) % stages.length);
              }}
              className="px-3 py-1 rounded-md bg-slate-900 hover:bg-blue-600 text-white text-xs font-medium transition-colors cursor-pointer flex items-center gap-1"
            >
              <span>Next Stage</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
