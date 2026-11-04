import type { Metadata } from "next";
import Image from "next/image";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import {
  GeistPixelSquare,
  GeistPixelGrid,
  GeistPixelCircle,
  GeistPixelTriangle,
  GeistPixelLine,
} from "geist/font/pixel";
import {
  GeistSerif,
  GeistSerifRegular,
  GeistSerifSquare,
  GeistSerifTriangle,
  GeistSerifHeart,
} from "geist/font/serif";
import "./globals.css";
import HeaderNav from "../components/HeaderNav";

export const metadata: Metadata = {
  title: "galeus — Local Certificate Automation & Invariant Guard",
  description:
    "One Canva template. One messy sheet. Zero mistakes. High-precision local certificate generation and verified SMTP dispatch powered by galeus.",
  icons: {
    icon: "/galeus-icon.png",
    apple: "/galeus-icon.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`
        ${GeistSans.variable}
        ${GeistMono.variable}
        ${GeistPixelSquare.variable}
        ${GeistPixelGrid.variable}
        ${GeistPixelCircle.variable}
        ${GeistPixelTriangle.variable}
        ${GeistPixelLine.variable}
        ${GeistSerif.variable}
        ${GeistSerifRegular.variable}
        ${GeistSerifSquare.variable}
        ${GeistSerifTriangle.variable}
        ${GeistSerifHeart.variable}
      `}
    >
      <body className="antialiased selection:bg-blue-100 selection:text-blue-900 bg-[#fbfbfc] text-slate-900 font-sans min-h-screen flex flex-col">
        {/* Flat, Minimal, Juicy Navigation Header */}
        <header className="border-b border-slate-200/90 bg-white/95 backdrop-blur-md sticky top-0 z-40 transition-colors">
          <div className="max-w-6xl mx-auto px-3 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
            <a href="/" className="flex items-center gap-3 group">
              <div className="flex items-center">
                <Image
                  src="/galeus-logo.png"
                  alt="galeus"
                  width={130}
                  height={42}
                  priority
                  className="h-7 sm:h-8 w-auto object-contain transition-transform duration-150 group-hover:scale-[1.02]"
                />
              </div>
              <span className="hidden sm:inline-flex font-mono text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200/80 shrink-0">
                v1.0
              </span>
            </a>

            <HeaderNav />
          </div>
        </header>

        {/* Main Content Viewport */}
        <main className="flex-1 max-w-6xl w-full mx-auto px-3 sm:px-6 py-5 sm:py-10">
          {children}
        </main>
      </body>
    </html>
  );
}
