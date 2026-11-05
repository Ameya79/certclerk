"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { RotateCw, Sparkles } from "lucide-react";

interface SplitFlapCellProps {
  char: string;
  targetChar: string;
  isFlipping: boolean;
  isLocked: boolean;
  isAccent?: boolean;
}

const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789. ";

function SplitFlapCell({
  char,
  targetChar,
  isFlipping,
  isLocked,
  isAccent = false,
}: SplitFlapCellProps) {
  const displayChar = char === " " ? "\u00A0" : char;

  return (
    <div
      className={`relative select-none flex flex-col items-center justify-center font-mono font-light rounded-[3px] sm:rounded-md overflow-hidden transition-all duration-150
        w-[13px] h-[22px] text-[10px]
        min-[375px]:w-[15px] min-[375px]:h-[25px] min-[375px]:text-[11px]
        sm:w-[22px] sm:h-[34px] sm:text-sm
        md:w-[28px] md:h-[44px] md:text-lg
        lg:w-[32px] lg:h-[50px] lg:text-xl
        ${
          char === " "
            ? "bg-[#0b0d14]/60 border border-slate-900/60"
            : "bg-[#111420] border border-slate-800 shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_2px_4px_rgba(0,0,0,0.4)]"
        }
        ${isFlipping ? "scale-[0.98] brightness-125" : ""}
        ${
          isLocked && isAccent && char !== " "
            ? "text-blue-400 font-normal drop-shadow-[0_0_8px_rgba(59,130,246,0.6)]"
            : isLocked
            ? "text-slate-100"
            : "text-slate-400"
        }
      `}
    >
      {/* Top Flap Card Half */}
      <div className="absolute top-0 inset-x-0 h-1/2 overflow-hidden flex items-end justify-center pb-[0px] bg-gradient-to-b from-[#181c2d] to-[#0f121d] border-b border-black/80">
        <span className="leading-none transform translate-y-[50%]">
          {displayChar}
        </span>
      </div>

      {/* Bottom Flap Card Half */}
      <div className="absolute bottom-0 inset-x-0 h-1/2 overflow-hidden flex items-start justify-center pt-[0px] bg-gradient-to-b from-[#0f121d] to-[#0a0d16]">
        <span className="leading-none transform -translate-y-[50%]">
          {displayChar}
        </span>
      </div>

      {/* Center Mechanical Split Seam / Hinge Shadow */}
      <div className="absolute inset-x-0 top-1/2 -translate-y-[0.5px] h-[1px] bg-black/90 shadow-[0_1px_0_rgba(255,255,255,0.06)] z-10 pointer-events-none" />

      {/* Subtle Side Pin Rivets */}
      <div className="absolute left-[0.5px] top-1/2 -translate-y-1/2 w-[1.5px] h-[3px] bg-slate-700/60 rounded-r-full pointer-events-none" />
      <div className="absolute right-[0.5px] top-1/2 -translate-y-1/2 w-[1.5px] h-[3px] bg-slate-700/60 rounded-l-full pointer-events-none" />
    </div>
  );
}

const ROWS = [
  { text: "ONE CANVA TEMPLATE.", accent: false },
  { text: "ONE MESSY SHEET.", accent: false },
  { text: "ZERO MISTAKES.", accent: true },
];

// Target uniform grid width: 19 characters (matching "ONE CANVA TEMPLATE.")
const GRID_COLS = 19;

function padRow(text: string, cols: number): string {
  return text.padEnd(cols, " ");
}

