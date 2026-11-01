"use client";

import React, { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { Job } from "../../../lib/types";
import { getJob, startAnalysis, startGeneration } from "../../../lib/api";
import Stepper, { StepNumber } from "../../../components/Stepper";
import ReviewTable from "../../../components/ReviewTable";
import PreviewGrid from "../../../components/PreviewGrid";
import EmailEditor from "../../../components/EmailEditor";
import ApproveCard from "../../../components/ApproveCard";
import SendPanel from "../../../components/SendPanel";
import Report from "../../../components/Report";
import { Loader2, AlertCircle, ChevronLeft, Layers, FileText, CheckCircle2 } from "lucide-react";

export default function JobPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const resolvedParams = use(params);
  const jobId = resolvedParams.id;

  const [job, setJob] = useState<Job | null>(null);
  const [currentStep, setCurrentStep] = useState<StepNumber>(2);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const analysisStarted = React.useRef(false);

  // Fetch job state
  const fetchState = async () => {
    try {
      const data = await getJob(jobId);
      setJob(data);

      // Auto-trigger analysis if fresh job (only trigger once)
      if (data.status === "created" && !analysisStarted.current) {
        analysisStarted.current = true;
        await startAnalysis(jobId).catch(() => {});
      }

      // Map backend status to initial recommended step
      if (data.status === "mapped" || data.status === "analyzed") {
        setCurrentStep((prev) => (prev > 2 ? prev : 2));
      } else if (data.status === "generated") {
        setCurrentStep((prev) => (prev > 3 ? prev : 3));
      } else if (data.status === "approved") {
        setCurrentStep(6);
      } else if (data.status === "sending" || data.status === "paused") {
        setCurrentStep(6);
      } else if (data.status === "done") {
        setCurrentStep(7);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load job.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchState();
  }, [jobId]);

  // Polling while active async stages
  useEffect(() => {
    if (!job) return;
    const isAsync = job.status === "created" || job.status === "analyzed" || job.status === "generating" || job.status === "sending";
    let timer: NodeJS.Timeout;

    if (isAsync) {
      timer = setInterval(() => {
        fetchState();
      }, 1000);
    }

    return () => clearInterval(timer);
  }, [job?.status]);

  if (loading && !job) {
    return (
      <div className="py-24 text-center space-y-3 max-w-5xl mx-auto">
        <Loader2 className="w-7 h-7 text-slate-800 animate-spin mx-auto" />
        <p className="text-xs font-medium text-slate-500">Loading certificate job...</p>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="max-w-md mx-auto p-6 rounded-xl bg-white border border-red-200 text-center space-y-3 shadow-sm">
        <AlertCircle className="w-8 h-8 text-red-600 mx-auto" />
        <h3 className="font-semibold text-slate-900 text-sm">Unable to Load Job</h3>
        <p className="text-xs text-red-700">{error || "Job not found"}</p>
        <button
          onClick={() => router.push("/")}
          className="mt-2 px-4 py-2 rounded-lg bg-slate-900 hover:bg-black text-white text-xs font-medium transition-all duration-150 active:scale-95 cursor-pointer"
        >
          Return Home
        </button>
      </div>
    );
  }

  // Handle Generate transition from Step 2
  const handleProceedToGenerate = async () => {
    try {
      await startGeneration(jobId);
      setCurrentStep(3);
      fetchState();
    } catch (err: any) {
      alert("Failed to start generation: " + err.message);
    }
  };

  const recipientCount = job.total || job.recipients?.length || 0;

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      {/* Persistent Batch Context Header */}
      <div className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 flex items-center justify-between text-xs shadow-xs">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.push("/")}
            className="text-slate-500 hover:text-slate-900 flex items-center gap-1 transition-colors cursor-pointer"
            title="Return to Home"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="font-medium">All Jobs</span>
          </button>
          
          <div className="h-3.5 w-px bg-slate-200"></div>

          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-800 font-mono text-[11px]">
              Batch #{jobId.slice(0, 8)}
            </span>
            <span className="text-slate-400">•</span>
            <span className="text-slate-600">
              {recipientCount} attendee{recipientCount === 1 ? "" : "s"}
            </span>
            <span className="text-slate-400">•</span>
            <span className="text-[11px] font-mono text-slate-500">
              Tag: [{job.placeholder}]
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {job.status === "generated" && (
            <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-medium flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Previews Ready
            </span>
          )}
          {job.status === "approved" && (
            <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-medium flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Batch Locked
            </span>
          )}
          {job.status === "done" && (
            <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-medium">
              Completed
            </span>
          )}
        </div>
      </div>

      {/* Stepper navigation */}
      <Stepper
        currentStep={currentStep}
        onStepClick={(step) => setCurrentStep(step)}
      />

      {/* Background Processing Banner (when analyzing or generating) */}
      {(job.status === "created" || job.status === "analyzed" || job.status === "generating") && (
        <div className="p-3.5 rounded-xl bg-white border border-slate-200 flex items-center justify-between shadow-xs animate-in fade-in duration-150">
          <div className="flex items-center gap-2.5">
            <Loader2 className="w-4 h-4 text-slate-800 animate-spin shrink-0" />
            <div>
              <span className="font-semibold text-xs text-slate-900 block">
                {job.status === "created" || job.status === "analyzed"
                  ? "Standardizing attendee data & validating addresses..."
                  : `Rendering personalized certificates (${job.progress || 0}/${job.total || 0})...`}
              </span>
              <span className="text-[11px] text-slate-500">
                Self-correcting fit engine is actively verifying boundaries.
              </span>
            </div>
          </div>
          {job.status === "generating" && (
            <div className="text-right">
              <span className="text-xs font-mono font-semibold text-slate-800">
                {job.total > 0 ? Math.round(((job.progress || 0) / job.total) * 100) : 0}%
              </span>
            </div>
          )}
        </div>
      )}

      {/* Active Step Content with Smooth Fade Transitions */}
      <div className="transition-all duration-200">
        {currentStep === 2 && (
          <ReviewTable
            job={job}
            onRefresh={fetchState}
            onProceed={handleProceedToGenerate}
          />
        )}

        {currentStep === 3 && (
          <PreviewGrid
            job={job}
            onProceed={() => setCurrentStep(4)}
          />
        )}

        {currentStep === 4 && (
          <EmailEditor
            job={job}
            onRefresh={fetchState}
            onProceed={() => setCurrentStep(5)}
          />
        )}

        {currentStep === 5 && (
          <ApproveCard
            job={job}
            onRefresh={fetchState}
            onProceed={() => setCurrentStep(6)}
          />
        )}

        {currentStep === 6 && (
          <SendPanel
            job={job}
            onRefresh={fetchState}
            onProceed={() => setCurrentStep(7)}
          />
        )}

        {currentStep === 7 && (
          <Report
            job={job}
            onRestart={() => router.push("/")}
          />
        )}
      </div>
    </div>
  );
}
