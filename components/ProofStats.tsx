"use client";

import { useEffect, useState, useRef } from "react";
import { useInView, useReducedMotion } from "motion/react";

/**
 * EDITABLE PROOF STATS PLACEHOLDERS
 * Replace these placeholder values with your company's actual metrics.
 */
export const PROOF_STATS_CONFIG = [
  {
    id: "STAT_QUERY_PRECISION",
    numericTarget: 99.98,
    suffix: "%",
    label: "Query Precision Rate",
    detail: "Evaluated against 2.4M multi-SKU lookups against live ERP ground truth.",
    instrumentRef: "CAL/ISO-998",
  },
  {
    id: "STAT_MEAN_LATENCY",
    numericTarget: 18,
    suffix: "ms",
    label: "Mean Retrieval Latency",
    detail: "Sub-20ms hybrid vector and BM25 indexing with zero LLM cache overhead.",
    instrumentRef: "TIMING/SUB-20",
  },
  {
    id: "STAT_HALLUCINATION_RATE",
    numericTarget: 0.0,
    suffix: "%",
    label: "Hallucination Tolerance",
    detail: "Hard-schema gate ensures answers only contain verified catalog entities.",
    instrumentRef: "GATE/HARD-SCHEMA",
  },
  {
    id: "STAT_ANSWERS_SERVED",
    numericTarget: 4.8,
    suffix: "M+",
    label: "Deterministic Answers Served",
    detail: "Active production volume across industrial optics, electronics, and aerospace.",
    instrumentRef: "VOL/ANNUAL-PROD",
  },
];

function AnimatedCounter({
  target,
  suffix,
  decimals = 2,
}: {
  target: number;
  suffix: string;
  decimals?: number;
}) {
  const [value, setValue] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.4 });
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    if (!isInView) return;
    if (shouldReduceMotion) {
      const rafId = requestAnimationFrame(() => setValue(target));
      return () => cancelAnimationFrame(rafId);
    }

    const duration = 1600; // ms
    const startTime = performance.now();

    const frame = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      // Snappy cubic ease-out
      const ease = 1 - Math.pow(1 - progress, 3);
      setValue(target * ease);

      if (progress < 1) {
        requestAnimationFrame(frame);
      } else {
        setValue(target);
      }
    };

    requestAnimationFrame(frame);
  }, [isInView, target, shouldReduceMotion]);

  const formatted =
    decimals === 0
      ? Math.round(value).toString()
      : value.toFixed(decimals);

  return (
    <span ref={ref} className="tabular-nums font-mono">
      {formatted}
      <span className="text-[#FF4D1F] font-sans ml-0.5">{suffix}</span>
    </span>
  );
}

export function ProofStats() {
  return (
    <section
      id="proof"
      className="relative border-b border-[var(--rule-hairline)] bg-[var(--bg-canvas)] py-20 sm:py-32 overflow-hidden"
    >
      <div className="max-w-[1920px] mx-auto px-4 sm:px-6 md:px-10">
        {/* Section Header */}
        <div className="mb-14 sm:mb-20 max-w-4xl">
          <div className="inline-flex items-center gap-2 text-xs font-mono tracking-widest uppercase text-[#FF4D1F] mb-3">
            <span className="w-3 h-[1px] bg-[#FF4D1F]" />
            <span>EMPIRICAL VALIDATION</span>
          </div>
          <h2 className="text-3xl sm:text-5xl lg:text-6xl font-sans font-bold tracking-tight text-[var(--ink-primary)] mb-6">
            Tested to zero tolerance.{" "}
            <span className="font-serif italic font-normal text-[#FF4D1F]">
              Proven in high-stakes catalog search.
            </span>
          </h2>
          <p className="text-base sm:text-lg text-[var(--ink-secondary)] leading-relaxed font-sans max-w-3xl">
            When purchasing high-precision industrial hardware, an inaccurate
            tolerance or wrong price costs tens of thousands of dollars. INDEX
            is built like an avionics system: mathematically verified, rigorously
            measured.
          </p>
        </div>

        {/* 4-Stat Editorial Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 border-t border-l border-[var(--rule-hairline)] bg-[var(--bg-canvas)]">
          {PROOF_STATS_CONFIG.map((stat) => (
            <div
              key={stat.id}
              className="border-r border-b border-[var(--rule-hairline)] p-6 sm:p-8 flex flex-col justify-between hover:bg-[var(--bg-surface)] transition-colors duration-200"
            >
              <div>
                {/* Instrument Metadata */}
                <div className="flex items-center justify-between text-[10px] font-mono text-[var(--ink-tertiary)] border-b border-[var(--rule-hairline)] pb-2 mb-6">
                  <span>{stat.instrumentRef}</span>
                  <span className="uppercase text-[9px] text-[#FF4D1F]">
                    {stat.id}
                  </span>
                </div>

                {/* Number with Count-Up */}
                <div className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tighter text-[var(--ink-primary)] mb-4">
                  <AnimatedCounter
                    target={stat.numericTarget}
                    suffix={stat.suffix}
                    decimals={
                      stat.id === "STAT_MEAN_LATENCY"
                        ? 0
                        : stat.id === "STAT_ANSWERS_SERVED"
                        ? 1
                        : 2
                    }
                  />
                </div>

                {/* Label */}
                <h3 className="text-base sm:text-lg font-bold font-sans text-[var(--ink-primary)] mb-2">
                  {stat.label}
                </h3>

                {/* Detail */}
                <p className="text-xs sm:text-sm text-[var(--ink-secondary)] font-sans leading-relaxed">
                  {stat.detail}
                </p>
              </div>

              <div className="mt-8 pt-3 border-t border-[var(--rule-hairline)] text-[10px] font-mono text-[var(--ink-tertiary)] uppercase flex justify-between">
                <span>BENCHMARK: 2026 AUDIT</span>
                <span className="text-emerald-600 font-bold">VERIFIED</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
