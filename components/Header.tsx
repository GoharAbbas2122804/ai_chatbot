"use client";

import { useEffect, useState } from "react";

interface HeaderProps {
  onOpenWidget?: () => void;
}

export function Header({ onOpenWidget }: HeaderProps) {
  const [timeUtc, setTimeUtc] = useState<string>("00:00:00 UTC");
  const [isDark, setIsDark] = useState<boolean>(false);

  useEffect(() => {
    // Check initial theme safely without cascading synchronous render
    const savedTheme = localStorage.getItem("index_theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const initialDark = savedTheme === "dark" || (!savedTheme && prefersDark);

    const rafId = requestAnimationFrame(() => {
      setIsDark(initialDark);
      if (initialDark) {
        document.documentElement.setAttribute("data-theme", "dark");
      } else {
        document.documentElement.removeAttribute("data-theme");
      }
    });

    // Live UTC Clock
    const updateTime = () => {
      const d = new Date();
      const hours = String(d.getUTCHours()).padStart(2, "0");
      const mins = String(d.getUTCMinutes()).padStart(2, "0");
      const secs = String(d.getUTCSeconds()).padStart(2, "0");
      setTimeUtc(`${hours}:${mins}:${secs} UTC`);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);

    return () => {
      cancelAnimationFrame(rafId);
      clearInterval(interval);
    };
  }, []);

  const toggleTheme = () => {
    const nextDark = !isDark;
    setIsDark(nextDark);
    if (nextDark) {
      document.documentElement.setAttribute("data-theme", "dark");
      localStorage.setItem("index_theme", "dark");
    } else {
      document.documentElement.removeAttribute("data-theme");
      localStorage.setItem("index_theme", "light");
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[var(--rule-hairline)] bg-[var(--bg-canvas)]/90 backdrop-blur-md transition-colors duration-200">
      <div className="max-w-[1920px] mx-auto px-4 sm:px-6 md:px-10 h-16 flex items-center justify-between text-xs font-mono">
        {/* Left: Brand mark & Instrument ID */}
        <div className="flex items-center gap-4 sm:gap-6">
          <a
            href="#hero"
            className="flex items-center gap-2 group text-[var(--ink-primary)] font-sans font-bold tracking-tight text-base sm:text-lg focus-visible:outline-none"
          >
            <span className="w-2.5 h-2.5 bg-[#FF4D1F] inline-block transition-transform duration-200 group-hover:scale-125" />
            <span className="font-serif italic font-normal text-xl sm:text-2xl tracking-normal text-[var(--ink-primary)]">
              INDEX
            </span>
            <span className="hidden sm:inline-block text-[10px] uppercase font-mono tracking-widest text-[var(--ink-tertiary)] border border-[var(--rule-hairline)] px-1.5 py-0.5">
              SYS/4.2
            </span>
          </a>

          <div className="hidden lg:flex items-center gap-2 text-[var(--ink-secondary)] border-l border-[var(--rule-hairline)] pl-5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
            <span className="uppercase tracking-wider text-[11px]">
              Catalog Status: 42,910 Verified SKUs
            </span>
          </div>
        </div>

        {/* Center: System Clock & Instrument readout */}
        <div className="hidden md:flex items-center gap-6 text-[var(--ink-tertiary)] text-[11px] tracking-widest uppercase">
          <div className="flex items-center gap-2">
            <span className="text-[#FF4D1F]">LATENCY:</span>
            <span className="text-[var(--ink-primary)] font-bold">18ms</span>
          </div>
          <span className="text-[var(--rule-hairline)]">/</span>
          <div className="flex items-center gap-2">
            <span>CLOCK:</span>
            <span className="text-[var(--ink-primary)]">{timeUtc}</span>
          </div>
          <span className="text-[var(--rule-hairline)]">/</span>
          <div className="flex items-center gap-2">
            <span>HALLUCINATION:</span>
            <span className="text-[#15803D] dark:text-[#22C55E] font-bold">0.00%</span>
          </div>
        </div>

        {/* Right: Dark mode toggle & Primary Trigger CTA */}
        <div className="flex items-center gap-3 sm:gap-4">
          <button
            onClick={toggleTheme}
            type="button"
            aria-label={isDark ? "Switch to light paper mode" : "Switch to dark obsidian mode"}
            className="px-2.5 py-1.5 border border-[var(--rule-hairline)] hover:border-[var(--ink-primary)] text-[var(--ink-secondary)] hover:text-[var(--ink-primary)] transition-colors flex items-center gap-1.5 cursor-pointer text-[11px] uppercase tracking-wider"
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isDark ? "bg-[#FF4D1F]" : "bg-[var(--ink-primary)]"
              }`}
            />
            <span>{isDark ? "PAPER" : "OBSIDIAN"}</span>
          </button>

          <button
            onClick={onOpenWidget}
            type="button"
            className="px-3.5 py-1.5 bg-[var(--ink-primary)] text-[var(--bg-canvas)] hover:bg-[#FF4D1F] hover:text-white transition-colors duration-200 font-sans font-medium text-xs tracking-tight flex items-center gap-2 cursor-pointer"
          >
            <span className="w-1.5 h-1.5 bg-[#FF4D1F] group-hover:bg-white inline-block" />
            <span>OPEN CONSOLE</span>
          </button>
        </div>
      </div>
    </header>
  );
}
