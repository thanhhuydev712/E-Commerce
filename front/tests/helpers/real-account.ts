import { expect, type Page } from "@playwright/test";
import { randomUUID } from "node:crypto";

// BrowserContext request shares the HttpOnly refresh cookie with the page.
// Only call from the isolated fullstack runner, never against a production URL.
export async function registerRealAccount(page: Page) {
  const email = `ui-${randomUUID()}@fullstack.test`;
  const base = process.env.LIVE_BASE_URL ?? "http://127.0.0.1:3002";
  if (!["127.0.0.1", "localhost"].includes(new URL(base).hostname))
    throw new Error("UI account fixtures require a local isolated runner");
  const response = await page.request.post("/api/v1/auth/register", {
    headers: { Origin: new URL(base).origin },
    data: { email, password: "FullstackPassword-2026!", firstName: "UI Buyer" },
  });
  expect(response.status()).toBe(201);
  return { email };
}
