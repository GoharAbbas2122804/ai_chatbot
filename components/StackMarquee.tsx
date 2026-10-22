"use client";

const STACK_ITEMS = [
  { name: "SAP S/4HANA", type: "ERP Master", latency: "Sub-5ms" },
  { name: "SHOPIFY PLUS", type: "Commerce Engine", latency: "Webhook Sync" },
  { name: "AKENEO PIM", type: "Attribute Graph", latency: "GraphQL Stream" },
  { name: "COMMERCELAYER", type: "Composable API", latency: "Instant" },
  { name: "POSTGRESQL PGVECTOR", type: "Dense Index", latency: "Cosine SIM" },
  { name: "BIGCOMMERCE B2B", type: "Enterprise Matrix", latency: "Direct Feed" },
  { name: "SALESFORCE COMMERCE", type: "Catalog Service", latency: "REST Sync" },
  { name: "PIMCORE", type: "Multi-Domain MDM", latency: "Scheduled Feed" },
  { name: "MEDUSA COMMERCE", type: "Headless Node", latency: "Event Bus" },
];

export function StackMarquee() {
  return (
    <div className="w-full border-b border-[var(--rule-hairline)] bg-[var(--bg-surface)] py-6 overflow-hidden">
      <div className="max-w-[1920px] mx-auto px-4 sm:px-6 md:px-10 mb-3 flex items-center justify-between text-[10px] font-mono text-[var(--ink-tertiary)] uppercase tracking-widest">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 bg-[#FF4D1F]" />
          <span>NATIVE ENTERPRISE PROTOCOLS & INTEGRATIONS</span>
        </div>
        <span className="hidden sm:inline">ZERO-DRIFT CONNECTOR MATRIX</span>
      </div>

      {/* Infinite Scrolling Marquee Track */}
      <div className="relative flex overflow-x-hidden border-t border-b border-[var(--rule-hairline)] bg-[var(--bg-canvas)] py-3">
        <div className="flex shrink-0 animate-[marquee_30s_linear_infinite] motion-reduce:animate-none items-center gap-8 pr-8">
          {STACK_ITEMS.map((item, idx) => (
            <div key={`s1-${idx}`} className="flex items-center gap-3">
              <span className="font-serif italic text-lg sm:text-xl text-[var(--ink-primary)] whitespace-nowrap">
                {item.name}
              </span>
              <span className="font-mono text-[10px] uppercase px-1.5 py-0.5 border border-[var(--rule-hairline)] text-[var(--ink-secondary)]">
                {item.type}
              </span>
              <span className="font-mono text-[10px] text-[#FF4D1F]">
                [{item.latency}]
              </span>
              <span className="text-[var(--rule-bold)] font-mono ml-4">/</span>
            </div>
          ))}
        </div>

        <div
          aria-hidden="true"
          className="flex shrink-0 animate-[marquee_30s_linear_infinite] motion-reduce:animate-none items-center gap-8 pr-8"
        >
          {STACK_ITEMS.map((item, idx) => (
            <div key={`s2-${idx}`} className="flex items-center gap-3">
              <span className="font-serif italic text-lg sm:text-xl text-[var(--ink-primary)] whitespace-nowrap">
                {item.name}
              </span>
              <span className="font-mono text-[10px] uppercase px-1.5 py-0.5 border border-[var(--rule-hairline)] text-[var(--ink-secondary)]">
                {item.type}
              </span>
              <span className="font-mono text-[10px] text-[#FF4D1F]">
                [{item.latency}]
              </span>
              <span className="text-[var(--rule-bold)] font-mono ml-4">/</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
