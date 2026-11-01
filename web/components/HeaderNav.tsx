"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { LlmStatus } from "../lib/types";
import { getLlmSettings } from "../lib/api";
import AiSettingsModal from "./AiSettingsModal";
import { Sparkles, ShieldCheck, ArrowRight, Laptop } from "lucide-react";

export default function HeaderNav() {
  const [llmStatus, setLlmStatus] = useState<LlmStatus | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

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
            href="/#playground"
            className="px-3 py-1.5 rounded-lg hover:bg-slate-100 hover:text-slate-900 transition-colors"
          >
            Playground
          </Link>
          <Link
            href="/#guarantees"
            className="px-3 py-1.5 rounded-lg hover:bg-slate-100 hover:text-slate-900 transition-colors"
          >
            Guarantees
          </Link>
          <Link
            href="/#workflow"
            className="px-3 py-1.5 rounded-lg hover:bg-slate-100 hover:text-slate-900 transition-colors"
          >
            Workflow
          </Link>
        </div>

        {/* AI Provider Status Button */}
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 border transition-all duration-150 active:scale-[0.98] cursor-pointer shadow-2xs ${
            isConfigured
              ? "bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100/60"
              : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-slate-300"
          }`}
          title="Click to configure AI keys (Gemini / Groq / Ollama / Rules)"
        >
          <Sparkles
            className={`w-3.5 h-3.5 shrink-0 ${
              isConfigured ? "text-emerald-600" : "text-slate-400"
            }`}
          />
          <span className="truncate max-w-[110px] sm:max-w-none">
            {isConfigured ? (
              <span className="font-semibold">{llmStatus?.provider || "AI Ready"}</span>
            ) : (
              <span>Rules-Only Engine</span>
            )}
          </span>
          <span className="text-[10px] text-slate-400 font-mono border-l border-slate-200 pl-1.5 ml-0.5">
            Config
          </span>
        </button>

        {/* Local Device Indicator */}
        <div className="hidden lg:flex items-center gap-1.5 text-xs text-slate-600 px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200/80">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
          <span className="font-medium text-slate-700">100% On-Device</span>
        </div>

        {/* Launch Studio CTA */}
        <a
          href="/#studio"
          className="px-3.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium flex items-center gap-1.5 transition-all duration-150 active:scale-[0.98] shadow-2xs shrink-0 cursor-pointer"
        >
          <span>Launch Studio</span>
          <ArrowRight className="w-3.5 h-3.5 shrink-0" />
        </a>
      </nav>

      <AiSettingsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onStatusChange={(newStatus) => setLlmStatus(newStatus)}
      />
    </>
  );
}
