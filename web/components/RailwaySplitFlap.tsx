"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";

interface LineConfig {
  text: string;
  isAccent?: boolean;
}

const LINES: LineConfig[] = [
  { text: "One Canva template.", isAccent: false },
  { text: "One messy sheet.", isAccent: false },
  { text: "Zero mistakes.", isAccent: true },
];

const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

function FlipChar({
  char,
  targetChar,
  isFlipping,
  isLocked,
  isAccent,
}: {
  char: string;
  targetChar: string;
  isFlipping: boolean;
  isLocked: boolean;
  isAccent?: boolean;
}) {
  if (targetChar === " ") {
    return <span>&nbsp;</span>;
  }

  return (
    <span
      className={`inline-block transition-all duration-75 select-none ${
        isAccent
          ? "text-blue-600 font-normal"
          : "text-slate-950 font-light"
      } ${
        isFlipping
          ? "opacity-60 -translate-y-[2px] scale-y-90"
          : "opacity-100 translate-y-0 scale-y-100"
      }`}
      style={{
        transformStyle: "preserve-3d",
        display: "inline-block",
      }}
    >
      {char}
    </span>
  );
}

export default function RailwaySplitFlap() {
  const [board, setBoard] = useState<string[]>(() =>
    LINES.map((l) => l.text)
  );
  const [flippingState, setFlippingState] = useState<boolean[][]>(() =>
    LINES.map((l) => Array(l.text.length).fill(false))
  );
  const [lockedState, setLockedState] = useState<boolean[][]>(() =>
    LINES.map((l) => Array(l.text.length).fill(true))
  );
  const [isAnimating, setIsAnimating] = useState(false);
  const timeoutsRef = useRef<NodeJS.Timeout[]>([]);
  const intervalsRef = useRef<NodeJS.Timeout[]>([]);

  const clearAllTimers = () => {
    timeoutsRef.current.forEach(clearTimeout);
    intervalsRef.current.forEach(clearInterval);
    timeoutsRef.current = [];
    intervalsRef.current = [];
  };

  const startAnimation = useCallback(() => {
    clearAllTimers();
    setIsAnimating(true);

    // Reduced motion preference check
    if (
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      setBoard(LINES.map((l) => l.text));
      setLockedState(LINES.map((l) => Array(l.text.length).fill(true)));
      setFlippingState(LINES.map((l) => Array(l.text.length).fill(false)));
      setIsAnimating(false);
      return;
    }

    // Initialize board with randomized glyphs for non-space characters
    setBoard(
      LINES.map((l) =>
        l.text
          .split("")
          .map((c) => (c === " " ? " " : GLYPHS[Math.floor(Math.random() * GLYPHS.length)]))
          .join("")
      )
    );
    setLockedState(LINES.map((l) => Array(l.text.length).fill(false)));
    setFlippingState(LINES.map((l) => Array(l.text.length).fill(true)));

    let totalCharsToLock = 0;
    let lockedCount = 0;

    LINES.forEach((l) => {
      totalCharsToLock += l.text.replace(/ /g, "").length;
    });

    LINES.forEach((lineObj, lineIdx) => {
      const lineText = lineObj.text;

      for (let charIdx = 0; charIdx < lineText.length; charIdx++) {
        const targetChar = lineText[charIdx];

        if (targetChar === " ") {
          setLockedState((prev) => {
            const next = prev.map((r) => [...r]);
            next[lineIdx][charIdx] = true;
            return next;
          });
          setFlippingState((prev) => {
            const next = prev.map((r) => [...r]);
            next[lineIdx][charIdx] = false;
            return next;
          });
          continue;
        }

        // Mechanical stagger: earlier lines and earlier letters start and lock first
        const startDelay = lineIdx * 180 + charIdx * 30 + Math.random() * 60;
        const totalCycles = 6 + Math.floor(Math.random() * 8); // 6 to 13 mechanical flips

        const timeout = setTimeout(() => {
          let currentCycle = 0;

          const interval = setInterval(() => {
            currentCycle++;

            if (currentCycle >= totalCycles) {
              clearInterval(interval);

              // Lock onto target character
              setBoard((prev) => {
                const next = [...prev];
                const chars = next[lineIdx].split("");
                chars[charIdx] = targetChar;
                next[lineIdx] = chars.join("");
                return next;
              });

              setLockedState((prev) => {
                const next = prev.map((r) => [...r]);
                next[lineIdx][charIdx] = true;
                return next;
              });

              setFlippingState((prev) => {
                const next = prev.map((r) => [...r]);
                next[lineIdx][charIdx] = false;
                return next;
              });

              lockedCount++;
              if (lockedCount >= totalCharsToLock) {
                setIsAnimating(false);
              }
            } else {
              // Roll to a new random glyph
              const randChar = GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
              setBoard((prev) => {
                const next = [...prev];
                const chars = next[lineIdx].split("");
                chars[charIdx] = randChar;
                next[lineIdx] = chars.join("");
                return next;
              });
            }
          }, 42); // 42ms rapid mechanical tick

          intervalsRef.current.push(interval);
        }, startDelay);

        timeoutsRef.current.push(timeout);
      }
    });
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      startAnimation();
    }, 120);

    return () => {
      clearTimeout(timer);
      clearAllTimers();
    };
  }, [startAnimation]);

  return (
    <h1
      onClick={() => !isAnimating && startAnimation()}
      title="Click to replay mechanical letter animation"
      className="text-3xl sm:text-5xl md:text-6xl font-mono font-light tracking-tight leading-[1.18] sm:leading-[1.15] cursor-pointer inline-block"
      style={{ perspective: "1000px" }}
    >
      {LINES.map((lineObj, lineIdx) => {
        const rowChars = (board[lineIdx] || lineObj.text).split("");

        return (
          <span key={lineIdx} className="block">
            {rowChars.map((char, charIdx) => (
              <FlipChar
                key={charIdx}
                char={char}
                targetChar={lineObj.text[charIdx] || ""}
                isFlipping={flippingState[lineIdx]?.[charIdx] ?? false}
                isLocked={lockedState[lineIdx]?.[charIdx] ?? true}
                isAccent={lineObj.isAccent}
              />
            ))}
          </span>
        );
      })}
    </h1>
  );
}
