import { expect, test, type Page } from "@playwright/test";

const hero = (page: Page) =>
  page.getByRole("region", { name: "Chiến dịch nổi bật", exact: true });
const slide = (page: Page, id: string) => page.locator("#hero-slide-" + id);

test("banner trượt mềm và nối vòng hai chiều bằng một chiều rộng ảnh", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  await hero(page)
    .getByRole("button", { name: "Tạm dừng chuyển banner" })
    .click();
  const track = hero(page).locator(".rf-hero-track");
  const width = (await hero(page)
    .locator(".rf-reference-hero-image")
    .boundingBox())!.width;
  await expect(track).toHaveCSS("transition-duration", "0.7s");
  await expect(track).toHaveCSS(
    "transition-timing-function",
    "cubic-bezier(0.22, 0.61, 0.36, 1)",
  );
  await hero(page)
    .getByRole("button", { name: /TRẢ GÓP PC/ })
    .click();
  const x = () =>
    track.evaluate(
      (el) => new DOMMatrixReadOnly(getComputedStyle(el).transform).m41,
    );
  await expect.poll(x).toBeCloseTo(-6 * width, 0);
  for (const [button, start, end, canonical] of [
    ["Banner sau", -6, -7, -1],
    ["Banner trước", -1, 0, -6],
  ] as const) {
    await track.evaluate((element) => {
      const target = element as HTMLElement & {
        samples: number[];
        sampled: boolean;
      };
      target.samples = [];
      target.sampled = false;
      const started = performance.now();
      requestAnimationFrame(function record(now) {
        target.samples.push(
          new DOMMatrixReadOnly(getComputedStyle(element).transform).m41,
        );
        if (now - started < 1000) requestAnimationFrame(record);
        else target.sampled = true;
      });
    });
    await hero(page).getByRole("button", { name: button, exact: true }).click();
    await expect
      .poll(() =>
        track.evaluate(
          (el) => (el as HTMLElement & { sampled: boolean }).sampled,
        ),
      )
      .toBe(true);
    const samples = await track.evaluate(
      (el) => (el as HTMLElement & { samples: number[] }).samples,
    );
    // Các frame đang trượt chỉ đi giữa hai ảnh kề nhau. Điểm chuẩn hóa dùng ảnh giống hệt.
    const movement = samples.filter(
      (value) => Math.abs(value - canonical * width) > 1,
    );
    expect(
      movement.some(
        (value) =>
          value > Math.min(start, end) * width + 1 &&
          value < Math.max(start, end) * width - 1,
      ),
    ).toBe(true);
    expect(
      movement.every(
        (value) =>
          value >= Math.min(start, end) * width - 1 &&
          value <= Math.max(start, end) * width + 1,
      ),
    ).toBe(true);
    await expect.poll(x).toBeCloseTo(canonical * width, 0);
    await expect(
      hero(page).locator('[aria-roledescription="slide"]:not([inert])'),
    ).toHaveCount(1);
  }
  // Kéo ngắn ngay sau khi chuẩn hóa vòng lặp vẫn phải trả về mềm.
  const viewport = hero(page).locator(".rf-reference-hero-image");
  await viewport.scrollIntoViewIfNeeded();
  const box = (await viewport.boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2 - 20, box.y + box.height / 2, {
    steps: 4,
  });
  await page.mouse.up();
  await expect(track).toHaveCSS("transition-duration", "0.7s");
  await expect.poll(x).toBeCloseTo(-6 * width, 0);
});

