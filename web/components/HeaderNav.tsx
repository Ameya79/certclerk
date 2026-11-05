"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LlmStatus } from "../lib/types";
import { getLlmSettings } from "../lib/api";
import AiSettingsModal from "./AiSettingsModal";
import HowToUseModal from "./HowToUseModal";
import { Sparkles, ArrowRight, BookOpen, Layers, HelpCircle } from "lucide-react";

export default function HeaderNav() {
  const pathname = usePathname();
  const [llmStatus, setLlmStatus] = useState<LlmStatus | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  const isStudioPage = pathname === "/studio";

  const fetchStatus = () => {
    getLlmSettings()
      .then((s) => setLlmStatus(s))
      .catch(() => {});
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const isConfigured = llmStatus?.configured;

  return (
    <>
      <nav aria-label="Main Navigation" className="flex items-center gap-1.5 sm:gap-2.5">
        {/* How to Use Layman Guide Button */}
        <button
          type="button"
          onClick={() => setIsHelpOpen(true)}
          className="h-8 sm:h-9 px-2 sm:px-3 rounded-lg text-xs font-medium text-slate-700 hover:text-slate-950 bg-slate-50 hover:bg-slate-100/80 border border-slate-200/90 transition-all duration-150 active:scale-[0.98] flex items-center gap-1.5 cursor-pointer shrink-0 whitespace-nowrap shadow-flat"
          title="Quick Layman Guide: Canva template, Excel format, Gemini key & SMTP"
        >
          <HelpCircle className="w-3.5 h-3.5 text-blue-600 shrink-0" />
          <span className="hidden sm:inline">How to Use</span>
          <span className="sm:hidden">Guide</span>
        </button>

        {/* AI Engine Status Chip */}
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className={`h-8 sm:h-9 px-2 sm:px-3 rounded-lg text-xs font-medium flex items-center gap-1.5 border transition-all duration-150 active:scale-[0.98] cursor-pointer shrink-0 whitespace-nowrap shadow-flat ${
            isConfigured
              ? "bg-blue-50 text-blue-900 border-blue-200 hover:bg-blue-100/80"
              : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-slate-300"
          }`}
          title="Click to configure AI keys (Gemini / Groq / Ollama / Rules)"
        >
          <Sparkles
            className={`w-3.5 h-3.5 shrink-0 ${
              isConfigured ? "text-blue-600" : "text-slate-400"
            }`}
          />
          {/* Desktop expanded status */}
          <span className="font-medium hidden sm:inline">
            {isConfigured ? (llmStatus?.provider || "AI Engine") : "Rules Engine"}
          </span>
          <span
            className={`hidden sm:inline-block text-[10px] font-mono px-1.5 py-0.5 rounded border ${
              isConfigured
                ? "bg-blue-100/80 text-blue-700 border-blue-200"
                : "bg-slate-100 text-slate-500 border-slate-200"
            }`}
          >
            {isConfigured ? "ACTIVE" : "CONFIG"}
          </span>

          {/* Clean phone-optimized indicator: single line, zero wrapping, live dot */}
          <span className="sm:hidden font-mono text-[11px] font-semibold flex items-center gap-1">
            <span>{isConfigured ? "AI" : "Keys"}</span>
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isConfigured ? "bg-emerald-500 animate-pulse" : "bg-amber-400"
              }`}
            />
          </span>
        </button>

        {/* 100% On-Device Badge (Desktop only) */}
        <div className="hidden sm:flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-xl bg-emerald-50/70 border border-emerald-200/80 text-emerald-900 shadow-flat">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse shrink-0" />
          <span className="font-mono text-[11px] font-semibold tracking-tight text-emerald-800">
            100% ON-DEVICE
          </span>
        </div>

        {/* Page Switcher CTA Button */}
        {isStudioPage ? (
          <Link
            href="/"
            className="h-8 sm:h-9 px-2.5 sm:px-3.5 rounded-lg bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 text-xs font-medium flex items-center gap-1.5 transition-all duration-150 active:scale-[0.98] shadow-flat shrink-0 whitespace-nowrap"
          >
            <BookOpen className="w-3.5 h-3.5 text-slate-600 shrink-0" />
            <span className="hidden sm:inline">Overview</span>
            <span className="sm:hidden">Home</span>
          </Link>
        ) : (
          <Link
            href="/studio"
            className="h-8 sm:h-9 px-2.5 sm:px-3.5 rounded-lg bg-slate-950 hover:bg-blue-600 text-white text-xs font-medium flex items-center gap-1.5 transition-all duration-150 active:scale-[0.98] shadow-tactile shrink-0 whitespace-nowrap"
          >
            <Layers className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden sm:inline">Open Studio</span>
            <span className="sm:hidden">Studio</span>
            <ArrowRight className="w-3.5 h-3.5 shrink-0 hidden sm:inline" />
          </Link>
        )}
      </nav>

      <AiSettingsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onStatusChange={(newStatus) => setLlmStatus(newStatus)}
      />

      <HowToUseModal
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
      />
    </>
  );
}
