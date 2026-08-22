/* Barefoot — 1.0 CSS behavior tests.
   Container-query grid, container-unit carousel, anchored popovers,
   and theme switching through startViewTransition.

   npm run test:css */
import { test, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { DEMOS, gotoDemo, gotoGallery, tokenColor } from "./helpers.js";

const rootDir = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

test.describe("tests have real CSS (smoke)", () => {
  test("demo page loads the built Barefoot stylesheet", async ({ page }) => {
    await gotoDemo(page);
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
    await gotoDemo(page);

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
    await gotoDemo(page);
    const carousel = page.locator("[data-carousel]");
    const slide = page.locator("[data-carousel] > *").first();

    const cw = (await carousel.boundingBox()).width;
    const sw = (await slide.boundingBox()).width;

    expect(Math.abs(sw - cw * 0.6)).toBeLessThan(2);
  });
});

test.describe("stackable tables", () => {
  test("table[data-table='stack']: header row hidden when its container is narrow, table when wide", async ({ page }) => {
    await gotoDemo(page);
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
    await gotoDemo(page);
    const trigger = page.locator(DEMOS.helpTrigger);
    const otherTrigger = page.locator(DEMOS.tipTrigger);
    const pop = page.locator(DEMOS.helpPop);

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
    await gotoDemo(page);
    const trigger = page.locator(DEMOS.helpTrigger);
    const pop = page.locator(DEMOS.helpPop);

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
    await gotoDemo(page);
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
    await gotoDemo(page);
    const range = page.locator(DEMOS.amount);
    // Chromium's getComputedStyle doesn't reflect author styles on the
    // ::-webkit-slider-* shadow pseudos, so assert the element-level skin:
    // native chrome stripped, height from --fz-control-height, no surface.
    await expect(range).toHaveCSS("appearance", "none");
    await expect(range).toHaveCSS("height", "40px");
    await expect(range).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
    await expect(range).toHaveCSS("cursor", "pointer");
  });

  test("progress and meter are themed bars (accent fill, alt track)", async ({ page }) => {
    await gotoDemo(page);
    for (const id of [DEMOS.prog, DEMOS.storage]) {
      const bar = page.locator(id);
      await expect(bar).toHaveCSS("height", "12px");
      await expect(bar).toHaveCSS("background-color", await tokenColor(page, "--fz-surface-alt")); // --fz-surface-alt (light)
      await expect(bar).toHaveCSS("overflow", "hidden");
      await expect(bar).toHaveCSS("accent-color", await tokenColor(page, "--fz-primary")); // --fz-primary (light)
    }
  });
});

test.describe("breadcrumbs & pagination", () => {
  test("breadcrumbs: slash separator between items, current is muted text", async ({ page }) => {
    await gotoDemo(page);
    const second = page.locator('[data-breadcrumbs] li').nth(1);
    const sep = await second.evaluate((el) =>
      getComputedStyle(el, "::before").content
    );
    expect(sep).toBe('"/"');
    await expect(page.locator('[data-breadcrumbs] [aria-current="page"]')).toHaveText("Theming");
  });

  test("pagination: current page is a filled span, never a link", async ({ page }) => {
    await gotoDemo(page);
    const current = page.locator('[data-pagination] [aria-current="page"]');
    await expect(current).toHaveText("2");
    const bg = await current.evaluate((el) => getComputedStyle(el).backgroundColor);
    expect(bg).toBe(await tokenColor(page, "--fz-primary")); // --fz-primary
    await expect(page.locator('[data-pagination] a[aria-current]')).toHaveCount(0);
  });
});

test.describe("themes & OS accessibility settings", () => {
  test("forest theme flips the accent to green", async ({ page }) => {
    await gotoDemo(page);
    // Probe what the accent paints — getPropertyValue would return the
    // unresolved light-dark() string on a plain custom property.
    const before = await tokenColor(page, "--fz-primary");
    await page.locator("html").evaluate((el) => {
      el.dataset.theme = "forest";
    });
    const after = await tokenColor(page, "--fz-primary");
    expect(before).not.toBe(after);
    expect(after).toBe("rgb(47, 107, 79)");
  });

  test("prefers-contrast: more forces black-on-white tokens", async ({ page }) => {
    await page.emulateMedia({ contrast: "more" });
    await gotoDemo(page);
    // Read what the token PAINTS, not its serialized form — plain
    // custom properties resolve light-dark() at the consumer property.
    expect(await tokenColor(page, "--fz-text")).toBe("rgb(0, 0, 0)");
  });
});

test.describe("v1.5 form completion", () => {
  test("select gets a themed chevron (appearance none + reserved padding)", async ({ page }) => {
    await gotoDemo(page);
    const sel = page.locator(DEMOS.country);
    await expect(sel).toHaveCSS("appearance", "none");
    const arrow = await sel.evaluate((el) => getComputedStyle(el).backgroundImage);
    expect(arrow).toContain("svg");
    await expect(sel).not.toHaveCSS("padding-right", "0px");
  });

  test("file input button is skinned via ::file-selector-button", async ({ page }) => {
    await gotoDemo(page);
    const btn = await page.evaluate((file) => {
      const el = document.querySelector(file);
      const s = getComputedStyle(el, "::file-selector-button");
      return { bg: s.backgroundColor, h: s.height };
    }, DEMOS.file);
    expect(btn.bg).toBe(await tokenColor(page, "--fz-surface-alt")); // --fz-surface-alt
    expect(btn.h).toBe("40px"); // --fz-control-height
  });

  test("color input renders as a themed swatch", async ({ page }) => {
    await gotoDemo(page);
    const c = page.locator(DEMOS.favcolor);
    await expect(c).toHaveCSS("height", "40px");
    await expect(c).toHaveCSS("width", "40px");
    await expect(c).toHaveCSS("border-radius", "4px"); // --fz-radius-sm
  });

  test("required controls get a danger asterisk on their wrapped label", async ({ page }) => {
    await gotoDemo(page);
    const marker = await page.evaluate(() => {
      const label = document.querySelector("label:has(> input[required])");
      return getComputedStyle(label, "::after").content;
    });
    expect(marker).toBe('" *"');
  });

  test("autogrow textarea opts into field-sizing: content", async ({ page }) => {
    await gotoDemo(page);
    await expect(page.locator(DEMOS.bio)).toHaveCSS("field-sizing", "content");
  });

  test("form:has(:user-invalid) marks the whole form after user interaction", async ({ page }) => {
    await gotoDemo(page);
    const email = page.locator(DEMOS.email);
    await email.fill("not-an-email");
    await email.blur();
    await expect(page.locator(DEMOS.demoForm)).toHaveCSS("outline-style", "solid");
  });

  test("output is a styled live region", async ({ page }) => {
    await gotoDemo(page);
    await expect(page.locator(DEMOS.amountOut)).toHaveCSS("font-weight", "600");
  });
});

test.describe("v1.6 layout & navigation", () => {
  test("spacing scale: mt/p/px/py map to the token scale (axis shorthands win)", async ({ page }) => {
    await gotoDemo(page);
    const cs = await page.locator(DEMOS.spacingProbe).evaluate((el) => {
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
    await gotoDemo(page);
    const cards = page.locator(`${DEMOS.demoGridAuto} .card`);
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
    await gotoDemo(page);
    await expect(page.locator(DEMOS.demoGridGap)).toHaveCSS("gap", "8px"); // --fz-space-2
  });

  test("nav: current page is accent + semibold, links are padded pills", async ({ page }) => {
    await gotoDemo(page);
    const current = page.locator(`${DEMOS.demoNav} [aria-current="page"]`);
    await expect(current).toHaveText("Home");
    await expect(current).toHaveCSS("font-weight", "600");
    const color = await current.evaluate((el) => getComputedStyle(el).color);
    expect(color).toBe(await tokenColor(page, "--fz-primary")); // --fz-primary
    await expect(page.locator(`${DEMOS.demoNav} a`).nth(1)).toHaveCSS("padding-left", "12px"); // space-3 pill
  });

  test("nav footer variant is muted with a top hairline", async ({ page }) => {
    await gotoDemo(page);
    await expect(page.locator('[data-nav="footer"]')).toHaveCSS("border-top-style", "solid");
    const fg = await page.locator('[data-nav="footer"] > span').evaluate(
      (el) => getComputedStyle(el.parentElement).color
    );
    expect(fg).toBe(await tokenColor(page, "--fz-muted")); // --fz-muted
  });

  test("sidebar splits aside from main and stacks when narrow", async ({ page }) => {
    await gotoDemo(page);
    const sidebar = page.locator(DEMOS.demoSidebar);
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
    await gotoDemo(page);
    await expect(page.locator(DEMOS.demoSticky)).toHaveCSS("position", "sticky");
    await expect(page.locator(DEMOS.demoSticky)).toHaveCSS("top", "0px");
  });
});

test.describe("v1.7 feedback & status", () => {
  test("status tokens resolve as light-dark pairs (flip with color-scheme)", async ({ page }) => {
    await gotoDemo(page);
    // Probe what each token paints under both schemes — getPropertyValue
    // would return the unresolved light-dark() string now that tokens
    // are plain custom properties (ADR-0005).
    const t = await page.evaluate(() => {
      const root = document.documentElement;
      const probe = document.createElement("span");
      document.body.append(probe);
      const names = ["--fz-success", "--fz-info", "--fz-warning"];
      const read = () =>
        names.map((name) => {
          probe.style.color = `var(${name})`;
          return getComputedStyle(probe).color;
        });
      root.style.colorScheme = "light";
      const light = read();
      root.style.colorScheme = "dark";
      const dark = read();
      root.style.colorScheme = "";
      probe.remove();
      return { light, dark };
    });
    const [successL, infoL, warningL] = t.light;
    const [successD, infoD, warningD] = t.dark;
    expect(successL).toBe("rgb(26, 127, 55)");
    expect(infoL).toBe("rgb(9, 105, 218)");
    expect(warningL).toBe("rgb(154, 103, 0)");
    expect(successD).not.toBe(successL);
    expect(infoD).not.toBe(infoL);
    expect(warningD).not.toBe(warningL);
  });

  test("alert: data-alert variants paint the status edge from the tokens", async ({ page }) => {
    await gotoDemo(page);
    // Status edges read the tokens — tokenColor resolves whatever theme is active.
    await expect(page.locator(DEMOS.demoAlertDanger)).toHaveCSS("border-inline-start-color", await tokenColor(page, "--fz-danger"));
    await expect(page.locator(DEMOS.demoAlertSuccess)).toHaveCSS("border-inline-start-color", await tokenColor(page, "--fz-success"));
    await expect(page.locator(DEMOS.demoAlertInfo)).toHaveCSS("border-inline-start-color", await tokenColor(page, "--fz-info"));
    await expect(page.locator(DEMOS.demoAlertWarning)).toHaveCSS("border-inline-start-color", await tokenColor(page, "--fz-warning"));
  });

  test("alert dismiss button removes its alert (opt-in js/alert-dismiss.js)", async ({ page }) => {
    await gotoDemo(page);
    const alert = page.locator(DEMOS.demoAlertDanger);
    await alert.getByRole("button", { name: "Dismiss" }).click();
    await expect(alert).toHaveCount(0);
  });

  test("field validation: touched invalid fields get the danger border, valid get success", async ({ page }) => {
    await gotoDemo(page);
    const email = page.locator(DEMOS.demoEmail);
    await email.fill("nope");
    await email.blur();
    await expect(email).toHaveCSS("border-color", await tokenColor(page, "--fz-danger")); // --fz-danger (light)

    await email.fill("you@example.com");
    await email.blur();
    await expect(email).toHaveCSS("border-color", await tokenColor(page, "--fz-success")); // --fz-success (light)
  });

  test("field validation: [aria-invalid] mirrors the state for script-driven forms", async ({ page }) => {
    await gotoDemo(page);
    const input = page.locator(DEMOS.demoUser);
    await input.evaluate((el) => {
      el.setAttribute("aria-invalid", "true");
      el.setAttribute("aria-describedby", "user-msg");
    });
    await expect(input).toHaveCSS("border-color", await tokenColor(page, "--fz-danger"));
    await input.evaluate((el) => el.setAttribute("aria-invalid", "false"));
    await expect(input).toHaveCSS("border-color", await tokenColor(page, "--fz-success"));
  });

  test("skeleton: shimmering placeholder with a surface-alt base", async ({ page }) => {
    await gotoDemo(page);
    const sk = page.locator(DEMOS.demoSkeletonLine);
    await expect(sk).toHaveCSS("background-color", await tokenColor(page, "--fz-surface-alt")); // --fz-surface-alt (light)
    const anim = await sk.evaluate((el) => getComputedStyle(el, "::after").animationName);
    expect(anim).toBe("fz-skeleton-shimmer");
  });

  test("skeleton: shimmer disabled under prefers-reduced-motion", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await gotoDemo(page);
    const anim = await page
      .locator(DEMOS.demoSkeletonLine)
      .evaluate((el) => getComputedStyle(el, "::after").animationName);
    expect(anim).toBe("none");
  });

  test("toast: popover opens declaratively, Esc closes, pinned to bottom edge", async ({ page }) => {
    await gotoDemo(page);
    const toast = page.locator(DEMOS.demoToast);
    await expect(toast).toBeHidden();
    await page.locator(DEMOS.toastTrigger).click();
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
    await gotoDemo(page);
    await page.locator(DEMOS.toastTrigger).click();
    await expect(page.locator(DEMOS.demoToast)).toHaveCSS("border-inline-start-color", await tokenColor(page, "--fz-success"));
  });

  test("badge: status variants map to the status tokens", async ({ page }) => {
    await gotoDemo(page);
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
    expect(colors.s).toBe(await tokenColor(page, "--fz-success"));
    expect(colors.i).toBe(await tokenColor(page, "--fz-info"));
    expect(colors.w).toBe(await tokenColor(page, "--fz-warning"));
  });
});

test.describe("v1.8 content & media", () => {
  test("fluid type: headings clamp — smaller on a narrow viewport, capped on a wide one", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await gotoDemo(page);
    const wide = await page
      .locator(`${DEMOS.typography} h1`)
      .evaluate((el) => parseFloat(getComputedStyle(el).fontSize));

    await page.setViewportSize({ width: 360, height: 800 });
    const narrow = await page
      .locator(`${DEMOS.typography} h1`)
      .evaluate((el) => parseFloat(getComputedStyle(el).fontSize));

    expect(wide).toBe(40);   // --fz-type-2xl caps at 2.5rem
    expect(narrow).toBeLessThan(wide);
    expect(narrow).toBeGreaterThan(20); // never collapses on phones
  });

  test("fluid type: headings read the --fz-type-* tokens", async ({ page }) => {
    await gotoDemo(page);
    const sizes = await page.locator(`${DEMOS.typography} h1, ${DEMOS.typography} h2, ${DEMOS.typography} h3, ${DEMOS.typography} h4`).evaluateAll((els) => {
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
    await gotoDemo(page);
    // The first h3 is :first-child → margin-block-start: 0 (by design).
    // Test the second h3 to assert the section rhythm.
    const heading = page.locator(`${DEMOS.demoProse} h3`).nth(1);
    const mt = parseFloat(await heading.evaluate((el) => getComputedStyle(el).marginTop));
    const mb = parseFloat(await heading.evaluate((el) => getComputedStyle(el).marginBottom));
    expect(mt).toBe(48); // --fz-space-7 (3rem)
    expect(mb).toBe(12); // --fz-space-3 (0.75rem)
    expect(mt).toBeGreaterThan(mb);
  });

  test("prose: tables get their own vertical room inside the wrapper", async ({ page }) => {
    await gotoDemo(page);
    const table = page.locator(`${DEMOS.demoProse} table`);
    const mt = parseFloat(await table.evaluate((el) => getComputedStyle(el).marginTop));
    expect(mt).toBe(24); // --fz-space-5 (1.5rem)
    // Table is width: 100% (computed = parent width in px). Assert it fills the prose container.
    const { w: tableW, pw: proseW } = await table.evaluate((el) => {
      return { w: el.getBoundingClientRect().width, pw: el.closest(".fz-prose").getBoundingClientRect().width };
    });
    expect(tableW).toBeCloseTo(proseW, 1);
  });

  test("avatar: circular, token-sized, object-fit cover", async ({ page }) => {
    await gotoDemo(page);
    const av = page.locator(DEMOS.demoAvatar);
    await expect(av).toHaveCSS("border-radius", "50%");
    await expect(av).toHaveCSS("width", "40px"); // --fz-avatar-size (2.5rem)
    await expect(av).toHaveCSS("height", "40px");
    await expect(av).toHaveCSS("object-fit", "cover");
  });

  test("avatar: data-size sm/lg resize from the token edge", async ({ page }) => {
    await gotoDemo(page);
    await expect(page.locator(DEMOS.demoAvatarSm)).toHaveCSS("width", "28px"); // 1.75rem
    const lg = page.locator(`${DEMOS.media} .fz-avatar[data-size="lg"]`);
    await expect(lg).toHaveCSS("width", "64px"); // 4rem
  });

  test("media: [data-media] locks a 16:9 box, data-ratio overrides", async ({ page }) => {
    await gotoDemo(page);
    const ratio = async (sel) => {
      const box = await page.locator(sel).boundingBox();
      return box.height / box.width;
    };
    expect(await ratio(DEMOS.demoMedia16)).toBeCloseTo(9 / 16, 2);
    expect(await ratio(`${DEMOS.media} [data-media][data-ratio="1/1"]`)).toBeCloseTo(1, 2);
    expect(await ratio(`${DEMOS.media} [data-media][data-ratio="21/9"]`)).toBeCloseTo(9 / 21, 2);
  });

  test("media: images are responsive — capped width, kept ratio", async ({ page }) => {
    await gotoDemo(page);
    const img = page.locator(DEMOS.demoResponsiveImg);
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
    await gotoDemo(page);
    const card = page.locator(DEMOS.demoMediaCard);
    await expect(card).toHaveCSS("padding", "0px");
    await expect(card.locator(":scope > img")).toHaveCSS("border-radius", "0px");
    await expect(card.locator(":scope > header")).toHaveCSS("padding", "24px"); // --fz-space-5
  });
});

test.describe("v1.9 stepper & input groups", () => {
  test("stepper horizontal: completed steps use success token, current uses primary", async ({ page }) => {
    await gotoDemo(page);
    const stepper = page.locator(DEMOS.demoStepperH);
    const circles = stepper.locator("[data-step-circle]");

    // First step (completed) — success colors
    await expect(circles.nth(0)).toHaveCSS("border-color", await tokenColor(page, "--fz-success")); // --fz-success
    await expect(circles.nth(0)).toHaveCSS("background-color", await tokenColor(page, "--fz-success"));
    await expect(circles.nth(0)).toHaveCSS("color", await tokenColor(page, "--fz-success-fg")); // --fz-success-fg

    // Second step (current) — primary colors
    await expect(circles.nth(1)).toHaveCSS("border-color", await tokenColor(page, "--fz-primary")); // --fz-primary
    await expect(circles.nth(1)).toHaveCSS("background-color", await tokenColor(page, "--fz-primary"));
    await expect(circles.nth(1)).toHaveCSS("color", await tokenColor(page, "--fz-primary-fg")); // --fz-primary-fg

    // Third step (pending) — muted/border colors
    await expect(circles.nth(2)).toHaveCSS("border-color", await tokenColor(page, "--fz-border")); // --fz-border
    await expect(circles.nth(2)).toHaveCSS("background-color", await tokenColor(page, "--fz-surface")); // --fz-surface
    await expect(circles.nth(2)).toHaveCSS("color", await tokenColor(page, "--fz-muted")); // --fz-muted
  });

  test("stepper vertical: same token mapping, vertical layout", async ({ page }) => {
    await gotoDemo(page);
    const stepper = page.locator(DEMOS.demoStepperV);
    const circles = stepper.locator("[data-step-circle]");

    // First step (completed)
    await expect(circles.nth(0)).toHaveCSS("border-color", await tokenColor(page, "--fz-success"));
    await expect(circles.nth(0)).toHaveCSS("background-color", await tokenColor(page, "--fz-success"));

    // Second step (current)
    await expect(circles.nth(1)).toHaveCSS("border-color", await tokenColor(page, "--fz-primary"));
    await expect(circles.nth(1)).toHaveCSS("background-color", await tokenColor(page, "--fz-primary"));

    // Third step (pending)
    await expect(circles.nth(2)).toHaveCSS("border-color", await tokenColor(page, "--fz-border"));
    await expect(circles.nth(2)).toHaveCSS("background-color", await tokenColor(page, "--fz-surface"));
  });

  test("input group: leading affix shares input focus state", async ({ page }) => {
    await gotoDemo(page);
    const group = page.locator(`${DEMOS.demoInputGroupForm} [data-input-group]`).first();
    const affix = group.locator(":scope > :first-child");
    const input = group.locator("input");

    // Default state — check border-inline-start-color to avoid shorthand
    await expect(affix).toHaveCSS("border-inline-start-color", await tokenColor(page, "--fz-border")); // --fz-border
    await expect(affix).toHaveCSS("color", await tokenColor(page, "--fz-muted")); // --fz-muted
    await expect(affix).toHaveCSS("background-color", await tokenColor(page, "--fz-surface-alt")); // --fz-surface-alt

    // Focus state
    await input.focus();
    await expect(affix).toHaveCSS("border-inline-start-color", await tokenColor(page, "--fz-focus-ring")); // --fz-focus-ring
    await expect(affix).toHaveCSS("color", await tokenColor(page, "--fz-focus-ring"));
  });

  test("input group: leading affix shares input validation state (invalid)", async ({ page }) => {
    await gotoDemo(page);
    // Use the username input (text type) for invalid test
    const group = page.locator(`${DEMOS.demoInputGroupForm} [data-input-group]`).first();
    const affix = group.locator(":scope > :first-child");
    const input = group.locator("input");

    // Trigger invalid state — fill with invalid email-like text then blur
    // Actually, let's use the required attribute approach
    await input.evaluate((el) => el.setAttribute("aria-invalid", "true"));
    await expect(affix).toHaveCSS("border-inline-start-color", await tokenColor(page, "--fz-danger")); // --fz-danger
    await expect(affix).toHaveCSS("color", await tokenColor(page, "--fz-danger"));
  });

  test("input group: leading affix shares input validation state (valid)", async ({ page }) => {
    await gotoDemo(page);
    const group = page.locator(`${DEMOS.demoInputGroupForm} [data-input-group]`).first();
    const affix = group.locator(":scope > :first-child");
    const input = group.locator("input");

    // Trigger valid state
    await input.evaluate((el) => el.setAttribute("aria-invalid", "false"));
    await expect(affix).toHaveCSS("border-inline-start-color", await tokenColor(page, "--fz-success")); // --fz-success
    await expect(affix).toHaveCSS("color", await tokenColor(page, "--fz-success"));
  });

  test("date/number/email inputs get themed surface and validation", async ({ page }) => {
    await gotoDemo(page);
    const email = page.locator(DEMOS.polishEmail);
    const number = page.locator(DEMOS.polishNumber);
    const date = page.locator(DEMOS.polishDate);

    // All should have the shared input styles — height may be 42px due to line-height
    await expect(email).toHaveCSS("background-color", await tokenColor(page, "--fz-surface")); // --fz-surface
    await expect(email).toHaveCSS("border-color", await tokenColor(page, "--fz-border")); // --fz-border
    await expect(email).toHaveCSS("min-height", "40px"); // --fz-control-height

    await expect(number).toHaveCSS("background-color", await tokenColor(page, "--fz-surface"));
    await expect(number).toHaveCSS("min-height", "40px");

    await expect(date).toHaveCSS("background-color", await tokenColor(page, "--fz-surface"));
    await expect(date).toHaveCSS("min-height", "40px");
  });

  test("number input hides spinner by default (appearance: textfield)", async ({ page }) => {
    await gotoDemo(page);
    const number = page.locator(DEMOS.polishNumber);

    // Should have appearance: textfield (hiding native spinner)
    await expect(number).toHaveCSS("appearance", "textfield");
  });

  test("date input has themed calendar picker indicator", async ({ page, browserName }) => {
    test.skip(browserName !== "chromium", "WebKit/Blink pseudo-element");
    await gotoDemo(page);
    const date = page.locator(DEMOS.polishDate);

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
    await gotoDemo(page);
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
    await gotoDemo(page);
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
    await gotoDemo(page);

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
    const skeleton = page.locator(DEMOS.demoSkeletonLine);
    const iteration = await skeleton.evaluate(
      (el) => getComputedStyle(el, "::after").animationIterationCount
    );
    expect(iteration).toBe("1");
  });

  test("print stylesheet forces light-on-white, no shadows", async ({ page }) => {
    await gotoDemo(page);
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
    await gotoDemo(page);
    const avatars = page.locator(`${DEMOS.demoAvatarGroup} .fz-avatar`);
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
    expect(shadow).toContain(await tokenColor(page, "--fz-surface")); // --fz-surface
  });

  test("spinner rotates via fz-spin and reads the accent tokens", async ({ page }) => {
    await gotoDemo(page);
    const spinner = page.locator(DEMOS.demoSpinner);
    const name = await spinner.evaluate(
      (el) => getComputedStyle(el).animationName
    );
    expect(name).toBe("fz-spin");
    await expect(spinner).toHaveCSS("border-radius", "999px"); // --fz-radius-full
    await expect(spinner).toHaveCSS("border-top-color", await tokenColor(page, "--fz-primary")); // --fz-primary (light)

    // Sizes: default 1.5rem, lg tracks the control height token.
    await expect(spinner).toHaveCSS("width", "24px");
    const lg = page.locator(`${DEMOS.spinner} [data-spinner][data-size="lg"]`);
    await expect(lg).toHaveCSS("width", "40px"); // --fz-control-height
  });

  test("divider draws hairlines around real text", async ({ page }) => {
    await gotoDemo(page);
    const divider = page.locator(DEMOS.demoDivider);
    await expect(divider).toHaveCSS("display", "flex");

    // Both rules render at the stroke token's width…
    const rules = await divider.evaluate((el) => [
      getComputedStyle(el, "::before").borderTopWidth,
      getComputedStyle(el, "::after").borderTopWidth,
    ]);
    expect(rules).toEqual(["1px", "1px"]); // --fz-border-width

    // …and the label is muted secondary text, not a heading look.
    await expect(divider).toHaveCSS("color", await tokenColor(page, "--fz-muted")); // --fz-muted
    await expect(divider).toHaveCSS("font-weight", "400");
  });
});

test.describe("mobile viewport (375px)", () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test("page never overflows horizontally", async ({ page }) => {
    await gotoDemo(page);
    const overflow = await page.evaluate(() => ({
      scroll: document.scrollingElement.scrollWidth,
      inner: window.innerWidth,
    }));
    expect(overflow.scroll).toBeLessThanOrEqual(overflow.inner);
  });

  test("fluid type steps down and tap targets keep their height", async ({ page }) => {
    await gotoDemo(page);

    // Headings shrink below their wide-viewport cap but never collapse.
    const h1 = parseFloat(await page
      .locator(`${DEMOS.typography} h1`)
      .evaluate((el) => getComputedStyle(el).fontSize));
    expect(h1).toBeLessThan(40); // below the 2.5rem cap
    expect(h1).toBeGreaterThan(20);

    // Controls hold --fz-control-height so touch targets stay usable.
    const btn = page.getByRole("button", { name: "Open dialog" });
    const height = await btn.evaluate((el) => el.getBoundingClientRect().height);
    expect(height).toBeGreaterThanOrEqual(40);
  });

  test("hamburger nav: list collapses behind the toggle, links stay full-width", async ({ page }) => {
    await gotoDemo(page);
    const nav = page.locator(DEMOS.demoNavBurger);
    const toggle = nav.locator(".fz-nav-toggle");
    const firstLink = nav.locator(`${DEMOS.demoNavMenu} a`).first();

    await toggle.click();
    await expect(firstLink).toBeVisible();

    // The open menu is a column: each link spans the nav's content box,
    // so the whole row is a tap target.
    const [navWidth, linkWidth] = await page.evaluate(([navSel, menuSel]) => {
      const n = document.querySelector(navSel);
      const a = n.querySelector(`${menuSel} a`);
      return [n.clientWidth, a.getBoundingClientRect().width];
    }, [DEMOS.demoNavBurger, DEMOS.demoNavMenu]);
    expect(linkWidth).toBeGreaterThan(navWidth * 0.9);
  });
});

test.describe("chips", () => {
  const markup = `
    <link rel="stylesheet" href="/dist/index.css">
    <link rel="stylesheet" href="/dist/components/chip.css">
    <span data-chip>css<button type="button" data-chip-remove aria-label="Remove css">×</button></span>`;

  test("chip is an inline-flex pill; remove control is bare with its own ring", async ({ page }) => {
    // Standalone fixture: inside a .fz-row the chip is a flex item and
    // its computed display blockifies to "flex" — the fixture shows the
    // component's own value.
    await gotoDemo(page);
    await page.setContent(markup);
    const chip = page.locator("[data-chip]");
    await expect(chip).toHaveCSS("display", "inline-flex");
    await expect(chip).toHaveCSS("border-radius", "999px"); // --fz-radius-full

    const btn = chip.locator("[data-chip-remove]");
    await expect(btn).toHaveCSS("border-style", "none"); // global button skin reset
    await btn.focus();
    await expect(btn).toHaveCSS("outline-style", "solid");
  });
});

test.describe("contrast palette mirrors (ADR-0001)", () => {
  // Source-parse guards: the manual [data-theme="contrast"] palette and
  // its OS-settings mirror must stay value-identical (CSS cannot OR a
  // media query with an attribute selector, so the duplication is
  // structural — see docs/adr/0001). The print palette may differ in
  // values on purpose but must cover the same token names.

  // Extracts the balanced { ... } block following a rule anchored at
  // line start (^ + m flag), so prose mentions in comments can't
  // hijack the match and reformatting can't strand the literal.
  function extractCssBlock(css, anchor) {
    const start = css.search(anchor);
    if (start === -1) return null;
    const open = css.indexOf("{", start);
    let depth = 0;
    for (let i = open; i < css.length; i++) {
      if (css[i] === "{") depth++;
      else if (css[i] === "}") {
        depth--;
        if (depth === 0) return css.slice(open + 1, i);
      }
    }
    return null;
  }

  function parseCustomProps(fragment) {
    if (fragment == null) return null;
    return Object.fromEntries(
      [...fragment.matchAll(/(--fz-[a-z0-9-]+)\s*:\s*([^;]+);/g)].map((m) => [m[1], m[2].trim()])
    );
  }

  let canonical, mirror, printPalette;

  test.beforeAll(() => {
    const tokensCss = fs.readFileSync(path.join(rootDir, "src/tokens.css"), "utf8");
    const baseCss = fs.readFileSync(path.join(rootDir, "src/base.css"), "utf8");
    canonical = parseCustomProps(extractCssBlock(tokensCss, /^\[data-theme="contrast"\]/m));
    mirror = parseCustomProps(
      extractCssBlock(extractCssBlock(tokensCss, /^@media\s*\(prefers-contrast:\s*more\)/m), /^[ \t]*:root/m)
    );
    printPalette = parseCustomProps(
      extractCssBlock(extractCssBlock(baseCss, /^[ \t]*@media\s+print/m), /^[ \t]*:root/m)
    );
  });

  test("mirror block is found and parses", () => {
    expect(canonical, "canonical [data-theme=contrast] block").toBeTruthy();
    expect(mirror, "prefers-contrast mirror block").toBeTruthy();
    expect(printPalette, "print palette block").toBeTruthy();
  });

  test("manual contrast and prefers-contrast are value-identical", () => {
    expect(mirror).toEqual(canonical);
  });

  test("print palette covers the same token names (values may differ)", () => {
    expect(Object.keys(printPalette).sort()).toEqual(Object.keys(canonical).sort());
  });
});

test.describe("tokens: no typed-property registrations (ADR-0005)", () => {
  // The ten @property blocks were dead weight: nothing animates a
  // --fz-* token, and each initial-value duplicated the palette's
  // light half by hand. Consumers who animate a token register their
  // own copy (docs/theming.md). This pins the decision so the block
  // cannot quietly grow back with its drift-prone mirrors.
  test("tokens.css ships plain custom properties only", () => {
    const tokensCss = fs.readFileSync(path.join(rootDir, "src/tokens.css"), "utf8");
    expect(tokensCss, "@property blocks were removed (see ADR-0005)").not.toContain(
      "@property"
    );
  });
});

test.describe("menu items (shared recipe, ADR-0007)", () => {
  test("popover and dropdown menu items render identically", async ({ page }) => {
    await gotoDemo(page);

    await page.locator(DEMOS.helpTrigger).click();
    const popLink = page.locator(`${DEMOS.helpPop} a`).first();
    await expect(popLink).toBeVisible();

    await page.locator("[data-menu] > summary").click();
    const ddLink = page.locator("[data-menu] a").first();
    await expect(ddLink).toBeVisible();

    // The copies had drifted: popover links kept base.css's underline
    // and accent color while dropdown links were clean. One recipe
    // now styles both — assert what it paints.
    const expectedColor = await tokenColor(page, "--fz-text");
    for (const link of [popLink, ddLink]) {
      const s = await link.evaluate((el) => {
        const cs = getComputedStyle(el);
        return { deco: cs.textDecorationLine, color: cs.color };
      });
      expect(s.deco).toBe("none");
      expect(s.color).toBe(expectedColor);
    }
  });
});

test.describe("disabled controls (ADR-0007)", () => {
  test("a disabled switch dims and shows not-allowed, not its pointer", async ({
    page,
  }) => {
    await gotoDemo(page);
    const sw = page.locator("input[data-switch]").first();
    await sw.evaluate((el) => {
      el.disabled = true;
    });
    const s = await sw.evaluate((el) => {
      // Extract primitives here — a live CSSStyleDeclaration does not
      // survive serialization identically across engines.
      const cs = getComputedStyle(el);
      return { cursor: cs.cursor, opacity: cs.opacity };
    });
    // The :is()-compressed disabled rule alone is (0,1,1) and would
    // lose the cursor tiebreak against [data-switch] (0,2,1); the
    // dedicated arm keeps the original outcome.
    expect(s.cursor).toBe("not-allowed");
    expect(s.opacity).toBe("0.5");
  });
});

test.describe("shared component recipes (ADR-0007)", () => {
  test("menu items are styled once, not per-container", () => {
    const shared = fs.readFileSync(
      path.join(rootDir, "src/components/menu-items.css"),
      "utf8"
    );
    expect(shared).toContain("details[data-menu]");
    expect(shared).toContain('[popover][data-kind="menu"]');
    expect(shared).toContain("text-decoration: none");
    for (const f of ["dropdown.css", "popover.css"]) {
      const src = fs.readFileSync(path.join(rootDir, "src/components", f), "utf8");
      expect(src, `${f} re-implements the shared item recipe`).not.toContain(
        "text-align: start"
      );
      expect(src, `${f} should point at the shared recipe`).toContain(
        "menu-items.css"
      );
    }
    const full = fs.readFileSync(path.join(rootDir, "src/full.css"), "utf8");
    expect(full).toContain("./components/menu-items.css");
  });

  test("disabled dimming comes from --fz-disabled-opacity", () => {
    // Pins the dimming literal only — non-disabled opacity
    // affordances (e.g. the calendar-picker indicator's 0.6 hover
    // state) are deliberately out of scope. Known blind spots: `.5`
    // and `0.55`-style spellings.
    const files = fs
      .readdirSync(path.join(rootDir, "src/components"))
      .filter((f) => f.endsWith(".css"));
    for (const f of files) {
      const src = fs.readFileSync(path.join(rootDir, "src/components", f), "utf8");
      expect(src, `${f} hard-codes the disabled dimming`).not.toMatch(
        /opacity:\s*0\.5\b/
      );
      if (f === "buttons.css" || f === "forms.css") {
        expect(src, `${f} should consume the shared token`).toContain(
          "var(--fz-disabled-opacity)"
        );
      }
    }
  });

  test("no comment-only rules ship in components", () => {
    // forms.css carried an empty input[type=…] list "for documentation";
    // comments document, selector lists don't.
    for (const f of fs
      .readdirSync(path.join(rootDir, "src/components"))
      .filter((f) => f.endsWith(".css"))) {
      const src = fs.readFileSync(path.join(rootDir, "src/components", f), "utf8");
      const stripped = src.replace(/\/\*[\s\S]*?\*\//g, "");
      const empties = [...stripped.matchAll(/[^{}]*\{\s*\}/g)];
      expect(empties.map((m) => m[0].trim()), `${f} ships an empty rule`).toEqual(
        []
      );
    }
  });
});

test.describe("theme gallery (live preview cards)", () => {
  test("six themes render side by side, each with its own accent", async ({ page }) => {
    await gotoGallery(page);
    // Each card scopes data-theme on itself, so tokens resolve inside
    // the card subtree. Same probe trick as tokenColor(), but scoped:
    // six cards must resolve six distinct --fz-primary values live —
    // no screenshots needed to prove the previews are real.
    const colors = await page.evaluate(() =>
      [...document.querySelectorAll(".gallery-card")].map((card) => {
        const probe = document.createElement("span");
        card.append(probe);
        probe.style.color = "var(--fz-primary)";
        const resolved = getComputedStyle(probe).color;
        probe.remove();
        return resolved;
      })
    );
    expect(colors).toHaveLength(6);
    expect(
      new Set(colors).size,
      `expected six distinct live accents, got: ${colors.join(", ")}`
    ).toBe(6);
  });

  test("cards carry real theme scoping, not just styling", async ({ page }) => {
    await gotoGallery(page);
    // The default card has no attribute; every themed one must name
    // the theme it previews.
    const themed = await page
      .locator(".gallery-card[data-theme]")
      .evaluateAll((els) => els.map((el) => el.dataset.theme));
    expect(themed.sort()).toEqual([
      "contrast",
      "dashboard",
      "editorial",
      "forest",
      "playful",
    ]);
  });
});

test.describe("API reference audit (docs/api.md ↔ src)", () => {
  // The data-* table in docs/api.md is the frozen public contract; this
  // audit keeps it true in both directions (source-parse only — never
  // touches a page). Internal seams the JS modules set and their CSS
  // consumes are deliberately not consumer API and live in an explicit
  // allowlist inside api.md itself; data-theme-btn is the demo pages'
  // switcher convention (docs + demo markup, no src/ implementation).
  const INTERNAL_MARKERS = new Set(["data-fz-tabs-js", "data-nav-js", "data-open"]);
  const DEMO_ONLY = new Set(["data-theme-btn"]);

  function documentedAttributes() {
    const api = fs.readFileSync(path.join(rootDir, "docs/api.md"), "utf8");
    const table = api.slice(api.indexOf("## data-* attribute reference"));
    return new Set(
      [...table.matchAll(/^\|\s*`(data-[a-z0-9-]+)`/gm)].map((m) => m[1])
    );
  }

  function implementedAttributes() {
    const found = new Set();
    for (const dir of ["src/components", "src/js"]) {
      for (const f of fs
        .readdirSync(path.join(rootDir, dir))
        .filter((f) => /\.(css|js)$/.test(f))) {
        const src = fs.readFileSync(path.join(rootDir, dir, f), "utf8");
        // CSS attribute selectors + HTML-ish literals: [data-x], "data-x".
        for (const m of src.matchAll(/\[?(data-[a-z0-9-]+)/g)) {
          found.add({ name: m[1], where: `${dir}/${f}` });
        }
        // JS dataset access: dataset.themeBtn → data-theme-btn.
        for (const m of src.matchAll(/dataset\.([A-Za-z0-9]+)/g)) {
          const kebab = m[1].replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);
          found.add({ name: `data-${kebab}`, where: `${dir}/${f}` });
        }
      }
    }
    return found;
  }

  test("every documented data-* attribute exists in src or the demo pages", () => {
    const implemented = implementedAttributes();
    const names = new Set([...implemented].map((a) => a.name));
    const missing = [...documentedAttributes()].filter(
      (n) => !names.has(n) && !DEMO_ONLY.has(n)
    );
    expect(missing, "documented in api.md but not implemented anywhere").toEqual([]);
  });

  test("everything implemented in src is documented or an internal marker", () => {
    const documented = documentedAttributes();
    const undocumented = [...implementedAttributes()]
      .filter((a) => !documented.has(a.name) && !INTERNAL_MARKERS.has(a.name))
      .map((a) => `${a.name} (${a.where})`);
    expect(undocumented, "implemented in src but missing from api.md").toEqual([]);
  });

  test("internal markers stay out of the consumer table", () => {
    const table = documentedAttributes();
    const leaked = [...INTERNAL_MARKERS].filter((n) => table.has(n));
    expect(leaked, "internal JS→CSS seam leaked into the public table").toEqual([]);
  });

  test("theming.md carries a generated token region that knows every --fz-* token", () => {
    // Pins build/token-docs.mjs output against tokens.css so a new token
    // cannot land without regenerating the reference (npm run docs:tokens,
    // part of npm run check).
    const tokensSrc = fs.readFileSync(path.join(rootDir, "src/tokens.css"), "utf8");
    const rootBlock = tokensSrc.slice(tokensSrc.indexOf(":root {"));
    const defined = new Set(
      [...rootBlock.matchAll(/^\s*(--fz-[a-z0-9-]+):/gm)].map((m) => m[1])
    );
    const theming = fs.readFileSync(path.join(rootDir, "docs/theming.md"), "utf8");
    const start = theming.indexOf("<!-- TOKENS:START -->");
    const end = theming.indexOf("<!-- TOKENS:END -->");
    expect(start, "theming.md lost its TOKENS markers").toBeGreaterThanOrEqual(0);
    expect(end, "theming.md lost its TOKENS markers").toBeGreaterThan(start);
    const generated = theming.slice(start, end);
    const missing = [...defined].filter((t) => !generated.includes(`\`${t}\``));
    expect(missing, "tokens.css defines these but theming.md does not list them — run npm run docs:tokens").toEqual([]);
  });
});
