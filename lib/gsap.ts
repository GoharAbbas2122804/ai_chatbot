"use client";

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { useGSAP } from "@gsap/react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(useGSAP, ScrollTrigger, SplitText);
  ScrollTrigger.config({ ignoreMobileResize: true });

  // Expose read-only window.__motion.triggerCount() hook
  (window as unknown as { __motion?: { triggerCount: () => number } }).__motion = {
    triggerCount: () => ScrollTrigger.getAll().length,
  };
}

export { gsap, ScrollTrigger, SplitText, useGSAP };
