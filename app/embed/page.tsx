import type { Metadata } from "next";
import { Suspense } from "react";
import { EmbedView } from "@/components/EmbedView";

export const metadata: Metadata = {
  title: "INDEX Terminal / Embed",
  description: "Deterministic catalog intelligence terminal iframe embed.",
  robots: "noindex, nofollow",
};

export default function EmbedPage() {
  return (
    <main className="w-full h-screen overflow-hidden bg-[var(--bg-canvas)]">
      <Suspense
        fallback={
          <div className="w-full h-screen flex items-center justify-center font-mono text-xs text-[var(--ink-tertiary)] bg-[var(--bg-canvas)]">
            INITIALIZING CATALOG TERMINAL...
          </div>
        }
      >
        <EmbedView />
      </Suspense>
    </main>
  );
}
