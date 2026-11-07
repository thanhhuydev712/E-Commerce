"use client";
import { useCallback, useEffect, useState } from "react";
import { api } from "@/src/catalog/api-client";
export function useApiResource<T>(path: string) {
  const [version, setVersion] = useState(0);
  const [result, setResult] = useState<{
    path: string;
    version: number;
    data: T | null;
    error: string;
  } | null>(null);
  useEffect(() => {
    let active = true;
    api<T>(path)
      .then((value) => {
        if (active) {
          setResult({ path, version, data: value, error: "" });
        }
      })
      .catch((cause) => {
        if (active)
          setResult({
            path,
            version,
            data: null,
            error:
              cause instanceof Error ? cause.message : "Không tải được dữ liệu",
          });
      });
    return () => {
      active = false;
    };
  }, [path, version]);
  const reload = useCallback(() => setVersion((value) => value + 1), []);
  // Đổi URL không được tạm hiển thị dữ liệu/thao tác của tài nguyên trước đó.
  const current = result?.path === path && result.version === version;
  return {
    data: current ? result.data : null,
    error: current ? result.error : "",
    loading: !current,
    reload,
  };
}
