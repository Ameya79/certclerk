import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import HeaderNav from "../components/HeaderNav";

export const metadata: Metadata = {
  title: "CertClerk — Local Certificate Automation & Invariant Guard",
  description: "One Canva template. One messy sheet. Zero mistakes. High-precision local certificate generation and verified SMTP dispatch.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body className="antialiased selection:bg-slate-200 selection:text-slate-900 bg-[#fbfbfc] text-slate-900 font-sans min-h-screen flex flex-col">
        {/* Navigation Header */}
        <header className="border-b border-slate-200/80 bg-white/95 backdrop-blur-sm sticky top-0 z-40 transition-colors">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
            <a href="/" className="flex items-center gap-3 group">
              <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center text-white font-mono font-bold text-xs tracking-tight transition-transform duration-150 group-hover:scale-105 shrink-0 shadow-xs">
                CC
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base tracking-tight text-slate-950">
                  Cert<span className="text-slate-500">Clerk</span>
                </span>
                <span className="font-mono text-[10px] font-medium px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200 shrink-0">
                  v1.0
                </span>
              </div>
            </a>
            
            <HeaderNav />
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-12">
          {children}
        </main>
      </body>
    </html>
  );
}
