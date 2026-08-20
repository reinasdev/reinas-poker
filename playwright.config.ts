import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";

export default defineConfig({
  testDir: "./tests/e2e",
  // O fluxo cruza duas aplicações e uma caixa de entrada compartilhada;
  // paralelizar embaralha os emails.
  fullyParallel: false,
  workers: 1,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? "github" : "list",
  outputDir: "test-results/playwright",
  // Confere que o reinas-id está de pé antes de rodar qualquer teste.
  globalSetup: "./tests/e2e/global-setup.ts",
  use: { baseURL, trace: "on-first-retry", screenshot: "only-on-failure" },
  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : {
        command: "npm run dev",
        url: `${baseURL}/api/health`,
        reuseExistingServer: !process.env.CI,
        timeout: 180_000,
      },
  projects: [
    { name: "desktop-chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile-chromium", use: { ...devices["Pixel 7"] } },
  ],
});
