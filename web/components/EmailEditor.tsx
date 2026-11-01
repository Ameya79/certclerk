"use client";

import React, { useState } from "react";
import { Job } from "../lib/types";
import { updateEmailTemplate, draftEmail } from "../lib/api";
import { Sparkles, Eye, ArrowRight, Loader2, Info } from "lucide-react";

interface EmailEditorProps {
  job: Job;
  onRefresh: () => void;
  onProceed: () => void;
}

export default function EmailEditor({ job, onRefresh, onProceed }: EmailEditorProps) {
  const [subject, setSubject] = useState(job.subject || "Your Certificate of Participation");
  const [body, setBody] = useState(
    job.body || "Dear {name},\n\nThank you for participating! Please find your certificate attached.\n\nBest regards,\nThe Event Team"
  );
  const [eventName, setEventName] = useState("Workshop");
  const [drafting, setDrafting] = useState(false);
  const [saving, setSaving] = useState(false);

  const sampleRecipient = job.recipients.find((r) => r.status !== "skipped") || {
    clean_name: "Rahul Sharma",
  };

  const previewSubject = subject.replace(/\{name\}/g, sampleRecipient.clean_name).replace(/\{event\}/g, eventName);
  const previewBody = body.replace(/\{name\}/g, sampleRecipient.clean_name).replace(/\{event\}/g, eventName);

  const handleDraftAI = async () => {
    setDrafting(true);
    try {
      const res = await draftEmail(job.job_id, eventName);
      setSubject(res.subject);
      setBody(res.body);
    } catch (err: any) {
      alert("AI draft failed: " + err.message);
    } finally {
      setDrafting(false);
    }
  };

  const handleSaveAndProceed = async () => {
    setSaving(true);
    try {
      await updateEmailTemplate(job.job_id, {
        subject: subject.trim(),
        body: body.trim(),
      });
      onRefresh();
      onProceed();
    } catch (err: any) {
      alert("Failed to save template: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const insertVariable = (variable: string) => {
    setBody((b) => b + " " + variable);
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Editor Form */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="font-semibold text-slate-900 text-sm">Email Template</h3>
            <button
              onClick={handleDraftAI}
              disabled={drafting}
              className="text-xs px-2.5 py-1.5 rounded-lg bg-slate-100 text-slate-700 font-medium hover:bg-slate-200 border border-slate-200 flex items-center gap-1.5 transition-all duration-150 active:scale-95 cursor-pointer"
            >
              {drafting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 text-indigo-600" />}
              Draft with AI
            </button>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
              Event Name (for {"{event}"} tag)
            </label>
            <input
              type="text"
              value={eventName}
              onChange={(e) => setEventName(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white font-medium focus:border-slate-400 transition-colors"
              placeholder="e.g. AI Hackathon 2026"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
              Subject Line
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white font-medium focus:border-slate-400 transition-colors"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Email Body
              </label>
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => insertVariable("{name}")}
                  className="text-[11px] px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono hover:bg-slate-200 cursor-pointer"
                >
                  +{"{name}"}
                </button>
                <button
                  type="button"
                  onClick={() => insertVariable("{event}")}
                  className="text-[11px] px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono hover:bg-slate-200 cursor-pointer"
                >
                  +{"{event}"}
                </button>
              </div>
            </div>
            <textarea
              rows={8}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="w-full p-3 text-xs rounded-lg border border-slate-200 bg-white font-normal focus:border-slate-400 transition-colors"
            />
          </div>
        </div>

        {/* Live Preview Card */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between shadow-sm">
          <div>
            <div className="flex items-center gap-2 pb-3 mb-4 border-b border-slate-100 text-slate-900 font-semibold text-sm">
              <Eye className="w-4 h-4 text-indigo-600" />
              <span>Live Sample Preview</span>
              <span className="text-xs font-normal text-slate-400">({sampleRecipient.clean_name})</span>
            </div>

            <div className="space-y-3.5 rounded-lg bg-slate-50 p-4 border border-slate-200 text-xs">
              <div>
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-0.5">Subject:</span>
                <p className="font-semibold text-slate-900">{previewSubject}</p>
              </div>

              <div>
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-0.5">Message:</span>
                <p className="whitespace-pre-wrap text-slate-700 font-sans leading-relaxed">
                  {previewBody}
                </p>
              </div>

              <div className="pt-2 border-t border-slate-200 flex items-center gap-2 text-xs text-slate-500">
                <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                Attachment: <code className="font-mono text-[11px] bg-slate-100 px-1 py-0.5 rounded">certificate_{sampleRecipient.clean_name.toLowerCase().replace(/\s+/g, "_")}.pdf</code>
              </div>
            </div>
          </div>

          <div className="mt-5 flex items-start gap-2.5 p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-600">
            <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
            <p>
              Emails are personalized for every recipient. Newline-injection protection is strictly enforced by code.
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between pt-2">
        <p className="text-xs text-slate-500">
          Template updates invalidate any previous batch hash to guarantee authorization integrity.
        </p>
        <button
          onClick={handleSaveAndProceed}
          disabled={saving}
          className="py-2.5 px-5 rounded-xl bg-slate-900 hover:bg-black text-white font-medium text-xs sm:text-sm flex items-center gap-1.5 transition-all duration-150 active:scale-95 cursor-pointer disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          Save & Proceed to Approval Gate
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
