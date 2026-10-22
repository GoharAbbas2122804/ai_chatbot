import type { Metadata } from "next";
import { ChatWidget } from "@/components/ChatWidget";

export const metadata: Metadata = {
  title: "INDEX Terminal / Embed",
  description: "Deterministic catalog intelligence terminal iframe embed.",
  robots: "noindex, nofollow",
};

export default function EmbedPage() {
  return (
    <main className="w-full h-screen overflow-hidden bg-[var(--bg-canvas)]">
      <ChatWidget isEmbedded />
    </main>
  );
}
