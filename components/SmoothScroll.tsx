"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import Lenis from "lenis";
import { gsap, ScrollTrigger } from "@/lib/gsap";

export function SmoothScrollProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    // 1. Disabled on /embed
    if (pathname?.startsWith("/embed")) {
      return;
    }

    // 2. Disabled under prefers-reduced-motion
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (prefersReducedMotion) {
      return;
    }

    const lenis = new Lenis({
      autoRaf: false,
      smoothWheel: true,
    });

    lenisRef.current = lenis;

    // Sync Lenis scroll with ScrollTrigger
    const onScroll = () => {
      ScrollTrigger.update();
    };
    lenis.on("scroll", onScroll);

    const tickerCb = (time: number) => {
      lenis.raf(time * 1000);
    };

    gsap.ticker.add(tickerCb);
    gsap.ticker.lagSmoothing(0);

    // Refresh ScrollTrigger after web fonts and window load
    const handleRefresh = () => {
      ScrollTrigger.refresh();
    };

    if (typeof document !== "undefined" && document.fonts) {
      document.fonts.ready.then(handleRefresh);
    }
    window.addEventListener("load", handleRefresh);

    return () => {
      window.removeEventListener("load", handleRefresh);
      gsap.ticker.remove(tickerCb);
      lenis.off("scroll", onScroll);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, [pathname]);

  return <>{children}</>;
}

export const SmoothScroll = SmoothScrollProvider;
