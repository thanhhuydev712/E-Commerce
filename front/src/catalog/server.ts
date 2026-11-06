import "server-only";
import { cache } from "react";
import { connection } from "next/server";
import type { StorefrontSnapshot } from "./model";
export const getStorefront = cache(async (): Promise<StorefrontSnapshot> => {
  await connection();
  const base = process.env.API_INTERNAL_URL ?? "http://127.0.0.1:3001";
  const response = await fetch(`${base}/api/v1/storefront`, {
    cache: "no-store",
    signal: AbortSignal.timeout(30000),
  });
  if (!response.ok)
    throw new Error("Không tải được dữ liệu cửa hàng từ backend.");
  const payload = await response.json();
  return payload.data as StorefrontSnapshot;
});