test("bắt đầu kéo giữa transition giữ nguyên vị trí ảnh đang hiển thị", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  await hero(page)
    .getByRole("button", { name: "Tạm dừng chuyển banner" })
    .click();
  const viewport = hero(page).locator(".rf-reference-hero-image");
  await viewport.scrollIntoViewIfNeeded();
  const box = (await viewport.boundingBox())!;
  const track = hero(page).locator(".rf-hero-track");
  const x = () =>
    track.evaluate(
      (el) => new DOMMatrixReadOnly(getComputedStyle(el).transform).m41,
    );
  await page.mouse.move(box.x + box.width * 0.6, box.y + box.height * 0.45);
  await hero(page).getByRole("button", { name: "Banner sau" }).click();
  await expect.poll(x).toBeLessThan(-box.width * 1.1);
  await page.mouse.move(box.x + box.width * 0.6, box.y + box.height * 0.45);
  const before = await x();
  await page.mouse.down();
  const frozen = await x();
  expect(Math.abs(frozen - before)).toBeLessThan(box.width * 0.12);
  await expect(track).toHaveCSS("transition-duration", "0s");
  await page.mouse.move(
    box.x + box.width * 0.6 - 20,
    box.y + box.height * 0.45,
    { steps: 4 },
  );
  await expect.poll(x).toBeCloseTo(frozen - 20, 0);
  await page.mouse.up();
  await expect.poll(x).toBeCloseTo(-2 * box.width, 0);
  await expect(slide(page, "pc")).toHaveAttribute("aria-hidden", "false");
  await expect(page).toHaveURL(/\/$/);
});

test("banner quảng cáo dọc hiện trên laptop, giữ hover và không tràn ngang", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await hero(page)
    .getByRole("button", { name: "Tạm dừng chuyển banner" })
    .click();
  for (const width of [1024, 1280, 1536, 1920]) {
    await page.setViewportSize({ width, height: 900 });
    for (const side of ["left", "right"]) {
      await page.mouse.move(width / 2, 10);
      const ad = page.locator(".rf-side-ad-" + side);
      await expect(ad).toBeVisible();
      const link = ad.getByRole("link");
      const box = (await ad.boundingBox())!;
      await expect
        .poll(async () => (await link.boundingBox())!.x)
        .toBe(side === "left" ? -box.width / 2 : width - box.width / 2);
      await ad.hover({
        position: {
          x: side === "left" ? box.width / 4 : (box.width * 3) / 4,
          y: 20,
        },
      });
      await expect
        .poll(async () => (await link.boundingBox())!.x)
        .toBe(side === "left" ? 0 : width - box.width);
    }
    expect(
      await page.evaluate(
        () =>
          document.documentElement.scrollWidth >
          document.documentElement.clientWidth,
      ),
    ).toBe(false);
  }
  for (const width of [1023, 768, 390]) {
    await page.setViewportSize({ width, height: 900 });
    await expect(page.locator(".rf-side-ad-left")).toBeHidden();
    await expect(page.locator(".rf-side-ad-right")).toBeHidden();
  }
});

async function loadWithClock(page: Page) {
  const time = new Date("2026-11-06T03:00:00Z");
  await page.clock.install({ time });
  await page.goto("/");
  // Next cần timer để hoàn tất streaming/hydration trước khi đóng băng giờ.
  await hero(page)
    .getByRole("button", { name: "Tạm dừng chuyển banner" })
    .click();
  await hero(page)
    .getByRole("button", { name: /PC Powered by ASUS/ })
    .click();
  await page.clock.pauseAt(new Date(time.getTime() + 60000));
  await hero(page)
    .getByRole("button", { name: "Bật tự động chuyển banner" })
    .click();
}

test("hero tự chuyển đúng 3 giây, bắt đầu lại sau chọn tay và quay về đầu", async ({
  page,
}) => {
  await loadWithClock(page);
  await expect(
    hero(page).getByRole("button", { name: "Banner sau" }),
  ).toBeVisible();
  await page.clock.runFor(2999);
  await expect(slide(page, "asus")).toHaveAttribute("aria-hidden", "false");
  await page.clock.runFor(1);
  await expect(slide(page, "pc")).toHaveAttribute("aria-hidden", "false");

  await hero(page)
    .getByRole("button", { name: /KHUYẾN MÃI GAMING GEAR/ })
    .click();
  await page.clock.runFor(2999);
  await expect(slide(page, "gear")).toHaveAttribute("aria-hidden", "false");
  await page.clock.runFor(1);
  await expect(slide(page, "installments")).toHaveAttribute(
    "aria-hidden",
    "false",
  );
  await page.clock.runFor(3000);
  await expect(slide(page, "asus")).toHaveAttribute("aria-hidden", "false");

  await hero(page)
    .getByRole("button", { name: "Tạm dừng chuyển banner" })
    .click();
  await page.clock.runFor(9000);
  await expect(slide(page, "asus")).toHaveAttribute("aria-hidden", "false");
  await hero(page)
    .getByRole("button", { name: "Bật tự động chuyển banner" })
    .click();
  await page.clock.runFor(3000);
  await expect(slide(page, "pc")).toHaveAttribute("aria-hidden", "false");
});

