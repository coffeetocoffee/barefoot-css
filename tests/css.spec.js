/* Barefoot — 1.0 CSS behavior tests.
   Container-query grid, container-unit carousel, anchored popovers,
   and theme switching through startViewTransition.

   npm run test:css */
import { test, expect } from "@playwright/test";

test.describe("tests have real CSS (smoke)", () => {
  test("demo page loads the built Barefoot stylesheet", async ({ page }) => {
    await page.goto("/demo/");
    const styled = await page.evaluate(() => {
      const root = getComputedStyle(document.documentElement);
      const contain = getComputedStyle(document.querySelector(".fz-contain"));
      return Boolean(root.getPropertyValue("--fz-primary").trim()) && contain.containerType === "inline-size";
    });
    // dist/ is gitignored and built in CI; if a test job ever forgets to
    // build, this fails with a clear message instead of a confusing
    // column-count mismatch.
    expect(styled, "dist/ is not built — run npm run check (build) before the tests").toBe(true);
  });
});

test.describe("container queries", () => {
  test("same [data-grid] markup: 1 column when narrow, 3 when wide", async ({ page }) => {
    await page.goto("/demo/");

    // Pin the container widths explicitly so the test asserts the *markup*
    // behavior, not the demo's incidental flex sizing (which OS font
    // metrics can tip across the breakpoint).
    await page.evaluate(() => {
      const [narrow, wide] = document.querySelectorAll(".fz-contain");
      narrow.style.width = "14rem";
      wide.style.width = "60rem";
    });

    const cols = (sel) =>
      page
        .locator(sel)
        .evaluate((el) => getComputedStyle(el).gridTemplateColumns.trim().split(/\s+/).length);

    expect(await cols(".fz-demo-narrow [data-grid]")).toBe(1);
    expect(await cols(".fz-demo-wide [data-grid]")).toBe(3);
  });

  test("carousel slides are sized in container units (60cqi)", async ({ page }) => {
    await page.goto("/demo/");
    const carousel = page.locator("[data-carousel]");
    const slide = page.locator("[data-carousel] > *").first();

    const cw = (await carousel.boundingBox()).width;
    const sw = (await slide.boundingBox()).width;

    expect(Math.abs(sw - cw * 0.6)).toBeLessThan(2);
  });
});

test.describe("anchored popovers (anchor positioning)", () => {
  test("menu popover pins below its own trigger (not the other popover's)", async ({ page }) => {
    await page.goto("/demo/");
    const trigger = page.locator('#help-trigger');
    const otherTrigger = page.locator("#tip-trigger");
    const pop = page.locator("#help-pop");

    await trigger.click();
    await expect(pop).toBeVisible();

    const tb = await trigger.boundingBox();
    const ob = await otherTrigger.boundingBox();
    const pb = await pop.boundingBox();

    // Anchored to its own trigger: left-aligned with it…
    expect(Math.abs(pb.x - tb.x)).toBeLessThan(2);
    // …and below it.
    expect(Math.abs(pb.y - (tb.y + tb.height))).toBeLessThan(2);
    // The tooltip trigger sits to the right; if the menu had attached to
    // a shared anchor name it would land there instead — guard it.
    expect(Math.abs(pb.x - ob.x)).toBeGreaterThan(10);
  });
});

test.describe("theme switching through view transitions", () => {
  test("theme buttons work with startViewTransition", async ({ page }) => {
    await page.goto("/demo/");
    const hasApi = await page.evaluate(
      () => typeof document.startViewTransition === "function"
    );

    await page.getByRole("button", { name: "Dark" }).click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");

    // The API exists in the test browser; using it must not break the swap.
    expect(hasApi).toBe(true);
  });
});
