import { expect, test } from "@playwright/test";

for (const reducedMotion of ["no-preference", "reduce"] as const) {
  for (const width of [360, 1920, 3840]) {
    test(`marquee runs, pauses and resumes at ${width}px with motion ${reducedMotion}`, async ({
      page,
    }, testInfo) => {
      await page.emulateMedia({ reducedMotion });
      await page.setViewportSize({ width, height: 900 });
      await page.goto("/");
      const track = page.locator(".rf-marquee-track");
      await expect(track).toBeVisible();
      await page.mouse.move(0, 899);
      await expect(page.locator(".rf-reference-pills button")).toHaveCount(0);
      const bounds = await page.locator(".rf-reference-pills").boundingBox();
      const margin = width <= 768 ? 16 : 50;
      expect(bounds!.x).toBe(margin);
      expect(bounds!.width).toBe(width - margin * 2);
      await expect(page.locator(".rf-reference-pills")).toHaveCSS(
        "overflow-x",
        "hidden",
      );
      const position = () =>
        track.evaluate((element) => element.getBoundingClientRect().x);
      await expect(track).toHaveCSS("animation-play-state", "running");
      const start = await position();
      // Observe natural elapsed time; never advance the animation manually.
      await expect
        .poll(async () => start - (await position()))
        .toBeGreaterThan(8);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth + 1,
        ),
      ).toBe(true);
      await page.locator(".rf-reference-pills").hover();
      await expect(track).toHaveCSS("animation-play-state", "paused");
      const paused = await position();
      const geometry = await track.evaluate((element) => {
        const [firstGroup, secondGroup] = Array.from(
          element.children,
        ) as HTMLElement[];
        const last = firstGroup.lastElementChild!.getBoundingClientRect();
        const first = secondGroup.firstElementChild!.getBoundingClientRect();
        return {
          seam: first.left - last.right,
          gap: parseFloat(getComputedStyle(firstGroup).columnGap),
          width: firstGroup.getBoundingClientRect().width,
          copyWidth: secondGroup.getBoundingClientRect().width,
          viewportWidth: element.parentElement!.clientWidth,
        };
      });
      expect(geometry.seam).toBeCloseTo(geometry.gap, 0);
      expect(geometry.copyWidth).toBeCloseTo(geometry.width, 0);
      expect(geometry.width).toBeGreaterThanOrEqual(geometry.viewportWidth);
      // Chỉ năm ưu đãi gốc tham gia bàn phím/trình đọc màn hình.
      await expect(track.getByRole("link")).toHaveCount(5);
      await page.waitForTimeout(350);
      expect(Math.abs((await position()) - paused)).toBeLessThan(1);
      await page.mouse.move(0, 899);
      await expect(track).toHaveCSS("animation-play-state", "running");
      const resumed = await position();
      // Resuming must preserve progress rather than restart the cycle.
      expect(Math.abs(resumed - paused)).toBeLessThan(20);
      await expect
        .poll(async () => resumed - (await position()))
        .toBeGreaterThan(8);
      await page.locator(".rf-reference-pills").screenshot({
        path: testInfo.outputPath("marquee.png"),
        animations: "allow",
      });
    });
  }
}
