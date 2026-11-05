"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { LlmStatus } from "../lib/types";
import { getLlmSettings, saveLlmSettings, testLlmSettings } from "../lib/api";
import {
  Sparkles,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Loader2,
  X,
  Zap,
  Eye,
  EyeOff,
  ShieldCheck,
} from "lucide-react";

interface AiSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStatusChange?: (status: LlmStatus) => void;
}

type ProviderPreset = "gemini" | "groq" | "ollama" | "custom";

const PRESETS: Record<
  ProviderPreset,
  {
    name: string;
    badge: string;
    baseUrl: string;
    defaultModel: string;
    keyLink?: string;
    keyLinkLabel?: string;
    description: string;
  }
> = {
  gemini: {
    name: "Google Gemini (Free)",
    badge: "Recommended",
    baseUrl: "https://generativelanguage.googleapis.com/v1beta/openai/",
    defaultModel: "gemini-3.6-flash",
    keyLink: "https://aistudio.google.com/app/apikey",
    keyLinkLabel: "Get Free Gemini API Key at Google AI Studio",
    description: "100% free tier. 1,500 requests/day, 15 RPM. No credit card required.",
  },
  groq: {
    name: "Groq Cloud (Free)",
    badge: "Ultra-Fast",
    baseUrl: "https://api.groq.com/openai/v1",
    defaultModel: "llama-3.3-70b-versatile",
    keyLink: "https://console.groq.com/keys",
    keyLinkLabel: "Get Free Groq API Key at Groq Console",
    description: "Blazing fast Llama 3.3 70B inference. Free tier with generous token allowance.",
  },
  ollama: {
    name: "Ollama (Local Offline)",
    badge: "100% Private",
    baseUrl: "http://localhost:11434/v1",
    defaultModel: "llama3.2",
    keyLink: "https://ollama.com",
    keyLinkLabel: "Download Ollama",
    description: "Runs completely on your local computer. Zero internet and zero API key needed.",
  },
  custom: {
    name: "Custom OpenAI Compatible",
    badge: "Advanced",
    baseUrl: "",
    defaultModel: "gpt-3.5-turbo",
    description: "Any provider implementing the standard OpenAI chat completions endpoint.",
  },
};

