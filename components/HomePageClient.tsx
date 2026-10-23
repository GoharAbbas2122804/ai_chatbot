"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import type { CatalogProduct } from "@/lib/catalog/schema";
import { FilmGrain } from "@/components/FilmGrain";
import { SmoothScroll } from "@/components/SmoothScroll";
import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { CatalogGrid } from "@/components/CatalogGrid";
import { ProblemAnswer } from "@/components/ProblemAnswer";
import { GuardrailsPipeline } from "@/components/GuardrailsPipeline";
import { LiveCatalog } from "@/components/LiveCatalog";
import { ProofStats } from "@/components/ProofStats";
import { StackMarquee } from "@/components/StackMarquee";
import { FAQ } from "@/components/FAQ";
import { ClosingCTA } from "@/components/ClosingCTA";

const ChatWidget = dynamic(
  () => import("@/components/ChatWidget").then((mod) => mod.ChatWidget),
  { ssr: false }
);

const CustomCursor = dynamic(
  () => import("@/components/CustomCursor").then((mod) => mod.CustomCursor),
  { ssr: false }
);

interface HomePageClientProps {
  products: CatalogProduct[];
}

export function HomePageClient({ products }: HomePageClientProps) {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [initialQuestion, setInitialQuestion] = useState<string | undefined>(undefined);

  const handleOpenChat = (question?: string) => {
    if (question) {
      setInitialQuestion(question);
    }
    setIsChatOpen(true);
  };

  const handleCloseChat = () => {
    setIsChatOpen(false);
    setInitialQuestion(undefined);
  };

  return (
    <SmoothScroll>
      <FilmGrain />
      <CustomCursor />

      {/* Header with ScrollTrigger progress bar */}
      <Header onOpenWidget={() => handleOpenChat()} />

      <main className="w-full flex-1 flex flex-col">
        {/* 1. Hero with kinetic headline and live preview */}
        <Hero onOpenTerminal={() => handleOpenChat()} />

        {/* 2. Server-Rendered Precision Catalog Grid */}
        <CatalogGrid
          products={products}
          onAskProduct={(question) => handleOpenChat(question)}
        />

        {/* 3. Problem → Answer pinned scroll storytelling */}
        <ProblemAnswer />

        {/* 4. 4-step Guardrails Pipeline with animated SVG path */}
        <GuardrailsPipeline />

        {/* 5. Live spreadsheet catalog with bidirectional sync */}
        <LiveCatalog />

        {/* 6. Proof: GSAP count-up numbers */}
        <ProofStats />

        {/* 7. Stack Marquee with pause on hover */}
        <StackMarquee />

        {/* 8. Frequently Asked Questions Accordion */}
        <FAQ />

        {/* 9. Closing CTA */}
        <ClosingCTA onOpenTerminal={() => handleOpenChat()} />
      </main>

      {/* Floating Interactive Chat Widget */}
      <ChatWidget
        isOpen={isChatOpen}
        onOpen={() => handleOpenChat()}
        onClose={handleCloseChat}
        initialQuestion={initialQuestion}
      />
    </SmoothScroll>
  );
}