test("mỗi caption chọn đúng ảnh, mũi tên lặp vòng và link banner dẫn đúng trang", async ({
  page,
}) => {
  await page.goto("/");
  await hero(page)
    .getByRole("button", { name: "Tạm dừng chuyển banner" })
    .click();
  const buttons = hero(page)
    .getByRole("group", { name: "Chọn chiến dịch" })
    .getByRole("button");
  const ids = ["asus", "pc", "monitor", "laptop", "gear", "installments"];
  const catalog = await page.request.get("/api/v1/storefront");
  expect(catalog.status()).toBe(200);
  const banners = (await catalog.json()).data.presentation.bannerCampaigns as {
    id: string;
    image: string;
  }[];
  await expect(buttons).toHaveCount(ids.length);
  for (const [index, id] of ids.entries()) {
    await buttons.nth(index).click();
    await expect(buttons.nth(index)).toHaveAttribute("aria-pressed", "true");
    await expect(slide(page, id)).toHaveAttribute("aria-hidden", "false");
    await expect(slide(page, id).locator("img")).toHaveAttribute(
      "src",
      new RegExp(
        encodeURIComponent(banners.find((banner) => banner.id === id)!.image),
      ),
    );
    await expect(
      hero(page).locator('[aria-roledescription="slide"]:not([inert])'),
    ).toHaveCount(1);
  }
  await hero(page).getByRole("button", { name: "Banner sau" }).click();
  await expect(slide(page, "asus")).toHaveAttribute("aria-hidden", "false");
  await hero(page).getByRole("button", { name: "Banner trước" }).click();
  await expect(slide(page, "installments")).toHaveAttribute(
    "aria-hidden",
    "false",
  );
  await buttons.nth(0).click();
  await hero(page)
    .getByRole("link", { name: "Khám phá PC Powered by ASUS", exact: true })
    .click();
  await expect(page).toHaveURL(/\/pc-builder$/);
});

test("kéo chuột đổi hai chiều, kéo ngắn trả về và không mở nhầm liên kết", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await hero(page)
    .getByRole("button", { name: "Tạm dừng chuyển banner" })
    .click();
  await hero(page).locator(".rf-reference-hero-image").scrollIntoViewIfNeeded();
  const box = (await hero(page)
    .locator(".rf-reference-hero-image")
    .boundingBox())!;
  const x = box.x + box.width * 0.6;
  const y = box.y + box.height * 0.45;
  for (const [distance, id] of [
    [-180, "pc"],
    [180, "asus"],
    [-20, "asus"],
  ] as const) {
    await page.mouse.move(x, y);
    await page.mouse.down();
    await page.mouse.move(x + distance, y, { steps: 12 });
    await page.mouse.up();
    await expect(slide(page, id)).toHaveAttribute("aria-hidden", "false");
    await expect(page).toHaveURL(/\/$/);
  }
  // Sau một lần kéo, click thật vẫn mở được banner.
  await page.mouse.click(x, y);
  await expect(page).toHaveURL(/\/pc-builder$/);
});

