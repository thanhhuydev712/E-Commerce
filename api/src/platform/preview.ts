import type { RequestHandler } from 'express';

// HTTP boundary for the public read-only preview; it does not replace route guards.
export function previewBoundary(enabled: boolean): RequestHandler {
  return (request, response, next) => {
    const publicRead =
      /^\/api\/v1\/(storefront\/?$|health(?:\/ready)?\/?$|media\/[^/]+\/?$|products(?:\/[^/]+)?\/?$|categories\/?$|brands\/?$)/.test(
        request.path,
      );
    if (
      !enabled ||
      request.method === 'OPTIONS' ||
      (['GET', 'HEAD'].includes(request.method) && publicRead)
    ) {
      next();
      return;
    }
    const noSession =
      request.path === '/api/v1/auth/session' ||
      ['GET', 'HEAD'].includes(request.method);
    response.status(noSession ? 401 : 503).json({
      error: {
        code: noSession ? 'UNAUTHENTICATED' : 'PREVIEW_READ_ONLY',
        message: noSession
          ? 'Bản giới thiệu không mở phiên tài khoản.'
          : 'Bản trải nghiệm chỉ đọc; đăng ký, đặt hàng và thanh toán đang tắt.',
      },
      meta: { requestId: response.getHeader('X-Request-Id') },
    });
  };
}
