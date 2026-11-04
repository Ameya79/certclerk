"use client";

import React, { useState, useEffect } from "react";
import { Job, SmtpConfig } from "../lib/types";
import { sendJob, pauseSend, resumeSend } from "../lib/api";
import { Send, Pause, Play, AlertCircle, CheckCircle2, Loader2, ArrowRight, Server, ShieldCheck, Mail } from "lucide-react";

interface SendPanelProps {
  job: Job;
  onRefresh: () => void;
  onProceed: () => void;
}

export default function SendPanel({ job, onRefresh, onProceed }: SendPanelProps) {
  // SMTP credentials held in local component state ONLY (never saved to disk or logs)
  const [host, setHost] = useState("smtp.gmail.com");
  const [port, setPort] = useState(587);
  const [user, setUser] = useState("");
  const [password, setPassword] = useState("");
  const [sender, setSender] = useState("");

  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const recipients = job.recipients || [];
  const sendable = recipients.filter((r) => r.status !== "skipped" && r.email);
  const sentCount = recipients.filter((r) => r.status === "sent").length;
  const failedCount = recipients.filter((r) => r.status === "failed").length;
  const isDone = job.status === "done";
  const isSending = job.status === "sending";
  const isPaused = job.status === "paused";

  // Poll status while sending
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isSending) {
      timer = setInterval(() => {
        onRefresh();
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isSending, onRefresh]);

  const handleStartSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !password || !sender) {
      setError("Please fill in all SMTP credentials.");
      return;
    }

    setSending(true);
    setError(null);
    const smtp: SmtpConfig = {
      host: host.trim(),
      port: Number(port),
      user: user.trim(),
      password: password.trim(),
      sender: sender.trim(),
    };

    try {
      if (isPaused) {
        await resumeSend(job.job_id, smtp);
      } else {
        await sendJob(job.job_id, smtp);
      }
      onRefresh();
    } catch (err: any) {
      setError(err.message || "Sending failed to start.");
    } finally {
      setSending(false);
    }
  };

  const handlePause = async () => {
    try {
      await pauseSend(job.job_id);
      onRefresh();
    } catch (err: any) {
      alert("Pause failed: " + err.message);
    }
  };

  return (
    <div className="w-full space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-stretch">
        {/* Left Column: SMTP Credentials Setup (7 cols) */}
        <div className="md:col-span-7 bg-white border border-slate-200 rounded-xl p-5 sm:p-6 shadow-sm flex flex-col justify-between">
          <form onSubmit={handleStartSend} className="space-y-3.5">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-800">
                <Server className="w-4 h-4 text-indigo-600" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-900">SMTP Server Configuration</h4>
                <p className="text-[11px] text-slate-500">
                  In-memory only. Credentials are never written to disk, database, or logs.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div className="sm:col-span-2">
                <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  SMTP Host
                </label>
                <input
                  type="text"
                  value={host}
                  disabled={isSending || isDone}
                  onChange={(e) => setHost(e.target.value)}
                  placeholder="smtp.gmail.com"
                  className="w-full px-2.5 py-1.5 text-base sm:text-xs rounded-lg border border-slate-200 bg-white focus:border-slate-400 transition-colors font-mono disabled:bg-slate-50"
                />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  Port
                </label>
                <input
                  type="number"
                  value={port}
                  disabled={isSending || isDone}
                  onChange={(e) => setPort(Number(e.target.value))}
                  placeholder="587"
                  className="w-full px-2.5 py-1.5 text-base sm:text-xs rounded-lg border border-slate-200 bg-white focus:border-slate-400 transition-colors font-mono disabled:bg-slate-50"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  Username / Email
                </label>
                <input
                  type="email"
                  value={user}
                  disabled={isSending || isDone}
                  onChange={(e) => {
                    setUser(e.target.value);
                    if (!sender) setSender(e.target.value);
                  }}
                  placeholder="your.email@gmail.com"
                  className="w-full px-2.5 py-1.5 text-base sm:text-xs rounded-lg border border-slate-200 bg-white focus:border-slate-400 transition-colors font-mono disabled:bg-slate-50"
                />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  Password / App Password
                </label>
                <input
                  type="password"
                  value={password}
                  disabled={isSending || isDone}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="16-character app password"
                  className="w-full px-2.5 py-1.5 text-base sm:text-xs rounded-lg border border-slate-200 bg-white focus:border-slate-400 transition-colors font-mono disabled:bg-slate-50"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Sender From Address
              </label>
              <input
                type="email"
                value={sender}
                disabled={isSending || isDone}
                onChange={(e) => setSender(e.target.value)}
                placeholder="club@gmail.com"
                className="w-full px-2.5 py-1.5 text-base sm:text-xs rounded-lg border border-slate-200 bg-white focus:border-slate-400 transition-colors font-mono disabled:bg-slate-50"
              />
            </div>

            {error && (
              <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2">
                <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {!isDone && (
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={sending || isSending}
                  className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-black text-white font-medium text-xs flex items-center justify-center gap-2 transition-all duration-150 active:scale-95 cursor-pointer disabled:opacity-40 shadow-xs"
                >
                  {sending || isSending ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Active Dispatch in Progress...
                    </>
                  ) : isPaused ? (
                    <>
                      <Play className="w-3.5 h-3.5" />
                      Resume Dispatch Queue
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      Start Dispatching ({sendable.length} Messages)
                    </>
                  )}
                </button>
              </div>
            )}
          </form>

          <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
            <span>Paced at 1.5s/msg (rate limit safe)</span>
            <span>CRLF header sanitization on</span>
          </div>
        </div>

        {/* Right Column: Live Delivery Status & Diagnostics (5 cols) */}
        <div className="md:col-span-5 bg-white border border-slate-200 rounded-xl p-5 sm:p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-slate-700" />
                <h4 className="font-bold text-sm text-slate-900">Delivery Status</h4>
              </div>

              {isSending && (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-800 flex items-center gap-1">
                  <Loader2 className="w-3 h-3 animate-spin text-indigo-600" /> Live
                </span>
              )}
              {isPaused && (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                  Paused
                </span>
              )}
              {isDone && (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Completed
                </span>
              )}
              {!isSending && !isPaused && !isDone && (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                  Ready
                </span>
              )}
            </div>

            {/* Progress gauge */}
            <div className="space-y-1.5 my-4">
              <div className="flex justify-between text-xs font-medium text-slate-700">
                <span>{sentCount} of {sendable.length} sent</span>
                <span className="font-mono">{sendable.length > 0 ? Math.round((sentCount / sendable.length) * 100) : 0}%</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-slate-900 transition-all duration-200 rounded-full"
                  style={{
                    width: `${sendable.length > 0 ? (sentCount / sendable.length) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>

            {/* Live stats breakdown */}
            <div className="space-y-2 mt-4 text-xs">
              <div className="flex justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
                <span className="text-slate-600">Delivered Successfully</span>
                <span className="font-bold text-emerald-700">{sentCount}</span>
              </div>
              <div className="flex justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
                <span className="text-slate-600">Failed Delivery</span>
                <span className="font-bold text-red-600">{failedCount}</span>
              </div>
              <div className="flex justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
                <span className="text-slate-600">Remaining in Queue</span>
                <span className="font-bold text-slate-700">{Math.max(0, sendable.length - sentCount - failedCount)}</span>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100">
            {isSending && (
              <button
                type="button"
                onClick={handlePause}
                className="w-full py-2 px-3 rounded-lg border border-slate-200 hover:bg-slate-50 text-xs font-medium flex items-center justify-center gap-1.5 transition-all duration-150 active:scale-95 cursor-pointer text-slate-700"
              >
                <Pause className="w-3.5 h-3.5" /> Pause Sending
              </button>
            )}

            {isDone && (
              <button
                type="button"
                onClick={onProceed}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-medium flex items-center justify-center gap-1.5 transition-all duration-150 active:scale-95 cursor-pointer shadow-xs"
              >
                View Final Report & Downloads
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}

            {!isSending && !isDone && (
              <p className="text-[11px] text-slate-400 text-center">
                Press "Start Dispatching" to initiate the throttled delivery loop.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
