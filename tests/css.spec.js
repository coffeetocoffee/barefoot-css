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

test.describe("range, progress & meter skins", () => {
  test("range slider is fully skinned (appearance none + themed height)", async ({ page }) => {
    await page.goto("/demo/");
    const range = page.locator("#amount");
    // Chromium's getComputedStyle doesn't reflect author styles on the
    // ::-webkit-slider-* shadow pseudos, so assert the element-level skin:
    // native chrome stripped, height from --fz-control-height, no surface.
    await expect(range).toHaveCSS("appearance", "none");
    await expect(range).toHaveCSS("height", "40px");
    await expect(range).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
    await expect(range).toHaveCSS("cursor", "pointer");
  });

  test("progress and meter are themed bars (accent fill, alt track)", async ({ page }) => {
    await page.goto("/demo/");
    for (const id of ["#prog", "#storage"]) {
      const bar = page.locator(id);
      await expect(bar).toHaveCSS("height", "12px");
      await expect(bar).toHaveCSS("background-color", "rgb(244, 244, 244)"); // --fz-surface-alt (light)
      await expect(bar).toHaveCSS("overflow", "hidden");
      await expect(bar).toHaveCSS("accent-color", "rgb(26, 26, 26)"); // --fz-primary (light)
    }
  });
});

test.describe("breadcrumbs & pagination", () => {
  test("breadcrumbs: slash separator between items, current is muted text", async ({ page }) => {
    await page.goto("/demo/");
    const second = page.locator('[data-breadcrumbs] li').nth(1);
    const sep = await second.evaluate((el) =>
      getComputedStyle(el, "::before").content
    );
    expect(sep).toBe('"/"');
    await expect(page.locator('[data-breadcrumbs] [aria-current="page"]')).toHaveText("Theming");
  });

  test("pagination: current page is a filled span, never a link", async ({ page }) => {
    await page.goto("/demo/");
    const current = page.locator('[data-pagination] [aria-current="page"]');
    await expect(current).toHaveText("2");
    const bg = await current.evaluate((el) => getComputedStyle(el).backgroundColor);
    expect(bg).toBe("rgb(26, 26, 26)"); // --fz-primary (light)
    await expect(page.locator('[data-pagination] a[aria-current]')).toHaveCount(0);
  });
});

test.describe("themes & OS accessibility settings", () => {
  test("forest theme flips the accent to green", async ({ page }) => {
    await page.goto("/demo/");
    const root = page.locator("html");
    const before = await root.evaluate((el) =>
      getComputedStyle(el).getPropertyValue("--fz-primary").trim()
    );
    await root.evaluate((el) => {
      el.dataset.theme = "forest";
    });
    const after = await root.evaluate((el) =>
      getComputedStyle(el).getPropertyValue("--fz-primary").trim()
    );
    expect(before).not.toBe(after);
    expect(after).toBe("rgb(47, 107, 79)");
  });

  test("prefers-contrast: more forces black-on-white tokens", async ({ page }) => {
    await page.emulateMedia({ contrast: "more" });
    await page.goto("/demo/");
    const root = page.locator("html");
    const text = await root.evaluate((el) =>
      getComputedStyle(el).getPropertyValue("--fz-text").trim()
    );
    expect(text).toBe("rgb(0, 0, 0)");
  });
});

test.describe("v1.5 form completion", () => {
  test("select gets a themed chevron (appearance none + reserved padding)", async ({ page }) => {
    await page.goto("/demo/");
    const sel = page.locator("#country");
    await expect(sel).toHaveCSS("appearance", "none");
    const arrow = await sel.evaluate((el) => getComputedStyle(el).backgroundImage);
    expect(arrow).toContain("svg");
    await expect(sel).not.toHaveCSS("padding-right", "0px");
  });

  test("file input button is skinned via ::file-selector-button", async ({ page }) => {
    await page.goto("/demo/");
    const btn = await page.evaluate(() => {
      const el = document.querySelector("#file");
      const s = getComputedStyle(el, "::file-selector-button");
      return { bg: s.backgroundColor, h: s.height };
    });
    expect(btn.bg).toBe("rgb(244, 244, 244)"); // --fz-surface-alt (light)
    expect(btn.h).toBe("40px"); // --fz-control-height
  });

  test("color input renders as a themed swatch", async ({ page }) => {
    await page.goto("/demo/");
    const c = page.locator("#favcolor");
    await expect(c).toHaveCSS("height", "40px");
    await expect(c).toHaveCSS("width", "40px");
    await expect(c).toHaveCSS("border-radius", "4px"); // --fz-radius-sm
  });

  test("required controls get a danger asterisk on their wrapped label", async ({ page }) => {
    await page.goto("/demo/");
    const marker = await page.evaluate(() => {
      const label = document.querySelector("label:has(> input[required])");
      return getComputedStyle(label, "::after").content;
    });
    expect(marker).toBe('" *"');
  });

  test("autogrow textarea opts into field-sizing: content", async ({ page }) => {
    await page.goto("/demo/");
    await expect(page.locator("#bio")).toHaveCSS("field-sizing", "content");
  });

  test("form:has(:user-invalid) marks the whole form after user interaction", async ({ page }) => {
    await page.goto("/demo/");
    const email = page.locator("#email");
    await email.fill("not-an-email");
    await email.blur();
    await expect(page.locator("#demo-form")).toHaveCSS("outline-style", "solid");
  });

  test("output is a styled live region", async ({ page }) => {
    await page.goto("/demo/");
    await expect(page.locator("#amount-out")).toHaveCSS("font-weight", "600");
  });
});

