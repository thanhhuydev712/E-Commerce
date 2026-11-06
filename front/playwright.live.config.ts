import { defineConfig, devices } from "@playwright/test";
export default defineConfig({
  testDir: process.env.LIVE_INCLUDE_UI === "1" ? "./tests" : "./tests/live",
  workers: 1,
  retries: 0,
  timeout: 360000,
  expect: { timeout: 30000 },
  reporter: [
    ["list"],
    [
      "json",
      {
        outputFile:
          process.env.LIVE_REPORT_PATH ??
          ".visual-review/live-test-results.json",
      },
    ],
  ],
  use: {
    actionTimeout: 30000,
    navigationTimeout: 60000,
    baseURL: process.env.LIVE_BASE_URL ?? "http://127.0.0.1:3002",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
