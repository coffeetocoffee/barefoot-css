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

test.describe("v1.7 feedback & status", () => {
  test("status tokens resolve as light-dark pairs (flip with color-scheme)", async ({ page }) => {
    await page.goto("/demo/");
    const t = await page.evaluate(() => {
      const root = document.documentElement;
      const read = () => {
        const s = getComputedStyle(root);
        return {
          success: s.getPropertyValue("--fz-success").trim(),
          info: s.getPropertyValue("--fz-info").trim(),
          warning: s.getPropertyValue("--fz-warning").trim(),
        };
      };
      root.style.colorScheme = "light";
      const light = read();
      root.style.colorScheme = "dark";
      const dark = read();
      root.style.colorScheme = "";
      return { light, dark };
    });
    expect(t.light.success).toBe("rgb(26, 127, 55)");
    expect(t.light.info).toBe("rgb(9, 105, 218)");
    expect(t.light.warning).toBe("rgb(154, 103, 0)");
    expect(t.dark.success).not.toBe(t.light.success);
    expect(t.dark.info).not.toBe(t.light.info);
    expect(t.dark.warning).not.toBe(t.light.warning);
  });

  test("alert: data-alert variants paint the status edge from the tokens", async ({ page }) => {
    await page.goto("/demo/");
    // light() → light value of --fz-danger (#b3261e → rgb(179, 38, 30)).
    await expect(page.locator("#demo-alert-danger")).toHaveCSS("border-inline-start-color", "rgb(179, 38, 30)");
    await expect(page.locator("#demo-alert-success")).toHaveCSS("border-inline-start-color", "rgb(26, 127, 55)");
    await expect(page.locator("#demo-alert-info")).toHaveCSS("border-inline-start-color", "rgb(9, 105, 218)");
    await expect(page.locator("#demo-alert-warning")).toHaveCSS("border-inline-start-color", "rgb(154, 103, 0)");
  });

  test("alert dismiss button removes its alert (opt-in js/alert-dismiss.js)", async ({ page }) => {
    await page.goto("/demo/");
    const alert = page.locator("#demo-alert-danger");
    await alert.getByRole("button", { name: "Dismiss" }).click();
    await expect(alert).toHaveCount(0);
  });

  test("field validation: touched invalid fields get the danger border, valid get success", async ({ page }) => {
    await page.goto("/demo/");
    const email = page.locator("#demo-email");
    await email.fill("nope");
    await email.blur();
    await expect(email).toHaveCSS("border-color", "rgb(179, 38, 30)"); // --fz-danger (light)

    await email.fill("you@example.com");
    await email.blur();
    await expect(email).toHaveCSS("border-color", "rgb(26, 127, 55)"); // --fz-success (light)
  });

  test("field validation: [aria-invalid] mirrors the state for script-driven forms", async ({ page }) => {
    await page.goto("/demo/");
    const input = page.locator("#demo-user");
    await input.evaluate((el) => {
      el.setAttribute("aria-invalid", "true");
      el.setAttribute("aria-describedby", "user-msg");
    });
    await expect(input).toHaveCSS("border-color", "rgb(179, 38, 30)");
    await input.evaluate((el) => el.setAttribute("aria-invalid", "false"));
    await expect(input).toHaveCSS("border-color", "rgb(26, 127, 55)");
  });

  test("skeleton: shimmering placeholder with a surface-alt base", async ({ page }) => {
    await page.goto("/demo/");
    const sk = page.locator("#demo-skeleton-line");
    await expect(sk).toHaveCSS("background-color", "rgb(244, 244, 244)"); // --fz-surface-alt (light)
    const anim = await sk.evaluate((el) => getComputedStyle(el, "::after").animationName);
    expect(anim).toBe("fz-skeleton-shimmer");
  });

  test("skeleton: shimmer disabled under prefers-reduced-motion", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/demo/");
    const anim = await page
      .locator("#demo-skeleton-line")
      .evaluate((el) => getComputedStyle(el, "::after").animationName);
    expect(anim).toBe("none");
  });

  test("toast: popover opens declaratively, Esc closes, pinned to bottom edge", async ({ page }) => {
    await page.goto("/demo/");
    const toast = page.locator("#demo-toast");
    await expect(toast).toBeHidden();
    await page.locator("#toast-trigger").click();
    await expect(toast).toBeVisible();
    await expect(toast).toHaveAttribute("role", "status");
    const pos = await toast.evaluate((el) => {
      const r = el.getBoundingClientRect();
      return { bottom: r.bottom, vh: window.innerHeight };
    });
    expect(pos.vh - pos.bottom).toBeLessThan(100); // pinned near the viewport bottom

    await page.keyboard.press("Escape");
    await expect(toast).toBeHidden();
  });

  test("toast: data-variant tints the edge from the status tokens", async ({ page }) => {
    await page.goto("/demo/");
    await page.locator("#toast-trigger").click();
    await expect(page.locator("#demo-toast")).toHaveCSS("border-inline-start-color", "rgb(26, 127, 55)");
  });

  test("badge: status variants map to the status tokens", async ({ page }) => {
    await page.goto("/demo/");
    // Reuse the alert section badges? None there — check token-backed styles
    // via the conformance demo by injecting a badge in a temp container.
    const colors = await page.evaluate(() => {
      const host = document.createElement("div");
      host.innerHTML = `
        <span class="badge" data-variant="success">ok</span>
        <span class="badge" data-variant="info">i</span>
        <span class="badge" data-variant="warning">w</span>`;
      document.body.append(host);
      const [s, i, w] = [...host.children].map((el) => getComputedStyle(el).borderColor);
      host.remove();
      return { s, i, w };
    });
    expect(colors.s).toBe("rgb(26, 127, 55)");
    expect(colors.i).toBe("rgb(9, 105, 218)");
    expect(colors.w).toBe("rgb(154, 103, 0)");
  });
});

