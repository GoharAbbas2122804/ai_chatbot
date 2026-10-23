"use client";

import { useEffect, useState, useRef } from "react";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";

interface HeaderProps {
  onOpenWidget?: () => void;
}

export function Header({ onOpenWidget }: HeaderProps) {
  const headerRef = useRef<HTMLElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
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

  useGSAP(
    () => {
      if (!headerRef.current) return;

      // 1. Initial fade in
      gsap.from(headerRef.current, {
        autoAlpha: 0,
        y: -15,
        duration: 0.8,
        ease: "power2.out",
      });

      // 2. Hide on scroll down, show on scroll up
      const showAnim = gsap
        .from(headerRef.current, {
          yPercent: -100,
          paused: true,
          duration: 0.3,
          ease: "power2.out",
        })
        .progress(1);

      ScrollTrigger.create({
        start: "top top",
        end: "max",
        onUpdate: (self) => {
          if (self.direction === -1) {
            showAnim.play();
          } else {
            if (self.scroll() > 80) {
              showAnim.reverse();
            }
          }
        },
      });

      // 3. Scroll progress bar
      if (progressBarRef.current) {
        gsap.to(progressBarRef.current, {
          scaleX: 1,
          transformOrigin: "left center",
          ease: "none",
          scrollTrigger: {
            start: "top top",
            end: "max",
            scrub: 0.2,
          },
        });
      }
    },
    { scope: headerRef }
  );

  return (
    <header
      ref={headerRef}
      className="sticky top-0 z-40 w-full border-b border-[var(--rule-hairline)] bg-[var(--bg-canvas)]/90 backdrop-blur-md transition-colors duration-200"
    >
      {/* Scroll Progress Bar */}
      <div
        ref={progressBarRef}
        className="absolute top-0 left-0 right-0 h-[2px] bg-[#FF4D1F] scale-x-0 transform-origin-left z-50 pointer-events-none"
      />

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
              Active Catalog Intelligence
            </span>
            <span className="text-[10px] text-[var(--ink-tertiary)] font-mono hidden xl:inline ml-2">
              [{timeUtc}]
            </span>
          </div>
        </div>

        {/* Center Navigation Links */}
        <nav className="hidden md:flex items-center gap-6 font-sans text-sm text-[var(--ink-secondary)]">
          <a href="#catalog" className="hover:text-[var(--ink-primary)] transition-colors">
            Shop Catalog
          </a>
          <a href="#problem-answer" className="hover:text-[var(--ink-primary)] transition-colors">
            How It Works
          </a>
          <a href="#guardrails" className="hover:text-[var(--ink-primary)] transition-colors">
            Guardrails
          </a>
          <a href="#proof-stats" className="hover:text-[var(--ink-primary)] transition-colors">
            Proof
          </a>
          <a href="#faq" className="hover:text-[var(--ink-primary)] transition-colors">
            FAQ
          </a>
        </nav>

        {/* Right: Actions & Theme Toggle */}
        <div className="flex items-center gap-3 sm:gap-4">
          <button
            onClick={toggleTheme}
            type="button"
            aria-label="Toggle visual theme"
            className="w-8 h-8 flex items-center justify-center border border-[var(--rule-hairline)] hover:border-[var(--ink-primary)] transition-colors text-[var(--ink-primary)] cursor-pointer"
          >
            {isDark ? "☼" : "☾"}
          </button>

          <button
            onClick={onOpenWidget}
            type="button"
            className="px-3.5 py-2 bg-[var(--ink-primary)] text-[var(--bg-canvas)] hover:bg-[#FF4D1F] hover:text-white transition-colors duration-200 flex items-center gap-2 font-mono text-[11px] uppercase tracking-wider cursor-pointer"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>Ask Catalog</span>
          </button>
        </div>
      </div>
    </header>
  );
}
