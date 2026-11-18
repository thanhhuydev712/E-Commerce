import { Suspense } from "react";
import { AuthPage } from "./auth-page";

// Ranh giới chung cho query next; các URL auth vẫn là route riêng trong App Router.
export function AuthRoute({ mode }: { mode: string }) {
  return (
    <Suspense fallback={<p role="status">Đang chuẩn bị trang tài khoản…</p>}>
      <AuthPage mode={mode} />
    </Suspense>
  );
}