export default function AiSettingsModal({ isOpen, onClose, onStatusChange }: AiSettingsModalProps) {
  const [mounted, setMounted] = useState(false);
  const [activePreset, setActivePreset] = useState<ProviderPreset>("gemini");
  const [baseUrl, setBaseUrl] = useState(PRESETS.gemini.baseUrl);
  const [apiKey, setApiKey] = useState("");
  const [savedMaskedKey, setSavedMaskedKey] = useState("");
  const [model, setModel] = useState(PRESETS.gemini.defaultModel);
  const [persist, setPersist] = useState(true);
  const [showKey, setShowKey] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    ok: boolean;
    latency_ms?: number;
    error?: string;
    provider?: string;
  } | null>(null);

  const [saving, setSaving] = useState(false);
  const [savedBanner, setSavedBanner] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setTestResult(null);
      setSavedBanner(false);
      getLlmSettings()
        .then((s) => {
          if (s.base_url) {
            setBaseUrl(s.base_url);
            if (s.provider.includes("Gemini")) setActivePreset("gemini");
            else if (s.provider.includes("Groq")) setActivePreset("groq");
            else if (s.provider.includes("Ollama")) setActivePreset("ollama");
            else setActivePreset("custom");
          }
          if (s.model) setModel(s.model);
          if (s.masked_key) setSavedMaskedKey(s.masked_key);
        })
        .catch(() => {});
    }
  }, [isOpen]);

  if (!isOpen || !mounted) return null;

  const handleSelectPreset = (preset: ProviderPreset) => {
    setActivePreset(preset);
    const p = PRESETS[preset];
    setBaseUrl(p.baseUrl);
    setModel(p.defaultModel);
    setTestResult(null);
    setSavedBanner(false);
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    setSavedBanner(false);
    try {
      const res = await testLlmSettings({
        base_url: baseUrl.trim(),
        api_key: apiKey.trim() || undefined,
        model: model.trim(),
      });
      setTestResult(res);
    } catch (err: any) {
      setTestResult({ ok: false, error: err.message || "Failed to reach server" });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setSavedBanner(false);
    try {
      const res = await saveLlmSettings({
        base_url: baseUrl.trim(),
        api_key: apiKey.trim(),
        model: model.trim(),
        persist,
      });
      setSavedBanner(true);
      if (onStatusChange) onStatusChange(res.settings);
    } catch (err: any) {
      alert("Failed to save settings: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleClear = async () => {
    if (confirm("Reset to Rules-Only mode? AI requests will be bypassed.")) {
      setSaving(true);
      try {
        const res = await saveLlmSettings({
          base_url: "",
          api_key: "",
          model: "",
          persist: true,
        });
        setBaseUrl("");
        setApiKey("");
        setModel("");
        setTestResult(null);
        setSavedBanner(true);
        if (onStatusChange) onStatusChange(res.settings);
      } catch (err: any) {
        alert("Failed to reset: " + err.message);
      } finally {
        setSaving(false);
      }
    }
  };

  const currentPresetInfo = PRESETS[activePreset];

  return createPortal(
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-sm flex min-h-full items-center justify-center p-3 sm:p-4"
      onClick={onClose}
    >
      <div
        className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full my-auto shadow-2xl relative flex flex-col max-h-[calc(100vh-2rem)] overflow-hidden animate-fade-in-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - Fixed & Pinned at Top */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-800 shrink-0">
              <Sparkles className="w-4 h-4 text-indigo-600" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900 leading-tight">AI Agent Provider Settings</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">Configure free AI keys for name standardization & email drafting</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer shrink-0"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Body Container */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">

        {/* Preset Selector */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
            Select Free Provider Preset
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {(Object.keys(PRESETS) as ProviderPreset[]).map((key) => {
              const p = PRESETS[key];
              const isSelected = activePreset === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleSelectPreset(key)}
                  className={`p-2.5 rounded-lg border text-left flex flex-col justify-between transition-all duration-150 active:scale-95 cursor-pointer ${
                    isSelected
                      ? "border-slate-900 bg-slate-50 text-slate-900 font-semibold"
                      : "border-slate-200 hover:bg-slate-50/70 text-slate-700 font-medium"
                  }`}
                >
                  <span className="text-xs truncate block">{p.name.split(" ")[0]}</span>
                  <span
                    className={`text-[9px] font-medium px-1.5 py-0.5 rounded mt-1.5 w-fit ${
                      key === "gemini"
                        ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                        : "bg-slate-100 text-slate-600 border border-slate-200"
                    }`}
                  >
                    {p.badge}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Preset info note & link to get key */}
        <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs space-y-1">
          <p className="text-slate-700 leading-normal">{currentPresetInfo.description}</p>
          {currentPresetInfo.keyLink && (
            <a
              href={currentPresetInfo.keyLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-indigo-600 font-semibold hover:underline"
            >
              <span>{currentPresetInfo.keyLinkLabel}</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>

        {/* Inputs */}
        <div className="space-y-3">
          <div>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <label className="text-[11px] font-semibold text-slate-700 uppercase tracking-wider">
                  {activePreset === "gemini"
                    ? "Paste Gemini API Key"
                    : activePreset === "groq"
                    ? "Paste Groq API Key"
                    : "API Key"}
                </label>
                {savedMaskedKey && !apiKey && (
                  <span className="text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded font-medium inline-flex items-center gap-1">
                    <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" /> Active ({savedMaskedKey})
                  </span>
                )}
              </div>
              <span className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
                Model: <strong>{model || "gemini-3.6-flash"}</strong>
                {model !== currentPresetInfo.defaultModel && (
                  <button
                    type="button"
                    onClick={() => setModel(currentPresetInfo.defaultModel)}
                    className="text-indigo-600 underline ml-1 cursor-pointer font-sans"
                    title={`Reset to official ${currentPresetInfo.defaultModel}`}
                  >
                    (Reset to default)
                  </button>
                )}
              </span>
            </div>
            <div className="relative">
              <input
                type={showKey ? "text" : "password"}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder={
                  savedMaskedKey
                    ? `•••••••••••••••• (Saved key: ${savedMaskedKey} — leave blank to keep)`
                    : activePreset === "gemini"
                    ? "Paste your AIzaSy... key from Google AI Studio"
                    : activePreset === "groq"
                    ? "Paste your gsk_... key from Groq Console"
                    : activePreset === "ollama"
                    ? "Not needed for local Ollama"
                    : "Paste API key"
                }
                className="w-full pl-3 pr-8 py-2 text-base sm:text-xs rounded-lg border border-slate-300 bg-white font-mono focus:border-slate-500 transition-colors shadow-xs"
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                title={showKey ? "Hide key" : "Show key"}
              >
                {showKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
            {activePreset === "gemini" && (
              <p className="text-[11px] text-slate-500 mt-1">
                Google AI Studio keys work with all Gemini models automatically. galeus uses the fast free <code>gemini-3.6-flash</code> model.
              </p>
            )}
          </div>

          {/* Advanced Endpoint & Model Toggle */}
          <div className="pt-1">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-[11px] text-slate-500 hover:text-slate-800 underline font-medium cursor-pointer"
            >
              {showAdvanced ? "− Hide Endpoint & Model Settings" : "+ Customize Base URL or Model (Optional)"}
            </button>

            {showAdvanced && (
              <div className="mt-2.5 p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-2.5 animate-in fade-in duration-150">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                    Base URL (API Endpoint)
                  </label>
                  <input
                    type="text"
                    value={baseUrl}
                    onChange={(e) => setBaseUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full px-2.5 py-1.5 text-base sm:text-xs rounded-md border border-slate-200 bg-white font-mono focus:border-slate-400 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                    Model Identifier
                  </label>
                  <input
                    type="text"
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    placeholder="e.g. gemini-3.6-flash"
                    className="w-full px-2.5 py-1.5 text-base sm:text-xs rounded-md border border-slate-200 bg-white font-mono focus:border-slate-400 transition-colors"
                  />
                </div>
              </div>
            )}
          </div>

          <label className="flex items-center gap-2 cursor-pointer pt-0.5">
            <input
              type="checkbox"
              checked={persist}
              onChange={(e) => setPersist(e.target.checked)}
              className="rounded text-slate-900 focus:ring-0"
            />
            <span className="text-xs text-slate-600">
              Save to local <code>.env</code> file (persists across restarts)
            </span>
          </label>
        </div>

        {/* Live Test Feedback */}
        {testResult && (
          <div
            className={`p-3 rounded-lg border text-xs flex items-start gap-2.5 ${
              testResult.ok
                ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                : "bg-red-50 border-red-200 text-red-800"
            }`}
          >
            {testResult.ok ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            )}
            <div>
              <span className="font-semibold block">
                {testResult.ok ? "Connection Verified" : "Connection Failed"}
              </span>
              <span>
                {testResult.ok
                  ? `Successfully authenticated with ${testResult.provider || "provider"} (${testResult.latency_ms}ms ping).`
                  : testResult.error}
              </span>
            </div>
          </div>
        )}

        {savedBanner && (
          <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>AI settings saved and activated in real time!</span>
          </div>
        )}

        </div>

        {/* Action Buttons - Fixed & Pinned at Bottom */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 px-4 sm:px-5 py-3 sm:py-3.5 border-t border-slate-100 bg-slate-50/50 shrink-0">
          <button
            type="button"
            onClick={handleClear}
            className="text-xs text-slate-500 hover:text-slate-800 underline cursor-pointer text-center sm:text-left py-1"
          >
            Reset to Rules-Only
          </button>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={testing || !baseUrl}
              className="flex-1 sm:flex-none justify-center px-3 py-2 sm:py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-medium text-slate-700 flex items-center gap-1.5 transition-all duration-150 active:scale-95 cursor-pointer disabled:opacity-50 shadow-xs"
            >
              {testing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5 text-amber-500" />}
              <span>Test Key</span>
            </button>

            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="flex-1 sm:flex-none justify-center px-4 py-2 sm:py-1.5 rounded-lg bg-slate-900 hover:bg-black text-white text-xs font-medium flex items-center gap-1.5 transition-all duration-150 active:scale-95 cursor-pointer disabled:opacity-50 shadow-xs"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}
              <span>Save Configuration</span>
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
