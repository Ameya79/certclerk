"use client";

import React from "react";
import { Check, Upload, Table, Eye, Mail, ShieldCheck, Send, FileSpreadsheet } from "lucide-react";

export type StepNumber = 1 | 2 | 3 | 4 | 5 | 6 | 7;

interface StepperProps {
  currentStep: StepNumber;
  onStepClick?: (step: StepNumber) => void;
}

const STEPS = [
  { num: 1, label: "Upload", icon: Upload },
  { num: 2, label: "Review Data", icon: Table },
  { num: 3, label: "Preview Certs", icon: Eye },
  { num: 4, label: "Write Email", icon: Mail },
  { num: 5, label: "Approve", icon: ShieldCheck },
  { num: 6, label: "Send", icon: Send },
  { num: 7, label: "Report", icon: FileSpreadsheet },
] as const;

export default function Stepper({ currentStep, onStepClick }: StepperProps) {
  return (
    <div className="w-full bg-white border border-slate-200 rounded-xl p-3 sm:p-3.5 shadow-xs">
      <div className="flex items-center justify-between relative overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
        {STEPS.map((step, idx) => {
          const Icon = step.icon;
          const isDone = currentStep > step.num;
          const isCurrent = currentStep === step.num;

          return (
            <React.Fragment key={step.num}>
              <button
                type="button"
                onClick={() => isDone && onStepClick?.(step.num as StepNumber)}
                disabled={!isDone && !isCurrent}
                className={`flex items-center gap-2 group px-2 py-1.5 rounded-lg transition-all duration-150 ${
                  isDone
                    ? "cursor-pointer hover:bg-slate-50 active:scale-95"
                    : isCurrent
                    ? "bg-slate-100 cursor-default"
                    : "cursor-default opacity-60"
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-md flex items-center justify-center font-semibold text-[11px] transition-all duration-150 shrink-0 ${
                    isDone
                      ? "bg-emerald-600 text-white"
                      : isCurrent
                      ? "bg-slate-900 text-white"
                      : "bg-slate-200 text-slate-600"
                  }`}
                >
                  {isDone ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : step.num}
                </div>
                <span
                  className={`text-xs whitespace-nowrap transition-colors duration-150 ${
                    isCurrent
                      ? "text-slate-900 font-bold"
                      : isDone
                      ? "text-slate-700 font-medium"
                      : "text-slate-500 font-normal"
                  }`}
                >
                  {step.label}
                </span>
              </button>

              {idx < STEPS.length - 1 && (
                <div
                  className={`flex-1 h-px mx-1.5 min-w-[12px] sm:min-w-[24px] transition-colors duration-200 ${
                    currentStep > step.num ? "bg-emerald-500" : "bg-slate-200"
                  }`}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
