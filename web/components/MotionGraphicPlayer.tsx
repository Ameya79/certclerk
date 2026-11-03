"use client";

import React from "react";

export default function MotionGraphicPlayer() {
  return (
    <div id="demo" className="w-full max-w-5xl mx-auto">
      <div className="relative w-full aspect-video rounded-2xl overflow-hidden border border-slate-200/90 shadow-tactile bg-white">
        <iframe
          src="/motion-ad.html"
          title="galeus"
          className="w-full h-full border-0 block bg-white"
          allow="fullscreen"
          loading="eager"
        />
      </div>
    </div>
  );
}