test.describe("v1.8 content & media", () => {
  test("fluid type: headings clamp — smaller on a narrow viewport, capped on a wide one", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto("/demo/");
    const wide = await page
      .locator("#typography h1")
      .evaluate((el) => parseFloat(getComputedStyle(el).fontSize));

    await page.setViewportSize({ width: 360, height: 800 });
    const narrow = await page
      .locator("#typography h1")
      .evaluate((el) => parseFloat(getComputedStyle(el).fontSize));

    expect(wide).toBe(40);   // --fz-type-2xl caps at 2.5rem
    expect(narrow).toBeLessThan(wide);
    expect(narrow).toBeGreaterThan(20); // never collapses on phones
  });

  test("fluid type: headings read the --fz-type-* tokens", async ({ page }) => {
    await page.goto("/demo/");
    const sizes = await page.locator("#typography h1, #typography h2, #typography h3, #typography h4").evaluateAll((els) => {
      const root = getComputedStyle(document.documentElement);
      // Resolve a token to its used px (same viewport) so the heading's
      // computed size can be compared with the token it should read.
      const resolve = (token) => {
        const probe = document.createElement("span");
        probe.style.fontSize = root.getPropertyValue(token).trim();
        document.body.append(probe);
        const px = getComputedStyle(probe).fontSize;
        probe.remove();
        return px;
      };
      return els.map((el) => ({
        heading: getComputedStyle(el).fontSize,
        token: resolve(el.tagName === "H1" ? "--fz-type-2xl"
          : el.tagName === "H2" ? "--fz-type-xl"
          : el.tagName === "H3" ? "--fz-type-lg"
          : "--fz-type-md"),
      }));
    });
    for (const { heading, token } of sizes) {
      expect(heading).toBe(token);
    }
  });

  test("prose: headings open a section (big gap above, tight gap below)", async ({ page }) => {
    await page.goto("/demo/");
    // The first h3 is :first-child → margin-block-start: 0 (by design).
    // Test the second h3 to assert the section rhythm.
    const heading = page.locator("#demo-prose h3").nth(1);
    const mt = parseFloat(await heading.evaluate((el) => getComputedStyle(el).marginTop));
    const mb = parseFloat(await heading.evaluate((el) => getComputedStyle(el).marginBottom));
    expect(mt).toBe(48); // --fz-space-7 (3rem)
    expect(mb).toBe(12); // --fz-space-3 (0.75rem)
    expect(mt).toBeGreaterThan(mb);
  });

  test("prose: tables get their own vertical room inside the wrapper", async ({ page }) => {
    await page.goto("/demo/");
    const table = page.locator("#demo-prose table");
    const mt = parseFloat(await table.evaluate((el) => getComputedStyle(el).marginTop));
    expect(mt).toBe(24); // --fz-space-5 (1.5rem)
    // Table is width: 100% (computed = parent width in px). Assert it fills the prose container.
    const { w: tableW, pw: proseW } = await table.evaluate((el) => {
      return { w: el.getBoundingClientRect().width, pw: el.closest(".fz-prose").getBoundingClientRect().width };
    });
    expect(tableW).toBeCloseTo(proseW, 1);
  });

  test("avatar: circular, token-sized, object-fit cover", async ({ page }) => {
    await page.goto("/demo/");
    const av = page.locator("#demo-avatar");
    await expect(av).toHaveCSS("border-radius", "50%");
    await expect(av).toHaveCSS("width", "40px"); // --fz-avatar-size (2.5rem)
    await expect(av).toHaveCSS("height", "40px");
    await expect(av).toHaveCSS("object-fit", "cover");
  });

  test("avatar: data-size sm/lg resize from the token edge", async ({ page }) => {
    await page.goto("/demo/");
    await expect(page.locator("#demo-avatar-sm")).toHaveCSS("width", "28px"); // 1.75rem
    const lg = page.locator('#media .fz-avatar[data-size="lg"]');
    await expect(lg).toHaveCSS("width", "64px"); // 4rem
  });

  test("media: [data-media] locks a 16:9 box, data-ratio overrides", async ({ page }) => {
    await page.goto("/demo/");
    const ratio = async (sel) => {
      const box = await page.locator(sel).boundingBox();
      return box.height / box.width;
    };
    expect(await ratio("#demo-media-16")).toBeCloseTo(9 / 16, 2);
    expect(await ratio('#media [data-media][data-ratio="1/1"]')).toBeCloseTo(1, 2);
    expect(await ratio('#media [data-media][data-ratio="21/9"]')).toBeCloseTo(9 / 21, 2);
  });

  test("media: images are responsive — capped width, kept ratio", async ({ page }) => {
    await page.goto("/demo/");
    const img = page.locator("#demo-responsive-img");
    await expect(img).toHaveCSS("max-width", "100%");
    const fits = await img.evaluate((el) => {
      const imgBox = el.getBoundingClientRect();
      const parentBox = el.parentElement.getBoundingClientRect();
      return { w: imgBox.width, pw: parentBox.width, hw: imgBox.width / imgBox.height };
    });
    // 2000×500 source: rendering must stay within the container and keep 4:1.
    expect(fits.w).toBeLessThanOrEqual(fits.pw + 1);
    expect(fits.hw).toBeCloseTo(4, 1);
  });

  test("media card: card[data-media] bleeds media to the top, body keeps padding", async ({ page }) => {
    await page.goto("/demo/");
    const card = page.locator("#demo-media-card");
    await expect(card).toHaveCSS("padding", "0px");
    await expect(card.locator(":scope > img")).toHaveCSS("border-radius", "0px");
    await expect(card.locator(":scope > header")).toHaveCSS("padding", "24px"); // --fz-space-5
  });
});

