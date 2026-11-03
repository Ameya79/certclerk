"use client";

import React, { useState } from "react";
import { Sparkles, CheckCircle2, ShieldCheck, Scale, Award } from "lucide-react";

// Client-side rule cleaner matching the backend core/validators.py logic
function clientRulesClean(raw: string): string {
  if (!raw.trim()) return "";

  // Normalize spaces
  let s = raw.trim().replace(/\s+/g, " ");

  // Honorifics and particles lookup
  const honorifics: Record<string, string> = {
    "dr.": "Dr.",
    dr: "Dr.",
    "prof.": "Prof.",
    prof: "Prof.",
    "mr.": "Mr.",
    mr: "Mr.",
    "mrs.": "Mrs.",
    mrs: "Mrs.",
    "ms.": "Ms.",
    ms: "Ms.",
  };

  const particles = new Set(["de", "la", "le", "da", "di", "von", "van", "den", "der", "du"]);

  // Split on words while preserving delimiters (spaces, hyphens, apostrophes)
  const parts = s.split(/([\s\-'])/);
  const result: string[] = [];

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    if (part === " " || part === "-" || part === "'") {
      result.push(part);
      continue;
    }

    const lower = part.toLowerCase();
    if (honorifics[lower]) {
      result.push(honorifics[lower]);
    } else if (particles.has(lower) && i > 0 && i < parts.length - 1) {
      result.push(lower);
    } else if (lower.startsWith("mc") && lower.length > 2) {
      result.push("Mc" + lower[2].toUpperCase() + lower.slice(3));
    } else {
      result.push(lower.charAt(0).toUpperCase() + lower.slice(1));
    }
  }

  return result.join("");
}

function checkLetterInvariant(raw: string, clean: string): boolean {
  const norm = (str: string) => str.toLowerCase().replace(/[^a-z0-9]/g, "");
  return norm(raw) === norm(clean);
}

const PRESETS = [
  { label: "Messy Case & Quote", raw: "mrs. sARAH o'connor" },
  { label: "Long Name (Fit Test)", raw: "dr. alexander von humboldt-smith" },
  { label: "Uppercase & Particles", raw: "ELIZABETH DE LA ROSA" },
  { label: "Hyphenated French", raw: "jean-luc picard" },
];

export default function InteractiveSandbox() {
  const [inputName, setInputName] = useState("mrs. sARAh o'connor");

  const cleanedName = clientRulesClean(inputName);
  const invariantPassed = checkLetterInvariant(inputName, cleanedName);

  // Simulated PyMuPDF font fit calculation
  const charCount = cleanedName.length;
  let fitStatus = {
    badge: "100% Fit",
    color: "text-emerald-700 bg-emerald-50 border-emerald-200",
    description: "Standard scale (36pt) — fits standard Canva placeholder comfortably.",
    wrapMode: "Single Centered Line",
    scalePercent: 100,
  };

  if (charCount > 30) {
    fitStatus = {
      badge: "Two-Line Wrap",
      color: "text-blue-700 bg-blue-50 border-blue-200",
      description: "Auto-wrapped into 2 balanced lines — zero clipping or border collision.",
      wrapMode: "Two Centered Lines (Auto-Wrap)",
      scalePercent: 88,
    };
  } else if (charCount > 20) {
    fitStatus = {
      badge: "Auto-Scaled",
      color: "text-amber-800 bg-amber-50 border-amber-200",
      description: "Auto-scaled to 78% (28pt) — preserved on single line without frame overflow.",
      wrapMode: "Single Centered Line (Auto-Scaled)",
      scalePercent: 78,
    };
  }

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-8 space-y-6 shadow-flat hover:shadow-tactile transition-shadow">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
        <div>
          <h3 className="text-base font-semibold text-slate-950 tracking-tight flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
            <span>galeus Invariant & Auto-Fit Engine</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time verification: ensures strict letter identity{" "}
            <code className="font-mono text-slate-800 bg-slate-100 px-1 py-0.5 rounded text-[11px]">
              norm(raw) == norm(clean)
            </code>
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="font-pixel text-[10px] font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
            LOCAL ENGINE
          </span>
          <span className="font-pixel text-[10px] font-medium px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
            0 HALLUCINATIONS
          </span>
        </div>
      </div>

      {/* Preset Buttons */}
      <div className="space-y-2">
        <span className="text-xs font-medium text-slate-600 block">
          Preset test cases:
        </span>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((p) => (
            <button
              key={p.label}
              type="button"
              onClick={() => setInputName(p.raw)}
              className={`px-3 py-1.5 text-xs rounded-lg border transition-all duration-150 active:scale-[0.98] cursor-pointer ${
                inputName === p.raw
                  ? "bg-slate-950 text-white border-slate-950 font-medium shadow-flat"
                  : "bg-white hover:bg-slate-50 text-slate-700 border-slate-200"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Interactive 2-Column Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Left Side: Controls & Invariant Status */}
        <div className="space-y-4">
          <div>
            <label htmlFor="sandbox-raw-name" className="block text-xs font-semibold text-slate-900 mb-1.5">
              Raw Attendee Input (Type here to test)
            </label>
            <input
              id="sandbox-raw-name"
              type="text"
              value={inputName}
              onChange={(e) => setInputName(e.target.value)}
              placeholder="e.g. mrs. sARAH o'connor"
              className="w-full px-3.5 py-2.5 text-xs font-mono rounded-lg border border-slate-200 bg-white text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors shadow-flat"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Supports irregular casing, accents, particles, and honorifics.
            </p>
          </div>

          {/* Cleaned Invariant Output */}
          <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200/80 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-900">
                Standardized Output
              </span>
              {invariantPassed ? (
                <span className="text-[11px] font-pixel font-medium text-emerald-800 bg-emerald-100/70 border border-emerald-200 px-2 py-0.5 rounded flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>PASS: 100% INVARIANT</span>
                </span>
              ) : (
                <span className="text-[11px] font-pixel font-medium text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded">
                  MISMATCH DETECTED
                </span>
              )}
            </div>

            <div className="text-base font-semibold text-slate-950 font-sans tracking-tight">
              {cleanedName || <span className="text-slate-400 italic font-normal text-sm">Enter attendee name...</span>}
            </div>

            <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between text-xs text-slate-600">
              <span className="font-mono text-[11px] text-slate-500">
                Length: <strong className="text-slate-900">{charCount}</strong> characters
              </span>
              <span className={`font-mono text-[11px] font-medium px-2 py-0.5 rounded border ${fitStatus.color}`}>
                {fitStatus.badge} ({fitStatus.scalePercent}%)
              </span>
            </div>
          </div>

          <div className="flex items-start gap-2.5 p-3 rounded-lg bg-white border border-slate-200 text-xs text-slate-600 shadow-flat">
            <Scale className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong>PyMuPDF Fit Analysis:</strong> {fitStatus.description}
            </p>
          </div>
        </div>

        {/* Right Side: Realistic Certificate Canvas Preview (Geist Serif + Geist Sans) */}
        <div className="rounded-xl border border-slate-200 bg-gradient-to-b from-white to-slate-50/60 p-6 sm:p-8 text-center space-y-4 shadow-tactile relative overflow-hidden">
          {/* Elegant Corner Framing */}
          <div className="absolute top-2.5 left-2.5 w-3.5 h-3.5 border-t-2 border-l-2 border-slate-300" />
          <div className="absolute top-2.5 right-2.5 w-3.5 h-3.5 border-t-2 border-r-2 border-slate-300" />
          <div className="absolute bottom-2.5 left-2.5 w-3.5 h-3.5 border-b-2 border-l-2 border-slate-300" />
          <div className="absolute bottom-2.5 right-2.5 w-3.5 h-3.5 border-b-2 border-r-2 border-slate-300" />

          <div className="space-y-1">
            <div className="w-9 h-9 rounded-full bg-slate-950 text-white mx-auto flex items-center justify-center mb-2 shadow-tactile">
              <Award className="w-5 h-5 text-blue-400" />
            </div>
            <p className="font-serif text-sm font-semibold tracking-wide text-slate-900">
              Certificate of Excellence
            </p>
            <p className="text-xs text-slate-500 font-medium">
              This document is proudly presented to
            </p>
          </div>

          {/* Attendee Name Area (Dynamic font size, crisp Geist Sans) */}
          <div className="py-2 min-h-[64px] flex items-center justify-center">
            <h4
              className="font-bold text-slate-950 tracking-tight transition-all duration-150 leading-tight font-sans"
              style={{
                fontSize: charCount > 30 ? "1.25rem" : charCount > 20 ? "1.5rem" : "1.875rem",
              }}
            >
              {cleanedName || "Attendee Full Name"}
            </h4>
          </div>

          <p className="text-xs text-slate-500 max-w-xs mx-auto leading-normal">
            For outstanding achievement and active participation in the annual workshop.
          </p>

          <div className="pt-4 border-t border-slate-200/80 flex items-center justify-between text-[10px] font-mono text-slate-400">
            <span className="font-pixel text-[9px] text-blue-600">SEAL: GALEUS_VERIFIED</span>
            <span className="text-slate-600 font-medium">{fitStatus.wrapMode}</span>
            <span>PYMUPDF 1.28</span>
          </div>
        </div>
      </div>
    </div>
  );
}