export default function RailwaySplitFlap() {
  const [board, setBoard] = useState<string[]>(() =>
    ROWS.map(() => " ".repeat(GRID_COLS))
  );
  const [flippingState, setFlippingState] = useState<boolean[][]>(() =>
    ROWS.map(() => Array(GRID_COLS).fill(false))
  );
  const [lockedState, setLockedState] = useState<boolean[][]>(() =>
    ROWS.map(() => Array(GRID_COLS).fill(false))
  );
  const [isAnimating, setIsAnimating] = useState(false);

  const startAnimation = useCallback(() => {
    setIsAnimating(true);

    // Check reduced motion preference
    if (
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      setBoard(ROWS.map((r) => padRow(r.text, GRID_COLS)));
      setLockedState(ROWS.map(() => Array(GRID_COLS).fill(true)));
      setFlippingState(ROWS.map(() => Array(GRID_COLS).fill(false)));
      setIsAnimating(false);
      return;
    }

    // Reset board to blanks
    setBoard(ROWS.map(() => " ".repeat(GRID_COLS)));
    setLockedState(ROWS.map(() => Array(GRID_COLS).fill(false)));
    setFlippingState(ROWS.map(() => Array(GRID_COLS).fill(false)));

    ROWS.forEach((rowObj, rowIdx) => {
      const targetPadded = padRow(rowObj.text, GRID_COLS);

      for (let colIdx = 0; colIdx < GRID_COLS; colIdx++) {
        const targetChar = targetPadded[colIdx];
        if (targetChar === " ") {
          // Empty slots lock immediately
          setLockedState((prev) => {
            const next = prev.map((r) => [...r]);
            next[rowIdx][colIdx] = true;
            return next;
          });
          continue;
        }

        // Stagger: earlier rows and earlier cols start first, with a bit of organic jitter
        const delay = rowIdx * 240 + colIdx * 35 + Math.random() * 80;
        const totalFlips = 7 + Math.floor(Math.random() * 8); // 7 to 14 flips

        setTimeout(() => {
          let currentFlip = 0;

          // Mark cell as actively flipping
          setFlippingState((prev) => {
            const next = prev.map((r) => [...r]);
            next[rowIdx][colIdx] = true;
            return next;
          });

          const interval = setInterval(() => {
            currentFlip++;

            if (currentFlip >= totalFlips) {
              clearInterval(interval);
              // Snap to target char
              setBoard((prev) => {
                const next = [...prev];
                const rowChars = next[rowIdx].split("");
                rowChars[colIdx] = targetChar;
                next[rowIdx] = rowChars.join("");
                return next;
              });
              setLockedState((prev) => {
                const next = prev.map((r) => [...r]);
                next[rowIdx][colIdx] = true;
                return next;
              });
              setFlippingState((prev) => {
                const next = prev.map((r) => [...r]);
                next[rowIdx][colIdx] = false;
                return next;
              });

              // Check if all rows are finished
              if (rowIdx === ROWS.length - 1 && colIdx === targetPadded.trimEnd().length - 1) {
                setIsAnimating(false);
              }
            } else {
              // Show random glyph
              const randChar =
                GLYPHS[Math.floor(Math.random() * (GLYPHS.length - 1))];
              setBoard((prev) => {
                const next = [...prev];
                const rowChars = next[rowIdx].split("");
                rowChars[colIdx] = randChar;
                next[rowIdx] = rowChars.join("");
                return next;
              });
            }
          }, 45); // 45ms per mechanical flip
        }, delay);
      }
    });
  }, []);

  useEffect(() => {
    // Initial mount trigger
    const timer = setTimeout(() => {
      startAnimation();
    }, 150);
    return () => clearTimeout(timer);
  }, [startAnimation]);

  return (
    <div className="w-full max-w-3xl mx-auto space-y-3">
      {/* Hidden semantic H1 for Screen Readers and SEO */}
      <h1 className="sr-only">
        One Canva template. One messy sheet. Zero mistakes.
      </h1>

      {/* Mechanical Split-Flap Billboard Chassis */}
      <div
        aria-hidden="true"
        onClick={() => !isAnimating && startAnimation()}
        className="group relative cursor-pointer rounded-2xl sm:rounded-3xl p-3 sm:p-6 bg-gradient-to-b from-[#090b12] to-[#04060a] border border-slate-800/90 shadow-[0_20px_50px_rgba(0,0,0,0.5),0_0_0_1px_rgba(255,255,255,0.05),inset_0_1px_1px_rgba(255,255,255,0.1)] transition-transform duration-200 active:scale-[0.99]"
      >
        {/* Subtle Ambient Backlight Glow on Top Seam */}
        <div className="absolute inset-x-8 top-0 h-[1px] bg-gradient-to-r from-transparent via-blue-500/30 to-transparent pointer-events-none" />

        {/* Board Header Bar */}
        <div className="flex items-center justify-between pb-2.5 sm:pb-3.5 mb-2.5 sm:mb-3.5 border-b border-slate-800/70 text-[10px] sm:text-xs text-slate-500 font-mono">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-semibold text-slate-300 tracking-wider uppercase">
              DEPARTURE // PIPELINE-01
            </span>
          </div>

          <div className="flex items-center gap-2 text-[10px] text-slate-400">
            <span className="hidden sm:inline tracking-tight font-medium">
              Vercel Geist Mono
            </span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (!isAnimating) startAnimation();
              }}
              title="Click to re-flip mechanical board"
              className="p-1 rounded-md hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer flex items-center gap-1"
            >
              <RotateCw
                className={`w-3 h-3 ${isAnimating ? "animate-spin text-blue-400" : ""}`}
              />
              <span className="hidden sm:inline text-[9px] uppercase font-mono">
                Re-flip
              </span>
            </button>
          </div>
        </div>

        {/* 3-Row Split-Flap Matrix Grid */}
        <div className="space-y-1.5 sm:space-y-2.5 flex flex-col items-center justify-center">
          {ROWS.map((rowObj, rowIdx) => {
            const rowChars = (board[rowIdx] || "").split("");

            return (
              <div
                key={rowIdx}
                className="flex items-center justify-center gap-[2px] min-[375px]:gap-[2.5px] sm:gap-[3.5px] md:gap-1"
              >
                {rowChars.map((char, colIdx) => (
                  <SplitFlapCell
                    key={colIdx}
                    char={char}
                    targetChar={padRow(rowObj.text, GRID_COLS)[colIdx]}
                    isFlipping={flippingState[rowIdx]?.[colIdx] ?? false}
                    isLocked={lockedState[rowIdx]?.[colIdx] ?? false}
                    isAccent={rowObj.accent}
                  />
                ))}
              </div>
            );
          })}
        </div>

        {/* Board Bottom Ticker Strip */}
        <div className="flex items-center justify-between pt-2.5 sm:pt-3.5 mt-2.5 sm:mb-0 sm:mt-3.5 border-t border-slate-800/70 text-[9px] sm:text-[10px] font-mono text-slate-500">
          <div className="flex items-center gap-1.5">
            <span className="w-1 h-1 rounded-full bg-blue-500" />
            <span className="tracking-tight uppercase">SOLARI MECHANICAL FLAP</span>
          </div>
          <div className="text-slate-400">
            <span>ZERO TYPO GUARANTEE • 100% ON-DEVICE</span>
          </div>
        </div>
      </div>
    </div>
  );
}
