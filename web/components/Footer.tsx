"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Github, Linkedin, ShieldCheck, Heart, Sparkles, ExternalLink } from "lucide-react";

export default function Footer() {
  return (
    <footer aria-label="Site Footer" className="border-t border-slate-200/90 bg-white/60 backdrop-blur-xs mt-16 sm:mt-24 transition-colors">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-12 space-y-8">
        {/* Top Grid: Brand + Links */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-8 border-b border-slate-100">
          <div className="space-y-2">
            <Link href="/" className="inline-block group">
              <Image
                src="/galeus-logo.png"
                alt="galeus"
                width={120}
                height={39}
                className="h-7 w-auto object-contain transition-transform duration-150 group-hover:scale-[1.02]"
              />
            </Link>
            <p className="text-xs text-slate-500 max-w-sm leading-relaxed">
              The local-first certificate automation &amp; Canva layout workstation. Upload, approve, and dispatch with zero typos.
            </p>
          </div>

          {/* Quick Links & Benchtop Badge */}
          <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs font-medium text-slate-600">
            <Link href="/studio" className="hover:text-blue-600 transition-colors">
              Studio Workstation
            </Link>
            <span className="text-slate-300">•</span>
            <a
              href="https://github.com/Ameya79/galeus"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-blue-600 transition-colors inline-flex items-center gap-1"
            >
              <Github className="w-3.5 h-3.5" />
              <span>GitHub</span>
            </a>
            <span className="text-slate-300">•</span>
            <a
              href="https://www.linkedin.com/in/ameya-kulkarni-a31b74246/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-blue-600 transition-colors inline-flex items-center gap-1"
            >
              <Linkedin className="w-3.5 h-3.5 text-blue-700" />
              <span>LinkedIn</span>
            </a>
            <span className="text-slate-300">•</span>
            <a
              href="https://benchtoplabs.vercel.app"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-orange-50/80 text-orange-800 border border-orange-200/90 hover:bg-orange-100 transition-colors text-[11px] font-semibold tracking-tight shadow-flat"
              title="Verified by Benchtop Labs open registry"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
              <span>Benchtop Labs Verified</span>
            </a>
          </div>
        </div>

        {/* Bottom Bar: Creator Attribution & Copyright */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 text-center sm:text-left">
          <div className="flex items-center gap-1.5 flex-wrap justify-center sm:justify-start">
            <span>Built by</span>
            <a
              href="https://www.linkedin.com/in/ameya-kulkarni-a31b74246/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-slate-900 hover:text-blue-600 underline transition-colors"
            >
              Ameya Kulkarni
            </a>
            <span>•</span>
            <a
              href="https://github.com/Ameya79"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-600 hover:text-slate-900 transition-colors inline-flex items-center gap-1"
            >
              @Ameya79
            </a>
            <span>•</span>
            <span>100% On-Device &amp; Private</span>
          </div>

          <p className="text-[11px] text-slate-400">
            galeus © {new Date().getFullYear()} • Licensed under MIT
          </p>
        </div>
      </div>
    </footer>
  );
}
