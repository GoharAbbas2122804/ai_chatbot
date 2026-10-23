"use client";

import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";

interface Step {
  num: string;
  name: string;
  badge: string;
  desc: string;
  latency: string;
}

const STEPS: Step[] = [
  {
    num: "01",
    name: "Input Gate",
    badge: "Layer 1",
    desc: "Sanitizes control characters, bounds query lengths to 500 chars, and deflects prompt injections.",
    latency: "< 1.5ms",
  },
  {
    num: "02",
    name: "Entity Retrieval",
    badge: "Layer 2",
    desc: "Executes hybrid BM25 and exact SKU lookups over the indexed master catalog records.",
    latency: "< 5.0ms",
  },
  {
    num: "03",
    name: "Grounded Synthesis",
    badge: "Layer 3",
    desc: "Inference conditioned strictly on retrieved XML catalog records with zero parametric guessing.",
    latency: "Streaming",
  },
  {
    num: "04",
    name: "Output Verification",
    badge: "Layer 4",
    desc: "Hard-checks every mentioned SKU, currency digit, and unit against the database before output.",
    latency: "< 2.0ms",
  },
];

export function GuardrailsPipeline() {
  const containerRef = useRef<HTMLElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const stepCardRefs = useRef<(HTMLDivElement | null)[]>([]);

  useGSAP(
    () => {
      if (!containerRef.current) return;

      const path = pathRef.current;
      if (path) {
        const length = path.getTotalLength();
        gsap.set(path, {
          strokeDasharray: length,
          strokeDashoffset: length,
        });

        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: containerRef.current,
            start: "top 75%",
            end: "bottom 80%",
            scrub: 0.8,
          },
        });

        tl.to(path, {
          strokeDashoffset: 0,
          ease: "none",
        });

        stepCardRefs.current.forEach((card, idx) => {
          if (card) {
            tl.fromTo(
              card,
              { autoAlpha: 0.25, y: 30 },
              { autoAlpha: 1, y: 0, duration: 0.35, ease: "power2.out" },
              idx * 0.22
            );
          }
        });
      }
    },
    { scope: containerRef }
  );

  return (
    <section
      id="guardrails"
      ref={containerRef}
      className="relative border-b border-[var(--rule-hairline)] bg-[var(--bg-canvas)] py-20 lg:py-28 overflow-hidden"
    >
      <div className="max-w-[1920px] mx-auto px-4 sm:px-6 md:px-10">
        {/* Section Header */}
        <div className="mb-14 max-w-3xl">
          <div className="inline-flex items-center gap-2 text-xs font-mono tracking-widest uppercase text-[#FF4D1F] mb-3">
            <span className="w-3 h-[1px] bg-[#FF4D1F]" />
            <span>FOUR-TIER ZERO-HALLUCINATION ARCHITECTURE</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-sans font-bold tracking-tight text-[var(--ink-primary)] mb-4">
            The Guardrails Pipeline
          </h2>
          <p className="text-base text-[var(--ink-secondary)] leading-relaxed font-sans">
            Every query passes through four discrete verification layers. If confidence is below 100%,
            INDEX politely redirects to support rather than fabricating specs.
          </p>
        </div>

        {/* Connecting SVG Path (Desktop) */}
        <div className="relative mb-12 hidden lg:block">
          <svg
            className="w-full h-12 overflow-visible"
            viewBox="0 0 1200 40"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M 50 20 L 1150 20"
              stroke="var(--rule-hairline)"
              strokeWidth="2"
            />
            <path
              ref={pathRef}
              d="M 50 20 L 1150 20"
              stroke="#FF4D1F"
              strokeWidth="3"
              strokeLinecap="round"
            />
          </svg>
        </div>

        {/* 4 Steps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {STEPS.map((step, idx) => (
            <div
              key={step.num}
              ref={(el) => {
                stepCardRefs.current[idx] = el;
              }}
              className="bg-[var(--bg-surface)] border border-[var(--rule-hairline)] p-6 rounded-2xl flex flex-col justify-between shadow-sm relative group hover:border-[var(--rule-bold)] transition-colors"
            >
              <div>
                <div className="flex items-center justify-between text-xs font-mono mb-4">
                  <span className="font-bold text-[#FF4D1F] text-base">{step.num}</span>
                  <span className="px-2 py-0.5 border border-[var(--rule-hairline)] text-[var(--ink-tertiary)] uppercase rounded text-[10px]">
                    {step.badge}
                  </span>
                </div>
                <h3 className="font-sans font-bold text-lg text-[var(--ink-primary)] mb-2">
                  {step.name}
                </h3>
                <p className="text-xs text-[var(--ink-secondary)] leading-relaxed font-sans mb-6">
                  {step.desc}
                </p>
              </div>

              <div className="pt-3 border-t border-[var(--rule-hairline)] flex items-center justify-between text-[11px] font-mono text-[var(--ink-tertiary)]">
                <span>Latency</span>
                <span className="font-bold text-[var(--ink-primary)]">{step.latency}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
