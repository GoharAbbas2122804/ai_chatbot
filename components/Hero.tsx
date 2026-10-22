"use client";

import { useState, useRef } from "react";
import { motion, useReducedMotion } from "motion/react";
import { queryCatalogDeterministic } from "@/lib/catalog-data";

interface HeroProps {
  onOpenTerminal?: () => void;
}

const HERO_SUGGESTIONS = [
  "Lead time on SPEC-8820-X?",
  "Compare OPT-400 vs OPT-450",
  "Is ISO-900 in stock today?",
];

export function Hero({ onOpenTerminal }: HeroProps) {
  const shouldReduceMotion = useReducedMotion();
  const [activeQuery, setActiveQuery] = useState(HERO_SUGGESTIONS[0]);
  const [displayedAnswer, setDisplayedAnswer] = useState(
    queryCatalogDeterministic(HERO_SUGGESTIONS[0])
  );
  const [isTyping, setIsTyping] = useState(false);

  // Magnetic button effect
  const buttonRef = useRef<HTMLAnchorElement>(null);
  const [buttonOffset, setButtonOffset] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (shouldReduceMotion) return;
    const btn = buttonRef.current;
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const distanceX = (e.clientX - centerX) * 0.25;
    const distanceY = (e.clientY - centerY) * 0.25;
    setButtonOffset({ x: distanceX, y: distanceY });
  };

  const handleMouseLeave = () => {
    setButtonOffset({ x: 0, y: 0 });
  };

  const handleChipSelect = (query: string) => {
    setActiveQuery(query);
    setIsTyping(true);
    setTimeout(() => {
      setDisplayedAnswer(queryCatalogDeterministic(query));
      setIsTyping(false);
    }, 280);
  };

  const headlineWords = [
    { text: "Ask", isSerif: false },
    { text: "your", isSerif: false },
    { text: "catalog", isSerif: true },
    { text: "anything.", isSerif: false },
  ];

  return (
    <section
      id="hero"
      className="relative min-h-[92vh] border-b border-[var(--rule-hairline)] flex flex-col justify-between pt-8 sm:pt-14 pb-12 overflow-hidden"
    >
      {/* Top Instrument Coordinates Bar */}
      <div className="max-w-[1920px] mx-auto w-full px-4 sm:px-6 md:px-10 mb-8 sm:mb-12">
        <div className="flex flex-wrap items-center justify-between gap-4 text-[11px] font-mono text-[var(--ink-tertiary)] border-b border-[var(--rule-hairline)] pb-3">
          <div className="flex items-center gap-3">
            <span className="w-1.5 h-1.5 bg-[#FF4D1F]" />
            <span className="uppercase tracking-widest">
              SYSTEM STANDARD: SWISS EDITORIAL / DETERMINISTIC 4.2
            </span>
          </div>
          <div className="hidden sm:flex items-center gap-6">
            <span>SPEC: ISO 17025 HARMONIZED</span>
            <span>GRID: 12-COL ASYMMETRIC</span>
            <span className="text-[var(--ink-primary)]">ERROR DRIFT: ZERO</span>
          </div>
        </div>
      </div>

      {/* Main Hero Grid */}
      <div className="max-w-[1920px] mx-auto w-full px-4 sm:px-6 md:px-10 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
        {/* Left Column: Kinetic Headline & Magnetic Action */}
        <div className="lg:col-span-7 flex flex-col justify-center">
          <div className="mb-4 inline-flex items-center gap-2 text-xs font-mono tracking-widest uppercase text-[#FF4D1F]">
            <span className="w-3 h-[1px] bg-[#FF4D1F]" />
            <span>GROUNDED PRODUCT INTELLIGENCE</span>
          </div>

          {/* Kinetic Mask Reveal Headline */}
          <h1 className="text-[clamp(3.2rem,8.2vw,8.5rem)] leading-[0.9] tracking-[-0.04em] font-bold text-[var(--ink-primary)] mb-6 sm:mb-8">
            {headlineWords.map((word, i) => (
              <span
                key={i}
                className="inline-block overflow-hidden mr-[0.22em] align-top"
              >
                <motion.span
                  initial={
                    shouldReduceMotion
                      ? { opacity: 1, y: 0 }
                      : { y: "115%", opacity: 0 }
                  }
                  animate={{ y: 0, opacity: 1 }}
                  transition={{
                    duration: 0.85,
                    delay: 0.12 * i,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  className={`inline-block ${
                    word.isSerif
                      ? "font-serif italic font-normal tracking-normal text-[#FF4D1F]"
                      : "font-sans font-extrabold"
                  }`}
                >
                  {word.text}
                </motion.span>
              </span>
            ))}
          </h1>

          <p className="max-w-2xl text-base sm:text-xl text-[var(--ink-secondary)] leading-relaxed font-sans mb-8 sm:mb-10 font-normal">
            No hallucinations. No generic fluff. INDEX binds strictly to your
            master catalog to answer complex technical specifications, live
            pricing tiers, dimensional tolerances, and multi-SKU comparisons in
            sub-20ms.
          </p>

          {/* CTAs */}
          <div className="flex flex-wrap items-center gap-4 sm:gap-6 font-mono text-xs">
            <motion.a
              ref={buttonRef}
              href="#problem-answer"
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
              animate={{ x: buttonOffset.x, y: buttonOffset.y }}
              transition={{ type: "spring", stiffness: 350, damping: 20 }}
              className="px-7 py-4 bg-[#FF4D1F] text-white font-sans font-semibold text-sm sm:text-base tracking-tight hover:bg-[var(--ink-primary)] transition-colors duration-200 shadow-xl flex items-center gap-3 cursor-pointer select-none"
            >
              <span>SEE THE TRANSFORMATION</span>
              <span className="font-mono text-xs">→</span>
            </motion.a>

            <button
              onClick={onOpenTerminal}
              type="button"
              className="px-6 py-4 border border-[var(--rule-bold)] text-[var(--ink-primary)] hover:border-[#FF4D1F] hover:text-[#FF4D1F] transition-colors font-mono uppercase tracking-wider text-xs flex items-center gap-2 cursor-pointer"
            >
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
              <span>TEST INTERACTIVE TERMINAL</span>
            </button>
          </div>

          {/* Technical Metadata Row */}
          <div className="mt-10 sm:mt-12 pt-6 border-t border-[var(--rule-hairline)] grid grid-cols-2 sm:grid-cols-3 gap-6 font-mono text-xs">
            <div>
              <span className="text-[10px] uppercase text-[var(--ink-tertiary)] block mb-1">
                RETRIEVAL LATENCY
              </span>
              <span className="font-bold text-[var(--ink-primary)] text-sm">
                18ms avg
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase text-[var(--ink-tertiary)] block mb-1">
                HALLUCINATION RATE
              </span>
              <span className="font-bold text-[#15803D] dark:text-[#22C55E] text-sm">
                0.00% (Hard Gate)
              </span>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <span className="text-[10px] uppercase text-[var(--ink-tertiary)] block mb-1">
                COMPATIBILITY
              </span>
              <span className="font-bold text-[var(--ink-primary)] text-sm">
                Shopify / SAP / Akeneo
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Live Interactive Chat Demo Card */}
        <div className="lg:col-span-5">
          <div className="border border-[var(--rule-bold)] bg-[var(--bg-surface)] p-5 sm:p-6 shadow-2xl relative">
            {/* Corner Precision Ticks */}
            <span className="absolute -top-1.5 -left-1.5 w-3 h-3 border-t-2 border-l-2 border-[#FF4D1F]" />
            <span className="absolute -bottom-1.5 -right-1.5 w-3 h-3 border-b-2 border-r-2 border-[#FF4D1F]" />

            {/* Instrument Header */}
            <div className="flex items-center justify-between border-b border-[var(--rule-hairline)] pb-3 mb-4 font-mono text-[11px]">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="font-bold text-[var(--ink-primary)] uppercase">
                  LIVE BENCHMARK
                </span>
              </div>
              <span className="text-[var(--ink-tertiary)]">
                STREAM: DETERMINISTIC
              </span>
            </div>

            {/* Suggested Question Chips */}
            <div className="mb-4">
              <div className="text-[10px] font-mono uppercase text-[var(--ink-tertiary)] mb-2">
                TEST PRE-CALIBRATED QUERIES:
              </div>
              <div className="flex flex-wrap gap-1.5">
                {HERO_SUGGESTIONS.map((sug, i) => (
                  <button
                    key={i}
                    onClick={() => handleChipSelect(sug)}
                    type="button"
                    className={`px-2.5 py-1 text-xs font-mono border transition-all cursor-pointer ${
                      activeQuery === sug
                        ? "border-[#FF4D1F] bg-[#FF4D1F] text-white font-bold"
                        : "border-[var(--rule-hairline)] bg-[var(--bg-canvas)] text-[var(--ink-secondary)] hover:border-[var(--ink-primary)]"
                    }`}
                  >
                    {sug}
                  </button>
                ))}
              </div>
            </div>

            {/* Live Terminal Output Box */}
            <div className="min-h-[260px] bg-[var(--bg-canvas)] border border-[var(--rule-hairline)] p-4 flex flex-col justify-between font-mono text-xs">
              <div>
                <div className="flex items-center justify-between text-[10px] text-[var(--ink-tertiary)] uppercase border-b border-[var(--rule-hairline)] pb-2 mb-3">
                  <span>INPUT: {activeQuery}</span>
                  <span className="text-[#FF4D1F] font-bold">
                    {displayedAnswer.latencyMs}ms
                  </span>
                </div>

                {isTyping ? (
                  <div className="flex items-center gap-2 py-8 text-[var(--ink-tertiary)]">
                    <span className="w-2 h-2 bg-[#FF4D1F] animate-ping" />
                    <span>TRAVERSING MASTER PRODUCT GRAPH...</span>
                  </div>
                ) : (
                  <div>
                    <div className="text-[11px] font-bold text-[var(--ink-primary)] mb-2 uppercase tracking-wide">
                      {displayedAnswer.headline}
                    </div>
                    <div className="text-[11px] font-sans text-[var(--ink-secondary)] leading-relaxed whitespace-pre-wrap">
                      {displayedAnswer.text}
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom Spec Badge */}
              <div className="mt-4 pt-3 border-t border-[var(--rule-hairline)] flex items-center justify-between text-[10px] text-[var(--ink-tertiary)]">
                <span>INDEXED ENTITIES: 42,910</span>
                <span className="text-emerald-600 font-bold">
                  VERIFIED ACCURACY: 99.98%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Scroll Cue */}
      <div className="max-w-[1920px] mx-auto w-full px-4 sm:px-6 md:px-10 mt-8 pt-4 border-t border-[var(--rule-hairline)] flex items-center justify-between text-[11px] font-mono text-[var(--ink-tertiary)]">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 bg-[#FF4D1F]" />
          <span>SCROLL FOR SECTION 02: DIRTY DATA → CRYSTAL ANSWER</span>
        </div>
        <div className="flex items-center gap-4">
          <span>COORDINATES: [001 / HERO]</span>
          <span className="animate-bounce">↓</span>
        </div>
      </div>
    </section>
  );
}
