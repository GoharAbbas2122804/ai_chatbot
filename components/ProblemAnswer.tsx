"use client";

import { useState, useRef, useEffect } from "react";
import { useScroll, useTransform, useReducedMotion } from "motion/react";

export function ProblemAnswer() {
  const containerRef = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();
  const [sliderProgress, setSliderProgress] = useState(0.5); // 0 = raw spreadsheet, 1 = verified answer

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });

  const scrollTransform = useTransform(scrollYProgress, [0.25, 0.65], [0, 1]);

  useEffect(() => {
    if (shouldReduceMotion) return;
    const unsubscribe = scrollTransform.on("change", (latest) => {
      setSliderProgress(Math.max(0, Math.min(1, latest)));
    });
    return () => unsubscribe();
  }, [scrollTransform, shouldReduceMotion]);

  return (
    <section
      id="problem-answer"
      ref={containerRef}
      className="relative border-b border-[var(--rule-hairline)] bg-[var(--bg-canvas)] py-20 sm:py-32 overflow-hidden"
    >
      <div className="max-w-[1920px] mx-auto px-4 sm:px-6 md:px-10">
        {/* Section Header */}
        <div className="mb-12 sm:mb-16 max-w-4xl">
          <div className="inline-flex items-center gap-2 text-xs font-mono tracking-widest uppercase text-[#FF4D1F] mb-3">
            <span className="w-3 h-[1px] bg-[#FF4D1F]" />
            <span>THE REALITY OF ENTERPRISE COMMERCE</span>
          </div>
          <h2 className="text-3xl sm:text-5xl lg:text-6xl font-sans font-bold tracking-tight text-[var(--ink-primary)] mb-6">
            Your catalog is dirty.{" "}
            <span className="font-serif italic font-normal text-[#FF4D1F]">
              Your answers cannot be.
            </span>
          </h2>
          <p className="text-base sm:text-lg text-[var(--ink-secondary)] leading-relaxed font-sans max-w-3xl">
            Legacy spreadsheets, fragmented ERP exports, contradictory PIM
            fields, and manual distributor notes make traditional LLMs
            hallucinate catastrophically. INDEX resolves messy catalog entropy
            into mathematically grounded, deterministic answers.
          </p>
        </div>

        {/* Interactive Scrub Bar / Status Indicator */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4 font-mono text-xs border-b border-[var(--rule-hairline)] pb-4">
          <div className="flex items-center gap-3">
            <span className="text-[10px] text-[var(--ink-tertiary)] uppercase">
              TRANSFORMATION STAGE:
            </span>
            <span
              className={`font-bold uppercase ${
                sliderProgress < 0.4
                  ? "text-red-500"
                  : sliderProgress > 0.8
                  ? "text-emerald-600"
                  : "text-amber-500"
              }`}
            >
              {sliderProgress < 0.4
                ? "STAGE 01: RAW SPREADSHEET ENTROPY"
                : sliderProgress > 0.8
                ? "STAGE 03: CRYSTALLINE VERIFIED ANSWER"
                : "STAGE 02: ACTIVE RECONCILIATION & SCHEMA ENFORCEMENT"}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[10px] text-[var(--ink-tertiary)] uppercase">
              MANUAL REVEAL:
            </span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={sliderProgress}
              onChange={(e) => setSliderProgress(parseFloat(e.target.value))}
              aria-label="Scrub transformation from messy spreadsheet to verified answer"
              className="accent-[#FF4D1F] w-36 cursor-pointer"
            />
            <span className="font-bold text-[var(--ink-primary)]">
              {Math.round(sliderProgress * 100)}%
            </span>
          </div>
        </div>

        {/* Side-by-Side or Overlay Morph Display */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Left: Messy Spreadsheet Panel (Fades/Reduces as progress increases) */}
          <div
            className="lg:col-span-6 border border-[var(--rule-hairline)] bg-[var(--bg-surface)] p-5 sm:p-6 flex flex-col justify-between transition-all duration-300 relative"
            style={{
              opacity: 1 - sliderProgress * 0.4,
              borderColor:
                sliderProgress < 0.5 ? "rgba(239, 68, 68, 0.4)" : undefined,
            }}
          >
            <div>
              <div className="flex items-center justify-between border-b border-[var(--rule-hairline)] pb-3 mb-4 font-mono text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-red-500" />
                  <span className="font-bold text-[var(--ink-primary)] uppercase">
                    INPUT: UNSTRUCTURED RAW SPREADSHEET (3 REVISIONS)
                  </span>
                </div>
                <span className="text-red-500 text-[10px] uppercase font-bold">
                  CONTRADICTION DETECTED
                </span>
              </div>

              {/* Dirty Spreadsheet Mock Table */}
              <div className="overflow-x-auto text-[11px] font-mono border border-[var(--rule-hairline)] bg-[var(--bg-canvas)]">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[var(--rule-hairline)] bg-[var(--bg-subtle)] text-[var(--ink-tertiary)] uppercase">
                      <th className="p-2 border-r border-[var(--rule-hairline)]">
                        SKU_RAW
                      </th>
                      <th className="p-2 border-r border-[var(--rule-hairline)]">
                        PRICE_ERP
                      </th>
                      <th className="p-2 border-r border-[var(--rule-hairline)]">
                        WAREHOUSE_STOCK
                      </th>
                      <th className="p-2">NOTES_FIELD</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-[var(--rule-hairline)] bg-red-500/5">
                      <td className="p-2 font-bold text-red-600 border-r border-[var(--rule-hairline)]">
                        SPEC8820X
                      </td>
                      <td className="p-2 border-r border-[var(--rule-hairline)] line-through text-[var(--ink-tertiary)]">
                        $1,920.00
                      </td>
                      <td className="p-2 border-r border-[var(--rule-hairline)] text-red-600 font-bold">
                        14 (Bay 4)
                      </td>
                      <td className="p-2 text-[10px] text-red-600">
                        Discrepancy: old sheet listed $1,920, SAP says $1,840
                      </td>
                    </tr>
                    <tr className="border-b border-[var(--rule-hairline)]">
                      <td className="p-2 text-[var(--ink-secondary)] border-r border-[var(--rule-hairline)]">
                        OPT400-COL
                      </td>
                      <td className="p-2 border-r border-[var(--rule-hairline)]">
                        $2,190.00
                      </td>
                      <td className="p-2 border-r border-[var(--rule-hairline)]">
                        8
                      </td>
                      <td className="p-2 text-[10px] text-[var(--ink-tertiary)]">
                        Missing coating specs in row 481
                      </td>
                    </tr>
                    <tr className="border-b border-[var(--rule-hairline)] bg-amber-500/5">
                      <td className="p-2 text-amber-600 border-r border-[var(--rule-hairline)]">
                        ISO_900_DAMP
                      </td>
                      <td className="p-2 border-r border-[var(--rule-hairline)]">
                        $1,280.00
                      </td>
                      <td className="p-2 border-r border-[var(--rule-hairline)] text-amber-600 font-bold">
                        0 (BACKORDER)
                      </td>
                      <td className="p-2 text-[10px] text-amber-600">
                        Lead time says 12 days in US, 4 weeks in EU
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Error Callout */}
              <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 font-mono text-[11px] text-[var(--ink-secondary)]">
                <div className="font-bold text-red-600 uppercase mb-1">
                  WHY STANDARD LLMS FAIL HERE:
                </div>
                Unprompted models invent prices when faced with three different
                numbers, quote obsolete inventory from 2023 backups, and guess
                hardware compatibility without verifying mechanical mounts.
              </div>
            </div>

            <div className="mt-6 pt-3 border-t border-[var(--rule-hairline)] text-[10px] font-mono text-[var(--ink-tertiary)] flex justify-between uppercase">
              <span>SOURCE: CSV_IMPORT_REV3.XLSX</span>
              <span>UNCERTAINTY: HIGH</span>
            </div>
          </div>

          {/* Right: Verified Deterministic Output Card (Glows & Highlights as progress increases) */}
          <div
            className="lg:col-span-6 border bg-[var(--bg-canvas)] p-5 sm:p-6 flex flex-col justify-between transition-all duration-300 shadow-xl relative"
            style={{
              borderColor:
                sliderProgress > 0.5 ? "#FF4D1F" : "var(--rule-hairline)",
              transform: `scale(${0.98 + sliderProgress * 0.02})`,
            }}
          >
            <div>
              <div className="flex items-center justify-between border-b border-[var(--rule-hairline)] pb-3 mb-4 font-mono text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-[#FF4D1F]" />
                  <span className="font-bold text-[var(--ink-primary)] uppercase">
                    OUTPUT: GROUNDED CUSTOMER DELIVERABLE
                  </span>
                </div>
                <span className="text-emerald-600 font-bold text-[10px] uppercase">
                  99.98% DETERMINISTIC MATCH
                </span>
              </div>

              {/* Verified Output Card */}
              <div className="p-4 sm:p-5 border border-[var(--rule-bold)] bg-[var(--bg-surface)]">
                <div className="flex items-center gap-2 mb-3">
                  <span className="font-mono text-xs px-2 py-0.5 bg-[#FF4D1F] text-white font-bold tracking-wider uppercase">
                    SPEC-8820-X
                  </span>
                  <span className="text-xs font-mono text-[var(--ink-tertiary)]">
                    / CHRONOS GONIOMETER
                  </span>
                </div>

                <h3 className="text-lg font-serif font-bold text-[var(--ink-primary)] mb-2">
                  Verified Specification & Purchase Brief
                </h3>

                <p className="text-xs sm:text-sm font-sans text-[var(--ink-secondary)] leading-relaxed mb-4">
                  Confirmed through synchronized SAP S/4HANA live inventory and
                  PIM master catalog. Unit pricing locked at{" "}
                  <span className="font-mono font-bold text-[var(--ink-primary)] text-sm">
                    $1,840.00 USD
                  </span>
                  .
                </p>

                {/* Structured Spec Grid */}
                <div className="grid grid-cols-2 gap-3 text-xs font-mono border-t border-b border-[var(--rule-hairline)] py-3 my-3">
                  <div>
                    <span className="text-[10px] text-[var(--ink-tertiary)] uppercase block">
                      RESOLUTION
                    </span>
                    <span className="font-bold text-[var(--ink-primary)]">
                      0.001 mrad
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[var(--ink-tertiary)] uppercase block">
                      ACCURACY
                    </span>
                    <span className="font-bold text-[var(--ink-primary)]">
                      ±0.002° across 360°
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[var(--ink-tertiary)] uppercase block">
                      LIVE INVENTORY
                    </span>
                    <span className="font-bold text-[#15803D] dark:text-[#22C55E]">
                      14 Units (Warehouse B)
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[var(--ink-tertiary)] uppercase block">
                      LEAD TIME
                    </span>
                    <span className="font-bold text-[var(--ink-primary)]">
                      Same-day dispatch
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-[11px] font-mono text-[var(--ink-secondary)]">
                  <span className="text-[#FF4D1F] font-bold">COMPATIBILITY:</span>
                  <span>Mount Base MB-300, Stage ST-440</span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-3 border-t border-[var(--rule-hairline)] text-[10px] font-mono text-[var(--ink-tertiary)] flex justify-between uppercase">
              <span>INDEX VALIDATOR STATUS: ZERO HALLUCINATIONS</span>
              <span className="text-[#FF4D1F] font-bold">LATENCY: 16ms</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
