import { test, expect } from "@playwright/test";
import fs from "fs";
import path from "path";

test.describe("E2E Motion & Layout Performance", () => {
  test.beforeAll(() => {
    const dir = path.join(process.cwd(), "artifacts/screenshots");
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });

  test("validates 0 console errors, 0 hydration warnings, and CLS < 0.05", async ({ page }, testInfo) => {
    const consoleErrors: string[] = [];
    const hydrationWarnings: string[] = [];

    page.on("console", (msg) => {
      const text = msg.text();
      if (msg.type() === "error") {
        consoleErrors.push(text);
      }
      if (text.toLowerCase().includes("hydration") || text.toLowerCase().includes("did not match")) {
        hydrationWarnings.push(text);
      }
    });

    // Track CLS using PerformanceObserver
    await page.addInitScript(() => {
      (window as unknown as { __clsScore: number }).__clsScore = 0;
      try {
        const observer = new PerformanceObserver((entryList) => {
          for (const entry of entryList.getEntries()) {
            if (!(entry as unknown as { hadRecentInput?: boolean }).hadRecentInput) {
              (window as unknown as { __clsScore: number }).__clsScore += (entry as unknown as { value?: number }).value || 0;
            }
          }
        });
        observer.observe({ type: "layout-shift", buffered: true });
      } catch {
        // PerformanceObserver not supported
      }
    });

    await page.goto("/", { waitUntil: "networkidle" });

    // Verify motion ready flag with timeout
    await page.waitForFunction(
      () => (window as unknown as { __motionReady?: boolean }).__motionReady === true,
      { timeout: 8_000 }
    );

    // Verify initial load CLS (before user scroll) is well under 0.05
    const initialCls = await page.evaluate(() => (window as unknown as { __clsScore: number }).__clsScore || 0);
    console.log(`[Initial Load CLS] ${testInfo.project.name}: ${initialCls.toFixed(4)}`);
    expect(initialCls).toBeLessThan(0.05);

    // Scroll through all key sections
    const sections = ["#hero", "#catalog", "#problem-answer", "#guardrails", "#live-catalog", "#proof", "#faq"];
    for (const id of sections) {
      const el = page.locator(id);
      if (await el.count() > 0) {
        await el.scrollIntoViewIfNeeded();
        await page.waitForTimeout(150);
      }
    }

    // Capture screenshot
    const vp = page.viewportSize();
    const screenshotPath = path.join(
      process.cwd(),
      `artifacts/screenshots/landing-${testInfo.project.name}-${vp?.width || 0}x${vp?.height || 0}.png`
    );
    await page.screenshot({ path: screenshotPath, fullPage: true });

    // Verify 0 console errors and 0 hydration warnings
    const filteredErrors = consoleErrors.filter((e) => !e.includes("favicon") && !e.includes("chrome-extension"));
    expect(filteredErrors).toHaveLength(0);
    expect(hydrationWarnings).toHaveLength(0);

    // On desktop, verify GSAP triggers were initialized
    if (testInfo.project.name === "desktop-chrome") {
      const triggerCount = await page.evaluate(() => {
        return (window as unknown as { __motion?: { triggerCount?: () => number } }).__motion?.triggerCount?.() || 0;
      });
      console.log(`[GSAP ScrollTriggers] Count: ${triggerCount}`);
      expect(triggerCount).toBeGreaterThan(0);
    }
  });

  test("honors prefers-reduced-motion without breaking visibility", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/", { waitUntil: "networkidle" });

    // Verify that key elements are immediately visible without running scroll animations
    const heroTitle = page.locator("#hero h1");
    await expect(heroTitle).toBeVisible();

    const catalogGrid = page.locator("#catalog");
    await expect(catalogGrid).toBeVisible();

    const proofSection = page.locator("#proof");
    await expect(proofSection).toBeVisible();
  });
});
