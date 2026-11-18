import { defineConfig, devices } from "@playwright/test";
import { WELCOME_PROMOTION_COOKIE } from "./src/config/welcome-promotion";

const baseURL = process.env.LIVE_BASE_URL ?? "http://127.0.0.1:3002";
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
    baseURL,
    // Các suite nghiệp vụ bắt đầu ở phiên đã xem quảng bá; suite popup tự dùng phiên mới.
    storageState: {
      cookies: [
        {
          name: WELCOME_PROMOTION_COOKIE,
          value: "seen",
          domain: new URL(baseURL).hostname,
          path: "/",
          expires: -1,
          httpOnly: false,
          secure: new URL(baseURL).protocol === "https:",
          sameSite: "Lax",
        },
      ],
      origins: [],
    },
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