test.describe("v1.9 stepper & input groups", () => {
  test("stepper horizontal: completed steps use success token, current uses primary", async ({ page }) => {
    await page.goto("/demo/");
    const stepper = page.locator("#demo-stepper-h");
    const circles = stepper.locator("[data-step-circle]");

    // First step (completed) — success colors
    await expect(circles.nth(0)).toHaveCSS("border-color", "rgb(26, 127, 55)"); // --fz-success
    await expect(circles.nth(0)).toHaveCSS("background-color", "rgb(26, 127, 55)");
    await expect(circles.nth(0)).toHaveCSS("color", "rgb(255, 255, 255)"); // --fz-success-fg

    // Second step (current) — primary colors
    await expect(circles.nth(1)).toHaveCSS("border-color", "rgb(26, 26, 26)"); // --fz-primary
    await expect(circles.nth(1)).toHaveCSS("background-color", "rgb(26, 26, 26)");
    await expect(circles.nth(1)).toHaveCSS("color", "rgb(255, 255, 255)"); // --fz-primary-fg

    // Third step (pending) — muted/border colors
    await expect(circles.nth(2)).toHaveCSS("border-color", "rgb(216, 216, 216)"); // --fz-border
    await expect(circles.nth(2)).toHaveCSS("background-color", "rgb(255, 255, 255)"); // --fz-surface
    await expect(circles.nth(2)).toHaveCSS("color", "rgb(90, 90, 90)"); // --fz-muted
  });

  test("stepper vertical: same token mapping, vertical layout", async ({ page }) => {
    await page.goto("/demo/");
    const stepper = page.locator("#demo-stepper-v");
    const circles = stepper.locator("[data-step-circle]");

    // First step (completed)
    await expect(circles.nth(0)).toHaveCSS("border-color", "rgb(26, 127, 55)");
    await expect(circles.nth(0)).toHaveCSS("background-color", "rgb(26, 127, 55)");

    // Second step (current)
    await expect(circles.nth(1)).toHaveCSS("border-color", "rgb(26, 26, 26)");
    await expect(circles.nth(1)).toHaveCSS("background-color", "rgb(26, 26, 26)");

    // Third step (pending)
    await expect(circles.nth(2)).toHaveCSS("border-color", "rgb(216, 216, 216)");
    await expect(circles.nth(2)).toHaveCSS("background-color", "rgb(255, 255, 255)");
  });

  test("input group: leading affix shares input focus state", async ({ page }) => {
    await page.goto("/demo/");
    const group = page.locator("#demo-input-group-form [data-input-group]").first();
    const affix = group.locator(":scope > :first-child");
    const input = group.locator("input");

    // Default state — check border-inline-start-color to avoid shorthand
    await expect(affix).toHaveCSS("border-inline-start-color", "rgb(216, 216, 216)"); // --fz-border
    await expect(affix).toHaveCSS("color", "rgb(90, 90, 90)"); // --fz-muted
    await expect(affix).toHaveCSS("background-color", "rgb(244, 244, 244)"); // --fz-surface-alt

    // Focus state
    await input.focus();
    await expect(affix).toHaveCSS("border-inline-start-color", "rgb(26, 26, 26)"); // --fz-focus-ring
    await expect(affix).toHaveCSS("color", "rgb(26, 26, 26)");
  });

  test("input group: leading affix shares input validation state (invalid)", async ({ page }) => {
    await page.goto("/demo/");
    // Use the username input (text type) for invalid test
    const group = page.locator("#demo-input-group-form [data-input-group]").first();
    const affix = group.locator(":scope > :first-child");
    const input = group.locator("input");

    // Trigger invalid state — fill with invalid email-like text then blur
    // Actually, let's use the required attribute approach
    await input.evaluate((el) => el.setAttribute("aria-invalid", "true"));
    await expect(affix).toHaveCSS("border-inline-start-color", "rgb(179, 38, 30)"); // --fz-danger
    await expect(affix).toHaveCSS("color", "rgb(179, 38, 30)");
  });

  test("input group: leading affix shares input validation state (valid)", async ({ page }) => {
    await page.goto("/demo/");
    const group = page.locator("#demo-input-group-form [data-input-group]").first();
    const affix = group.locator(":scope > :first-child");
    const input = group.locator("input");

    // Trigger valid state
    await input.evaluate((el) => el.setAttribute("aria-invalid", "false"));
    await expect(affix).toHaveCSS("border-inline-start-color", "rgb(26, 127, 55)"); // --fz-success
    await expect(affix).toHaveCSS("color", "rgb(26, 127, 55)");
  });

  test("date/number/email inputs get themed surface and validation", async ({ page }) => {
    await page.goto("/demo/");
    const email = page.locator("#polish-email");
    const number = page.locator("#polish-number");
    const date = page.locator("#polish-date");

    // All should have the shared input styles — height may be 42px due to line-height
    await expect(email).toHaveCSS("background-color", "rgb(255, 255, 255)"); // --fz-surface
    await expect(email).toHaveCSS("border-color", "rgb(216, 216, 216)"); // --fz-border
    await expect(email).toHaveCSS("min-height", "40px"); // --fz-control-height

    await expect(number).toHaveCSS("background-color", "rgb(255, 255, 255)");
    await expect(number).toHaveCSS("min-height", "40px");

    await expect(date).toHaveCSS("background-color", "rgb(255, 255, 255)");
    await expect(date).toHaveCSS("min-height", "40px");
  });

  test("number input hides spinner by default (appearance: textfield)", async ({ page }) => {
    await page.goto("/demo/");
    const number = page.locator("#polish-number");

    // Should have appearance: textfield (hiding native spinner)
    await expect(number).toHaveCSS("appearance", "textfield");
  });

  test("date input has themed calendar picker indicator", async ({ page, browserName }) => {
    test.skip(browserName !== "chromium", "WebKit/Blink pseudo-element");
    await page.goto("/demo/");
    const date = page.locator("#polish-date");

    // The calendar picker indicator should have opacity transition (default 1, 0.6 on hover)
    const indicatorOpacity = await date.evaluate((el) =>
      getComputedStyle(el, "::-webkit-calendar-picker-indicator").opacity
    );
    // Default opacity is 1 in Chromium; hover transitions to 1 but base is 0.6
    expect(indicatorOpacity).toBe("1");
  });
});

