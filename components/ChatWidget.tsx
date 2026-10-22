"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useChat } from "@ai-sdk/react";
import type { Message } from "@ai-sdk/react";
import { motion, AnimatePresence } from "motion/react";

interface ChatWidgetProps {
  isOpen?: boolean;
  onClose?: () => void;
  isEmbedded?: boolean;
}

const DEFAULT_SUGGESTIONS = [
  "Compare OPT-400 vs OPT-450",
  "Lead time on SPEC-8820-X?",
  "Price & specs for MOD-770",
  "Check stock status for ISO-900",
];

// Helper to parse message text into rich SKU chips and mono prices
function FormattedMessageContent({ text }: { text: string }) {
  // Regex to match SKU tokens like SPEC-8820-X, OPT-400, etc. or [SKU] or prices like $1,840.00
  const tokenRegex = /(\[[A-Z0-9-]+\]|\b[A-Z]{2,5}-\d{3,4}(?:-[A-Z0-9]+)?\b|\$[\d,]+(?:\.\d{2})?)/g;

  const parts = useMemo(() => {
    const segments: Array<{ type: "text" | "sku" | "price"; value: string }> = [];
    let lastIdx = 0;
    let match: RegExpExecArray | null;

    while ((match = tokenRegex.exec(text)) !== null) {
      if (match.index > lastIdx) {
        segments.push({
          type: "text",
          value: text.substring(lastIdx, match.index),
        });
      }
      const val = match[0];
      if (val.startsWith("$")) {
        segments.push({ type: "price", value: val });
      } else {
        segments.push({ type: "sku", value: val.replace(/[\[\]]/g, "") });
      }
      lastIdx = tokenRegex.lastIndex;
    }

    if (lastIdx < text.length) {
      segments.push({ type: "text", value: text.substring(lastIdx) });
    }

    return segments;
  }, [text]);

  return (
    <div className="whitespace-pre-wrap leading-relaxed break-words">
      {parts.map((part, i) => {
        if (part.type === "sku") {
          return (
            <span
              key={i}
              className="inline-flex items-center gap-1 font-mono text-[11px] font-semibold tracking-wider px-1.5 py-0.5 mx-0.5 border border-[var(--rule-bold)] bg-[var(--bg-subtle)] text-[#FF4D1F] select-all uppercase rounded-none transition-colors hover:border-[#FF4D1F]"
              title={`Indexed SKU: ${part.value}`}
            >
              <span className="w-1 h-1 bg-[#FF4D1F] inline-block" />
              {part.value}
            </span>
          );
        }
        if (part.type === "price") {
          return (
            <span
              key={i}
              className="font-mono font-bold text-[var(--ink-primary)] px-0.5 underline decoration-[#FF4D1F]/50 underline-offset-2"
            >
              {part.value}
            </span>
          );
        }
        return <span key={i}>{part.value}</span>;
      })}
    </div>
  );
}

