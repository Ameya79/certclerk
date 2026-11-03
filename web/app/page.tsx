"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import MotionGraphicPlayer from "../components/MotionGraphicPlayer";
import {
  ShieldCheck,
  Lock,
  Layers,
  ArrowRight,
  HardDrive,
  CheckCircle2,
  Sparkles,
  Zap,
} from "lucide-react";

export default function Home() {
  return (
    <div className="space-y-16 sm:space-y-20">
      {/* 1. HERO SECTION WITH ACCURATE STAGGERED INTRO ANIMATIONS */}
      <section aria-label="Introduction" className="text-center pt-2 sm:pt-6 space-y-6 max-w-4xl mx-auto">
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
          <strong className="text-slate-950 font-semibold">galeus</strong> is an agentic certificate workstation that standardizes attendee names, verifies mathematical letter invariants, auto-scales Canva typography, and dispatches via your SMTP only with human approval.
        </p>

        {/* Intro 4: Dual Action Buttons */}
        <div className="animate-intro-4 flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link
            href="/studio"
            className="w-full sm:w-auto px-7 py-4 rounded-xl bg-slate-950 hover:bg-blue-600 text-white font-medium text-sm flex items-center justify-center gap-2 transition-all duration-150 active:scale-[0.98] shadow-tactile hover:shadow-juicy"
          >
            <Layers className="w-4 h-4 shrink-0" />
            <span>Open Studio Workstation</span>
            <ArrowRight className="w-4 h-4 shrink-0" />
          </Link>

          <a
            href="#demo"
            className="w-full sm:w-auto px-7 py-4 rounded-xl bg-white hover:bg-slate-50 text-slate-800 border border-slate-200/90 font-medium text-sm flex items-center justify-center gap-2 transition-all duration-150 active:scale-[0.98] shadow-flat"
          >
            <Zap className="w-4 h-4 text-blue-600 shrink-0" />
            <span>Watch Motion Story</span>
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

      {/* 2. CENTERPIECE MOTION GRAPHIC AD (WHAT THE AGENT DOES FOR YOU) */}
      <section id="demo" aria-label="What The Agent Does" className="space-y-4">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-medium border border-blue-200/60">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>Interactive Motion Demonstration</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-950">
            What the galeus Agent Does For You
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 leading-normal max-w-xl mx-auto">
            From 15 hours of repetitive manual edits to an automated 5-step invariant flow: watch the agent inspect, clean, render, lock, and dispatch certificates without hallucinations.
          </p>
        </div>

        <MotionGraphicPlayer />
      </section>

      {/* 3. CALL TO ACTION BANNER (TRANSITION TO STUDIO) */}
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

      {/* 4. SEMANTIC FOOTER */}
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
          <a href="#demo" className="hover:text-blue-600 transition-colors">
            Motion Story
          </a>
          <span>•</span>
          <Link href="/studio" className="hover:text-blue-600 transition-colors">
            Studio Workstation
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
