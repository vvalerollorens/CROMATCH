import { defineConfig, devices } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/live",
  timeout: 120000,
  workers: 1,
  retries: 0,
  reporter: "list",
  expect: { timeout: 20000 },
  use: {
    actionTimeout: 10000,
    navigationTimeout: 20000,
    baseURL: "https://cromatch-six.vercel.app",
    trace: "off",
    screenshot: "off",
    video: "off",
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    {
      name: "mobile",
      use: { ...devices["iPhone 13"], defaultBrowserType: "chromium" },
    },
  ],
});
