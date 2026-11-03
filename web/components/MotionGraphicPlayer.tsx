"use client";

import React, { useRef, useState } from "react";
import { Maximize2, Play, RotateCcw, Sparkles } from "lucide-react";

export default function MotionGraphicPlayer() {
  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  const handleIframeMessage = (action: string) => {
    if (!iframeRef.current || !iframeRef.current.contentWindow) return;
    iframeRef.current.contentWindow.postMessage({ type: action }, "*");
  };

  return (
    <div id="ad-player" className="w-full max-w-5xl mx-auto space-y-3">
      {/* Player Header Pill Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1 text-xs text-slate-500">
        <div className="inline-flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
          <span className="font-semibold text-slate-900 tracking-tight">The galeus Motion Story</span>
          <span className="text-slate-300">•</span>
          <span className="text-slate-500 font-normal">From 15 hours of copy-paste chaos to zero mistakes</span>
        </div>

        <div className="hidden sm:flex items-center gap-3 text-[11px] text-slate-400 font-mono">
          <span>Click / Space: Pause</span>
          <span>•</span>
          <span>R: Replay</span>
          <span>•</span>
          <span>F: Fullscreen</span>
        </div>
      </div>

      {/* Main 16:9 Viewport Box */}
      <div
        ref={containerRef}
        className="relative w-full aspect-video rounded-2xl overflow-hidden border border-slate-200/90 shadow-tactile bg-white group"
      >
        <iframe
          ref={iframeRef}
          src="/motion-ad.html"
          title="galeus: motion ad"
          className="w-full h-full border-0 block bg-white"
          allow="fullscreen"
          loading="eager"
        />

        {/* Quick Fullscreen Floating Button (Top Right on hover) */}
        <button
          onClick={toggleFullscreen}
          aria-label="Toggle Fullscreen"
          className="absolute top-3 right-3 z-30 p-2 rounded-xl bg-white/90 hover:bg-white text-slate-700 hover:text-slate-950 border border-slate-200/80 shadow-flat backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all duration-150 active:scale-95 cursor-pointer"
          title="Toggle Fullscreen"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      </div>

      {/* Mobile Interaction Hint */}
      <div className="sm:hidden text-center text-[11px] text-slate-400 font-mono pt-1">
        Tap the video to play/pause • Tap Replay to restart
      </div>
    </div>
  );
}
