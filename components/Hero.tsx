"use client";

import { useState, useRef } from "react";
import { gsap, SplitText, useGSAP } from "@/lib/gsap";

interface HeroProps {
  onOpenTerminal?: () => void;
}

const HERO_SUGGESTIONS = [
  {
    q: "Lead time on SPEC-8820-X?",
    a: "SPEC-8820-X (Chronos Goniometer) is $1,840.00 with Same-day dispatch. It features 0.001 mrad resolution and ±0.002° tolerance.",
  },
  {
    q: "Compare OPT-400 vs OPT-450",
    a: "Price difference is 660.00 USD. OPT-400 is $2,190.00 (400mm, Standard C-mount), while OPT-450 PRO is $2,850.00 (450mm, Universal C/F-mount with same-day dispatch).",
  },
  {
    q: "What is your cheapest optic?",
    a: "Lowest priced product in the catalog is the UV Fused Silica Lens (SKU: LNS-250) at $145.00 with same-day dispatch.",
  },
];

export function Hero({ onOpenTerminal }: HeroProps) {
  const containerRef = useRef<HTMLElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const decorRef = useRef<HTMLDivElement>(null);
  const chatCardRef = useRef<HTMLDivElement>(null);
  const magneticBtnRef = useRef<HTMLButtonElement>(null);

  const [activeIdx, setActiveIdx] = useState(0);

  useGSAP(
    () => {
      if (!containerRef.current) return;

      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: reduce)", () => {
        // Reduced motion: show final state immediately
        gsap.set([headlineRef.current, chatCardRef.current, decorRef.current], {
          autoAlpha: 1,
          y: 0,
        });
        if (typeof window !== "undefined") {
          (window as unknown as { __motionReady?: boolean }).__motionReady = true;
        }
      });

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const tl = gsap.timeline({
          defaults: { ease: "power3.out" },
          onComplete: () => {
            if (typeof window !== "undefined") {
              (window as unknown as { __motionReady?: boolean }).__motionReady = true;
            }
          },
        });

        // 1. SplitText headline masked reveal
        if (headlineRef.current) {
          const split = new SplitText(headlineRef.current, {
            type: "lines",
            linesClass: "line-wrapper overflow-hidden",
          });

          // Re-split after web fonts load
          if (typeof document !== "undefined" && document.fonts) {
            document.fonts.ready.then(() => {
              split.split({ type: "lines", linesClass: "line-wrapper overflow-hidden" });
            });
          }

          tl.from(split.lines, {
            yPercent: 110,
            autoAlpha: 0,
            duration: 0.85,
            stagger: 0.08,
          });
        }

        // 2. Chat card rise
        if (chatCardRef.current) {
          tl.from(
            chatCardRef.current,
            {
              y: 50,
              autoAlpha: 0,
              duration: 0.8,
            },
            "-=0.5"
          );
        }

        // 3. Parallax on hero decor elements
        if (decorRef.current) {
          gsap.to(decorRef.current, {
            y: -50,
            ease: "none",
            scrollTrigger: {
              trigger: containerRef.current,
              start: "top top",
              end: "bottom top",
              scrub: 0.6,
            },
          });
        }
      });

      // Pointer-fine subtle card tilt and magnetic button using gsap.quickTo
      mm.add("(pointer: fine)", () => {
        if (magneticBtnRef.current) {
          const btn = magneticBtnRef.current;
          const xTo = gsap.quickTo(btn, "x", { duration: 0.3, ease: "power2.out" });
          const yTo = gsap.quickTo(btn, "y", { duration: 0.3, ease: "power2.out" });

          const onMouseMove = (e: MouseEvent) => {
            const rect = btn.getBoundingClientRect();
            const cx = rect.left + rect.width / 2;
            const cy = rect.top + rect.height / 2;
            xTo((e.clientX - cx) * 0.25);
            yTo((e.clientY - cy) * 0.25);
          };

          const onMouseLeave = () => {
            xTo(0);
            yTo(0);
          };

          btn.addEventListener("mousemove", onMouseMove);
          btn.addEventListener("mouseleave", onMouseLeave);

          return () => {
            btn.removeEventListener("mousemove", onMouseMove);
            btn.removeEventListener("mouseleave", onMouseLeave);
          };
        }
      });
    },
    { scope: containerRef }
  );

  return (
    <section
      id="hero"
      ref={containerRef}
      className="relative min-h-[88vh] border-b border-[var(--rule-hairline)] flex flex-col justify-between pt-8 sm:pt-12 pb-12 overflow-hidden bg-[var(--bg-canvas)]"
    >
      {/* Background Decor Parallax Elements */}
      <div
        ref={decorRef}
        aria-hidden="true"
        className="absolute top-10 right-10 pointer-events-none opacity-20 hidden lg:block"
      >
        <div className="w-96 h-96 rounded-full border border-[var(--rule-bold)] flex items-center justify-center">
          <div className="w-64 h-64 rounded-full border border-dashed border-[var(--rule-bold)]" />
        </div>
      </div>

      {/* Top Coordinate Readout Bar */}
      <div className="max-w-[1920px] mx-auto w-full px-4 sm:px-6 md:px-10 mb-8 sm:mb-12">
        <div className="flex flex-wrap items-center justify-between gap-4 text-[11px] font-mono text-[var(--ink-tertiary)] border-b border-[var(--rule-hairline)] pb-3">
          <div className="flex items-center gap-3">
            <span className="w-1.5 h-1.5 bg-[#FF4D1F]" />
            <span className="uppercase tracking-widest">
              SYSTEM ARCHITECTURE: GROUNDED PRODUCT INTELLIGENCE
            </span>
          </div>
          <div className="hidden sm:flex items-center gap-6">
            <span>SPEC: ISO 17025 COMPLIANT</span>
            <span>CATALOG RETRIEVAL: REAL-TIME</span>
            <span className="text-[var(--ink-primary)] font-semibold">HALLUCINATION: 0.00%</span>
          </div>
        </div>
      </div>

      {/* Main Hero Content Grid */}
      <div className="max-w-[1920px] mx-auto w-full px-4 sm:px-6 md:px-10 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
        {/* Left Column: Headline & Value Proposition */}
        <div className="lg:col-span-7 flex flex-col justify-center">
          <div className="mb-4 inline-flex items-center gap-2 text-xs font-mono tracking-widest uppercase text-[#FF4D1F]">
            <span className="w-3 h-[1px] bg-[#FF4D1F]" />
            <span>PRECISION OPTICS & METROLOGY</span>
          </div>

          <h1
            ref={headlineRef}
            className="text-[clamp(2.8rem,7.5vw,7.8rem)] leading-[0.92] tracking-[-0.04em] font-bold text-[var(--ink-primary)] mb-6 sm:mb-8 font-sans"
          >
            Ask your catalog{" "}
            <span className="font-serif italic font-normal text-[#FF4D1F]">
              anything.
            </span>
          </h1>

          <p className="text-base sm:text-lg text-[var(--ink-secondary)] leading-relaxed max-w-2xl mb-8 font-sans">
            INDEX transforms enterprise spreadsheets and complex technical catalogs into a
            conversational AI that quotes verified prices, exact part numbers, and real-time tolerances with zero hallucination.
          </p>

          <div className="flex flex-wrap items-center gap-4">
            <button
              ref={magneticBtnRef}
              onClick={onOpenTerminal}
              type="button"
              className="px-7 py-4 bg-[var(--ink-primary)] text-[var(--bg-canvas)] hover:bg-[#FF4D1F] hover:text-white transition-colors duration-200 text-sm font-semibold tracking-wide flex items-center gap-3 shadow-xl cursor-pointer"
            >
              <span>Ask About Any Product</span>
              <span className="font-mono text-xs">→</span>
            </button>

            <a
              href="#catalog"
              className="px-6 py-4 border border-[var(--rule-bold)] text-[var(--ink-primary)] hover:border-[#FF4D1F] hover:text-[#FF4D1F] transition-colors text-sm font-medium tracking-wide"
            >
              Browse Catalog Grid
            </a>
          </div>
        </div>

        {/* Right Column: Hero Interactive Chat Preview Card */}
        <div className="lg:col-span-5 flex flex-col justify-center">
          <div
            ref={chatCardRef}
            className="w-full bg-[var(--bg-surface)] border border-[var(--rule-bold)] shadow-2xl p-5 sm:p-6 rounded-2xl relative overflow-hidden"
          >
            {/* Card Header */}
            <div className="flex items-center justify-between border-b border-[var(--rule-hairline)] pb-4 mb-4 font-mono text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="font-semibold text-[var(--ink-primary)]">
                  Live Catalog Assistant
                </span>
              </div>
              <span className="text-[10px] text-[var(--ink-tertiary)] uppercase tracking-wider">
                100% Grounded
              </span>
            </div>

            {/* Interactive Query Chips */}
            <div className="flex flex-wrap gap-1.5 mb-4">
              {HERO_SUGGESTIONS.map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveIdx(idx)}
                  className={`text-xs px-2.5 py-1 rounded-full border transition-all cursor-pointer ${
                    activeIdx === idx
                      ? "bg-[var(--ink-primary)] text-[var(--bg-canvas)] border-[var(--ink-primary)]"
                      : "bg-[var(--bg-canvas)] border-[var(--rule-hairline)] text-[var(--ink-secondary)] hover:border-[var(--ink-primary)]"
                  }`}
                >
                  {item.q}
                </button>
              ))}
            </div>

            {/* Simulated Query & Answer */}
            <div className="space-y-3 font-sans text-xs sm:text-sm">
              <div className="flex justify-end">
                <div className="bg-[var(--ink-primary)] text-[var(--bg-canvas)] px-3.5 py-2.5 rounded-xl rounded-br-xs max-w-[85%]">
                  {HERO_SUGGESTIONS[activeIdx].q}
                </div>
              </div>

              <div className="flex justify-start">
                <div className="bg-[var(--bg-canvas)] border border-[var(--rule-hairline)] text-[var(--ink-primary)] p-3.5 rounded-xl rounded-bl-xs leading-relaxed max-w-[95%]">
                  <p>{HERO_SUGGESTIONS[activeIdx].a}</p>
                  <div className="mt-2.5 pt-2 border-t border-[var(--rule-hairline)] flex items-center justify-between text-[11px] font-mono text-[var(--ink-tertiary)]">
                    <span className="text-emerald-600 font-medium">✓ Verified from Catalog</span>
                    <button
                      onClick={onOpenTerminal}
                      type="button"
                      className="text-[#FF4D1F] hover:underline font-medium"
                    >
                      Try live chat →
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
