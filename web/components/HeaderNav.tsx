"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LlmStatus } from "../lib/types";
import { getLlmSettings } from "../lib/api";
import AiSettingsModal from "./AiSettingsModal";
import { Sparkles, ArrowRight, BookOpen, Layers } from "lucide-react";

export default function HeaderNav() {
  const pathname = usePathname();
  const [llmStatus, setLlmStatus] = useState<LlmStatus | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

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
      <nav aria-label="Main Navigation" className="flex items-center gap-2 sm:gap-3">
        {/* Nav Links */}
        <div className="hidden md:flex items-center gap-1 mr-1 text-xs font-medium text-slate-600">
          <Link
            href="/studio"
            className="px-3 py-1.5 rounded-lg hover:bg-slate-100/80 hover:text-slate-950 transition-colors"
          >
            Studio
          </Link>
        </div>

        {/* AI Engine Status Chip */}
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className={`px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-2 border transition-all duration-150 active:scale-[0.98] cursor-pointer shadow-flat ${
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
          <span className="font-medium">
            {isConfigured ? (llmStatus?.provider || "AI Engine") : "Rules Engine"}
          </span>
          <span
            className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${
              isConfigured
                ? "bg-blue-100/80 text-blue-700 border-blue-200"
                : "bg-slate-100 text-slate-500 border-slate-200"
            }`}
          >
            {isConfigured ? "ACTIVE" : "CONFIG"}
          </span>
        </button>

        {/* 100% On-Device Badge */}
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
            className="px-3.5 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 text-xs font-medium flex items-center gap-1.5 transition-all duration-150 active:scale-[0.98] shadow-flat shrink-0"
          >
            <BookOpen className="w-3.5 h-3.5 text-slate-600 shrink-0" />
            <span>Overview</span>
          </Link>
        ) : (
          <Link
            href="/studio"
            className="px-3.5 py-1.5 rounded-lg bg-slate-950 hover:bg-blue-600 text-white text-xs font-medium flex items-center gap-1.5 transition-all duration-150 active:scale-[0.98] shadow-tactile shrink-0"
          >
            <Layers className="w-3.5 h-3.5 shrink-0" />
            <span>Open Studio</span>
            <ArrowRight className="w-3.5 h-3.5 shrink-0" />
          </Link>
        )}
      </nav>

      <AiSettingsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onStatusChange={(newStatus) => setLlmStatus(newStatus)}
      />
    </>
  );
}
