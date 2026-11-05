"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import MotionGraphicPlayer from "../components/MotionGraphicPlayer";
import RailwaySplitFlap from "../components/RailwaySplitFlap";
import {
  ShieldCheck,
  Lock,
  Layers,
  ArrowRight,
  HardDrive,
  CheckCircle2,
  Sparkles,
} from "lucide-react";

export default function Home() {
  return (
    <div className="space-y-10 sm:space-y-16">
      {/* 1. HERO SECTION WITH ACCURATE STAGGERED INTRO ANIMATIONS */}
      <section aria-label="Introduction" className="text-center pt-1 sm:pt-6 space-y-4 sm:space-y-6 max-w-4xl mx-auto px-1 sm:px-0">
        {/* Intro 1: Status Pill */}
        <div className="animate-intro-1 inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-1 sm:py-1.5 rounded-full bg-slate-100/90 border border-slate-200/90 text-[11px] sm:text-xs font-medium text-slate-800 shadow-flat">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse shrink-0" />
          <span className="font-medium text-slate-900">galeus 1.0</span>
          <span className="text-slate-300">•</span>
          <span className="font-pixel text-[9px] sm:text-[10px] text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200/60">
            ZERO MISTAKES
          </span>
        </div>

        {/* Intro 2: Railway-Style Mechanical Split-Flap Billboard in Vercel Geist Mono */}
        <div className="animate-intro-2 my-2 sm:my-4">
          <RailwaySplitFlap />
        </div>

        {/* Intro 3: Explanatory Subhead */}
        <p className="animate-intro-3 text-xs sm:text-base md:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed font-normal px-2">
          <strong className="text-slate-950 font-semibold">galeus</strong> is an agentic certificate workstation that standardizes attendee names with zero typos, auto-scales Canva typography to fit perfectly, and dispatches via your SMTP only with human approval.
        </p>

        {/* Intro 4: Single Focused Action Button */}
        <div className="animate-intro-4 flex items-center justify-center pt-1 sm:pt-2">
          <Link
            href="/studio"
            className="w-full sm:w-auto px-6 sm:px-8 py-3.5 sm:py-4 rounded-xl bg-slate-950 hover:bg-blue-600 text-white font-medium text-xs sm:text-sm flex items-center justify-center gap-2 transition-all duration-150 active:scale-[0.98] shadow-tactile hover:shadow-juicy"
          >
            <Layers className="w-4 h-4 shrink-0" />
            <span>Open Studio Workstation</span>
            <ArrowRight className="w-4 h-4 shrink-0" />
          </Link>
        </div>

        {/* Intro 5: Trust Strip */}
        <div className="animate-intro-5 pt-4 sm:pt-8 border-t border-slate-200/80 grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 text-[10px] sm:text-xs font-medium text-slate-600">
          <div className="flex items-center justify-center gap-1.5">
            <HardDrive className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600 shrink-0" />
            <span>100% On-Device</span>
          </div>
          <div className="flex items-center justify-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600 shrink-0" />
            <span>Exact Name Accuracy</span>
          </div>
          <div className="flex items-center justify-center gap-1.5">
            <Lock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600 shrink-0" />
            <span>SHA-256 Gate</span>
          </div>
          <div className="flex items-center justify-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600 shrink-0" />
            <span>Crash-Proof Progress</span>
          </div>
        </div>
      </section>

      {/* 2. CENTERPIECE MOTION GRAPHIC AD (CLEAN & DIRECT) */}
      <section aria-label="Product Demonstration" className="pt-2">
        <MotionGraphicPlayer />
      </section>

      {/* 3. CALL TO ACTION BANNER (TRANSITION TO STUDIO) */}
      <section aria-label="Launch Studio Call to Action" className="bg-gradient-to-b from-slate-950 to-slate-900 rounded-2xl sm:rounded-3xl p-6 sm:p-12 text-center text-white space-y-4 sm:space-y-5 shadow-juicy">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-400/20 text-xs font-medium text-blue-300">
          <Sparkles className="w-3.5 h-3.5 text-blue-400" />
          <span>Ready to Process Certificates?</span>
        </div>

        <h2 className="text-xl sm:text-3xl md:text-4xl font-bold tracking-tight text-white max-w-xl mx-auto">
          Start your certificate batch in the galeus studio.
        </h2>

        <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
          Upload your single-page Canva PDF and attendee list to generate, preview, and dispatch in minutes.
        </p>

        <div className="pt-2">
          <Link
            href="/studio"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm transition-all duration-150 active:scale-[0.98] shadow-tactile cursor-pointer"
          >
            <Layers className="w-4 h-4 shrink-0" />
            <span>Open Studio Workstation</span>
            <ArrowRight className="w-4 h-4 shrink-0" />
          </Link>
        </div>
      </section>
    </div>
  );
}
