"use client";
import { useCallback, useEffect, useState } from "react";
import { api } from "@/src/catalog/api-client";
export function useApiResource<T>(path: string) {
  const [data, setData] = useState<T | null>(null),
    [error, setError] = useState(""),
    [version, setVersion] = useState(0);
  useEffect(() => {
    let active = true;
    api<T>(path)
      .then((value) => {
        if (active) {
          setData(value);
          setError("");
        }
      })
      .catch((cause) => {
        if (active)
          setError(
            cause instanceof Error ? cause.message : "Không tải được dữ liệu",
          );
      });
    return () => {
      active = false;
    };
  }, [path, version]);
  const reload = useCallback(() => setVersion((value) => value + 1), []);
  return { data, error, reload };
}
