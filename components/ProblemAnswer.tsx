"use client";

import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";

export function ProblemAnswer() {
  const containerRef = useRef<HTMLElement>(null);
  const rawCardRef = useRef<HTMLDivElement>(null);
  const arrowRef = useRef<HTMLDivElement>(null);
  const verifiedCardRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (!containerRef.current) return;

      const mm = gsap.matchMedia();

      // Desktop: Pinned scrub timeline from "customer question" to "validated answer"
      mm.add("(min-width: 1024px)", () => {
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: containerRef.current,
            pin: true,
            anticipatePin: 1,
            scrub: 1,
            start: "top top",
            end: "+=800",
          },
        });

        tl.to(rawCardRef.current, {
          autoAlpha: 0.35,
          scale: 0.96,
          duration: 1,
        })
          .to(
            arrowRef.current,
            {
              scale: 1.25,
              color: "#FF4D1F",
              duration: 0.8,
            },
            "<0.2"
          )
          .fromTo(
            verifiedCardRef.current,
            { autoAlpha: 0.2, y: 30, scale: 0.95 },
            { autoAlpha: 1, y: 0, scale: 1, duration: 1 },
            "-=0.4"
          )
          .to(".story-sku-chip", {
            backgroundColor: "#FF4D1F",
            color: "#FFFFFF",
            borderColor: "#FF4D1F",
            stagger: 0.15,
            duration: 0.5,
          });
      });

      // Mobile: Simple stacked reveal
      mm.add("(max-width: 1023px)", () => {
        gsap.from([rawCardRef.current, verifiedCardRef.current], {
          y: 40,
          autoAlpha: 0,
          stagger: 0.15,
          duration: 0.8,
          ease: "power3.out",
          scrollTrigger: {
            trigger: containerRef.current,
            start: "top 80%",
            once: true,
          },
        });
      });
    },
    { scope: containerRef }
  );

  return (
    <section
      id="problem-answer"
      ref={containerRef}
      className="relative border-b border-[var(--rule-hairline)] bg-[var(--bg-canvas)] py-20 lg:py-28 overflow-hidden min-h-screen flex flex-col justify-center"
    >
      <div className="max-w-[1920px] mx-auto px-4 sm:px-6 md:px-10 w-full">
        {/* Section Header */}
        <div className="mb-12 max-w-3xl">
          <div className="inline-flex items-center gap-2 text-xs font-mono tracking-widest uppercase text-[#FF4D1F] mb-3">
            <span className="w-3 h-[1px] bg-[#FF4D1F]" />
            <span>HOW IT WORKS: PINNED STORYTELLING</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-sans font-bold tracking-tight text-[var(--ink-primary)] mb-4">
            From messy catalog entropy to{" "}
            <span className="font-serif italic font-normal text-[#FF4D1F]">
              verified precision.
            </span>
          </h2>
          <p className="text-base text-[var(--ink-secondary)] leading-relaxed font-sans">
            Generic LLMs guess and hallucinate when facing complex technical tables.
            INDEX grounds every token deterministically against verified SKU entities.
          </p>
        </div>

        {/* Storytelling Visual Track */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center">
          {/* Step 1: Customer Question & Raw Catalog Match */}
          <div
            ref={rawCardRef}
            className="lg:col-span-5 bg-[var(--bg-surface)] border border-[var(--rule-hairline)] p-6 rounded-2xl shadow-md"
          >
            <div className="flex items-center justify-between text-xs font-mono text-[var(--ink-tertiary)] border-b border-[var(--rule-hairline)] pb-3 mb-4">
              <span className="uppercase tracking-wider">Step 01 / Customer Inquiry</span>
              <span className="text-[#FF4D1F] font-semibold">Raw Request</span>
            </div>

            <div className="bg-[var(--bg-canvas)] p-3.5 rounded-xl border border-[var(--rule-hairline)] mb-4 text-xs font-sans text-[var(--ink-primary)]">
              &ldquo;I need a telecentric collimator around 400mm with C-mount under $2,500. What is in stock?&rdquo;
            </div>

            <div className="text-[11px] font-mono text-[var(--ink-secondary)] space-y-1.5 border-t border-[var(--rule-hairline)] pt-3">
              <div className="flex justify-between">
                <span>Database Search:</span>
                <span className="text-[var(--ink-primary)] font-semibold">BM25 + Semantic</span>
              </div>
              <div className="flex justify-between">
                <span>Candidate SKUs:</span>
                <span className="text-[var(--ink-primary)] font-semibold">OPT-400, OPT-400-COMPACT</span>
              </div>
            </div>
          </div>

          {/* Central Transformation Indicator */}
          <div
            ref={arrowRef}
            className="lg:col-span-2 flex flex-col items-center justify-center py-2 text-[var(--ink-tertiary)] font-mono text-xs text-center"
          >
            <div className="w-10 h-10 rounded-full border border-[var(--rule-bold)] flex items-center justify-center mb-1 bg-[var(--bg-canvas)]">
              →
            </div>
            <span className="text-[10px] uppercase tracking-widest text-[#FF4D1F] font-semibold">
              Deterministic Gate
            </span>
          </div>

          {/* Step 2: Validated Answer with Highlighting SKU Chips */}
          <div
            ref={verifiedCardRef}
            className="lg:col-span-5 bg-[var(--bg-surface)] border border-[var(--rule-bold)] p-6 rounded-2xl shadow-xl relative"
          >
            <div className="flex items-center justify-between text-xs font-mono text-[var(--ink-tertiary)] border-b border-[var(--rule-hairline)] pb-3 mb-4">
              <span className="uppercase tracking-wider">Step 02 / Validated Answer</span>
              <span className="text-emerald-600 font-semibold">0.00% Hallucination</span>
            </div>

            <div className="bg-[var(--bg-canvas)] p-4 rounded-xl border border-[var(--rule-hairline)] mb-4 text-xs font-sans text-[var(--ink-primary)] leading-relaxed">
              We have two verified options matching your requirements:
              <ul className="mt-2 space-y-2">
                <li>
                  •{" "}
                  <span className="story-sku-chip font-mono text-[11px] px-1.5 py-0.5 border border-[var(--rule-bold)] rounded font-semibold transition-colors">
                    OPT-400
                  </span>{" "}
                  (400mm ±0.05%, Standard C-mount) priced at <strong>$2,190.00</strong> with 2-day dispatch.
                </li>
                <li>
                  •{" "}
                  <span className="story-sku-chip font-mono text-[11px] px-1.5 py-0.5 border border-[var(--rule-bold)] rounded font-semibold transition-colors">
                    OPT-400-COMPACT
                  </span>{" "}
                  priced at <strong>$1,950.00</strong> with 3-day dispatch.
                </li>
              </ul>
            </div>

            <div className="text-[11px] font-mono text-emerald-600 border-t border-[var(--rule-hairline)] pt-3 flex items-center justify-between">
              <span>✓ All prices and tolerances hard-validated</span>
              <span className="text-[10px] text-[var(--ink-tertiary)]">18ms</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
