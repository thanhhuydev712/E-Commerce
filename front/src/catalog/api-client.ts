"use client";
let accessToken: string | null = null;
let refreshing: Promise<boolean> | null = null;
export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly code?: string,
  ) {
    super(message);
  }
}
export function setAccessToken(value: string | null) {
  accessToken = value;
}
export async function refreshSession() {
  if (refreshing) return refreshing;
  refreshing = (async () => {
    const restored = await fetch("/api/v1/auth/session", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    });
    if (restored.status === 401) {
      accessToken = null;
      return false;
    }
    const session = await restored.json();
    if (!restored.ok)
      throw new ApiError(
        restored.status,
        session.error?.message ?? "Không thể khôi phục phiên",
        session.error?.code,
      );
    if (!session.data.requiresRefresh) {
      accessToken = session.data.accessToken;
      return true;
    }
    const response = await fetch("/api/v1/auth/refresh", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: "{}",
      keepalive: true,
    });
    if (response.status === 401) {
      accessToken = null;
      return false;
    }
    const body = await response.json();
    if (!response.ok)
      throw new ApiError(
        response.status,
        body.error?.message ?? "Không thể khôi phục phiên",
        body.error?.code,
      );
    accessToken = body.data.accessToken;
    return true;
  })().finally(() => {
    refreshing = null;
  });
  return refreshing;
}
export async function api<T>(
  path: string,
  options: { method?: string; body?: unknown; key?: string } = {},
  retry = true,
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
  if (options.key) headers["Idempotency-Key"] = options.key;
  const response = await fetch(`/api/v1${path}`, {
    method: options.method ?? "GET",
    credentials: "include",
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
    cache: "no-store",
  });
  if (
    response.status === 401 &&
    retry &&
    !path.startsWith("/auth/") &&
    (await refreshSession())
  )
    return api<T>(path, options, false);
  const payload = await response.json();
  if (!response.ok)
    throw new ApiError(
      response.status,
      payload.error?.message ?? "Không thể kết nối API",
      payload.error?.code,
    );
  return payload.data as T;
}
