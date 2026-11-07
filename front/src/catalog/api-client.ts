"use client";
let accessToken: string | null = null;
let refreshing: Promise<boolean> | null = null;
export const SESSION_EXPIRED = "rigforge:session-expired";
export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly code?: string,
  ) {
    super(message);
  }
}
// Proxy có thể trả HTML/text khi backend ngừng hoạt động; không đưa lỗi JSON ra UI.
async function readResponse<T>(response: Response): Promise<T> {
  if (response.status === 204) return undefined as T;
  let payload;
  try {
    payload = await response.json();
  } catch {
    throw new ApiError(
      response.status,
      "Cửa hàng đang không phản hồi đúng. Vui lòng thử lại.",
    );
  }
  if (!response.ok)
    throw new ApiError(
      response.status,
      payload?.error?.message ??
        "Không thể kết nối cửa hàng. Vui lòng thử lại.",
      payload?.error?.code,
    );
  return payload.data as T;
}

async function request(path: string, options: RequestInit): Promise<Response> {
  try {
    return await fetch(path, options);
  } catch {
    throw new ApiError(
      0,
      "Không kết nối được cửa hàng. Kiểm tra mạng và thử lại.",
    );
  }
}
export function setAccessToken(value: string | null) {
  accessToken = value;
}
export async function refreshSession() {
  if (refreshing) return refreshing;
  refreshing = (async () => {
    const restored = await request("/api/v1/auth/session", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    });
    if (restored.status === 401) {
      accessToken = null;
      return false;
    }
    const session = await readResponse<{
      requiresRefresh: boolean;
      accessToken: string;
    }>(restored);
    if (!session.requiresRefresh) {
      accessToken = session.accessToken;
      return true;
    }
    const response = await request("/api/v1/auth/refresh", {
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
    const body = await readResponse<{ accessToken: string }>(response);
    accessToken = body.accessToken;
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
  const response = await request(`/api/v1${path}`, {
    method: options.method ?? "GET",
    credentials: "include",
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
    cache: "no-store",
  });
  if (response.status === 401 && !path.startsWith("/auth/")) {
    if (retry && (await refreshSession())) return api<T>(path, options, false);
    window.dispatchEvent(new Event(SESSION_EXPIRED));
  }
  return readResponse<T>(response);
}
