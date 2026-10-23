"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";

interface FAQItem {
  question: string;
  answer: string;
  category: string;
}

const FAQ_ITEMS: FAQItem[] = [
  {
    category: "Specifications & Calibration",
    question: "How do I verify optical tolerances and technical drawings before ordering?",
    answer:
      "All optics and stages are accompanied by NIST-traceable metrology reports and ISO/IEC 17025 interferometry maps. You can query our Catalog Assistant for specific wave-front distortions (λ/10 to λ/20), surface flatness, and scratch-dig ratings (10-5 to 40-20), or download complete STEP/CAD packages directly.",
  },
  {
    category: "Delivery & Fulfillment",
    question: "What is your standard lead time for optical assemblies?",
    answer:
      "Catalog items marked 'In Stock' are dispatched same-day for orders received prior to 15:00 UTC. Custom substrates, anti-reflective V-coatings, and specialized beam-splitter cubes typically require 7 to 10 business days for optical bench assembly and cleanroom vacuum packaging.",
  },
  {
    category: "Custom Engineering",
    question: "Can I request custom optical coatings or OEM modifications?",
    answer:
      "Yes. We maintain in-house ion-assisted electron beam deposition chambers supporting broadband AR (350–1100 nm, 600–1600 nm), laser-line high reflectors (>99.9% R at 532 nm, 1064 nm), and customized dielectric beam splitters. Submit your beam diameter, damage threshold (LIDT), and wavelength envelope to our engineering team.",
  },
  {
    category: "AI Catalog Intelligence",
    question: "How accurate is the INDEX Catalog Assistant?",
    answer:
      "The INDEX Catalog Assistant operates under a strict deterministic six-layer guardrail architecture. Unlike unconstrained chatbots, it validates every SKU, price, and unit spec against live ground-truth inventory before streaming. If a product or parameter is not in our verified catalog, the model is architecturally restricted from guessing.",
  },
  {
    category: "Quality Assurance",
    question: "Do you supply material certificates and RoHs/REACH compliance?",
    answer:
      "Every shipment includes Certificate of Conformance (CoC), material traceability certificates (Schott, Corning, or Heraeus fused silica), and full EU RoHS/REACH declarations. Defense and aerospace documentation (ITAR/EAR) is provided upon verification of end-user statements.",
  },
];

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggle = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <section
      id="faq"
      className="relative border-b border-[var(--rule-hairline)] bg-[var(--bg-canvas)] py-20 sm:py-32 overflow-hidden font-sans"
    >
      <div className="max-w-[1920px] mx-auto px-4 sm:px-6 md:px-10">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-12">
          {/* Left Header */}
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 text-xs font-mono tracking-widest uppercase text-[#FF4D1F] mb-3">
              <span className="w-3 h-[1px] bg-[#FF4D1F]" />
              <span>FREQUENTLY ASKED QUESTIONS</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-sans font-bold tracking-tight text-[var(--ink-primary)] mb-6">
              Engineering clarity.{" "}
              <span className="font-serif italic font-normal text-[#FF4D1F]">
                Answered in detail.
              </span>
            </h2>
            <p className="text-base text-[var(--ink-secondary)] leading-relaxed mb-8">
              Everything you need to know about purchasing, custom manufacturing,
              interferometric testing, and deterministic AI catalog lookups.
            </p>
            <div className="p-4 border border-[var(--rule-hairline)] bg-[var(--bg-surface)] rounded-xl">
              <span className="text-xs font-semibold text-[var(--ink-primary)] block mb-1">
                Have a specialized technical inquiry?
              </span>
              <p className="text-xs text-[var(--ink-secondary)] mb-3">
                Our application engineers and verified catalog assistant are available 24/7.
              </p>
              <a
                href="#catalog"
                className="inline-flex items-center gap-1.5 text-xs font-mono text-[#FF4D1F] hover:underline"
              >
                <span>EXPLORE CATALOG SPECIFICATIONS</span>
                <span>→</span>
              </a>
            </div>
          </div>

          {/* Right Accordion List */}
          <div className="w-full lg:max-w-2xl space-y-3">
            {FAQ_ITEMS.map((item, idx) => {
              const isOpen = openIndex === idx;

              return (
                <div
                  key={idx}
                  className="border border-[var(--rule-hairline)] bg-[var(--bg-surface)] rounded-xl overflow-hidden transition-colors"
                >
                  <button
                    type="button"
                    onClick={() => toggle(idx)}
                    aria-expanded={isOpen}
                    className="w-full p-5 text-left flex items-center justify-between gap-4 cursor-pointer focus:outline-none"
                  >
                    <div>
                      <span className="text-[10px] font-mono uppercase text-[#FF4D1F] tracking-wider block mb-1">
                        {item.category}
                      </span>
                      <span className="text-sm sm:text-base font-semibold text-[var(--ink-primary)]">
                        {item.question}
                      </span>
                    </div>

                    <div
                      className={`shrink-0 w-7 h-7 rounded-full border border-[var(--rule-hairline)] flex items-center justify-center text-[var(--ink-secondary)] transition-transform duration-200 ${
                        isOpen ? "rotate-45 text-[#FF4D1F] border-[#FF4D1F]" : ""
                      }`}
                    >
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                      </svg>
                    </div>
                  </button>

                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: "easeInOut" }}
                        className="overflow-hidden"
                      >
                        <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-[var(--ink-secondary)] leading-relaxed border-t border-[var(--rule-hairline)]/50">
                          {item.answer}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
