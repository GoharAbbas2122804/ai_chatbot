import { test, expect } from "@playwright/test";

test.describe("E2E Embed Route (/embed)", () => {
  test("renders embedded chat view without landing page layout", async ({ page }) => {
    await page.goto("/embed", { waitUntil: "networkidle" });

    // Verify header and hero are not rendered
    await expect(page.locator("header")).toHaveCount(0);
    await expect(page.locator("#hero")).toHaveCount(0);

    // Verify embedded chat container is visible
    const chatContainer = page.locator("div[role='log']");
    await expect(chatContainer).toBeVisible();

    // Verify initial greeting
    await expect(page.getByText(/INDEX Catalog Assistant|Catalog Assistant/i).first()).toBeVisible();

    // Verify input bar is present
    const textarea = page.getByPlaceholder(/ask about sku/i);
    await expect(textarea).toBeVisible();
  });
});
