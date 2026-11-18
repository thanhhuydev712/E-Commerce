import assert from "node:assert/strict";

const base = new URL(process.env.DOCKER_BASE_URL ?? "http://localhost:8080");
assert(
  ["localhost", "127.0.0.1"].includes(base.hostname),
  "Smoke này chỉ dành cho Docker local/CI.",
);
const request = (route, options = {}) =>
  fetch(new URL(route, base), {
    ...options,
    signal: AbortSignal.timeout(30000),
  });

const ready = await request("/api/v1/health/ready");
assert.equal(ready.status, 200, "API/DB chưa ready.");
const catalogResponse = await request("/api/v1/storefront");
assert.equal(catalogResponse.status, 200);
const { data } = await catalogResponse.json();
assert(data.products.length > 0, "Chạy seed local trước khi smoke catalog.");

for (const route of ["/", "/products", "/pc-builder"]) {
  const response = await request(route);
  assert.equal(response.status, 200, `${route} không trả 200.`);
  assert((await response.text()).includes("<html"), `${route} không có HTML.`);
}

const imagePath = data.products.find((product) =>
  product.image?.startsWith("/api/"),
)?.image;
assert(imagePath, "Catalog không có ảnh media API để kiểm volume/seed.");
const image = await request(imagePath);
assert.equal(image.status, 200, "Ảnh seed trong media volume không đọc được.");
assert(image.headers.get("content-type")?.startsWith("image/"));
await image.body.cancel();

const authRequest = (origin) =>
  request("/api/v1/auth/session", {
    method: "POST",
    headers: { Origin: origin, "Content-Type": "application/json" },
    body: "{}",
  });
const invalidOrigin = await authRequest("https://untrusted.invalid");
assert.equal(
  invalidOrigin.status,
  403,
  "Origin không tin cậy phải bị từ chối.",
);
const anonymous = await authRequest(base.origin);
assert.equal(
  anonymous.status,
  401,
  "Origin hợp lệ nhưng không có phiên phải trả 401.",
);

console.log(
  JSON.stringify(
    {
      result: "passed",
      scope:
        "Docker local/CI: API readiness, catalog, HTML routes, media, Origin guard",
      products: data.products.length,
      orderCreation: false,
      paymentProviderCalls: false,
      browserE2E: false,
    },
    null,
    2,
  ),
);