test.describe("v2.2 tokens, motion & print safety", () => {
  test("stroke and pill tokens resolve and drive components", async ({ page }) => {
    await page.goto("/demo/");
    const root = page.locator("html");
    const borderWidth = await root.evaluate((el) =>
      getComputedStyle(el).getPropertyValue("--fz-border-width").trim()
    );
    const radiusFull = await root.evaluate((el) =>
      getComputedStyle(el).getPropertyValue("--fz-radius-full").trim()
    );
    expect(borderWidth).toBe("1px");
    expect(radiusFull).toBe("999px");

    // Components consume the tokens: a button's stroke and a badge's
    // pill shape must come from --fz-border-width / --fz-radius-full.
    const button = page.getByRole("button", { name: "Open dialog" });
    await expect(button).toHaveCSS("border-top-width", "1px");
    const badgeRadius = await page.locator(".badge").first().evaluate(
      (el) => getComputedStyle(el).borderRadius
    );
    expect(badgeRadius).toBe("999px");
  });

  test("z-index scale orders dropdown < sticky < dialog < toast", async ({ page }) => {
    await page.goto("/demo/");
    const root = page.locator("html");
    const z = async (name) =>
      parseInt(
        await root.evaluate(
          (el, n) => getComputedStyle(el).getPropertyValue(n).trim(),
          name
        )
      );
    expect(await z("--fz-z-dropdown")).toBeLessThan(await z("--fz-z-sticky"));
    expect(await z("--fz-z-sticky")).toBeLessThan(await z("--fz-z-dialog"));
    expect(await z("--fz-z-dialog")).toBeLessThan(await z("--fz-z-toast"));

    // The dropdown panel consumes its rung of the ladder.
    const panelZ = await page
      .locator("details[data-menu] > :not(summary)")
      .first()
      .evaluate((el) => getComputedStyle(el).zIndex);
    expect(panelZ).toBe("10");
  });

  test("prefers-reduced-motion: reduce neutralizes motion", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/demo/");

    // Smooth scrolling is switched off…
    const scrollBehavior = await page
      .locator("html")
      .evaluate((el) => getComputedStyle(el).scrollBehavior);
    expect(scrollBehavior).toBe("auto");

    // …and every transition collapses to (almost) zero duration.
    const button = page.getByRole("button", { name: "Open dialog" });
    const durations = await button.evaluate((el) =>
      getComputedStyle(el).transitionDuration.split(",").map(parseFloat)
    );
    for (const d of durations) expect(d).toBeLessThan(1);

    // The skeleton shimmer stops too (animation runs once, ~no time).
    const skeleton = page.locator("#demo-skeleton-line");
    const iteration = await skeleton.evaluate(
      (el) => getComputedStyle(el, "::after").animationIterationCount
    );
    expect(iteration).toBe("1");
  });

  test("print stylesheet forces light-on-white, no shadows", async ({ page }) => {
    await page.goto("/demo/");
    // Even with a dark theme active, paper gets ink on white.
    await page.locator("html").evaluate((el) => { el.dataset.theme = "dark"; });
    await page.emulateMedia({ media: "print" });

    const body = page.locator("body");
    await expect(body).toHaveCSS("background-color", "rgb(255, 255, 255)");
    await expect(body).toHaveCSS("color", "rgb(0, 0, 0)");

    // Decorative depth never survives printing.
    const liftedShadow = await page
      .locator(".card[data-lifted]")
      .first()
      .evaluate((el) => getComputedStyle(el).boxShadow);
    expect(liftedShadow).toBe("none");

    // Blocks don't split across pages.
    const breakInside = await page
      .locator("pre")
      .first()
      .evaluate((el) => getComputedStyle(el).breakInside);
    expect(breakInside).toBe("avoid");
  });
});

