import type { RequestHandler } from 'express';

// HTTP boundary for the public read-only preview; it does not replace route guards.
export function previewBoundary(
  enabled: boolean,
  interactiveDemo = false,
): RequestHandler {
  return (request, response, next) => {
    const publicRead =
      /^\/api\/v1\/(storefront\/?$|health(?:\/ready)?\/?$|media\/[^/]+\/?$|products(?:\/[^/]+)?\/?$|categories\/?$|brands\/?$)/.test(
        request.path,
      );
    // Exact method/path allowlist; JWT, ownership, Origin and rate-limit guards
    // still execute downstream. Orders and payments have no demo exception.
    const demoRead = /^\/api\/v1\/(?:auth\/me|me(?:\/cart|\/builds)?)\/?$/.test(
      request.path,
    );
    const demoPost =
      /^\/api\/v1\/(?:auth\/(?:login|session|refresh|logout)|me\/(?:cart\/(?:items|build)|builds))\/?$/.test(
        request.path,
      );
    const demoWrite =
      (request.method === 'POST' && demoPost) ||
      (request.method === 'PUT' &&
        /^\/api\/v1\/me\/cart\/?$/.test(request.path)) ||
      (request.method === 'DELETE' &&
        /^\/api\/v1\/me\/builds\/[0-9a-fA-F]{8}(?:-[0-9a-fA-F]{4}){3}-[0-9a-fA-F]{12}\/?$/.test(
          request.path,
        ));
    if (
      !enabled ||
      request.method === 'OPTIONS' ||
      (['GET', 'HEAD'].includes(request.method) && publicRead) ||
      (interactiveDemo &&
        ((['GET', 'HEAD'].includes(request.method) && demoRead) || demoWrite))
    ) {
      next();
      return;
    }
    const noSession =
      request.path === '/api/v1/auth/session' ||
      ['GET', 'HEAD'].includes(request.method);
    response.status(interactiveDemo ? 503 : noSession ? 401 : 503).json({
      error: {
        code: interactiveDemo
          ? 'DEMO_FEATURE_DISABLED'
          : noSession
            ? 'UNAUTHENTICATED'
            : 'PREVIEW_READ_ONLY',
        message: interactiveDemo
          ? 'Bản demo chỉ mở đăng nhập, giỏ hàng và lưu cấu hình; chức năng này đang tắt.'
          : noSession
            ? 'Bản giới thiệu không mở phiên tài khoản.'
            : 'Bản trải nghiệm chỉ đọc; đăng ký, đặt hàng và thanh toán đang tắt.',
      },
      meta: { requestId: response.getHeader('X-Request-Id') },
    });
  };
}
