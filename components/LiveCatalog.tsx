"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { INITIAL_CATALOG, type ProductItem } from "@/lib/catalog-data";

export function LiveCatalog() {
  const [catalog, setCatalog] = useState<ProductItem[]>(INITIAL_CATALOG);
  const [selectedSku, setSelectedSku] = useState<string>("SPEC-8820-X");
  const [recentlyEditedField, setRecentlyEditedField] = useState<string | null>(null);

  const activeProduct =
    catalog.find((p) => p.sku === selectedSku) || catalog[0];

  const handlePriceChange = (id: string, newPrice: number) => {
    setCatalog((prev) =>
      prev.map((item) => (item.id === id ? { ...item, price: newPrice } : item))
    );
    setRecentlyEditedField(`${id}-price`);
    setTimeout(() => setRecentlyEditedField(null), 1200);
  };

  const handleStockChange = (id: string, newStock: number) => {
    setCatalog((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              stock: newStock,
              leadTime:
                newStock === 0
                  ? "Backordered (14 business days)"
                  : newStock < 5
                  ? "2 business days (Low Stock)"
                  : "Same-day dispatch",
            }
          : item
      )
    );
    setRecentlyEditedField(`${id}-stock`);
    setTimeout(() => setRecentlyEditedField(null), 1200);
  };

  const resetCatalog = () => {
    setCatalog(INITIAL_CATALOG);
    setRecentlyEditedField("reset");
    setTimeout(() => setRecentlyEditedField(null), 1000);
  };

  return (
    <section
      id="live-catalog"
      className="relative border-b border-[var(--rule-hairline)] bg-[var(--bg-canvas)] py-20 sm:py-32 overflow-hidden"
    >
      <div className="max-w-[1920px] mx-auto px-4 sm:px-6 md:px-10">
        {/* Section Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-12 sm:mb-16">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 text-xs font-mono tracking-widest uppercase text-[#FF4D1F] mb-3">
              <span className="w-3 h-[1px] bg-[#FF4D1F]" />
              <span>BIDIRECTIONAL CATALOG SYNCHRONIZATION</span>
            </div>
            <h2 className="text-3xl sm:text-5xl lg:text-6xl font-sans font-bold tracking-tight text-[var(--ink-primary)]">
              Edit the spreadsheet.{" "}
              <span className="font-serif italic font-normal text-[#FF4D1F]">
                Watch the chatbot adapt instantly.
              </span>
            </h2>
          </div>

          <div className="flex items-center gap-3 font-mono text-xs">
            <button
              onClick={resetCatalog}
              type="button"
              className="px-3.5 py-2 border border-[var(--rule-hairline)] hover:border-[var(--ink-primary)] text-[var(--ink-secondary)] hover:text-[var(--ink-primary)] transition-colors uppercase tracking-wider text-[11px] cursor-pointer"
            >
              RESTORE FACTORY VALUES
            </button>
          </div>
        </div>

        {/* Instructions banner */}
        <div className="mb-6 px-4 py-2.5 bg-[var(--bg-surface)] border border-[var(--rule-hairline)] font-mono text-xs text-[var(--ink-secondary)] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-[#FF4D1F]" />
            <span>
              INTERACTIVE: Click on any price or stock cell in the table below to
              modify values. Observe how the verified chatbot answer reflects the
              mutation in real time.
            </span>
          </div>
          <span className="hidden md:inline text-[10px] text-[var(--ink-tertiary)] uppercase">
            SYNC LATENCY: &lt; 1ms LOCAL
          </span>
        </div>

        {/* Main Split: Editable Table (Left) + Live Matching Answer (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Table (Col 7) */}
          <div className="lg:col-span-7 border border-[var(--rule-bold)] bg-[var(--bg-surface)] shadow-lg overflow-hidden">
            <div className="p-3 border-b border-[var(--rule-hairline)] bg-[var(--bg-subtle)] flex items-center justify-between font-mono text-xs">
              <span className="font-bold text-[var(--ink-primary)] uppercase">
                ENTERPRISE MASTER TABLE [EDITABLE]
              </span>
              <span className="text-[10px] text-[var(--ink-tertiary)] uppercase">
                CLICK CELL TO MUTATE
              </span>
            </div>

            <div className="overflow-x-auto text-xs font-mono">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[var(--rule-hairline)] bg-[var(--bg-canvas)] text-[var(--ink-tertiary)] uppercase text-[10px]">
                    <th className="p-3 border-r border-[var(--rule-hairline)]">
                      SKU
                    </th>
                    <th className="p-3 border-r border-[var(--rule-hairline)]">
                      PRODUCT DESCRIPTION
                    </th>
                    <th className="p-3 border-r border-[var(--rule-hairline)]">
                      UNIT PRICE (USD)
                    </th>
                    <th className="p-3 border-r border-[var(--rule-hairline)]">
                      STOCK
                    </th>
                    <th className="p-3">STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  {catalog.map((item) => {
                    const isSelected = item.sku === selectedSku;
                    const isPriceEdited =
                      recentlyEditedField === `${item.id}-price`;
                    const isStockEdited =
                      recentlyEditedField === `${item.id}-stock`;

                    return (
                      <tr
                        key={item.id}
                        onClick={() => setSelectedSku(item.sku)}
                        className={`border-b border-[var(--rule-hairline)] transition-colors cursor-pointer ${
                          isSelected
                            ? "bg-[var(--bg-canvas)] font-semibold"
                            : "hover:bg-[var(--bg-canvas)]/50"
                        }`}
                      >
                        {/* SKU */}
                        <td className="p-3 border-r border-[var(--rule-hairline)] whitespace-nowrap">
                          <span
                            className={`px-1.5 py-0.5 border text-[11px] uppercase ${
                              isSelected
                                ? "border-[#FF4D1F] bg-[#FF4D1F]/10 text-[#FF4D1F] font-bold"
                                : "border-[var(--rule-hairline)] text-[var(--ink-primary)]"
                            }`}
                          >
                            {item.sku}
                          </span>
                        </td>

                        {/* Name */}
                        <td className="p-3 border-r border-[var(--rule-hairline)] text-[var(--ink-secondary)] text-[11px]">
                          {item.name}
                        </td>

                        {/* Price Input Cell */}
                        <td
                          className={`p-2 border-r border-[var(--rule-hairline)] transition-colors ${
                            isPriceEdited ? "bg-[#FF4D1F]/20" : ""
                          }`}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex items-center gap-1">
                            <span className="text-[var(--ink-tertiary)]">$</span>
                            <input
                              type="number"
                              min="1"
                              step="10"
                              value={item.price}
                              onChange={(e) =>
                                handlePriceChange(
                                  item.id,
                                  Math.max(1, parseInt(e.target.value) || 0)
                                )
                              }
                              className="w-20 bg-[var(--bg-canvas)] border border-[var(--rule-hairline)] px-1.5 py-0.5 text-xs font-mono font-bold text-[var(--ink-primary)] focus:border-[#FF4D1F] focus:outline-none"
                            />
                          </div>
                        </td>

                        {/* Stock Input Cell */}
                        <td
                          className={`p-2 border-r border-[var(--rule-hairline)] transition-colors ${
                            isStockEdited ? "bg-emerald-500/20" : ""
                          }`}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <input
                            type="number"
                            min="0"
                            step="1"
                            value={item.stock}
                            onChange={(e) =>
                              handleStockChange(
                                item.id,
                                Math.max(0, parseInt(e.target.value) || 0)
                              )
                            }
                            className="w-16 bg-[var(--bg-canvas)] border border-[var(--rule-hairline)] px-1.5 py-0.5 text-xs font-mono font-bold text-[var(--ink-primary)] focus:border-[#FF4D1F] focus:outline-none"
                          />
                        </td>

                        {/* Status */}
                        <td className="p-3 whitespace-nowrap text-[11px]">
                          {item.stock > 0 ? (
                            <span className="text-emerald-600 font-bold">
                              {item.stock} in stock
                            </span>
                          ) : (
                            <span className="text-[#FF4D1F] font-bold">
                              Backorder
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Right Matching Chat Answer Box (Col 5) */}
          <div className="lg:col-span-5">
            <div className="border border-[var(--rule-bold)] bg-[var(--bg-surface)] p-6 shadow-xl relative">
              <div className="flex items-center justify-between border-b border-[var(--rule-hairline)] pb-3 mb-4 font-mono text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#FF4D1F] animate-pulse" />
                  <span className="font-bold text-[var(--ink-primary)] uppercase">
                    LINKED CHAT ANSWER PREVIEW
                  </span>
                </div>
                <span className="text-[10px] text-emerald-600 uppercase font-bold">
                  AUTOSYNC ACTIVE
                </span>
              </div>

              <div className="text-[10px] font-mono text-[var(--ink-tertiary)] uppercase mb-2">
                SIMULATED CUSTOMER QUERY:
              </div>
              <div className="p-2.5 bg-[var(--bg-canvas)] border border-[var(--rule-hairline)] font-mono text-xs font-bold text-[var(--ink-primary)] mb-4">
                &quot;What is the current price and stock count for {activeProduct.sku}?&quot;
              </div>

              {/* Animated Answer Box with key on price and stock so it flashes/animates on edit */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={`${activeProduct.sku}-${activeProduct.price}-${activeProduct.stock}`}
                  initial={{ opacity: 0.5, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0.5, y: -4 }}
                  transition={{ duration: 0.2 }}
                  className="p-4 bg-[var(--bg-canvas)] border border-[#FF4D1F] text-xs font-sans"
                >
                  <div className="flex items-center justify-between border-b border-[var(--rule-hairline)] pb-2 mb-3 font-mono text-[11px]">
                    <span className="font-bold text-[#FF4D1F] uppercase">
                      VERIFIED CATALOG RETRIEVAL
                    </span>
                    <span className="text-[var(--ink-tertiary)]">14ms</span>
                  </div>

                  <p className="leading-relaxed text-[var(--ink-secondary)] mb-4">
                    The official price for{" "}
                    <strong className="text-[var(--ink-primary)]">
                      {activeProduct.name}
                    </strong>{" "}
                    [
                    <span className="font-mono font-bold text-[#FF4D1F]">
                      {activeProduct.sku}
                    </span>
                    ] is{" "}
                    <span className="font-mono font-bold text-base text-[var(--ink-primary)] px-1 bg-[#FF4D1F]/10 border border-[#FF4D1F]/30">
                      ${activeProduct.price.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                      })}
                    </span>
                    .
                  </p>

                  <div className="p-3 bg-[var(--bg-surface)] border border-[var(--rule-hairline)] font-mono text-[11px] space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-[var(--ink-tertiary)] uppercase">
                        REAL-TIME INVENTORY:
                      </span>
                      <span
                        className={`font-bold ${
                          activeProduct.stock > 0
                            ? "text-emerald-600"
                            : "text-[#FF4D1F]"
                        }`}
                      >
                        {activeProduct.stock > 0
                          ? `${activeProduct.stock} units available`
                          : "0 units (Backorder)"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[var(--ink-tertiary)] uppercase">
                        LEAD TIME:
                      </span>
                      <span className="text-[var(--ink-primary)]">
                        {activeProduct.leadTime}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[var(--ink-tertiary)] uppercase">
                        OPTICAL TOLERANCE:
                      </span>
                      <span className="text-[var(--ink-primary)]">
                        {activeProduct.specs.toleranceOrAccuracy}
                      </span>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>

              <div className="mt-4 pt-3 border-t border-[var(--rule-hairline)] flex items-center justify-between text-[10px] font-mono text-[var(--ink-tertiary)]">
                <span>ZERO LAG CACHE INVALIDATION</span>
                <span className="text-[#FF4D1F] font-bold">MUTATION SYNCHRONIZED</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