test.describe("v1.6 layout & navigation", () => {
  test("spacing scale: mt/p/px/py map to the token scale (axis shorthands win)", async ({ page }) => {
    await page.goto("/demo/");
    const cs = await page.locator("#spacing-probe").evaluate((el) => {
      const s = getComputedStyle(el);
      return {
        mt: s.marginBlockStart,
        pt: s.paddingTop,
        pb: s.paddingBottom,
        pl: s.paddingLeft,
        pr: s.paddingRight,
      };
    });
    expect(cs.mt).toBe("32px");  // --fz-space-6 (2rem)
    expect(cs.pt).toBe("8px");   // --fz-space-2 (0.5rem, from py-2)
    expect(cs.pb).toBe("8px");
    expect(cs.pl).toBe("12px");  // --fz-space-3 (0.75rem, from px-3)
    expect(cs.pr).toBe("12px");
  });

  test("grid auto-fit: as many columns as fit, each ≥ --fz-grid-min", async ({ page }) => {
    await page.goto("/demo/");
    const cards = page.locator("#demo-grid-auto .card");
    // All three cards on one row → the grid fit ≥3 columns.
    const tops = await cards.evaluateAll((els) =>
      els.map((el) => Math.round(el.getBoundingClientRect().top))
    );
    expect(new Set(tops).size).toBe(1);
    // Each card ≥ the min track (14rem = 224px), minus 1px rounding.
    for (const w of await cards.evaluateAll((els) =>
      els.map((el) => el.getBoundingClientRect().width)
    )) {
      expect(w).toBeGreaterThanOrEqual(223);
    }
  });

  test("grid gap follows data-gap from the spacing scale", async ({ page }) => {
    await page.goto("/demo/");
    await expect(page.locator("#demo-grid-gap")).toHaveCSS("gap", "8px"); // --fz-space-2
  });

  test("nav: current page is accent + semibold, links are padded pills", async ({ page }) => {
    await page.goto("/demo/");
    const current = page.locator('#demo-nav [aria-current="page"]');
    await expect(current).toHaveText("Home");
    await expect(current).toHaveCSS("font-weight", "600");
    const color = await current.evaluate((el) => getComputedStyle(el).color);
    expect(color).toBe("rgb(26, 26, 26)"); // --fz-primary (light)
    await expect(page.locator("#demo-nav a").nth(1)).toHaveCSS("padding-left", "12px"); // space-3 pill
  });

  test("nav footer variant is muted with a top hairline", async ({ page }) => {
    await page.goto("/demo/");
    await expect(page.locator('[data-nav="footer"]')).toHaveCSS("border-top-style", "solid");
    const fg = await page.locator('[data-nav="footer"] > span').evaluate(
      (el) => getComputedStyle(el.parentElement).color
    );
    expect(fg).toBe("rgb(90, 90, 90)"); // --fz-muted (light)
  });

  test("sidebar splits aside from main and stacks when narrow", async ({ page }) => {
    await page.goto("/demo/");
    const sidebar = page.locator("#demo-sidebar");
    await expect(sidebar).toHaveCSS("display", "flex");
    const basis = await sidebar
      .locator(":scope > :first-child")
      .evaluate((el) => getComputedStyle(el).flexBasis);
    expect(basis).toBe("256px"); // --fz-sidebar-width (16rem)

    // Narrow the row → the split wraps to a single column.
    await sidebar.evaluate((el) => { el.style.width = "20rem"; });
    const tops = await sidebar.locator(":scope > *").evaluateAll((els) =>
      els.map((el) => el.getBoundingClientRect().top)
    );
    expect(tops[1] - tops[0]).toBeGreaterThan(0);
  });

  test("sticky utility pins to --fz-sticky-top", async ({ page }) => {
    await page.goto("/demo/");
    await expect(page.locator("#demo-sticky")).toHaveCSS("position", "sticky");
    await expect(page.locator("#demo-sticky")).toHaveCSS("top", "0px");
  });
});
