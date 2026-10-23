"use client";

import { useState, useMemo, useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "@/lib/gsap";
import type { CatalogProduct } from "@/lib/catalog/schema";

interface CatalogGridProps {
  products: CatalogProduct[];
  onAskProduct: (question: string) => void;
}

/**
 * Category-based technical vector illustrations (cross-sections, ray-tracing, schematics).
 */
function TechnicalProductIllustration({
  category,
  sku,
}: {
  category: string;
  sku: string;
}) {
  const catLower = (category || "").toLowerCase();
  const skuLower = (sku || "").toLowerCase();

  // 1. Lasers / Emitters
  if (catLower.includes("laser") || skuLower.includes("las") || skuLower.includes("mod")) {
    return (
      <svg
        viewBox="0 0 200 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full stroke-[var(--rule-bold)]"
      >
        <rect x="25" y="30" width="150" height="60" rx="3" strokeWidth="1.5" className="fill-[var(--bg-subtle)]" />
        <line x1="25" y1="60" x2="175" y2="60" strokeDasharray="3 3" strokeWidth="1" className="stroke-[var(--ink-tertiary)]" />
        <line x1="175" y1="60" x2="200" y2="60" strokeWidth="2" stroke="#FF4D1F" />
        <circle cx="100" cy="60" r="14" strokeWidth="1.5" className="fill-[var(--bg-surface)] stroke-[var(--ink-primary)]" />
        <circle cx="100" cy="60" r="5" fill="#FF4D1F" />
        <line x1="45" y1="40" x2="45" y2="80" strokeWidth="1" className="stroke-[var(--ink-tertiary)]" />
        <line x1="155" y1="40" x2="155" y2="80" strokeWidth="1" className="stroke-[var(--ink-tertiary)]" />
        <text x="32" y="24" fontSize="8" fontFamily="monospace" fill="currentColor" className="text-[var(--ink-tertiary)]">
          EMITTER // COAXIAL
        </text>
      </svg>
    );
  }

  // 2. Mirrors / Beam Splitters / Spectrometers
  if (catLower.includes("mirror") || catLower.includes("spectro") || skuLower.includes("mir") || skuLower.includes("spec")) {
    return (
      <svg
        viewBox="0 0 200 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full stroke-[var(--rule-bold)]"
      >
        <rect x="30" y="20" width="80" height="80" strokeWidth="1.5" className="fill-[var(--bg-subtle)]" />
        <line x1="30" y1="100" x2="110" y2="20" strokeWidth="2.5" className="stroke-[#FF4D1F]" />
        <path d="M 0 60 L 70 60 L 70 0" strokeWidth="1.5" stroke="#FF4D1F" strokeDasharray="4 2" />
        <path d="M 70 60 L 170 60" strokeWidth="1.5" className="stroke-[var(--ink-primary)]" />
        <circle cx="70" cy="60" r="3" fill="#FF4D1F" />
        <text x="32" y="112" fontSize="8" fontFamily="monospace" fill="currentColor" className="text-[var(--ink-tertiary)]">
          BEAM SPLITTER // DIELECTRIC
        </text>
      </svg>
    );
  }

  // 3. Motion Stages / Positioning
  if (catLower.includes("stage") || catLower.includes("position") || skuLower.includes("stg") || skuLower.includes("rot")) {
    return (
      <svg
        viewBox="0 0 200 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full stroke-[var(--rule-bold)]"
      >
        <rect x="30" y="70" width="140" height="30" strokeWidth="1.5" className="fill-[var(--bg-subtle)]" />
        <rect x="55" y="45" width="90" height="25" strokeWidth="1.5" className="fill-[var(--bg-surface)] stroke-[var(--ink-primary)]" />
        <line x1="75" y1="57" x2="125" y2="57" strokeWidth="2" stroke="#FF4D1F" />
        <circle cx="100" cy="57" r="4" fill="#FF4D1F" />
        <line x1="30" y1="85" x2="170" y2="85" strokeDasharray="3 3" strokeWidth="1" className="stroke-[var(--ink-tertiary)]" />
        <text x="32" y="32" fontSize="8" fontFamily="monospace" fill="currentColor" className="text-[var(--ink-tertiary)]">
          PIEZO TRANSLATION // SUB-MICRON
        </text>
      </svg>
    );
  }

  // 4. Lenses / Collimators / General Optics
  return (
    <svg
      viewBox="0 0 200 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-full stroke-[var(--rule-bold)]"
    >
      <path
        d="M 90 20 C 120 40 120 80 90 100 C 60 80 60 40 90 20 Z"
        strokeWidth="1.5"
        className="fill-[var(--bg-subtle)] stroke-[var(--ink-primary)]"
      />
      <line x1="20" y1="60" x2="180" y2="60" strokeDasharray="3 3" strokeWidth="1" className="stroke-[var(--ink-tertiary)]" />
      <path d="M 20 45 L 85 52 L 170 60" strokeWidth="1.5" stroke="#FF4D1F" />
      <path d="M 20 75 L 85 68 L 170 60" strokeWidth="1.5" stroke="#FF4D1F" />
      <circle cx="170" cy="60" r="3" fill="#FF4D1F" />
      <text x="30" y="112" fontSize="8" fontFamily="monospace" fill="currentColor" className="text-[var(--ink-tertiary)]">
        DOUBLE-CONVEX // FOCAL RAY
      </text>
    </svg>
  );
}

export function CatalogGrid({ products, onAskProduct }: CatalogGridProps) {
  const containerRef = useRef<HTMLElement>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return ["All", ...Array.from(set)];
  }, [products]);

  const filteredProducts = useMemo(() => {
    if (selectedCategory === "All") return products;
    return products.filter((p) => p.category === selectedCategory);
  }, [products, selectedCategory]);

  useGSAP(
    () => {
      gsap.from(".catalog-card", {
        y: 20,
        opacity: 0,
        stagger: 0.05,
        duration: 0.5,
        ease: "power2.out",
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top 80%",
          once: true,
        },
      });
    },
    { scope: containerRef, dependencies: [selectedCategory] }
  );

  return (
    <section
      id="catalog"
      ref={containerRef}
      className="relative border-b border-[var(--rule-hairline)] bg-[var(--bg-canvas)] py-20 sm:py-32 overflow-hidden"
    >
      <div className="max-w-[1920px] mx-auto px-4 sm:px-6 md:px-10">
        {/* Section Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-12 sm:mb-16">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 text-xs font-mono tracking-widest uppercase text-[#FF4D1F] mb-3">
              <span className="w-3 h-[1px] bg-[#FF4D1F]" />
              <span>PRECISION PRODUCT CATALOG</span>
            </div>
            <h2 className="text-3xl sm:text-5xl lg:text-6xl font-sans font-bold tracking-tight text-[var(--ink-primary)]">
              Industrial Hardware.{" "}
              <span className="font-serif italic font-normal text-[#FF4D1F]">
                Verified to exact specification.
              </span>
            </h2>
          </div>

          <div className="text-xs font-mono text-[var(--ink-tertiary)] uppercase tracking-wider">
            <span>{filteredProducts.length} ACTIVE SPECIFICATIONS</span>
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-8 no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`whitespace-nowrap px-4 py-2 rounded-full text-xs font-medium font-sans border transition-all cursor-pointer ${
                selectedCategory === cat
                  ? "bg-[var(--ink-primary)] text-[var(--bg-canvas)] border-[var(--ink-primary)] shadow-sm"
                  : "bg-[var(--bg-surface)] text-[var(--ink-secondary)] border-[var(--rule-hairline)] hover:border-[var(--ink-primary)] hover:text-[var(--ink-primary)]"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map((product) => {
            const specEntries = Object.entries(product.specs || {}).slice(0, 3);

            return (
              <div
                key={product.sku}
                className="catalog-card group flex flex-col justify-between border border-[var(--rule-hairline)] bg-[var(--bg-surface)] hover:border-[var(--rule-bold)] rounded-xl overflow-hidden transition-all duration-200 hover:shadow-lg"
              >
                <div>
                  {/* Schematic Vector Drawing */}
                  <div className="h-40 border-b border-[var(--rule-hairline)] bg-[var(--bg-canvas)]/40 p-4 flex items-center justify-center relative overflow-hidden">
                    <TechnicalProductIllustration
                      category={product.category}
                      sku={product.sku}
                    />
                    <div className="absolute top-3 left-3">
                      <span className="inline-block font-mono text-[11px] font-bold px-2 py-0.5 bg-[var(--bg-surface)] text-[#FF4D1F] border border-[var(--rule-hairline)] rounded select-all">
                        {product.sku}
                      </span>
                    </div>
                  </div>

                  {/* Card Content */}
                  <div className="p-5">
                    <div className="text-[10px] font-mono text-[var(--ink-tertiary)] uppercase tracking-wider mb-1">
                      {product.category || "Hardware"}
                    </div>
                    <h3 className="text-base font-bold font-sans text-[var(--ink-primary)] group-hover:text-[#FF4D1F] transition-colors line-clamp-1 mb-2">
                      {product.name}
                    </h3>

                    {/* Price and Stock */}
                    <div className="flex items-baseline justify-between mb-4 pb-3 border-b border-[var(--rule-hairline)]">
                      <div className="text-lg font-bold font-mono text-[var(--ink-primary)]">
                        {product.priceDisplay}
                      </div>
                      <span className="text-[11px] font-medium text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                        In Stock
                      </span>
                    </div>

                    {/* Key Technical Specs */}
                    {specEntries.length > 0 && (
                      <div className="space-y-1.5 mb-5 text-[11px] font-mono">
                        {specEntries.map(([key, val]) => (
                          <div
                            key={key}
                            className="flex items-center justify-between text-[var(--ink-secondary)]"
                          >
                            <span className="text-[var(--ink-tertiary)] capitalize truncate max-w-[120px]">
                              {key.replace(/([A-Z])/g, " $1")}
                            </span>
                            <span className="font-medium text-[var(--ink-primary)] truncate max-w-[140px]">
                              {val}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Contextual Ask Button */}
                <div className="p-5 pt-0">
                  <button
                    type="button"
                    onClick={() =>
                      onAskProduct(
                        `What are the specifications, price, and lead time for ${product.sku} (${product.name})?`
                      )
                    }
                    className="w-full py-2.5 px-3 bg-[var(--bg-canvas)] hover:bg-[var(--ink-primary)] text-[var(--ink-primary)] hover:text-[var(--bg-canvas)] border border-[var(--rule-hairline)] hover:border-[var(--ink-primary)] text-xs font-medium rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                    </svg>
                    <span>Ask about this product</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
