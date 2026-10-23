import type { Metadata, Viewport } from "next";
import { Instrument_Serif, Geist, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-instrument-serif",
  display: "swap",
});

const geistSans = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "INDEX — Grounded Catalog Intelligence & Deterministic SKU Retrieval",
  description:
    "An uncompromising instrument panel that answers customer questions strictly from verified product catalogs with 0.00% hallucination.",
  keywords: [
    "AI Product Catalog",
    "SKU Retrieval",
    "Deterministic AI",
    "E-commerce Chatbot",
    "Grounded Retrieval",
  ],
  authors: [{ name: "INDEX Systems" }],
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#F2EFE8",
};

import { SmoothScrollProvider } from "@/components/SmoothScroll";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${instrumentSerif.variable} ${geistSans.variable} ${jetbrainsMono.variable} antialiased selection:bg-[#FF4D1F] selection:text-white`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              document.documentElement.classList.add('js');
              window.__motionReady = false;
              setTimeout(function() {
                if (!window.__motionReady) {
                  document.documentElement.classList.add('motion-failed');
                }
              }, 3000);
            `,
          }}
        />
      </head>
      <body className="min-h-screen flex flex-col bg-[var(--bg-canvas)] text-[var(--ink-primary)] font-sans antialiased">
        <SmoothScrollProvider>{children}</SmoothScrollProvider>
      </body>
    </html>
  );
}
