"use client";
import { usePathname } from "next/navigation";
import { useSyncExternalStore } from "react";

const subscribe = () => () => {};
const clientReady = () => true;
const serverReady = () => false;
const authRoutes = new Set([
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
]);

/** Marker nằm trong layout chung, ngoài các trang Next giữ ẩn khi điều hướng. */
export function StoreRouteMarker() {
  const pathname = usePathname();
  // Hydration đầu khớp SSR dù người dùng đã chuyển URL trước khi marker hydrate.
  // Sau đó đọc URL hiện tại; không giữ class của route đã được cache ở server.
  const ready = useSyncExternalStore(subscribe, clientReady, serverReady);
  const kind = !ready
    ? ""
    : authRoutes.has(pathname)
      ? "rf-route-auth"
      : pathname === "/"
        ? "rf-route-home"
        : pathname.startsWith("/checkout")
          ? "rf-route-checkout"
          : pathname === "/promotions"
            ? "rf-route-minisite rf-route-campaign"
            : pathname === "/showrooms"
              ? "rf-route-minisite rf-route-showrooms"
              : "";
  return (
    <span hidden aria-hidden="true" className={`rf-route-marker ${kind}`} />
  );
}
