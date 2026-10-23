import { test, expect } from "@playwright/test";

test.describe("E2E Chat Assistant Flow", () => {
  test("opens assistant via launcher button and allows reset", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });

    // 1. Locate and click launcher button
    const launcherBtn = page.getByRole("button", { name: /open product catalog assistant|chat with catalog/i });
    await expect(launcherBtn).toBeVisible();
    await launcherBtn.click();

    // 2. Chat window should appear
    const chatModal = page.locator("div[role='log']");
    await expect(chatModal).toBeVisible();

    // Initial greeting message should be visible
    await expect(page.getByText(/INDEX Catalog Assistant|Catalog Assistant/i).first()).toBeVisible();

    // 3. Click Reset button
    const resetBtn = page.getByRole("button", { name: "Reset" });
    await expect(resetBtn).toBeVisible();
    await resetBtn.click();

    // 4. Close the assistant
    const closeBtn = page.getByRole("button", { name: /close assistant/i });
    await expect(closeBtn).toBeVisible();
    await closeBtn.click();

    // Launcher button reappears
    await expect(launcherBtn).toBeVisible();
  });

  test("pre-fills question when clicking contextual ask button on product card", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });

    // Scroll to catalog section
    const catalog = page.locator("#catalog");
    await catalog.scrollIntoViewIfNeeded();

    // Find first "Ask about this product" button
    const askButtons = page.getByRole("button", { name: /ask about this product/i });
    await expect(askButtons.first()).toBeVisible();
    await askButtons.first().click();

    // Chat widget should open with the question submitted
    const chatModal = page.locator("div[role='log']");
    await expect(chatModal).toBeVisible();

    // The user's question should be in the chat log
    const userMessage = page.locator("div[role='log']").getByText(/what are the specifications/i);
    await expect(userMessage).toBeVisible();
  });

  test("submits input query and displays answer", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });

    // Open chat
    const launcherBtn = page.getByRole("button", { name: /open product catalog assistant|chat with catalog/i });
    await launcherBtn.click();

    // Type query into textarea
    const textarea = page.getByPlaceholder(/ask about sku/i);
    await textarea.fill("How much is OPT-400?");

    // Send query
    const sendBtn = page.getByRole("button", { name: /send message/i });
    await sendBtn.click();

    // Verify user message appears
    await expect(page.getByText("How much is OPT-400?")).toBeVisible();

    // Verify assistant responds with price token inside the chat log
    await expect(page.locator("div[role='log']").getByText("$2,190.00")).toBeVisible({ timeout: 15_000 });
  });
});
