import { expect, test } from "@playwright/test";

test("không cuộn ngang khi thanh cuộn dọc chiếm chỗ trên Windows", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.locator("#forge-intro-heading")).toBeVisible();
  // Headless thường dùng scrollbar phủ nội dung, bỏ sót lỗi nền 100vw.
  await page.evaluate(() => {
    document.documentElement.style.scrollbarGutter = "stable";
    document.documentElement.style.scrollBehavior = "auto";
  });
  for (const width of [1920, 1536, 1024, 768, 390]) {
    await page.setViewportSize({ width, height: 915 });
    await expect
      .poll(() =>
        page.evaluate(() => {
          window.scrollTo({ left: 100, top: 0, behavior: "instant" });
          return window.scrollX;
        }),
      )
      .toBe(0);
  }
});

for (const width of [1920, 1340, 1024, 768, 390, 360]) {
  test(`chín khối trang chủ và footer thẳng mép ở ${width}px`, async ({
    page,
  }, testInfo) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.setViewportSize({ width, height: 1000 });
    await page.goto("/");
    await expect(page.locator(".rf-route-marker")).toHaveClass(/rf-route-home/);
    const hero = page.getByRole("region", {
      name: "Cấu hình của bạn. Dấu ấn của bạn.",
      exact: true,
    });
    await page.evaluate(() => window.scrollTo(0, 0));
    const frame = (await hero.boundingBox())!;
    const limit = await hero.evaluate((el) =>
      Number.parseFloat(
        getComputedStyle(el).getPropertyValue("--rf-home-width"),
      ),
    );
    expect(frame.width).toBe(
      Math.min(width - (width >= 1024 ? 128 : 32), limit),
    );
    expect(frame.x).toBe((width - frame.width) / 2);
    const sections = await page.locator(".rf-forge-home > section").all();
    expect(sections.length).toBe(9);
    for (const section of sections) {
      const box = (await section.boundingBox())!;
      expect(
        box.x,
        (await section.getAttribute("class")) ?? "section",
      ).toBeCloseTo(frame.x, 0);
      expect(box.width).toBeCloseTo(frame.width, 0);
    }
    for (const selector of [".rf-footer-grid", ".rf-footer-bottom"]) {
      const bounds = await page.locator(selector).evaluate((el) => {
        const box = el.getBoundingClientRect();
        const css = getComputedStyle(el);
        return {
          x: box.x + Number.parseFloat(css.paddingLeft),
          width:
            box.width -
            Number.parseFloat(css.paddingLeft) -
            Number.parseFloat(css.paddingRight),
        };
      });
      expect(bounds.x, selector).toBeCloseTo(frame.x, 0);
      expect(bounds.width, selector).toBeCloseTo(frame.width, 0);
    }
    await expect(page.locator(".rf-showroom-shell")).toBeHidden();
    expect(
      await page.evaluate(
        () =>
          document.documentElement.scrollWidth >
          document.documentElement.clientWidth,
      ),
    ).toBe(false);
    if (width === 1920 || width === 390) {
      await page.screenshot({
        path: testInfo.outputPath("landing-wide-top-" + width + ".png"),
        caret: "initial",
      });
      await page
        .locator(".rf-reference-flash")
        .first()
        .screenshot({
          path: testInfo.outputPath("landing-wide-products-" + width + ".png"),
          caret: "initial",
        });
    }
  });
}

test("chiều rộng dùng chung khi chuyển sang catalog và quay lại", async ({
  page,
}) => {
  // Link/Back và cache route đều phải giữ cùng khung nội dung.
  await page.setViewportSize({ width: 1920, height: 1000 });
  await page.goto("/");
  await expect(page.locator(".rf-route-marker")).toHaveClass(/rf-route-home/);
  await page
    .locator('.rf-directory-grid a[href="/products?category=pc"]')
    .click();
  await expect(page).toHaveURL(/\/products\?category=pc$/);
  await expect(page.locator(".rf-route-marker")).not.toHaveClass(
    /rf-route-home/,
  );
  await expect
    .poll(
      async () => (await page.locator("#main-content").boundingBox())!.width,
    )
    .toBe(
      (await page
        .locator("#main-content")
        .evaluate((el) =>
          Number.parseFloat(
            getComputedStyle(el).getPropertyValue("--rf-home-width"),
          ),
        )) + 128,
    );
  await page.goBack();
  await expect(page.locator(".rf-route-marker")).toHaveClass(/rf-route-home/);
  const maxWidth = await page
    .locator("#main-content")
    .evaluate((el) =>
      Number.parseFloat(
        getComputedStyle(el).getPropertyValue("--rf-home-width"),
      ),
    );
  await expect
    .poll(
      async () => (await page.locator("#main-content").boundingBox())!.width,
    )
    .toBe(maxWidth + 128);
});

for (const width of [1920, 1024, 768, 390, 360]) {
  test(`các trang cửa hàng dùng chung giới hạn nội dung ở ${width}px`, async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.setViewportSize({ width, height: 1000 });
    // Auth có shell toàn màn hình riêng; auth-viewport.spec.ts kiểm layout đó.
    for (const [route, panel] of [
      ["/products", ".rf-catalog-banner"],
      ["/products/ssd-kingston", ".rf-reference-detail"],
      ["/cart", null],
      ["/checkout", null],
      ["/account", null],
      ["/pc-builder", null],
      ["/promotions", ".rf-promotions-page"],
      ["/showrooms", null],
      ["/articles", null],
      ["/pages/installments", ".rf-panel.rf-prose"],
      ["/warranty", null],
    ] as const) {
      await page.goto(route);
      await expect(
        page.locator("#main-content :is(h1,h2):visible").first(),
      ).toBeVisible();
      const bounds = await page.locator("#main-content").evaluate((el) => {
        const box = el.getBoundingClientRect();
        const css = getComputedStyle(el);
        return {
          x: box.x + parseFloat(css.paddingLeft),
          width:
            box.width -
            parseFloat(css.paddingLeft) -
            parseFloat(css.paddingRight),
          limit: parseFloat(css.getPropertyValue("--rf-home-width")),
        };
      });
      const expected = Math.min(
        width - (width >= 1024 ? 128 : 32),
        bounds.limit,
      );
      expect(bounds.width, route).toBeCloseTo(expected, 0);
      expect(bounds.x, route).toBeCloseTo((width - expected) / 2, 0);
      if (panel) {
        const content = page.locator(panel).first();
        await expect(content).toBeVisible();
        const box = await content.boundingBox();
        expect(box, route).not.toBeNull();
        expect(box!.width, route).toBeCloseTo(expected, 0);
      }
      expect(
        await page.evaluate(
          () =>
            document.documentElement.scrollWidth >
            document.documentElement.clientWidth,
        ),
        route,
      ).toBe(false);
    }
  });
}