test("header full width và banner dọc hai bên ẩn nửa, mũi tên giữ nguyên", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1920, height: 1100 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await hero(page)
    .getByRole("button", { name: "Tạm dừng chuyển banner" })
    .click();
  await page.getByRole("combobox", { name: "Tìm kiếm sản phẩm" }).click();
  await page.mouse.move(960, 10);
  const frame = (await hero(page).boundingBox())!;
  // Người dùng có thể cân chỉnh max-width Hero độc lập với header/banner dọc.
  const maxWidth = await hero(page).evaluate((el) =>
    Number.parseFloat(getComputedStyle(el).maxWidth),
  );
  expect(frame.width).toBe(maxWidth);
  expect(frame.x).toBe((1920 - maxWidth) / 2);
  const previous = hero(page).getByRole("button", { name: "Banner trước" });
  const next = hero(page).getByRole("button", { name: "Banner sau" });
  expect((await previous.boundingBox())!.x).toBe(frame.x);
  const nextBox = (await next.boundingBox())!;
  expect(nextBox.x + nextBox.width).toBe(frame.x + frame.width);
  await hero(page).locator(".rf-reference-hero-image").hover();
  expect((await previous.boundingBox())!.x).toBe(frame.x);

  for (const side of ["left", "right"]) {
    await page.mouse.move(960, 10);
    const ad = page.locator(".rf-side-ad-" + side);
    const link = ad.getByRole("link");
    const box = (await ad.boundingBox())!;
    const initial = (await link.boundingBox())!;
    expect(initial.x).toBeCloseTo(
      side === "left" ? -box.width / 2 : 1920 - box.width / 2,
      0,
    );
    await ad.hover({
      position: {
        x: side === "left" ? box.width / 4 : (box.width * 3) / 4,
        y: 20,
      },
    });
    await expect
      .poll(async () => (await link.boundingBox())!.x)
      .toBe(side === "left" ? 0 : 1920 - box.width);
    await page.mouse.move(960, 10);
    await expect
      .poll(async () => (await link.boundingBox())!.x)
      .toBe(initial.x);
    await link.focus();
    await expect
      .poll(async () => (await link.boundingBox())!.x)
      .toBe(side === "left" ? 0 : 1920 - box.width);
    await page.getByRole("combobox", { name: "Tìm kiếm sản phẩm" }).focus();
  }
  const ad = page.locator(".rf-side-ad-left");
  const initialY = (await ad.boundingBox())!.y;
  await page.evaluate(() => window.scrollTo(0, 600));
  expect((await ad.boundingBox())!.y).toBe(initialY);
  for (const width of [1920, 1340, 768, 390]) {
    await page.setViewportSize({ width, height: 1100 });
    const header = page.locator(".rf-reference-header-main");
    const box = (await header.boundingBox())!;
    expect(box.x).toBe(0);
    expect(box.width).toBe(width);
    expect(
      await header.evaluate((el) => getComputedStyle(el).paddingLeft),
    ).toBe(width < 768 ? "16px" : "50px");
    expect(
      await header.evaluate((el) => getComputedStyle(el).paddingRight),
    ).toBe(width < 768 ? "16px" : "50px");
    expect(
      await page.evaluate(
        () =>
          document.documentElement.scrollWidth >
          document.documentElement.clientWidth,
      ),
    ).toBe(false);
  }
});

test("bàn phím giữ slide đang đọc và chỉ focus link của slide active", async ({
  page,
}) => {
  await loadWithClock(page);
  const link = hero(page).getByRole("link", {
    name: "Khám phá PC Powered by ASUS",
    exact: true,
  });
  await link.focus();
  await page.keyboard.press("Tab");
  await expect(
    hero(page).getByRole("button", { name: "Banner trước" }),
  ).toBeFocused();
  await page.clock.runFor(6000);
  await expect(slide(page, "asus")).toHaveAttribute("aria-hidden", "false");
  await page.getByRole("combobox", { name: "Tìm kiếm sản phẩm" }).focus();
  await page.clock.runFor(3000);
  await expect(slide(page, "pc")).toHaveAttribute("aria-hidden", "false");
});

test("mobile giữ nguyên tỷ lệ banner và đưa caption active vào vùng nhìn", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 900 });
  await page.goto("/");
  await hero(page)
    .getByRole("button", { name: "Tạm dừng chuyển banner" })
    .click();
  const viewport = hero(page).locator(".rf-reference-hero-image");
  const box = (await viewport.boundingBox())!;
  expect(Math.abs(box.width / box.height - 3)).toBeLessThan(0.02);
  await hero(page)
    .getByRole("button", { name: /TRẢ GÓP PC/ })
    .click();
  const caption = hero(page).getByRole("button", { name: /TRẢ GÓP PC/ });
  await expect(caption).toHaveAttribute("aria-pressed", "true");
  const captionBox = (await caption.boundingBox())!;
  expect(captionBox.x).toBeGreaterThanOrEqual(box.x - 1);
  expect(captionBox.x + captionBox.width).toBeLessThanOrEqual(
    box.x + box.width + 1,
  );
  const dimensions = await page.evaluate(() => ({
    content: document.documentElement.scrollWidth,
    viewport: document.documentElement.clientWidth,
  }));
  expect(dimensions.content).toBeLessThanOrEqual(dimensions.viewport);
});
