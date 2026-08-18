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

test.describe("stackable tables", () => {
  test("table[data-table='stack']: header row hidden when its container is narrow, table when wide", async ({ page }) => {
    await page.goto("/demo/");
    const table = page.locator('table[data-table="stack"]');
    const firstCell = table.locator("tbody tr").first().locator("td").first();

    // The nearest query container is the wrapping .fz-contain — pin its
    // inline size and the @container rule re-evaluates with it.
    await table.evaluate((el) => {
      el.parentElement.style.width = "14rem";
    });
    await expect(table.locator("thead")).toBeHidden();
    await expect(firstCell).toHaveCSS("display", "block");

    await table.evaluate((el) => {
      el.parentElement.style.width = "60rem";
    });
    await expect(table.locator("thead")).toBeVisible();
    await expect(firstCell).toHaveCSS("display", "table-cell");
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

  test("menu flips above its trigger when the trigger sits near the viewport bottom", async ({ page }) => {
    await page.goto("/demo/");
    const trigger = page.locator("#help-trigger");
    const pop = page.locator("#help-pop");

    // Nudge the trigger to just above the bottom edge (in-view) so the
    // preferred below-the-trigger placement would overflow the viewport.
    // `behavior: "instant"` matters: the page uses scroll-behavior smooth,
    // and Playwright's click auto-scroll would fight the placement.
    await trigger.evaluate((el) => {
      const r = el.getBoundingClientRect();
      window.scrollTo({
        top: window.scrollY + r.top - (window.innerHeight - 80),
        behavior: "instant",
      });
    });

    // Element.click() (not Playwright's click) so nothing re-scrolls.
    await trigger.evaluate((el) => el.click());
    await expect(pop).toBeVisible();

    const tb = await trigger.boundingBox();
    const pb = await pop.boundingBox();
    // position-try-fallbacks: flip-block flipped it above: the popover's
    // bottom edge sits at or above the trigger's top edge.
    expect(pb.y + pb.height).toBeLessThanOrEqual(tb.y + 1);
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