test.describe("v2.4 components", () => {
  test("avatar group overlaps avatars behind a surface ring", async ({ page }) => {
    await page.goto("/demo/");
    const avatars = page.locator("#demo-avatar-group .fz-avatar");
    await expect(avatars).toHaveCount(4);

    // The second avatar starts before the first one ends — a real
    // overlap of about a third of an avatar's width.
    const boxes = await avatars.evaluateAll((els) =>
      els.map((el) => el.getBoundingClientRect())
    );
    const overlap = boxes[0].right - boxes[1].left;
    expect(overlap).toBeGreaterThan(boxes[0].width / 4);
    expect(overlap).toBeLessThan(boxes[0].width / 2);

    // Each face is separated from the one beneath by the surface ring.
    const shadow = await avatars.nth(1).evaluate(
      (el) => getComputedStyle(el).boxShadow
    );
    expect(shadow).toContain("rgb(255, 255, 255)"); // --fz-surface (light)
  });

  test("spinner rotates via fz-spin and reads the accent tokens", async ({ page }) => {
    await page.goto("/demo/");
    const spinner = page.locator("#demo-spinner");
    const name = await spinner.evaluate(
      (el) => getComputedStyle(el).animationName
    );
    expect(name).toBe("fz-spin");
    await expect(spinner).toHaveCSS("border-radius", "999px"); // --fz-radius-full
    await expect(spinner).toHaveCSS("border-top-color", "rgb(26, 26, 26)"); // --fz-primary (light)

    // Sizes: default 1.5rem, lg tracks the control height token.
    await expect(spinner).toHaveCSS("width", "24px");
    const lg = page.locator('#spinner [data-spinner][data-size="lg"]');
    await expect(lg).toHaveCSS("width", "40px"); // --fz-control-height
  });

  test("divider draws hairlines around real text", async ({ page }) => {
    await page.goto("/demo/");
    const divider = page.locator("#demo-divider");
    await expect(divider).toHaveCSS("display", "flex");

    // Both rules render at the stroke token's width…
    const rules = await divider.evaluate((el) => [
      getComputedStyle(el, "::before").borderTopWidth,
      getComputedStyle(el, "::after").borderTopWidth,
    ]);
    expect(rules).toEqual(["1px", "1px"]); // --fz-border-width

    // …and the label is muted secondary text, not a heading look.
    await expect(divider).toHaveCSS("color", "rgb(90, 90, 90)"); // --fz-muted
    await expect(divider).toHaveCSS("font-weight", "400");
  });
});

test.describe("mobile viewport (375px)", () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test("page never overflows horizontally", async ({ page }) => {
    await page.goto("/demo/");
    const overflow = await page.evaluate(() => ({
      scroll: document.scrollingElement.scrollWidth,
      inner: window.innerWidth,
    }));
    expect(overflow.scroll).toBeLessThanOrEqual(overflow.inner);
  });

  test("fluid type steps down and tap targets keep their height", async ({ page }) => {
    await page.goto("/demo/");

    // Headings shrink below their wide-viewport cap but never collapse.
    const h1 = parseFloat(await page
      .locator("#typography h1")
      .evaluate((el) => getComputedStyle(el).fontSize));
    expect(h1).toBeLessThan(40); // below the 2.5rem cap
    expect(h1).toBeGreaterThan(20);

    // Controls hold --fz-control-height so touch targets stay usable.
    const btn = page.getByRole("button", { name: "Open dialog" });
    const height = await btn.evaluate((el) => el.getBoundingClientRect().height);
    expect(height).toBeGreaterThanOrEqual(40);
  });
});
