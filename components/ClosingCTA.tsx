"use client";

interface ClosingCTAProps {
  onOpenTerminal?: () => void;
}

export function ClosingCTA({ onOpenTerminal }: ClosingCTAProps) {
  return (
    <footer className="relative border-b border-[var(--rule-hairline)] bg-[var(--bg-canvas)] pt-20 sm:pt-32 pb-12 overflow-hidden">
      <div className="max-w-[1920px] mx-auto px-4 sm:px-6 md:px-10">
        {/* Massive Bleed-Off Display Typography */}
        <div className="relative mb-16 sm:mb-24">
          <div className="inline-flex items-center gap-2 text-xs font-mono tracking-widest uppercase text-[#FF4D1F] mb-4">
            <span className="w-3 h-[1px] bg-[#FF4D1F]" />
            <span>ARCHITECTURE TRANSITION</span>
          </div>

          <h2 className="text-[clamp(2.8rem,9vw,9.5rem)] font-bold tracking-[-0.04em] leading-[0.88] text-[var(--ink-primary)]">
            Stop hallucinating. <br />
            <span className="font-serif italic font-normal text-[#FF4D1F] tracking-tight">
              Start answering.
            </span>
          </h2>
        </div>

        {/* Action Bay Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 border-t border-b border-[var(--rule-hairline)] py-12 mb-16 items-center">
          <div className="lg:col-span-7">
            <p className="text-lg sm:text-2xl font-sans text-[var(--ink-secondary)] max-w-2xl leading-relaxed">
              Connect your catalog schema in under 15 minutes. Deploy
              deterministic product intelligence to your storefront, B2B portal,
              or field sales teams today.
            </p>
          </div>

          <div className="lg:col-span-5 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
            <button
              onClick={onOpenTerminal}
              type="button"
              className="px-8 py-5 bg-[#FF4D1F] text-white font-sans font-bold text-base hover:bg-[var(--ink-primary)] transition-colors duration-200 flex items-center justify-center gap-3 shadow-xl cursor-pointer"
            >
              <span>LAUNCH TERMINAL NOW</span>
              <span className="font-mono text-xs">→</span>
            </button>

            <a
              href="/embed"
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-5 border border-[var(--rule-bold)] text-[var(--ink-primary)] hover:border-[#FF4D1F] hover:text-[#FF4D1F] font-mono text-xs uppercase tracking-wider text-center transition-colors flex items-center justify-center gap-2"
            >
              <span>VIEW /EMBED IFRAME</span>
              <span className="text-[10px]">↗</span>
            </a>
          </div>
        </div>

        {/* Editorial Colophon & Technical Footer */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 text-xs font-mono text-[var(--ink-tertiary)] pt-8">
          <div>
            <span className="font-bold text-[var(--ink-primary)] block mb-2 uppercase text-[11px]">
              INDEX SYSTEMS GMBH
            </span>
            <p className="leading-relaxed">
              Bahnhofstrasse 42
              <br />
              8001 Zürich, Switzerland
              <br />
              UID: CHE-482.910.128
            </p>
          </div>

          <div>
            <span className="font-bold text-[var(--ink-primary)] block mb-2 uppercase text-[11px]">
              SPECIFICATION COMPLIANCE
            </span>
            <p className="leading-relaxed">
              DIN EN ISO 9001:2015
              <br />
              ISO/IEC 27001 Certified
              <br />
              GDPR & SOC2 Type II Harmonized
            </p>
          </div>

          <div>
            <span className="font-bold text-[var(--ink-primary)] block mb-2 uppercase text-[11px]">
              DETERMINISTIC ENGINE
            </span>
            <p className="leading-relaxed">
              Kernel: INDEX-CORE v4.2.0
              <br />
              Mean Latency: 18ms
              <br />
              Hallucination Bound: 0.00%
            </p>
          </div>

          <div className="flex flex-col justify-between">
            <div>
              <span className="font-bold text-[var(--ink-primary)] block mb-2 uppercase text-[11px]">
                COLOPHON
              </span>
              <p className="leading-relaxed">
                Typeset in Instrument Serif, Geist, and JetBrains Mono.
              </p>
            </div>
            <div className="text-[10px] uppercase text-[var(--ink-tertiary)] mt-4">
              © 2026 INDEX. ALL SPECIFICATIONS RESERVED.
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
