"use client";

import { useEffect, useState } from "react";
import { motion, useSpring } from "motion/react";

export function CustomCursor() {
  const [enabled, setEnabled] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [clicked, setClicked] = useState(false);

  // Smooth springs for cursor followers
  const cursorX = useSpring(0, { stiffness: 600, damping: 40 });
  const cursorY = useSpring(0, { stiffness: 600, damping: 40 });

  useEffect(() => {
    // Only enable on precise pointing devices without reduced motion
    const fineQuery = window.matchMedia("(pointer: fine)");
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

    if (!fineQuery.matches || motionQuery.matches) {
      return;
    }

    setEnabled(true);

    const handleMouseMove = (e: MouseEvent) => {
      cursorX.set(e.clientX);
      cursorY.set(e.clientY);
    };

    const handleMouseDown = () => setClicked(true);
    const handleMouseUp = () => setClicked(false);

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      const isInteractive =
        target.tagName === "BUTTON" ||
        target.tagName === "A" ||
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.closest("button") !== null ||
        target.closest("a") !== null ||
        target.getAttribute("role") === "button" ||
        target.dataset.cursorInteractive === "true";

      setHovered(isInteractive);
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    window.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mouseup", handleMouseUp);
    window.addEventListener("mouseover", handleMouseOver, { passive: true });

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("mouseover", handleMouseOver);
    };
  }, [cursorX, cursorY]);

  if (!enabled) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[9998] overflow-hidden">
      {/* Central precision dot */}
      <motion.div
        className="fixed top-0 left-0 w-1.5 h-1.5 -ml-[3px] -mt-[3px] bg-[#FF4D1F] rounded-full pointer-events-none"
        style={{
          x: cursorX,
          y: cursorY,
          scale: clicked ? 0.6 : hovered ? 1.5 : 1,
        }}
      />

      {/* Editorial crosshair ring */}
      <motion.div
        className="fixed top-0 left-0 pointer-events-none flex items-center justify-center -ml-4 -mt-4 w-8 h-8 rounded-full border border-[var(--ink-primary)]/40"
        style={{
          x: cursorX,
          y: cursorY,
          scale: clicked ? 0.8 : hovered ? 1.6 : 1,
          borderColor: hovered ? "rgba(255, 77, 31, 0.8)" : undefined,
        }}
        transition={{ duration: 0.15 }}
      >
        {/* Subtle crosshair hair ticks */}
        <span className="absolute top-0 w-[1px] h-1 bg-[var(--ink-primary)]/40" />
        <span className="absolute bottom-0 w-[1px] h-1 bg-[var(--ink-primary)]/40" />
        <span className="absolute left-0 w-1 h-[1px] bg-[var(--ink-primary)]/40" />
        <span className="absolute right-0 w-1 h-[1px] bg-[var(--ink-primary)]/40" />
      </motion.div>
    </div>
  );
}
