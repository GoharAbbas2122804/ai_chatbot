"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useChat } from "@ai-sdk/react";
import type { Message } from "@ai-sdk/react";
import { motion, AnimatePresence } from "motion/react";

export interface ChatWidgetProps {
  isOpen?: boolean;
  onClose?: () => void;
  isEmbedded?: boolean;
  initialQuestion?: string;
  onOpen?: () => void;
}

const DEFAULT_SUGGESTIONS = [
  "Compare OPT-400 vs OPT-450",
  "Lead time on SPEC-8820-X?",
  "Price and specs for MOD-770",
  "Cheapest optic in catalog?",
];

const TOKEN_REGEX = /(\[[A-Z0-9-]+\]|\b[A-Z]{2,5}-\d{3,4}(?:-[A-Z0-9]+)?\b|\$[\d,]+(?:\.\d{2})?)/g;

function FormattedMessageContent({ text }: { text: string }) {
  const parts = useMemo(() => {
    const regex = new RegExp(TOKEN_REGEX);
    const segments: Array<{ type: "text" | "sku" | "price"; value: string }> = [];
    let lastIdx = 0;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(text)) !== null) {
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
      lastIdx = regex.lastIndex;
    }

    if (lastIdx < text.length) {
      segments.push({ type: "text", value: text.substring(lastIdx) });
    }

    return segments;
  }, [text]);

  return (
    <div className="whitespace-pre-wrap leading-relaxed break-words text-xs sm:text-sm">
      {parts.map((part, i) => {
        if (part.type === "sku") {
          return (
            <span
              key={i}
              className="inline-flex items-center font-mono text-[11px] font-semibold px-1.5 py-0.5 mx-0.5 bg-neutral-100 dark:bg-neutral-800 text-[#FF4D1F] border border-neutral-200 dark:border-neutral-700 rounded select-all"
              title={`Catalog SKU: ${part.value}`}
            >
              {part.value}
            </span>
          );
        }
        if (part.type === "price") {
          return (
            <span
              key={i}
              className="font-mono font-bold text-[var(--ink-primary)] px-0.5"
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
  onOpen: controlledOnOpen,
  onClose: controlledOnClose,
  isEmbedded = false,
  initialQuestion,
}: ChatWidgetProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalOpen;

  const handleClose = () => {
    if (controlledOnClose) {
      controlledOnClose();
    } else {
      setInternalOpen(false);
    }
  };

  const handleOpen = () => {
    if (controlledOnOpen) {
      controlledOnOpen();
    } else {
      setInternalOpen(true);
    }
  };

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showTooltip, setShowTooltip] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Clean, professional initial message
  const initialMessages: Message[] = useMemo(
    () => [
      {
        id: "msg-init",
        role: "assistant",
        content:
          "Hello. I am the INDEX Catalog Assistant. You can ask me for verified specifications, real-time pricing, stock availability, or direct product comparisons.",
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
    error,
  } = useChat({
    id: "index-catalog-session",
    api: "/api/chat",
    initialMessages,
  });

  // Handle external prefilled question
  useEffect(() => {
    if (initialQuestion && isOpen) {
      append({
        role: "user",
        content: initialQuestion,
      });
    }
  }, [initialQuestion, isOpen, append]);

  // Launcher tooltip after 4s
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowTooltip(true);
    }, 4000);
    return () => clearTimeout(timer);
  }, []);

  // Auto-resize textarea
  const adjustTextareaHeight = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 110)}px`;
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
    }
  }, []);

  useEffect(() => {
    scrollToBottom(true);
  }, [messages, scrollToBottom]);

  const copyMessage = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSuggestionClick = (query: string) => {
    append({
      role: "user",
      content: query,
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (input.trim() && !isLoading) {
        handleSubmit(e);
      }
    }
  };

  const getMessageContent = (m: Message): string => {
    if (m.parts && m.parts.length > 0) {
      return m.parts
        .filter((p): p is { type: "text"; text: string } => p.type === "text")
        .map((p) => p.text)
        .join("");
    }
    return m.content || "";
  };

  // Render Widget Content inside Embed View or Modal
  function renderWidgetContent() {
    return (
      <div className="flex flex-col h-full bg-[var(--bg-canvas)] text-[var(--ink-primary)]">
        {/* Simple & Clean Header */}
        <div className="shrink-0 h-14 border-b border-[var(--rule-hairline)] bg-[var(--bg-surface)] px-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600" />
            </span>
            <div className="flex flex-col">
              <span className="font-semibold text-xs tracking-tight text-[var(--ink-primary)]">
                Catalog Assistant
              </span>
              <span className="text-[10px] text-[var(--ink-tertiary)]">
                Live Verified Knowledge
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setMessages(initialMessages)}
              type="button"
              title="Reset conversation"
              className="px-2.5 py-1 text-[11px] text-[var(--ink-tertiary)] hover:text-[var(--ink-primary)] rounded hover:bg-[var(--bg-subtle)] transition-colors cursor-pointer"
            >
              Reset
            </button>
            {!isEmbedded && (
              <button
                onClick={handleClose}
                type="button"
                aria-label="Close assistant"
                className="w-8 h-8 flex items-center justify-center text-[var(--ink-secondary)] hover:text-[var(--ink-primary)] rounded-full hover:bg-[var(--bg-subtle)] transition-colors cursor-pointer"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Live Message History with data-lenis-prevent */}
        <div
          ref={scrollContainerRef}
          data-lenis-prevent
          role="log"
          aria-live="polite"
          className="flex-1 overflow-y-auto p-4 space-y-3.5 relative"
        >
          {messages.map((m) => {
            const isUser = m.role === "user";
            const textContent = getMessageContent(m);

            return (
              <div
                key={m.id}
                className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}
              >
                <div
                  className={`relative max-w-[86%] p-3.5 rounded-2xl transition-all ${
                    isUser
                      ? "bg-[var(--ink-primary)] text-[var(--bg-canvas)] rounded-br-xs"
                      : "bg-[var(--bg-surface)] border border-[var(--rule-hairline)] text-[var(--ink-primary)] rounded-bl-xs shadow-xs"
                  }`}
                >
                  <FormattedMessageContent text={textContent} />

                  {/* Discrete Copy Button for Assistant */}
                  {!isUser && m.id !== "msg-init" && (
                    <div className="mt-2 pt-1 border-t border-[var(--rule-hairline)] flex items-center justify-end">
                      <button
                        onClick={() => copyMessage(m.id, textContent)}
                        type="button"
                        className="text-[10px] text-[var(--ink-tertiary)] hover:text-[var(--ink-primary)] flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        {copiedId === m.id ? (
                          <span className="text-emerald-600 font-medium">✓ Copied</span>
                        ) : (
                          <span>Copy</span>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* 3-Dot Minimal Wave Loading Indicator */}
          {isLoading && messages[messages.length - 1]?.role === "user" && (
            <div className="flex flex-col items-start">
              <div className="flex items-center gap-1.5 px-3.5 py-2.5 bg-[var(--bg-surface)] border border-[var(--rule-hairline)] rounded-2xl rounded-bl-xs shadow-xs">
                <span className="w-1.5 h-1.5 bg-[#FF4D1F] rounded-full animate-bounce [animation-delay:-0.3s]" />
                <span className="w-1.5 h-1.5 bg-[#FF4D1F] rounded-full animate-bounce [animation-delay:-0.15s]" />
                <span className="w-1.5 h-1.5 bg-[#FF4D1F] rounded-full animate-bounce" />
              </div>
            </div>
          )}

          {/* Friendly Error Banner */}
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-600 dark:text-red-400">
              Unable to complete request. Please check connection or retry.
            </div>
          )}
        </div>

        {/* Suggestion Chips */}
        {messages.length <= 2 && (
          <div className="px-3 py-2 border-t border-[var(--rule-hairline)] bg-[var(--bg-canvas)] overflow-x-auto flex gap-1.5 no-scrollbar">
            {DEFAULT_SUGGESTIONS.map((suggestion, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSuggestionClick(suggestion)}
                className="whitespace-nowrap shrink-0 text-[11px] px-3 py-1 bg-[var(--bg-surface)] border border-[var(--rule-hairline)] text-[var(--ink-secondary)] hover:text-[var(--ink-primary)] hover:border-[var(--ink-primary)] rounded-full transition-colors cursor-pointer"
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}

        {/* Minimal Input Bar */}
        <div className="shrink-0 border-t border-[var(--rule-hairline)] bg-[var(--bg-surface)] p-3">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (input.trim() && !isLoading) {
                handleSubmit(e);
              }
            }}
            className="flex items-end gap-2"
          >
            <textarea
              ref={textareaRef}
              rows={1}
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Ask about SKU, specs, pricing..."
              className="flex-1 max-h-24 resize-none bg-[var(--bg-canvas)] border border-[var(--rule-hairline)] text-[var(--ink-primary)] placeholder:text-[var(--ink-tertiary)] text-xs rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-[#FF4D1F] transition-colors leading-relaxed"
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              aria-label="Send message"
              className="shrink-0 w-9 h-9 bg-[var(--ink-primary)] text-[var(--bg-canvas)] hover:bg-[#FF4D1F] hover:text-white disabled:opacity-25 disabled:pointer-events-none rounded-xl transition-colors flex items-center justify-center cursor-pointer"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Embedded view container (used in /embed)
  if (isEmbedded) {
    return (
      <div className="w-full h-screen max-h-screen border border-[var(--rule-hairline)] overflow-hidden font-sans">
        {renderWidgetContent()}
      </div>
    );
  }

  return (
    <>
      {/* Floating Launcher Button */}
      <AnimatePresence>
        {!isOpen && (
          <div className="fixed bottom-5 right-5 sm:bottom-8 sm:right-8 z-50 flex items-center gap-3">
            {showTooltip && (
              <motion.div
                initial={{ opacity: 0, x: 10, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-[var(--bg-surface)] text-[var(--ink-primary)] border border-[var(--rule-hairline)] shadow-lg rounded-full text-xs font-medium cursor-pointer"
                onClick={handleOpen}
              >
                <span>Ask about any product</span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowTooltip(false);
                  }}
                  className="opacity-50 hover:opacity-100 text-[10px]"
                >
                  ✕
                </button>
              </motion.div>
            )}

            <motion.button
              onClick={handleOpen}
              type="button"
              aria-label="Open product catalog assistant"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              className="flex items-center gap-2.5 px-4 py-3 bg-[var(--ink-primary)] text-[var(--bg-canvas)] shadow-xl hover:bg-[#FF4D1F] hover:text-white transition-colors duration-200 rounded-full cursor-pointer"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="shrink-0"
              >
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              <span className="text-xs font-medium tracking-wide">
                Chat with Catalog
              </span>
            </motion.button>
          </div>
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
              onClick={handleClose}
              className="absolute inset-0 bg-black/30 backdrop-blur-xs sm:hidden pointer-events-auto"
            />

            {/* Main Window */}
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 25 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 25 }}
              transition={{ type: "spring", stiffness: 380, damping: 30 }}
              className="relative z-10 pointer-events-auto w-full h-[100dvh] sm:h-[600px] sm:max-h-[85vh] sm:w-[410px] sm:rounded-2xl flex flex-col bg-[var(--bg-canvas)] border border-[var(--rule-bold)] shadow-2xl overflow-hidden font-sans"
            >
              {renderWidgetContent()}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
