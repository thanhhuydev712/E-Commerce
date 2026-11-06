import { expect, test } from "@playwright/test";

test("không cuộn ngang khi thanh cuộn dọc chiếm chỗ trên Windows", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await page
    .getByRole("region", { name: "Chiến dịch nổi bật", exact: true })
    .getByRole("button", { name: "Tạm dừng chuyển banner" })
    .click();
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
  test(`các khối trang chủ, showroom và footer thẳng mép slide ở ${width}px`, async ({
    page,
  }, testInfo) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.setViewportSize({ width, height: 1000 });
    await page.goto("/");
    await expect(page.locator(".rf-route-marker")).toHaveClass(/rf-route-home/);
    const hero = page.getByRole("region", {
      name: "Chiến dịch nổi bật",
      exact: true,
    });
    await hero.getByRole("button", { name: "Tạm dừng chuyển banner" }).click();
    await page.evaluate(() => window.scrollTo(0, 0));
    const frame = (await hero.boundingBox())!;
    const limit = await hero.evaluate((el) =>
      Number.parseFloat(getComputedStyle(el).maxWidth),
    );
    expect(frame.width).toBe(
      Math.min(width - (width >= 1024 ? 128 : 32), limit),
    );
    expect(frame.x).toBe((width - frame.width) / 2);
    const sections = await page.locator("#main-content > section").all();
    expect(sections.length).toBeGreaterThanOrEqual(17);
    for (const section of sections) {
      const box = (await section.boundingBox())!;
      expect(
        box.x,
        (await section.getAttribute("class")) ?? "section",
      ).toBeCloseTo(frame.x, 0);
      expect(box.width).toBeCloseTo(frame.width, 0);
    }
    for (const selector of [
      ".rf-common-showrooms",
      ".rf-service-strip > .rf-container",
      ".rf-footer-grid",
      ".rf-footer-bottom",
    ]) {
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
        .locator(".rf-reference-shelf")
        .first()
        .screenshot({
          path: testInfo.outputPath("landing-wide-shelf-" + width + ".png"),
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
  await page.locator(".rf-reference-pills a").first().click();
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
    .getByRole("region", { name: "Chiến dịch nổi bật", exact: true })
    .evaluate((el) => Number.parseFloat(getComputedStyle(el).maxWidth));
  await expect
    .poll(
      async () => (await page.locator("#main-content").boundingBox())!.width,
    )
    .toBe(maxWidth + 128);
});

for (const width of [1920, 1024, 768, 390, 360]) {
  test(`các trang dùng chung giới hạn nội dung ở ${width}px`, async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.setViewportSize({ width, height: 1000 });
    for (const [route, panel] of [
      ["/products", ".rf-catalog-banner"],
      ["/products/ssd-kingston", ".rf-reference-detail"],
      ["/cart", null],
      ["/checkout", null],
      ["/login", ".rf-auth-reference"],
      ["/forgot-password", ".rf-auth-layout"],
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
