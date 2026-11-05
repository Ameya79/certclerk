"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import {
  HelpCircle,
  X,
  FileText,
  FileSpreadsheet,
  Sparkles,
  Mail,
  ArrowRight,
  ExternalLink,
  CheckCircle2,
  Lightbulb,
} from "lucide-react";

interface HowToUseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function HowToUseModal({ isOpen, onClose }: HowToUseModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-sm flex min-h-full items-center justify-center p-3 sm:p-4"
      onClick={onClose}
    >
      <div
        className="bg-white border border-slate-200 rounded-2xl max-w-2xl w-full my-auto shadow-2xl relative flex flex-col max-h-[calc(100vh-2rem)] overflow-hidden animate-fade-in-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - Fixed at Top */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <HelpCircle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900 leading-tight">
                How to Use galeus — Quick Guide
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                4 simple steps to automate your event certificates in minutes
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer shrink-0"
            aria-label="Close guide"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1">
          {/* Step 1: Canva Certificate Template */}
          <div className="p-4 rounded-xl border border-slate-200 bg-white hover:border-blue-200 transition-colors space-y-2.5 shadow-xs">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-md bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                1
              </span>
              <div className="flex items-center gap-1.5 font-semibold text-xs sm:text-sm text-slate-900">
                <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                <span>Create 1 Canva Certificate PDF</span>
              </div>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed pl-8">
              Design your certificate in Canva (free or pro). Right where the participant's name should appear, type the placeholder word <code className="font-mono bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded font-bold">AGENT</code>. Choose your font, color, and size in Canva as usual.
            </p>
            <div className="ml-8 p-2.5 rounded-lg bg-blue-50/60 border border-blue-100 text-[11px] text-blue-900 flex items-start gap-2">
              <Lightbulb className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
              <span>
                <strong>Export setting:</strong> In Canva, click <em>Share &rarr; Download &rarr; File Type: PDF Standard</em> (single page only). galeus will automatically locate the word <code className="font-mono">AGENT</code>, erase it, and auto-scale each attendee's real name to fit that exact spot!
              </span>
            </div>
          </div>

          {/* Step 2: Excel / CSV Roster */}
          <div className="p-4 rounded-xl border border-slate-200 bg-white hover:border-emerald-200 transition-colors space-y-2.5 shadow-xs">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-md bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                2
              </span>
              <div className="flex items-center gap-1.5 font-semibold text-xs sm:text-sm text-slate-900">
                <FileSpreadsheet className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Prepare Your Attendee Sheet (Excel or CSV)</span>
              </div>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed pl-8">
              Create an Excel (<code className="font-mono text-slate-700">.xlsx</code>) or CSV file with your attendee list:
            </p>
            <div className="ml-8 overflow-x-auto">
              <table className="text-xs border border-slate-200 rounded-lg overflow-hidden w-full max-w-md">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 text-[11px]">
                  <tr>
                    <th className="px-3 py-1.5 text-left font-bold">Name <span className="text-emerald-700 font-normal">(Required)</span></th>
                    <th className="px-3 py-1.5 text-left font-bold">Email <span className="text-slate-400 font-normal">(Optional)</span></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  <tr>
                    <td className="px-3 py-1.5 font-medium">Rahul Sharma</td>
                    <td className="px-3 py-1.5 font-mono text-[11px] text-slate-500">rahul@example.com</td>
                  </tr>
                  <tr>
                    <td className="px-3 py-1.5 font-medium">Dr. Maria O'Connor</td>
                    <td className="px-3 py-1.5 font-mono text-[11px] text-slate-500">maria@university.edu</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="ml-8 p-2.5 rounded-lg bg-emerald-50/60 border border-emerald-100 text-[11px] text-emerald-900 flex items-start gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
              <span>
                <strong>Zero stress:</strong> Even if attendees typed in ALL-CAPS, lowercase, or messy formatting, galeus automatically cleans and capitalizes them while guaranteeing zero spelling mistakes.
              </span>
            </div>
          </div>

          {/* Step 3: Free Gemini AI Key */}
          <div className="p-4 rounded-xl border border-slate-200 bg-white hover:border-indigo-200 transition-colors space-y-2.5 shadow-xs">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-md bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                3
              </span>
              <div className="flex items-center gap-1.5 font-semibold text-xs sm:text-sm text-slate-900">
                <Sparkles className="w-4 h-4 text-indigo-600 shrink-0" />
                <span>Get a Free Google Gemini API Key (Optional)</span>
              </div>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed pl-8">
              galeus uses Google's ultra-fast free model (<code className="font-mono text-indigo-700">gemini-3.6-flash</code>) to intelligently handle complex name honorifics and write personalized email drafts.
            </p>
            <div className="ml-8 space-y-1.5 text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                <span>Go to <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-indigo-600 font-semibold underline inline-flex items-center gap-0.5">Google AI Studio <ExternalLink className="w-3 h-3" /></a> and click <strong>"Create API Key"</strong>.</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                <span>It is <strong>100% free</strong> (1,500 requests/day, <strong>0 credit card required</strong>).</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                <span>Click <strong>AI Keys</strong> in the top navbar and paste it. (If you skip this, galeus runs in 100% offline rule mode).</span>
              </div>
            </div>
          </div>

          {/* Step 4: SMTP Setup */}
          <div className="p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-colors space-y-2.5 shadow-xs">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-md bg-slate-900 text-white flex items-center justify-center font-bold text-xs shrink-0">
                4
              </span>
              <div className="flex items-center gap-1.5 font-semibold text-xs sm:text-sm text-slate-900">
                <Mail className="w-4 h-4 text-slate-800 shrink-0" />
                <span>Send via SMTP Email (If Emailing Certificates)</span>
              </div>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed pl-8">
              In Step 6 (Send), you can dispatch certificates directly from your Gmail or organizational email server:
            </p>
            <div className="ml-8 p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs space-y-1.5">
              <p className="font-semibold text-slate-800">For Gmail accounts:</p>
              <ol className="list-decimal pl-4 space-y-1 text-slate-600 text-[11px]">
                <li>Go to your Google Account &rarr; <em>Security</em> &rarr; <em>2-Step Verification</em> &rarr; <strong>App Passwords</strong>.</li>
                <li>Generate a 16-letter App Password (e.g. <code className="font-mono">abcd efgh ijkl mnop</code>).</li>
                <li>In galeus, enter Host: <code className="font-mono">smtp.gmail.com</code>, Port: <code className="font-mono">587</code>, User: your email, Password: the app password.</li>
              </ol>
              <p className="text-[10px] text-slate-500 pt-1">
                🔒 <strong>Privacy guarantee:</strong> Your credentials are held in memory exclusively during active dispatch and immediately discarded. Never written to disk or sent to any server.
              </p>
            </div>
          </div>
        </div>

        {/* Footer - Fixed at Bottom */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 px-5 py-3.5 border-t border-slate-100 bg-slate-50/50 shrink-0">
          <p className="text-[11px] text-slate-500">
            Ready to test? Drop a template and sheet into the studio.
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-medium text-slate-700 transition-colors cursor-pointer"
            >
              Close Guide
            </button>
            <Link
              href="/studio"
              onClick={onClose}
              className="w-full sm:w-auto px-4 py-2 rounded-xl bg-slate-900 hover:bg-blue-600 text-white text-xs font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <span>Open Studio</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

