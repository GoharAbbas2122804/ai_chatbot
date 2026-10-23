import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 30_000,
  expect: {
    timeout: 5_000,
  },
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: "list",
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000",
    trace: "on-first-retry",
    launchOptions: {
      executablePath: "/usr/bin/google-chrome",
    },
  },
  projects: [
    {
      name: "desktop-chrome",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1440, height: 900 },
      },
    },
    {
      name: "tablet-chrome",
      use: {
        viewport: { width: 768, height: 1024 },
      },
    },
    {
      name: "mobile-chrome",
      use: {
        ...devices["Pixel 7"],
        viewport: { width: 390, height: 844 },
      },
    },
  ],
  webServer: {
    command: "bun run start",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
    env: {
      NEXT_PUBLIC_E2E: "1",
    },
  },
});
