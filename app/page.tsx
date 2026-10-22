"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { FilmGrain } from "@/components/FilmGrain";
import { SmoothScroll } from "@/components/SmoothScroll";
import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { ProblemAnswer } from "@/components/ProblemAnswer";
import { GuardrailsPipeline } from "@/components/GuardrailsPipeline";
import { LiveCatalog } from "@/components/LiveCatalog";
import { ProofStats } from "@/components/ProofStats";
import { StackMarquee } from "@/components/StackMarquee";
import { ClosingCTA } from "@/components/ClosingCTA";

// Lazy-load widget and custom cursor for zero hydration drift & optimal performance
const ChatWidget = dynamic(
  () => import("@/components/ChatWidget").then((mod) => mod.ChatWidget),
  { ssr: false }
);

const CustomCursor = dynamic(
  () => import("@/components/CustomCursor").then((mod) => mod.CustomCursor),
  { ssr: false }
);

export default function HomePage() {
  const [isTerminalOpen, setIsTerminalOpen] = useState(false);

  const handleOpenTerminal = () => {
    setIsTerminalOpen(true);
  };

  const handleCloseTerminal = () => {
    setIsTerminalOpen(false);
  };

  return (
    <SmoothScroll>
      {/* Visual textures */}
      <FilmGrain />
      <CustomCursor />

      {/* Page Structure with Semantic Landmarks */}
      <Header onOpenWidget={handleOpenTerminal} />

      <main className="w-full flex-1 flex flex-col">
        {/* 1. Hero with kinetic headline and live chat preview */}
        <Hero onOpenTerminal={handleOpenTerminal} />

        {/* 2. Problem → Answer sticky scroll transformation */}
        <ProblemAnswer />

        {/* 3. 4-step Guardrails Pipeline with animated SVG path */}
        <GuardrailsPipeline />

        {/* 4. Live spreadsheet catalog with bidirectional live update */}
        <LiveCatalog />

        {/* 5. Proof: count-up stats with editable placeholders */}
        <ProofStats />

        {/* 6. Stack Marquee */}
        <StackMarquee />

        {/* 7. Closing CTA with oversized bleed-off display type and colophon */}
        <ClosingCTA onOpenTerminal={handleOpenTerminal} />
      </main>

      {/* Floating Interactive Chat Widget with Spring Morph */}
      <ChatWidget
        isOpen={isTerminalOpen}
        onClose={handleCloseTerminal}
      />
    </SmoothScroll>
  );
}