export function ChatWidget({
  isOpen: controlledIsOpen,
  onClose: controlledOnClose,
  isEmbedded = false,
}: ChatWidgetProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalOpen;
  const setIsOpen = controlledOnClose ? controlledOnClose : setInternalOpen;

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Initial welcome message from the verified catalog agent
  const initialMessages: Message[] = useMemo(
    () => [
      {
        id: "msg-init",
        role: "assistant",
        content: `CATALOG QUERY BAY [LAYER 03 / DETERMINISTIC]\n\nI am the catalog intelligence system for INDEX. I answer customer queries regarding pricing, lead times, optical tolerances, and cross-SKU comparisons strictly from your verified PIM/ERP database. Ask me anything about our hardware index.`,
      },
    ],
    []
  );

  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    append,
    setMessages,
  } = useChat({
    api: "/api/chat",
    initialMessages,
  });

  // Auto-resize textarea
  const adjustTextareaHeight = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }, []);

  useEffect(() => {
    adjustTextareaHeight();
  }, [input, adjustTextareaHeight]);

  // Scroll to bottom
  const scrollToBottom = useCallback((smooth = true) => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: scrollContainerRef.current.scrollHeight,
        behavior: smooth ? "smooth" : "auto",
      });
      setShowScrollBottom(false);
    }
  }, []);

  useEffect(() => {
    scrollToBottom(true);
  }, [messages, scrollToBottom]);

  // Monitor scroll for "Scroll to bottom" pill
  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    const isUp = scrollHeight - scrollTop - clientHeight > 100;
    setShowScrollBottom(isUp);
  };

  // Copy helper
  const copyMessage = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Suggestion click
  const handleSuggestionClick = (query: string) => {
    append({
      role: "user",
      content: query,
    });
  };

  // Keyboard send handler
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (input.trim() && !isLoading) {
        handleSubmit(e);
      }
    }
  };

  // Helper to extract text from parts or content as requested by prompt
  const getMessageContent = (m: Message): string => {
    if (m.parts && m.parts.length > 0) {
      return m.parts
        .filter((p): p is { type: "text"; text: string } => p.type === "text")
        .map((p) => p.text)
        .join("");
    }
    return m.content || "";
  };

  // Embedded view container (used in /embed)
  if (isEmbedded) {
    return (
      <div className="w-full h-screen max-h-screen flex flex-col bg-[var(--bg-canvas)] text-[var(--ink-primary)] border border-[var(--rule-hairline)] overflow-hidden font-sans">
        {renderWidgetContent()}
      </div>
    );
  }

  return (
    <>
      {/* Floating Launcher Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 20 }}
            transition={{ type: "spring", stiffness: 450, damping: 30 }}
            className="fixed bottom-5 right-5 sm:bottom-8 sm:right-8 z-50"
          >
            <button
              onClick={() => {
                if (controlledOnClose) {
                  controlledOnClose();
                } else {
                  setInternalOpen(true);
                }
              }}
              type="button"
              aria-label="Open catalog intelligence terminal"
              className="group relative flex items-center gap-3 px-4 py-3 bg-[var(--ink-primary)] text-[var(--bg-canvas)] border border-[var(--rule-bold)] shadow-2xl hover:bg-[#FF4D1F] hover:text-white transition-colors duration-200 cursor-pointer"
            >
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FF4D1F] opacity-75 group-hover:bg-white" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#FF4D1F] group-hover:bg-white" />
              </span>
              <span className="font-mono text-xs font-semibold tracking-wider uppercase">
                QUERY CATALOG
              </span>
              <span className="text-[10px] font-mono opacity-60 border-l border-white/20 pl-2">
                18ms
              </span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating / Mobile Window Modal */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex sm:items-end sm:justify-end sm:p-6 pointer-events-none">
            {/* Backdrop on mobile */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                if (controlledOnClose) controlledOnClose();
                else setInternalOpen(false);
              }}
              className="fixed inset-0 bg-black/40 backdrop-blur-xs sm:hidden pointer-events-auto"
            />

            {/* Main Window */}
            <motion.div
              layoutId="catalog-chat-window"
              initial={{ opacity: 0, scale: 0.92, y: 40, transformOrigin: "bottom right" }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 40 }}
              transition={{ type: "spring", stiffness: 380, damping: 32 }}
              className="pointer-events-auto w-full h-[100dvh] sm:h-[680px] sm:max-h-[85vh] sm:w-[480px] flex flex-col bg-[var(--bg-canvas)] border border-[var(--rule-bold)] shadow-2xl overflow-hidden font-sans"
            >
              {renderWidgetContent()}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );

  function renderWidgetContent() {
    return (
      <>
        {/* Header Bar */}
        <div className="shrink-0 h-14 border-b border-[var(--rule-hairline)] bg-[var(--bg-surface)] px-4 flex items-center justify-between font-mono text-xs">
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600" />
            </span>
            <div className="flex flex-col">
              <span className="font-bold tracking-wider text-[var(--ink-primary)] uppercase text-[11px]">
                CATALOG QUERY BAY
              </span>
              <span className="text-[10px] text-[var(--ink-tertiary)] tracking-widest uppercase">
                HARD-SCHEMA GATE / 0.00% DRIFT
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setMessages(initialMessages)}
              type="button"
              title="Reset terminal session"
              className="px-2 py-1 border border-[var(--rule-hairline)] text-[var(--ink-tertiary)] hover:text-[var(--ink-primary)] hover:border-[var(--ink-primary)] text-[10px] tracking-wider uppercase transition-colors"
            >
              CLEAR
            </button>
            {!isEmbedded && (
              <button
                onClick={() => {
                  if (controlledOnClose) controlledOnClose();
                  else setInternalOpen(false);
                }}
                type="button"
                aria-label="Close chat window"
                className="w-7 h-7 flex items-center justify-center border border-[var(--rule-hairline)] hover:border-[#FF4D1F] hover:text-[#FF4D1F] text-[var(--ink-primary)] transition-colors cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Live Message History */}
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          aria-live="polite"
          className="flex-1 overflow-y-auto p-4 space-y-4 text-xs font-sans relative"
        >
          {messages.map((m) => {
            const isUser = m.role === "user";
            const textContent = getMessageContent(m);
            const isOutOfCatalog =
              !isUser && textContent.includes("CATALOG BOUNDARY: ITEM NOT FOUND");
            const isGuardrailRejected =
              !isUser && textContent.includes("GUARDRAIL INTERVENTION");

            return (
              <div
                key={m.id}
                className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}
              >
                {/* Meta indicator */}
                <div className="flex items-center gap-2 mb-1 text-[10px] font-mono uppercase text-[var(--ink-tertiary)]">
                  <span>{isUser ? "QUERY SOURCE" : "DETERMINISTIC RETRIEVAL"}</span>
                  <span>•</span>
                  <span>{isUser ? "OPERATOR" : "LAYER 03"}</span>
                </div>

                {/* Message bubble */}
                <div
                  className={`relative max-w-[92%] sm:max-w-[88%] p-3.5 border transition-all ${
                    isUser
                      ? "bg-[var(--ink-primary)] text-[var(--bg-canvas)] border-[var(--ink-primary)]"
                      : isOutOfCatalog
                      ? "bg-amber-500/10 border-amber-600/40 text-[var(--ink-primary)]"
                      : isGuardrailRejected
                      ? "bg-red-500/10 border-red-600/40 text-[var(--ink-primary)]"
                      : "bg-[var(--bg-surface)] border-[var(--rule-hairline)] text-[var(--ink-primary)]"
                  }`}
                >
                  <FormattedMessageContent text={textContent} />

                  {/* Streaming Soft Caret */}
                  {!isUser &&
                    isLoading &&
                    m.id === messages[messages.length - 1]?.id && (
                      <span className="inline-block w-1.5 h-3.5 bg-[#FF4D1F] ml-1 animate-pulse align-middle" />
                    )}

                  {/* Copy Button for Assistant */}
                  {!isUser && (
                    <div className="mt-3 pt-2 border-t border-[var(--rule-hairline)] flex items-center justify-between text-[10px] font-mono text-[var(--ink-tertiary)]">
                      <span className="tracking-widest uppercase">VERIFIED ENTITY</span>
                      <button
                        onClick={() => copyMessage(m.id, textContent)}
                        type="button"
                        className="hover:text-[var(--ink-primary)] flex items-center gap-1 transition-colors uppercase tracking-wider"
                      >
                        {copiedId === m.id ? (
                          <span className="text-[#15803D] dark:text-[#22C55E] font-bold">
                            ✓ COPIED
                          </span>
                        ) : (
                          <span>COPY SPECS</span>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* 3-Dot Wave Loading Indicator */}
          {isLoading &&
            messages[messages.length - 1]?.role === "user" && (
              <div className="flex flex-col items-start">
                <div className="flex items-center gap-1.5 px-3 py-2 bg-[var(--bg-surface)] border border-[var(--rule-hairline)]">
                  <span className="w-1.5 h-1.5 bg-[#FF4D1F] rounded-full animate-bounce [animation-delay:-0.3s]" />
                  <span className="w-1.5 h-1.5 bg-[#FF4D1F] rounded-full animate-bounce [animation-delay:-0.15s]" />
                  <span className="w-1.5 h-1.5 bg-[#FF4D1F] rounded-full animate-bounce" />
                  <span className="ml-2 font-mono text-[10px] text-[var(--ink-tertiary)] tracking-widest uppercase">
                    SCANNING INDEX...
                  </span>
                </div>
              </div>
            )}
        </div>

        {/* Scroll-to-bottom floating pill */}
        <AnimatePresence>
          {showScrollBottom && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute bottom-36 left-1/2 -translate-x-1/2 z-10"
            >
              <button
                onClick={() => scrollToBottom(true)}
                type="button"
                className="px-3 py-1 bg-[var(--ink-primary)] text-[var(--bg-canvas)] border border-[var(--rule-bold)] shadow-md text-[10px] font-mono tracking-wider uppercase flex items-center gap-1.5 hover:bg-[#FF4D1F] transition-colors"
              >
                <span>↓ LATEST CHUNKS</span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Suggestion Chips */}
        <div className="shrink-0 px-3 py-2 border-t border-[var(--rule-hairline)] bg-[var(--bg-canvas)] overflow-x-auto flex items-center gap-1.5 scrollbar-none">
          {DEFAULT_SUGGESTIONS.map((sug, i) => (
            <button
              key={i}
              onClick={() => handleSuggestionClick(sug)}
              type="button"
              disabled={isLoading}
              className="shrink-0 px-2.5 py-1 text-[11px] font-mono border border-[var(--rule-hairline)] bg-[var(--bg-surface)] hover:border-[#FF4D1F] hover:text-[#FF4D1F] text-[var(--ink-secondary)] transition-colors whitespace-nowrap cursor-pointer disabled:opacity-50"
            >
              {sug}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="shrink-0 p-3 sm:p-4 border-t border-[var(--rule-hairline)] bg-[var(--bg-surface)] pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))]">
          <form onSubmit={handleSubmit} className="relative flex items-end gap-2">
            <textarea
              ref={textareaRef}
              rows={1}
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Ask specifications, SKU tolerances, comparisons..."
              disabled={isLoading}
              className="flex-1 bg-[var(--bg-canvas)] border border-[var(--rule-bold)] text-[var(--ink-primary)] placeholder-[var(--ink-tertiary)] p-2.5 text-xs font-mono focus:border-[#FF4D1F] focus:outline-none resize-none leading-normal min-h-[42px] max-h-[120px]"
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="h-[42px] px-4 bg-[var(--ink-primary)] text-[var(--bg-canvas)] font-mono text-xs font-bold uppercase tracking-wider hover:bg-[#FF4D1F] hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center shrink-0 cursor-pointer"
            >
              SEND
            </button>
          </form>
          <div className="mt-1.5 flex items-center justify-between text-[10px] font-mono text-[var(--ink-tertiary)]">
            <span>PRESS ENTER TO TRANSMIT • SHIFT+ENTER FOR LINE</span>
            <span className="hidden sm:inline">INDEX v4.2 DETERMINISTIC</span>
          </div>
        </div>
      </>
    );
  }
}
