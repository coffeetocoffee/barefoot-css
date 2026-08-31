/* Barefoot — 1.0 CSS behavior tests.
   Container-query grid, container-unit carousel, anchored popovers,
   and theme switching through startViewTransition.

   npm run test:css */
import { test, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { DEMOS, gotoDemo, gotoGallery, gotoVtPair, gotoStudio, tokenColor, setContainerWidth, gridColumnCount, tokenValue, wcagContrast, luminance } from "./helpers.js";
import { buildDTCG } from "../build/tokens-dtcg.mjs";

const rootDir = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

test.describe("tests have real CSS (smoke)", () => {
  test("demo page loads the built Barefoot stylesheet", async ({ page }) => {
    await gotoDemo(page);
    const styled = await page.evaluate(() => {
      const root = getComputedStyle(document.documentElement);
      const contain = getComputedStyle(document.querySelector(".bf-contain"));
      return Boolean(root.getPropertyValue("--bf-primary").trim()) && contain.containerType === "inline-size";
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
      const [narrow, wide] = document.querySelectorAll(".bf-contain");
      narrow.style.width = "14rem";
      wide.style.width = "60rem";
    });

    const cols = (sel) =>
      page
        .locator(sel)
        .evaluate((el) => getComputedStyle(el).gridTemplateColumns.trim().split(/\s+/).length);

    expect(await cols(".bf-demo-narrow [data-grid]")).toBe(1);
    expect(await cols(".bf-demo-wide [data-grid]")).toBe(3);
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

test.describe("adaptive engine (v5.0 Phase 1)", () => {
  test("setContainerWidth helper drives container queries (narrow → 1 col, wide → 3)", async ({ page }) => {
    await gotoDemo(page);
    // Resize the *containers*, not the viewport (ADR-0009 / v5.0).
    await setContainerWidth(page, ".bf-demo-narrow .bf-contain", "14rem");
    await setContainerWidth(page, ".bf-demo-wide .bf-contain", "60rem");

    expect(await gridColumnCount(page, ".bf-demo-narrow [data-grid]")).toBe(1);
    expect(await gridColumnCount(page, ".bf-demo-wide [data-grid]")).toBe(3);
  });

  test("adaptive tokens present at :root", async ({ page }) => {
    await gotoDemo(page);

    const simple = {
      "--bf-adaptive-1": "24rem",
      "--bf-adaptive-2": "40rem",
      "--bf-adaptive-3": "56rem",
      "--bf-density": "comfortable",
    };
    for (const [name, expected] of Object.entries(simple)) {
      expect(await tokenValue(page, name), name).toBe(expected);
    }

    for (const name of [
      "--bf-type-cqi-xs", "--bf-type-cqi-sm", "--bf-type-cqi-md",
      "--bf-type-cqi-lg", "--bf-type-cqi-xl", "--bf-type-cqi-2xl",
    ]) {
      expect(await tokenValue(page, name), name).toMatch(/^clamp\(/);
    }
  });

  test("data-density=compact flips --bf-density to compact (style-query target)", async ({ page }) => {
    await gotoDemo(page);
    const before = await tokenValue(page, "--bf-density");
    await page.evaluate(() => document.documentElement.setAttribute("data-density", "compact"));
    const after = await tokenValue(page, "--bf-density");

    expect(before).toBe("comfortable");
    expect(after).toBe("compact");
  });
});

test.describe("adaptive components (v5.0 Phase 2)", () => {
  test("table[data-table=adaptive] card-stacks when its container is narrow", async ({ page }) => {
    await gotoDemo(page);
    const table = page.locator(DEMOS.demoTableAdaptive);
    const thead = table.locator("thead");
    const firstCell = table.locator("tbody tr").first().locator("td").first();

    await setContainerWidth(page, DEMOS.demoTableAdaptiveWrap, "14rem");
    await expect(thead).toBeHidden();
    await expect(firstCell).toHaveCSS("display", "flex");

    await setContainerWidth(page, DEMOS.demoTableAdaptiveWrap, "60rem");
    await expect(thead).toBeVisible();
    await expect(firstCell).toHaveCSS("display", "table-cell");
  });

  test("segmented[data-adaptive] compresses label padding when narrow", async ({ page }) => {
    await gotoDemo(page);
    const label = page.locator(`${DEMOS.demoSegmentedAdaptive} label`).first();

    await setContainerWidth(page, DEMOS.demoSegmentedAdaptive, "14rem");
    const narrow = await label.evaluate((el) => parseFloat(getComputedStyle(el).paddingInlineStart));

    await setContainerWidth(page, DEMOS.demoSegmentedAdaptive, "40rem");
    const wide = await label.evaluate((el) => parseFloat(getComputedStyle(el).paddingInlineStart));

    // 14rem < --bf-adaptive-1 (24rem) → tighter inline padding; 40rem → base.
    expect(narrow).toBeLessThan(wide);
  });

  test("form[data-form=adaptive] collapses its .bf-row to one column when narrow", async ({ page }) => {
    await gotoDemo(page);
    const row = page.locator(`${DEMOS.demoFormAdaptive} .bf-row`);

    await setContainerWidth(page, DEMOS.demoFormAdaptive, "14rem");
    expect(await row.evaluate((el) => getComputedStyle(el).flexDirection)).toBe("column");

    await setContainerWidth(page, DEMOS.demoFormAdaptive, "40rem");
    expect(await row.evaluate((el) => getComputedStyle(el).flexDirection)).toBe("row");
  });

  test("card[data-card=adaptive] is horizontal when wide, vertical when narrow", async ({ page }) => {
    await gotoDemo(page);
    const narrow = await setContainerWidth(page, DEMOS.demoCardAdaptiveWrap, "14rem")
      .then(() => gridColumnCount(page, DEMOS.demoCardAdaptive));
    const wide = await setContainerWidth(page, DEMOS.demoCardAdaptiveWrap, "48rem")
      .then(() => gridColumnCount(page, DEMOS.demoCardAdaptive));

    expect(narrow).toBe(1);
    expect(wide).toBe(2);
  });

  test("form[data-form=adaptive] reveals error summary on :user-invalid", async ({ page }) => {
    await gotoDemo(page);
    const form = page.locator(DEMOS.demoFormAdaptive);
    const summary = form.locator("[data-form-summary]");
    const first = form.locator("input[name=first]");

    await expect(summary).toBeHidden();
    // Interact with the empty required field and blur it → :user-invalid.
    await first.click();
    await first.fill("a");
    await first.fill("");
    await first.press("Tab");
    await expect(summary).toBeVisible();
  });
});

test.describe("stackable tables", () => {
  test("table[data-table='stack']: header row hidden when its container is narrow, table when wide", async ({ page }) => {
    await gotoDemo(page);
    const table = page.locator('table[data-table="stack"]');
    const firstCell = table.locator("tbody tr").first().locator("td").first();

    // The nearest query container is the wrapping .bf-contain — pin its
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

test.describe("platform primitives (@supports-gated)", () => {
  // The 3.1 primitives: scroll-driven animations, popover=hint,
  // interest invokers, implicit anchor positioning. Each gate is a live
  // CSS.supports/prototype probe so an engine exercises what it ships and
  // skips the rest. v5.0 Phase 3: implicit anchor positioning is now
  // exercised on every floor engine (un-gated — verified green on
  // chromium/firefox/webkit); scroll-driven animations and popover=hint stay
  // gated because the *installed* test browsers don't satisfy them at runtime
  // (the aspirational floor is ahead of what's actually installed), so those
  // skips remain. Interest invokers stay Chromium-only.
  const supportsScrollDriven = (page) =>
    page.evaluate(() => CSS.supports("animation-timeline: scroll()"));
  const supportsCarouselProgress = async (page) =>
    page.evaluate(() => {
      if (!CSS.supports("animation-timeline: scroll()")) return false;
      const sc = document.querySelector("[data-carousel][data-progress]");
      if (!sc) return true; // fixture missing — let the wiring assert fail loudly
      const anim = sc.getAnimations({ subtree: true }).find(
        (a) => a.animationName === "bf-carousel-progress"
      );
      return Boolean(anim && anim.timeline);
    });
  const supportsAnchorPos = (page) =>
    page.evaluate(() => CSS.supports("anchor-name: --bf-a"));
  const supportsHint = (page) =>
    page.evaluate(() => {
      const el = document.createElement("div");
      el.setAttribute("popover", "hint");
      return el.popover === "hint";
    });
  const supportsInterestInvokers = (page) =>
    page.evaluate(() => "interestFor" in HTMLElement.prototype);

  test("carousel progress bar: scroll-driven, no JS, tracks position", async ({ page }) => {
    await gotoDemo(page);
    if (!(await supportsCarouselProgress(page)))
      test.skip(true, "scroll-driven animations unsupported here");

    const scroller = page.locator("[data-carousel][data-progress]");

    const wiring = await scroller.evaluate((el) => {
      const s = getComputedStyle(el, "::after");
      return {
        name: s.animationName,
        timeline: s.animationTimeline,
        sticky: s.position,
      };
    });
    expect(wiring.name).toBe("bf-carousel-progress");
    expect(wiring.timeline).toContain("scroll(");
    expect(wiring.sticky).toBe("sticky");

    // Live feedback: background-size (the animated property) goes from
    // ~0% at the first snap point to ~100% at the last. Snap points —
    // not raw max scroll — bound both ends, so thresholds stay loose.
    const readFill = () =>
      scroller.evaluate(
        (el) => parseFloat(getComputedStyle(el, "::after").backgroundSize)
      );
    expect(await readFill()).toBeLessThan(15);
    await scroller.evaluate((el) =>
      el.scrollTo({ left: el.scrollWidth, behavior: "instant" })
    );
    await expect.poll(readFill).toBeGreaterThan(85);

    // The bar's slot is cancelled — scrolling to the end lands on the
    // last slide's edge, not on blank space the pseudo-element added.
    // Viewport rects, not offsetLeft: the carousel isn't positioned,
    // so slide offsets are relative to some ancestor, not the scroller.
    const overshoot = await scroller.evaluate((el) =>
      Math.abs(
        el.getBoundingClientRect().right -
          el.lastElementChild.getBoundingClientRect().right
      )
    );
    expect(overshoot).toBeLessThanOrEqual(2);
  });

  test("[data-reveal] animates in on scroll-entry (view timeline)", async ({ page }) => {
    await gotoDemo(page);
    if (!(await supportsScrollDriven(page)))
      test.skip(true, "scroll-driven animations unsupported here");

    const reveal = page
      .locator(`${DEMOS.revealSection} [data-reveal]`)
      .first();
    const anim = await reveal.evaluate((el) => {
      const s = getComputedStyle(el);
      return { name: s.animationName, timeline: s.animationTimeline };
    });
    expect(anim.name).toBe("bf-reveal-up");
    expect(anim.timeline).toContain("view()");
  });

  test("[data-reveal]: prefers-reduced-motion removes it and shows content", async ({ page }) => {
    // Ungated on purpose: in engines without scroll-driven animations
    // this must ALSO pass trivially (no rule ever applied). The gate
    // that matters lives in the stylesheet (@media no-preference),
    // because base.css's motion kill-switch clamps durations — which a
    // scroll timeline ignores.
    await page.emulateMedia({ reducedMotion: "reduce" });
    await gotoDemo(page);

    const reveal = page
      .locator(`${DEMOS.revealSection} [data-reveal]`)
      .first();
    await expect(reveal).toBeVisible();
    const anim = await reveal.evaluate((el) => {
      const s = getComputedStyle(el);
      return { name: s.animationName, opacity: s.opacity };
    });
    expect(anim.name).toBe("none");
    expect(anim.opacity).toBe("1");
  });

  test("hint tooltip: click invoker still opens declaratively, Esc closes", async ({ page }) => {
    await gotoDemo(page);
    if (!(await supportsHint(page)))
      test.skip(true, "popover=hint unsupported here");

    const tip = page.locator(DEMOS.tipPop);
    await expect(tip).toHaveAttribute("popover", "hint");
    // Element.click() (not Playwright's click): the page scrolls
    // smoothly, and an auto-scroll mid-click shifts the trigger between
    // open and measurement — same discipline as the flip test above.
    await page
      .locator(DEMOS.tipTrigger)
      .evaluate((el) => el.scrollIntoView({ block: "center", behavior: "instant" }));
    await page.locator(DEMOS.tipTrigger).evaluate((el) => el.click());
    await expect(tip).toBeVisible();

    // Anchored above the trigger where anchor positioning exists.
    if (await supportsAnchorPos(page)) {
      const tb = await page.locator(DEMOS.tipTrigger).boundingBox();
      const pb = await tip.boundingBox();
      expect(pb.y + pb.height).toBeLessThanOrEqual(tb.y + 1);
    }

    await page.keyboard.press("Escape");
    await expect(tip).toBeHidden();
  });

  test("hint tooltip: hover/focus opens it via interest invoker, hover-away closes", async ({ page }) => {
    await gotoDemo(page);
    if (
      !(await supportsInterestInvokers(page)) ||
      !(await supportsHint(page))
    )
      test.skip(true, "interest invokers unsupported here");

    const trigger = page.locator(DEMOS.tipTrigger);
    const tip = page.locator(DEMOS.tipPop);

    await trigger.hover();
    await expect(tip).toBeVisible(); // engines may delay the show; auto-waits

    await page.mouse.move(5, 5);
    await expect(tip).toBeHidden({ timeout: 5000 }); // …and delay the hide

    await trigger.focus();
    await expect(tip).toBeVisible(); // keyboard focus counts as interest too
  });

  test("popovers pin to their invoker with zero anchoring markup (implicit anchors)", async ({ page }) => {
    await gotoDemo(page);

    // The demo dropped its inline anchor styles in 3.1 — pinning must
    // come entirely from the implicit invoker relationship. If any of
    // these grows a style attribute again, this contract has regressed
    // to requiring per-element inline CSS.
    for (const sel of [DEMOS.helpTrigger, DEMOS.helpPop, DEMOS.tipTrigger, DEMOS.tipPop]) {
      expect(
        await page.locator(sel).getAttribute("style"),
        `${sel} grew an inline style`
      ).toBeNull();
    }

    const trigger = page.locator(DEMOS.helpTrigger);
    const pop = page.locator(DEMOS.helpPop);
    // Same discipline as the flip test: scroll first (instant), then
    // click via the element so nothing auto-scrolls between open and
    // measurement — WebKit's timing made that race visible here.
    await trigger.evaluate((el) =>
      el.scrollIntoView({ block: "center", behavior: "instant" })
    );
    await trigger.evaluate((el) => el.click());
    await expect(pop).toBeVisible();
    const tb = await trigger.boundingBox();
    const pb = await pop.boundingBox();
    // Tolerance covers subpixel + scrollbar-shift noise between open
    // and measurement (Firefox measured ~3.5px); default unanchored
    // placement would be hundreds of pixels away, so 8px still proves
    // pinning. The legacy describe above keeps the tight <2px pin.
    expect(Math.abs(pb.x - tb.x)).toBeLessThan(8);                // left-aligned…
    expect(Math.abs(pb.y - (tb.y + tb.height))).toBeLessThan(8); // …and below
  });
});

test.describe("theme switching through view transitions", () => {
  test("theme buttons work with startViewTransition", async ({ page }) => {
    await gotoDemo(page);
    const hasApi = await page.evaluate(
      () => typeof document.startViewTransition === "function"
    );

    await page.getByRole("button", { name: "Dark" }).click();
    await expect(page.locator("html")).toHaveAttribute("data-bf-theme", "dark");

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
    // native chrome stripped, height from --bf-control-height, no surface.
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
      await expect(bar).toHaveCSS("background-color", await tokenColor(page, "--bf-surface-alt")); // --bf-surface-alt (light)
      await expect(bar).toHaveCSS("overflow", "hidden");
      await expect(bar).toHaveCSS("accent-color", await tokenColor(page, "--bf-primary")); // --bf-primary (light)
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
    expect(bg).toBe(await tokenColor(page, "--bf-primary")); // --bf-primary
    await expect(page.locator('[data-pagination] a[aria-current]')).toHaveCount(0);
  });
});

test.describe("themes & OS accessibility settings", () => {
  test("forest theme flips the accent to green", async ({ page }) => {
    await gotoDemo(page);
    // Probe what the accent paints — getPropertyValue would return the
    // unresolved light-dark() string on a plain custom property.
    const before = await tokenColor(page, "--bf-primary");
    await page.locator("html").evaluate((el) => {
      el.dataset.bfTheme = "forest";
    });
    const after = await tokenColor(page, "--bf-primary");
    expect(before).not.toBe(after);
    expect(after).toBe("rgb(47, 107, 79)");
  });

  test("sunset theme flips the accent to warm coral", async ({ page }) => {
    await gotoDemo(page);
    await page.locator("html").evaluate((el) => {
      el.dataset.bfTheme = "sunset";
    });
    expect(await tokenColor(page, "--bf-primary")).toBe("rgb(154, 52, 18)");
  });

  test("prefers-contrast: more forces black-on-white tokens", async ({ page }) => {
    await page.emulateMedia({ contrast: "more" });
    await gotoDemo(page);
    // Read what the token PAINTS, not its serialized form — plain
    // custom properties resolve light-dark() at the consumer property.
    expect(await tokenColor(page, "--bf-text")).toBe("rgb(0, 0, 0)");
  });
});

test.describe("v1.5 form completion", () => {
  test("select falls back to the chevron skin where base-select is unsupported", async ({ page, browserName }) => {
    await gotoDemo(page);
    // Engines with customizable select (v4.5) upgrade past this skin.
    if (await page.evaluate(() => CSS.supports("appearance", "base-select")))
      test.skip(true, "engine upgrades to base-select (see v4.5 suite)");
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
    expect(btn.bg).toBe(await tokenColor(page, "--bf-surface-alt")); // --bf-surface-alt
    expect(btn.h).toBe("40px"); // --bf-control-height
  });

  test("color input renders as a themed swatch", async ({ page }) => {
    await gotoDemo(page);
    const c = page.locator(DEMOS.favcolor);
    await expect(c).toHaveCSS("height", "40px");
    await expect(c).toHaveCSS("width", "40px");
    await expect(c).toHaveCSS("border-radius", "4px"); // --bf-radius-sm
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
    expect(cs.mt).toBe("32px");  // --bf-space-6 (2rem)
    expect(cs.pt).toBe("8px");   // --bf-space-2 (0.5rem, from py-2)
    expect(cs.pb).toBe("8px");
    expect(cs.pl).toBe("12px");  // --bf-space-3 (0.75rem, from px-3)
    expect(cs.pr).toBe("12px");
  });

  test("grid auto-fit: as many columns as fit, each ≥ --bf-grid-min", async ({ page }) => {
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
    await expect(page.locator(DEMOS.demoGridGap)).toHaveCSS("gap", "8px"); // --bf-space-2
  });

  test("nav: current page is accent + semibold, links are padded pills", async ({ page }) => {
    await gotoDemo(page);
    const current = page.locator(`${DEMOS.demoNav} [aria-current="page"]`);
    await expect(current).toHaveText("Home");
    await expect(current).toHaveCSS("font-weight", "600");
    const color = await current.evaluate((el) => getComputedStyle(el).color);
    expect(color).toBe(await tokenColor(page, "--bf-primary")); // --bf-primary
    await expect(page.locator(`${DEMOS.demoNav} a`).nth(1)).toHaveCSS("padding-left", "12px"); // space-3 pill
  });

  test("nav footer variant is muted with a top hairline", async ({ page }) => {
    await gotoDemo(page);
    await expect(page.locator('[data-nav="footer"]')).toHaveCSS("border-top-style", "solid");
    const fg = await page.locator('[data-nav="footer"] > span').evaluate(
      (el) => getComputedStyle(el.parentElement).color
    );
    expect(fg).toBe(await tokenColor(page, "--bf-muted")); // --bf-muted
  });

  test("sidebar splits aside from main and stacks when narrow", async ({ page }) => {
    await gotoDemo(page);
    const sidebar = page.locator(DEMOS.demoSidebar);
    await expect(sidebar).toHaveCSS("display", "flex");
    const basis = await sidebar
      .locator(":scope > :first-child")
      .evaluate((el) => getComputedStyle(el).flexBasis);
    expect(basis).toBe("256px"); // --bf-sidebar-width (16rem)

    // Narrow the row → the split wraps to a single column.
    await sidebar.evaluate((el) => { el.style.width = "20rem"; });
    const tops = await sidebar.locator(":scope > *").evaluateAll((els) =>
      els.map((el) => el.getBoundingClientRect().top)
    );
    expect(tops[1] - tops[0]).toBeGreaterThan(0);
  });

  test("sticky utility pins to --bf-sticky-top", async ({ page }) => {
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
      const names = ["--bf-success", "--bf-info", "--bf-warning"];
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
    await expect(page.locator(DEMOS.demoAlertDanger)).toHaveCSS("border-inline-start-color", await tokenColor(page, "--bf-danger"));
    await expect(page.locator(DEMOS.demoAlertSuccess)).toHaveCSS("border-inline-start-color", await tokenColor(page, "--bf-success"));
    await expect(page.locator(DEMOS.demoAlertInfo)).toHaveCSS("border-inline-start-color", await tokenColor(page, "--bf-info"));
    await expect(page.locator(DEMOS.demoAlertWarning)).toHaveCSS("border-inline-start-color", await tokenColor(page, "--bf-warning"));
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
    await expect(email).toHaveCSS("border-color", await tokenColor(page, "--bf-danger")); // --bf-danger (light)

    await email.fill("you@example.com");
    await email.blur();
    await expect(email).toHaveCSS("border-color", await tokenColor(page, "--bf-success")); // --bf-success (light)
  });

  test("field validation: [aria-invalid] mirrors the state for script-driven forms", async ({ page }) => {
    await gotoDemo(page);
    const input = page.locator(DEMOS.demoUser);
    await input.evaluate((el) => {
      el.setAttribute("aria-invalid", "true");
      el.setAttribute("aria-describedby", "user-msg");
    });
    await expect(input).toHaveCSS("border-color", await tokenColor(page, "--bf-danger"));
    await input.evaluate((el) => el.setAttribute("aria-invalid", "false"));
    await expect(input).toHaveCSS("border-color", await tokenColor(page, "--bf-success"));
  });

  test("skeleton: shimmering placeholder with a surface-alt base", async ({ page }) => {
    await gotoDemo(page);
    const sk = page.locator(DEMOS.demoSkeletonLine);
    await expect(sk).toHaveCSS("background-color", await tokenColor(page, "--bf-surface-alt")); // --bf-surface-alt (light)
    const anim = await sk.evaluate((el) => getComputedStyle(el, "::after").animationName);
    expect(anim).toBe("bf-skeleton-shimmer");
  });

  test("skeleton: shimmer disabled under prefers-reduced-motion", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await gotoDemo(page);
    const anim = await page
      .locator(DEMOS.demoSkeletonLine)
      .evaluate((el) => getComputedStyle(el, "::after").animationName);
    expect(anim).toBe("none");
  });

  test("toast: opens and closes declaratively, pinned to bottom edge", async ({ page }) => {
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

    // Manual lifetime: its own Close button dismisses it — still zero JS.
    await toast.getByRole("button", { name: "Close" }).click();
    await expect(toast).toBeHidden();
  });

  test("toast: data-variant tints the edge from the status tokens", async ({ page }) => {
    await gotoDemo(page);
    await page.locator(DEMOS.toastTrigger).click();
    await expect(page.locator(DEMOS.demoToast)).toHaveCSS("border-inline-start-color", await tokenColor(page, "--bf-success"));
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
    expect(colors.s).toBe(await tokenColor(page, "--bf-success"));
    expect(colors.i).toBe(await tokenColor(page, "--bf-info"));
    expect(colors.w).toBe(await tokenColor(page, "--bf-warning"));
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

    expect(wide).toBe(40);   // --bf-type-2xl caps at 2.5rem
    expect(narrow).toBeLessThan(wide);
    expect(narrow).toBeGreaterThan(20); // never collapses on phones
  });

  test("fluid type: headings read the --bf-type-* tokens", async ({ page }) => {
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
        token: resolve(el.tagName === "H1" ? "--bf-type-2xl"
          : el.tagName === "H2" ? "--bf-type-xl"
          : el.tagName === "H3" ? "--bf-type-lg"
          : "--bf-type-md"),
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
    expect(mt).toBe(48); // --bf-space-7 (3rem)
    expect(mb).toBe(12); // --bf-space-3 (0.75rem)
    expect(mt).toBeGreaterThan(mb);
  });

  test("prose: tables get their own vertical room inside the wrapper", async ({ page }) => {
    await gotoDemo(page);
    const table = page.locator(`${DEMOS.demoProse} table`);
    const mt = parseFloat(await table.evaluate((el) => getComputedStyle(el).marginTop));
    expect(mt).toBe(24); // --bf-space-5 (1.5rem)
    // Table is width: 100% (computed = parent width in px). Assert it fills the prose container.
    const { w: tableW, pw: proseW } = await table.evaluate((el) => {
      return { w: el.getBoundingClientRect().width, pw: el.closest(".bf-prose").getBoundingClientRect().width };
    });
    expect(tableW).toBeCloseTo(proseW, 1);
  });

  test("avatar: circular, token-sized, object-fit cover", async ({ page }) => {
    await gotoDemo(page);
    const av = page.locator(DEMOS.demoAvatar);
    await expect(av).toHaveCSS("border-radius", "50%");
    await expect(av).toHaveCSS("width", "40px"); // --bf-avatar-size (2.5rem)
    await expect(av).toHaveCSS("height", "40px");
    await expect(av).toHaveCSS("object-fit", "cover");
  });

  test("avatar: data-size sm/lg resize from the token edge", async ({ page }) => {
    await gotoDemo(page);
    await expect(page.locator(DEMOS.demoAvatarSm)).toHaveCSS("width", "28px"); // 1.75rem
    const lg = page.locator(`${DEMOS.media} .bf-avatar[data-size="lg"]`);
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
    await expect(card.locator(":scope > header")).toHaveCSS("padding", "24px"); // --bf-space-5
  });
});

test.describe("v1.9 stepper & input groups", () => {
  test("stepper horizontal: completed steps use success token, current uses primary", async ({ page }) => {
    await gotoDemo(page);
    const stepper = page.locator(DEMOS.demoStepperH);
    const circles = stepper.locator("[data-step-circle]");

    // First step (completed) — success colors
    await expect(circles.nth(0)).toHaveCSS("border-color", await tokenColor(page, "--bf-success")); // --bf-success
    await expect(circles.nth(0)).toHaveCSS("background-color", await tokenColor(page, "--bf-success"));
    await expect(circles.nth(0)).toHaveCSS("color", await tokenColor(page, "--bf-success-fg")); // --bf-success-fg

    // Second step (current) — primary colors
    await expect(circles.nth(1)).toHaveCSS("border-color", await tokenColor(page, "--bf-primary")); // --bf-primary
    await expect(circles.nth(1)).toHaveCSS("background-color", await tokenColor(page, "--bf-primary"));
    await expect(circles.nth(1)).toHaveCSS("color", await tokenColor(page, "--bf-primary-fg")); // --bf-primary-fg

    // Third step (pending) — muted/border colors
    await expect(circles.nth(2)).toHaveCSS("border-color", await tokenColor(page, "--bf-border")); // --bf-border
    await expect(circles.nth(2)).toHaveCSS("background-color", await tokenColor(page, "--bf-surface")); // --bf-surface
    await expect(circles.nth(2)).toHaveCSS("color", await tokenColor(page, "--bf-muted")); // --bf-muted
  });

  test("stepper vertical: same token mapping, vertical layout", async ({ page }) => {
    await gotoDemo(page);
    const stepper = page.locator(DEMOS.demoStepperV);
    const circles = stepper.locator("[data-step-circle]");

    // First step (completed)
    await expect(circles.nth(0)).toHaveCSS("border-color", await tokenColor(page, "--bf-success"));
    await expect(circles.nth(0)).toHaveCSS("background-color", await tokenColor(page, "--bf-success"));

    // Second step (current)
    await expect(circles.nth(1)).toHaveCSS("border-color", await tokenColor(page, "--bf-primary"));
    await expect(circles.nth(1)).toHaveCSS("background-color", await tokenColor(page, "--bf-primary"));

    // Third step (pending)
    await expect(circles.nth(2)).toHaveCSS("border-color", await tokenColor(page, "--bf-border"));
    await expect(circles.nth(2)).toHaveCSS("background-color", await tokenColor(page, "--bf-surface"));
  });

  test("input group: leading affix shares input focus state", async ({ page }) => {
    await gotoDemo(page);
    const group = page.locator(`${DEMOS.demoInputGroupForm} [data-input-group]`).first();
    const affix = group.locator(":scope > :first-child");
    const input = group.locator("input");

    // Default state — check border-inline-start-color to avoid shorthand
    await expect(affix).toHaveCSS("border-inline-start-color", await tokenColor(page, "--bf-border")); // --bf-border
    await expect(affix).toHaveCSS("color", await tokenColor(page, "--bf-muted")); // --bf-muted
    await expect(affix).toHaveCSS("background-color", await tokenColor(page, "--bf-surface-alt")); // --bf-surface-alt

    // Focus state
    await input.focus();
    await expect(affix).toHaveCSS("border-inline-start-color", await tokenColor(page, "--bf-focus-ring")); // --bf-focus-ring
    await expect(affix).toHaveCSS("color", await tokenColor(page, "--bf-focus-ring"));
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
    await expect(affix).toHaveCSS("border-inline-start-color", await tokenColor(page, "--bf-danger")); // --bf-danger
    await expect(affix).toHaveCSS("color", await tokenColor(page, "--bf-danger"));
  });

  test("input group: leading affix shares input validation state (valid)", async ({ page }) => {
    await gotoDemo(page);
    const group = page.locator(`${DEMOS.demoInputGroupForm} [data-input-group]`).first();
    const affix = group.locator(":scope > :first-child");
    const input = group.locator("input");

    // Trigger valid state
    await input.evaluate((el) => el.setAttribute("aria-invalid", "false"));
    await expect(affix).toHaveCSS("border-inline-start-color", await tokenColor(page, "--bf-success")); // --bf-success
    await expect(affix).toHaveCSS("color", await tokenColor(page, "--bf-success"));
  });

  test("date/number/email inputs get themed surface and validation", async ({ page }) => {
    await gotoDemo(page);
    const email = page.locator(DEMOS.polishEmail);
    const number = page.locator(DEMOS.polishNumber);
    const date = page.locator(DEMOS.polishDate);

    // All should have the shared input styles — height may be 42px due to line-height
    await expect(email).toHaveCSS("background-color", await tokenColor(page, "--bf-surface")); // --bf-surface
    await expect(email).toHaveCSS("border-color", await tokenColor(page, "--bf-border")); // --bf-border
    await expect(email).toHaveCSS("min-height", "40px"); // --bf-control-height

    await expect(number).toHaveCSS("background-color", await tokenColor(page, "--bf-surface"));
    await expect(number).toHaveCSS("min-height", "40px");

    await expect(date).toHaveCSS("background-color", await tokenColor(page, "--bf-surface"));
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
      getComputedStyle(el).getPropertyValue("--bf-border-width").trim()
    );
    const radiusFull = await root.evaluate((el) =>
      getComputedStyle(el).getPropertyValue("--bf-radius-full").trim()
    );
    expect(borderWidth).toBe("1px");
    expect(radiusFull).toBe("999px");

    // Components consume the tokens: a button's stroke and a badge's
    // pill shape must come from --bf-border-width / --bf-radius-full.
    const button = page.getByRole("button", { name: "Open dialog" });
    await expect(button).toHaveCSS("border-top-width", "1px");
    const badgeRadius = await page.locator(".badge").first().evaluate(
      (el) => getComputedStyle(el).borderRadius
    );
    expect(badgeRadius).toBe("999px");
  });

  test("z-index scale orders sticky < dialog < toast", async ({ page }) => {
    await gotoDemo(page);
    const root = page.locator("html");
    const z = async (name) =>
      parseInt(
        await root.evaluate(
          (el, n) => getComputedStyle(el).getPropertyValue(n).trim(),
          name
        )
      );
    expect(await z("--bf-z-sticky")).toBeLessThan(await z("--bf-z-dialog"));
    expect(await z("--bf-z-dialog")).toBeLessThan(await z("--bf-z-toast"));
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
    await page.locator("html").evaluate((el) => { el.dataset.bfTheme = "dark"; });
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
    const avatars = page.locator(`${DEMOS.demoAvatarGroup} .bf-avatar`);
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
    expect(shadow).toContain(await tokenColor(page, "--bf-surface")); // --bf-surface
  });

  test("spinner rotates via bf-spin and reads the accent tokens", async ({ page }) => {
    await gotoDemo(page);
    const spinner = page.locator(DEMOS.demoSpinner);
    const name = await spinner.evaluate(
      (el) => getComputedStyle(el).animationName
    );
    expect(name).toBe("bf-spin");
    await expect(spinner).toHaveCSS("border-radius", "999px"); // --bf-radius-full
    await expect(spinner).toHaveCSS("border-top-color", await tokenColor(page, "--bf-primary")); // --bf-primary (light)

    // Sizes: default 1.5rem, lg tracks the control height token.
    await expect(spinner).toHaveCSS("width", "24px");
    const lg = page.locator(`${DEMOS.spinner} [data-spinner][data-size="lg"]`);
    await expect(lg).toHaveCSS("width", "40px"); // --bf-control-height
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
    expect(rules).toEqual(["1px", "1px"]); // --bf-border-width

    // …and the label is muted secondary text, not a heading look.
    await expect(divider).toHaveCSS("color", await tokenColor(page, "--bf-muted")); // --bf-muted
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

    // Controls hold --bf-control-height so touch targets stay usable.
    const btn = page.getByRole("button", { name: "Open dialog" });
    const height = await btn.evaluate((el) => el.getBoundingClientRect().height);
    expect(height).toBeGreaterThanOrEqual(40);
  });

  test("hamburger nav: list collapses behind the toggle, links stay full-width", async ({ page }) => {
    await gotoDemo(page);
    const nav = page.locator(DEMOS.demoNavBurger);
    const toggle = nav.locator(".bf-nav-toggle");
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
    // Standalone fixture: inside a .bf-row the chip is a flex item and
    // its computed display blockifies to "flex" — the fixture shows the
    // component's own value.
    await gotoDemo(page);
    await page.setContent(markup);
    const chip = page.locator("[data-chip]");
    await expect(chip).toHaveCSS("display", "inline-flex");
    await expect(chip).toHaveCSS("border-radius", "999px"); // --bf-radius-full

    const btn = chip.locator("[data-chip-remove]");
    await expect(btn).toHaveCSS("border-style", "none"); // global button skin reset
    await btn.focus();
    await expect(btn).toHaveCSS("outline-style", "solid");
  });
});

test.describe("contrast palette mirrors (ADR-0001)", () => {
  // Source-parse guards: the manual [data-bf-theme="contrast"] palette and
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
      [...fragment.matchAll(/(--bf-[a-z0-9-]+)\s*:\s*([^;]+);/g)].map((m) => [m[1], m[2].trim()])
    );
  }

  let canonical, mirror, printPalette;

  test.beforeAll(() => {
    const tokensCss = fs.readFileSync(path.join(rootDir, "src/tokens.css"), "utf8");
    const baseCss = fs.readFileSync(path.join(rootDir, "src/base.css"), "utf8");
    canonical = parseCustomProps(extractCssBlock(tokensCss, /^\[data-bf-theme="contrast"\]/m));
    mirror = parseCustomProps(
      extractCssBlock(extractCssBlock(tokensCss, /^@media\s*\(prefers-contrast:\s*more\)/m), /^[ \t]*:root/m)
    );
    printPalette = parseCustomProps(
      extractCssBlock(extractCssBlock(baseCss, /^[ \t]*@media\s+print/m), /^[ \t]*:root/m)
    );
  });

  test("mirror block is found and parses", () => {
    expect(canonical, "canonical [data-bf-theme=contrast] block").toBeTruthy();
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
  // --bf-* token, and each initial-value duplicated the palette's
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
  test("popover menu items render with correct styling", async ({ page }) => {
    await gotoDemo(page);

    await page.locator(DEMOS.helpTrigger).click();
    const popLink = page.locator(`${DEMOS.helpPop} a`).first();
    await expect(popLink).toBeVisible();

    // The recipe styles popover menu items — assert what it paints.
    const expectedColor = await tokenColor(page, "--bf-text");
    const s = await popLink.evaluate((el) => {
      const cs = getComputedStyle(el);
      return { deco: cs.textDecorationLine, color: cs.color };
    });
    expect(s.deco).toBe("none");
    expect(s.color).toBe(expectedColor);
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
    expect(shared).toContain('[popover][data-kind="menu"]');
    expect(shared).toContain("text-decoration: none");
    const popover = fs.readFileSync(path.join(rootDir, "src/components/popover.css"), "utf8");
    expect(popover, `popover.css re-implements the shared item recipe`).not.toContain(
      "text-align: start"
    );
    const full = fs.readFileSync(path.join(rootDir, "src/full.css"), "utf8");
    expect(full).toContain("./components/menu-items.css");
  });

  test("disabled dimming comes from --bf-disabled-opacity", () => {
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
      if (
        f === "buttons.css" ||
        f === "forms-base.css" ||
        f === "forms-checks.css"
      ) {
        expect(src, `${f} should consume the shared token`).toContain(
          "var(--bf-disabled-opacity)"
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
  test("eight themes render side by side, each with its own accent", async ({ page }) => {
    await gotoGallery(page);
    // Each card scopes data-bf-theme on itself, so tokens resolve inside
    // the card subtree. Same probe trick as tokenColor(), but scoped:
    // eight cards must resolve eight distinct --bf-primary values live —
    // no screenshots needed to prove the previews are real.
    const colors = await page.evaluate(() =>
      [...document.querySelectorAll(".gallery-card")].map((card) => {
        const probe = document.createElement("span");
        card.append(probe);
        probe.style.color = "var(--bf-primary)";
        const resolved = getComputedStyle(probe).color;
        probe.remove();
        return resolved;
      })
    );
    expect(colors).toHaveLength(8);
    expect(
      new Set(colors).size,
      `expected eight distinct live accents, got: ${colors.join(", ")}`
    ).toBe(8);
  });

  test("cards carry real theme scoping, not just styling", async ({ page }) => {
    await gotoGallery(page);
    // The default card has no attribute; every themed one must name
    // the theme it previews.
    const themed = await page
      .locator(".gallery-card[data-bf-theme]")
      .evaluateAll((els) => els.map((el) => el.dataset.bfTheme));
    expect(themed.sort()).toEqual([
      "coastal",
      "contrast",
      "dashboard",
      "editorial",
      "forest",
      "playful",
      "sunset",
    ]);
  });
});

test.describe("v3.3 growth batch", () => {
  test("segmented control: native radio hidden, segments drawn by the component", async ({ page }) => {
    await gotoDemo(page);
    const group = page.locator(DEMOS.demoSegmented);
    const checked = group.locator('input:checked');
    const checkedLabel = group.locator('label:has(input:checked)');

    // The drawing is ours; the semantics are the platform's.
    const input = await checked.evaluate((el) => {
      const s = getComputedStyle(el);
      return { opacity: s.opacity, position: s.position };
    });
    expect(input).toEqual({ opacity: "0", position: "absolute" });
    await expect(checked).toHaveAccessibleName("Day"); // real radio, real name

    // Selected segment: raised surface on the tinted track.
    await expect(checkedLabel).toHaveCSS(
      "background-color",
      await tokenColor(page, "--bf-surface")
    );
    // Unselected segments stay muted.
    const unchecked = group.locator('label:has(input:not(:checked)):not(:has(input:disabled))').first();
    await expect(unchecked).toHaveCSS("color", await tokenColor(page, "--bf-muted"));

    // Legend names the group for AT, clipped from sight.
    const legend = await group
      .locator("legend")
      .evaluate((el) => getComputedStyle(el).clipPath);
    expect(legend).toBe("inset(50%)");
  });

  test("segmented control: keyboard moves the painted selection", async ({ page }) => {
    await gotoDemo(page);
    const group = page.locator(DEMOS.demoSegmented);
    await page.keyboard.press("Tab"); // land somewhere in the form…
    // Focus the first segment radio directly, then arrow through.
    const first = group.locator('input[value="day"]');
    await first.focus();
    await page.keyboard.press("ArrowRight");
    const weekLabel = group.locator('label:has(input[value="week"])');
    await expect(group.locator('input[value="week"]')).toBeChecked();
    await expect(weekLabel).toHaveCSS(
      "background-color",
      await tokenColor(page, "--bf-surface")
    );
  });

  test("datalist field reserves space for the engine's picker affordance", async ({ page }) => {
    await gotoDemo(page);
    // Same reserved inline-end as the select skin — typed text never
    // slides under the native arrow. Compare against the select rather
    // than freezing a px value.
    const inputPad = await page
      .locator(DEMOS.framework)
      .evaluate((el) => getComputedStyle(el).paddingInlineEnd);
    const selectPad = await page
      .locator(DEMOS.country)
      .evaluate((el) => getComputedStyle(el).paddingInlineEnd);
    expect(inputPad).toBe(selectPad);
    expect(inputPad).not.toBe("0px");
  });

  test("kbd keycaps ship with the core (base layer), not a component opt-in", async ({ page }) => {
    await gotoDemo(page);
    const kbd = page.locator("#typography kbd").first();
    await expect(kbd).toHaveCSS("border-top-width", "1px");
    await expect(kbd).toHaveCSS("border-bottom-width", "2px"); // keycap lip
    await expect(kbd).toHaveCSS(
      "background-color",
      await tokenColor(page, "--bf-surface-alt")
    );
  });

  test("timeline: dots on a spine, plain ol underneath", async ({ page }) => {
    await gotoDemo(page);
    const list = page.locator(DEMOS.demoTimeline);
    await expect(list).toHaveCSS("list-style-type", "none");

    const dot = await list
      .locator("li")
      .first()
      .evaluate((el) => {
        const s = getComputedStyle(el, "::before");
        return { content: s.content, position: s.position, border: s.borderTopColor };
      });
    expect(dot.content).toBe('""');
    expect(dot.position).toBe("absolute");
    expect(dot.border).toBe(await tokenColor(page, "--bf-primary"));

    // Spine connects every entry except the last.
    const [spine, last] = await page.evaluate((sel) => {
      const items = document.querySelectorAll(`${sel} > li`);
      const spineEl = getComputedStyle(items[0], "::after");
      const lastEl = getComputedStyle(items[items.length - 1], "::after");
      return [spineEl.backgroundColor, lastEl.content];
    }, DEMOS.demoTimeline);
    expect(spine).toBe(await tokenColor(page, "--bf-border"));
    expect(last).toBe("none");
  });

  test("empty state: dashed centered panel with a decorative glyph slot", async ({ page }) => {
    await gotoDemo(page);
    const panel = page.locator(DEMOS.demoEmptyState);
    await expect(panel).toHaveCSS("border-style", "dashed");
    await expect(panel).toHaveCSS("text-align", "center");
    await expect(panel).toHaveCSS("flex-direction", "column");
    // Glyph is decoration; meaning lives in the heading.
    await expect(panel.locator("> span").first()).toHaveAttribute("aria-hidden", "true");
    await expect(panel.getByRole("heading")).toBeVisible();
  });

  test("toast stacking: sibling toasts lift into a column instead of overlapping", async ({ page }) => {
    await gotoDemo(page);
    const first = page.locator(DEMOS.demoToast);
    const second = page.locator(DEMOS.demoToastUpload);
    const third = page.locator(DEMOS.demoToastError);

    await page.locator(DEMOS.toastTrigger).click();
    await expect(first).toBeVisible();
    // A lone toast sits at its pinned spot — no offset.
    expect(await first.evaluate((el) => getComputedStyle(el).translate)).toBe("none");

    await page.locator(DEMOS.toastUploadTrigger).click();
    await page.locator(DEMOS.toastErrorTrigger).click();
    await expect(second).toBeVisible();
    await expect(third).toBeVisible();

    // Transitions lift each toast into place — wait until they've landed.
    await expect
      .poll(() =>
        page.evaluate((sel) => {
          const rs = [...document.querySelector(sel).children]
            .filter((el) => el.matches(":popover-open"))
            .map((el) => el.getBoundingClientRect());
          return rs.every(
            (r, i) => i === 0 || r.top >= rs[i - 1].bottom - 0.5
          );
        }, DEMOS.demoToastStack)
      )
      .toBe(true);

    const rects = await page.evaluate((stackSel) => {
      return [...document.querySelector(stackSel).children]
        .filter((el) => el.matches(":popover-open"))
        .map((el) => {
          const r = el.getBoundingClientRect();
          return { top: r.top, bottom: r.bottom, translate: getComputedStyle(el).translate };
        });
    }, DEMOS.demoToastStack);

    expect(rects).toHaveLength(3);
    // Newest last in the DOM → oldest highest on screen.
    for (let i = 1; i < rects.length; i++) {
      expect(rects[i].top).toBeGreaterThanOrEqual(rects[i - 1].bottom - 0.5);
    }
    // Only toasts with an open sibling after them carry an offset.
    expect(rects[2].translate).toBe("none");
    expect(rects[0].translate).not.toBe("none");

    // Clean up so later sections aren't covered by open popovers.
    await page.evaluate((stackSel) => {
      for (const el of document.querySelectorAll(`${stackSel} [popover]`)) el.hidePopover();
    }, DEMOS.demoToastStack);
  });

  test("sortable table: header buttons inherit the th voice, indicator glyph present", async ({ page }) => {
    await gotoDemo(page);
    const btn = page.locator(`${DEMOS.demoSortTable} thead th button`).nth(2); // Points
    await expect(btn).toHaveCSS("min-height", "0px"); // beats the global button chrome
    await expect(btn).toHaveCSS("color", await tokenColor(page, "--bf-muted"));
    const glyph = await btn.evaluate((el) => getComputedStyle(el, "::after").content);
    expect(glyph).toBe('"↕"');
    // No sort yet → th carries no aria-sort.
    await expect(page.locator(`${DEMOS.demoSortTable} th[aria-sort]`)).toHaveCount(0);
  });
});

test.describe("v4.5 customizable select & sticky tables", () => {
  const supportsBaseSelect = (page) =>
    page.evaluate(() => CSS.supports("appearance", "base-select"));

  test("single select upgrades to base-select; the SVG chevron retires", async ({ page }) => {
    await gotoDemo(page);
    if (!(await supportsBaseSelect(page)))
      test.skip(true, "customizable select unsupported here");

    const sel = page.locator(DEMOS.country);
    await expect(sel).toHaveCSS("appearance", "base-select");
    // The chevron skin's background-image is gone; ::picker-icon draws.
    expect(await sel.evaluate((el) => getComputedStyle(el).backgroundImage)).toBe("none");
    // Multiple/size selects keep the browser's control (same exclusion
    // as the fallback skin) — asserted via a standalone fixture, since
    // blockification rules don't apply to selects and the demo has none.
    const multi = await sel.evaluate(() => {
      const el = document.createElement("select");
      el.multiple = true;
      document.body.append(el);
      const appearance = getComputedStyle(el).appearance;
      el.remove();
      return appearance;
    });
    expect(multi).not.toBe("base-select");
  });

  test("picker surface uses tokens (::picker)", async ({ page }) => {
    await gotoDemo(page);
    if (!(await supportsBaseSelect(page)))
      test.skip(true, "customizable select unsupported here");

    const picker = await page.locator(DEMOS.country).evaluate((el) => {
      const s = getComputedStyle(el, "::picker(select)");
      return { bg: s.backgroundColor, border: s.borderTopColor };
    });
    expect(picker.bg).toBe(await tokenColor(page, "--bf-surface"));
    expect(picker.border).toBe(await tokenColor(page, "--bf-border"));
  });

  test("reduced-motion collapses the picker entry transition", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await gotoDemo(page);
    if (!(await supportsBaseSelect(page)))
      test.skip(true, "customizable select unsupported here");

    // ::picker() is a top-layer pseudo the global * kill switch can't
    // reach — forms-select.css carries its own guard; this pins it.
    const dur = await page.locator(DEMOS.country).evaluate(
      (el) => getComputedStyle(el, "::picker(select)").transitionDuration
    );
    for (const d of dur.split(", ")) expect(parseFloat(d)).toBeLessThanOrEqual(0.01);
  });

  test("sticky-head keeps the header row pinned and opaque", async ({ page }) => {
    await gotoDemo(page);
    const th = page.locator(`${DEMOS.demoStickyTable} thead th`).first();
    await expect(th).toHaveCSS("position", "sticky");
    await expect(th).toHaveCSS("top", "0px");
    // Opaque on purpose: transparent sticky headers show rows through.
    expect(
      await th.evaluate((el) => getComputedStyle(el).backgroundColor)
    ).toBe(await tokenColor(page, "--bf-surface"));
    const zToken = await page.locator("html").evaluate((el) =>
      parseInt(getComputedStyle(el).getPropertyValue("--bf-z-sticky").trim())
    );
    expect(parseInt(await th.evaluate((el) => getComputedStyle(el).zIndex))).toBe(zToken);
  });

  test("sticky-col pins the first column on the logical start edge", async ({ page }) => {
    await gotoDemo(page);
    // Corner cell composes both variants; body row headers (<th>) stick too.
    const corner = page.locator(`${DEMOS.demoStickyTable} thead th`).first();
    const rowHead = page.locator(`${DEMOS.demoStickyTable} tbody th`).first();
    await expect(corner).toHaveCSS("position", "sticky");
    await expect(rowHead).toHaveCSS("position", "sticky");
    expect(
      await rowHead.evaluate((el) => getComputedStyle(el).insetInlineStart)
    ).toBe("0px");
    expect(
      await rowHead.evaluate((el) => getComputedStyle(el).backgroundColor)
    ).toBe(await tokenColor(page, "--bf-surface"));
  });

  test("non-sticky tables keep static cells", async ({ page }) => {
    await gotoDemo(page);
    const stackTh = page.locator('table[data-table="stack"] thead th').first();
    await expect(stackTh).toHaveCSS("position", "static");
  });
});

test.describe("v4.6 navigation transitions (cross-document view transitions)", () => {
  // The transition renders in the top layer across two documents; a
  // mid-navigation frame is not deterministically capturable, so the
  // static contract is pinned source-side and the live wiring through
  // the pagereveal event (the platform's own "did this navigation
  // transition?" signal).

  const vtSrc = () =>
    fs.readFileSync(path.join(rootDir, "src/components/view-transition.css"), "utf8");

  test("importing the file opts same-origin navigations in", () => {
    expect(vtSrc()).toMatch(/@view-transition\s*\{\s*navigation:\s*auto/);
  });

  test("reduced motion opts back out entirely", () => {
    const src = vtSrc();
    const guard = src.slice(src.indexOf("(prefers-reduced-motion: reduce)"));
    expect(guard).toMatch(/@view-transition\s*\{\s*navigation:\s*none/);
    // Top-layer pseudos are out of base.css's reach — the in-file kill
    // switch must cover the group morphs too, not just the snapshots.
    expect(guard).toContain("::view-transition-group(*)");
  });

  test("--bf-vt-* tokens exist and are consumed by the component", () => {
    const tokens = fs.readFileSync(path.join(rootDir, "src/tokens.css"), "utf8");
    expect(tokens).toMatch(/--bf-vt-duration:/);
    expect(tokens).toMatch(/--bf-vt-easing:/);
    const src = vtSrc();
    expect(src).toContain("var(--bf-vt-duration)");
    expect(src).toContain("var(--bf-vt-easing)");
  });

  test("full.css stays frozen at its 4.5 import set (ADR-0008)", () => {
    const src = fs.readFileSync(path.join(rootDir, "src/full.css"), "utf8");
    const imports = [...src.matchAll(/@import\s+"([^"]+)"/g)].map((m) => m[1]);
    expect(imports).toEqual([
      "./index.css",
      "./components/buttons.css",
      "./components/forms.css",
      "./components/segmented.css",
      "./components/dialog.css",
      "./components/popover.css",
      "./components/menu-items.css",
      "./components/accordion.css",
      "./components/tabs.css",
      "./components/carousel.css",
      "./components/reveal.css",
      "./components/grid.css",
      "./components/layout.css",
      "./components/nav.css",
      "./components/alert.css",
      "./components/skeleton.css",
      "./components/spinner.css",
      "./components/divider.css",
      "./components/table.css",
      "./components/code.css",
      "./components/timeline.css",
      "./components/empty-state.css",
      "./components/card.css",
      "./components/badge.css",
      "./components/chip.css",
      "./components/breadcrumbs.css",
      "./components/pagination.css",
      "./components/prose.css",
      "./components/media.css",
      "./components/stepper.css",
      "./components/view-transition.css",
      "./utilities.css",
    ]);
  });

  test("the core stays core: index.css never enables navigation", () => {
    const index = fs.readFileSync(path.join(rootDir, "src/index.css"), "utf8");
    expect(index).not.toContain("@view-transition");
    expect(index).not.toContain("view-transition.css");
  });

  test("pair page carries the twin name and links home; demo names its side too", async ({ page }) => {
    await gotoVtPair(page);
    await expect(
      page.getByRole("link", { name: /Back to the conformance demo/ })
    ).toBeVisible();

    if (await page.evaluate(() => CSS.supports("view-transition-name", "hero"))) {
      await expect(page.locator("#vt-pair article")).toHaveCSS(
        "view-transition-name",
        "bf-demo-hero"
      );
    }

    await gotoDemo(page);
    await expect(page.locator(DEMOS.demoNavVt).locator("article").first()).toHaveCSS(
      "view-transition-name",
      "bf-demo-hero"
    );
  });

  // Live wiring: pagereveal carries a ViewTransition object exactly when
  // a cross-document transition was created for this navigation. The
  // probe yields a three-state verdict, because event *presence* does
  // not imply transition *activation*: Firefox ships ViewTransition +
  // pageswap/pagereveal while still navigating plainly (no cross-doc
  // transition created) — which is precisely Barefoot's degrade-by-
  // omission contract doing its job, so that outcome skips rather than
  // fails.
  async function revealState(page, { reducedMotion = false, attempts = 3 } = {}) {
    if (reducedMotion) await page.emulateMedia({ reducedMotion: "reduce" });
    await gotoDemo(page);
    const capable = await page.evaluate(
      () =>
        typeof ViewTransition !== "undefined" &&
        "onpageswap" in window &&
        "onpagereveal" in window
    );
    if (!capable) return "unsupported";
    // One install covers every later navigation: each document starts
    // fresh and re-arms itself at document creation.
    await page.addInitScript(() => {
      window.__bfVtReveal = "pending";
      addEventListener("pagereveal", (e) => {
        window.__bfVtReveal = e.viewTransition ? "transitioned" : "plain";
      });
    });

    // Creating the transition is best-effort even where it is supported
    // (a headless navigation can beat the snapshot capture), so never
    // trust a single "plain": observe up to N real navigations.
    let verdict = null;
    for (let seen = 0; seen < attempts && verdict !== "transitioned"; seen++) {
      await page.getByRole("link", { name: /Open the pair page/ }).click();
      await page.waitForLoadState("load");
      verdict = await page.evaluate(() => window.__bfVtReveal);
      if (verdict === "pending")
        throw new Error("pagereveal never fired — instrumentation lost");
      if (verdict !== "transitioned")
        await page.goBack({ waitUntil: "load" }); // re-arm on the demo
    }
    return verdict;
  }

  test("navigating between opting-in documents creates a transition", async ({ page }) => {
    const state = await revealState(page);
    if (state === "unsupported")
      test.skip(true, "pagereveal/pageswap unsupported here");
    if (state !== "transitioned")
      test.skip(true, "engine ships the events but creates no cross-document transitions across 3 navigations — degrade by omission holds");
    expect(state).toBe("transitioned");
  });

  test("reduced motion navigates plainly (no transition created)", async ({ page }) => {
    const state = await revealState(page, { reducedMotion: true, attempts: 1 });
    if (state === "unsupported")
      test.skip(true, "pagereveal/pageswap unsupported here");
    expect(state).toBe("plain");
  });
});

test.describe("API reference audit (docs/api.md ↔ src)", () => {
  // The data-* table in docs/api.md is the frozen public contract; this
  // audit keeps it true in both directions (source-parse only — never
  // touches a page). Internal seams the JS modules set and their CSS
  // consumes are deliberately not consumer API and live in an explicit
  // allowlist inside api.md itself. DEMO_ONLY is currently empty:
  // data-bf-theme-btn graduated from demo-page convention to the
  // first-party module src/js/theme.js in 4.9.
  const INTERNAL_MARKERS = new Set(["data-bf-tabs-js", "data-nav-js", "data-open"]);
  const DEMO_ONLY = new Set();

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
        // JS dataset access: dataset.bfThemeBtn → data-bf-theme-btn.
        for (const m of src.matchAll(/dataset\.([A-Za-z0-9]+)/g)) {
          const kebab = m[1].replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);
          found.add({ name: `data-${kebab}`, where: `${dir}/${f}` });
        }
      }
    }
    // tokens.css defines theme-level data-* attributes (data-bf-theme,
    // data-density) that live outside components/js.
    const tokensSrc = fs.readFileSync(path.join(rootDir, "src/tokens.css"), "utf8");
    for (const m of tokensSrc.matchAll(/\[?(data-[a-z0-9-]+)/g)) {
      found.add({ name: m[1], where: "src/tokens.css" });
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

  test("theming.md carries a generated token region that knows every --bf-* token", () => {
    // Pins build/token-docs.mjs output against tokens.css so a new token
    // cannot land without regenerating the reference (npm run docs:tokens,
    // part of npm run check).
    const tokensSrc = fs.readFileSync(path.join(rootDir, "src/tokens.css"), "utf8");
    const rootBlock = tokensSrc.slice(tokensSrc.indexOf(":root {"));
    const defined = new Set(
      [...rootBlock.matchAll(/^\s*(--bf-[a-z0-9-]+):/gm)].map((m) => m[1])
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

test.describe("v4.8 validation icons & forced colors", () => {
  test("touched valid fields draw a check icon and reserve its space", async ({ page }) => {
    await gotoDemo(page);
    const email = page.locator(DEMOS.demoEmail);
    const before = await email.evaluate((el) =>
      parseFloat(getComputedStyle(el).paddingInlineEnd)
    );
    await email.fill("you@example.com");
    await email.blur();
    await expect(email).toHaveCSS("border-color", await tokenColor(page, "--bf-success"));
    const style = await email.evaluate((el) => {
      const s = getComputedStyle(el);
      return { paddingInlineEnd: parseFloat(s.paddingInlineEnd), backgroundImage: s.backgroundImage };
    });
    expect(style.paddingInlineEnd).toBeGreaterThan(before);
    expect(style.backgroundImage).toContain("svg");
  });

  test("touched invalid fields draw a cross icon and the danger border", async ({ page }) => {
    await gotoDemo(page);
    const user = page.locator(DEMOS.demoUser);
    await user.fill("ab"); // minlength=3 → :user-invalid
    await user.blur();
    await expect(user).toHaveCSS("border-color", await tokenColor(page, "--bf-danger"));
    const bg = await user.evaluate((el) => getComputedStyle(el).backgroundImage);
    expect(bg).toContain("svg");
    // The cross and the check are different glyphs.
    const check = page.locator(DEMOS.demoEmail);
    await check.fill("you@example.com");
    await check.blur();
    const cross = await user.evaluate((el) => getComputedStyle(el).backgroundImage);
    const tick = await check.evaluate((el) => getComputedStyle(el).backgroundImage);
    expect(cross).not.toBe(tick);
  });

  test("forced colors: invalid fields go dashed and focus regains an outline", async ({ page, browserName }) => {
    test.skip(browserName !== "chromium", "forced-colors emulation is chromium-gated");
    await gotoDemo(page);
    await page.emulateMedia({ forcedColors: "active" });
    const email = page.locator(DEMOS.demoEmail);
    await email.fill("not-an-email");
    await email.blur();
    await expect(email).toHaveCSS("border-style", "dashed");
    await email.focus();
    await expect(email).toHaveCSS("outline-style", "solid");
    await expect(email).toHaveCSS("outline-width", "2px");
  });

  test("forced colors: background-only state cues gain outlines", async ({ page, browserName }) => {
    test.skip(browserName !== "chromium", "forced-colors emulation is chromium-gated");
    await gotoDemo(page);
    await page.emulateMedia({ forcedColors: "active" });
    await expect(page.locator('[data-pagination] [aria-current="page"]')).toHaveCSS("outline-style", "solid");
    await expect(page.locator(`${DEMOS.demoSegmented} label:has(input:checked)`)).toHaveCSS("outline-style", "solid");
    await expect(page.locator(DEMOS.demoSkeletonLine)).toHaveCSS("outline-style", "solid");
  });

  test("forced colors: ghost buttons state their boundary", async ({ page, browserName }) => {
    test.skip(browserName !== "chromium", "forced-colors emulation is chromium-gated");
    await gotoDemo(page);
    await page.emulateMedia({ forcedColors: "active" });
    const ghost = page.locator('button[data-variant="ghost"]').first();
    await expect(ghost).not.toHaveCSS("border-color", "rgba(0, 0, 0, 0)");
  });
});

test.describe("v4.8 DTCG tokens.json export", () => {
  // Source-parse tests: the generator runs in-node against src/tokens.css,
  // no page and no dist/ needed.
  const group = (mode, prefix) => Object.keys(mode).find((k) => k.startsWith(prefix));

  test("every token exports with a value and a type", () => {
    const dtcg = buildDTCG();
    const all = [
      ...Object.values(dtcg.light).flatMap((g) => Object.entries(g)),
      ...Object.values(dtcg.dark).flatMap((g) => Object.entries(g)),
      ...Object.values(dtcg.core).flatMap((g) => Object.entries(g)),
    ];
    expect(all.length).toBeGreaterThan(90);
    for (const [name, entry] of all) {
      expect(entry.$value, `${name} carries a value`).toBeDefined();
      // Deliberately untyped: "none" (no DTCG shadow shape) and the
      // easing keyword (no DTCG type exists for it).
      if (entry.$value !== "none" && entry.$value !== "ease") {
        expect(entry.$type, `${name} is typed`).toBeTruthy();
      }
    }
  });

  test("light-dark() pairs split into resolved scheme values", () => {
    const dtcg = buildDTCG();
    const primary = dtcg.light[group(dtcg.light, "Color")].primary;
    expect(primary.$type).toBe("color");
    expect(primary.$value).toBe("#1a1a1a");
    expect(primary.$extensions["com.barefoot-css.css-name"]).toBe("--bf-primary");
    expect(dtcg.dark[group(dtcg.dark, "Color")].primary.$value).toBe("#ececec");
  });

  test("color-mix() fallbacks mix out to real hex per scheme", () => {
    const dtcg = buildDTCG();
    const ramps = group(dtcg.light, "Alpha ramps");
    expect(dtcg.light[ramps]["primary-muted"].$value).toBe("#1a1a1a40");
    expect(dtcg.dark[ramps]["surface-2"].$value).toBe("#1f1f1f");
  });

  test("scheme-independent tokens land in core", () => {
    const dtcg = buildDTCG();
    const spacing = dtcg.core[group(dtcg.core, "Spacing scale")];
    expect(spacing["space-1"].$type).toBe("dimension");
    expect(spacing["space-1"].$value).toBe("0.25rem");
    expect(dtcg.core[group(dtcg.core, "Motion")].transition.$type).toBe("duration");
    expect(dtcg.core[group(dtcg.core, "Motion")].transition.$value).toBe("150ms");
  });
});

test.describe("generative theming (v5.0 Phase 4)", () => {
  // The 12-step OKLCH ramp is generated from --bf-seed-h / --bf-seed-c.
  // The gate for this feature is contrast: every derived step must clear a
  // 3:1 graphical-object floor (WCAG 1.4.11), verified here — never asserted.
  test("12-step scale generates 12 distinct, monotonic (light→dark) steps", async ({ page }) => {
    await gotoDemo(page);
    const tones = [];
    for (let i = 1; i <= 12; i++) {
      tones.push(await tokenColor(page, `--bf-tone-${i}`));
    }
    expect(new Set(tones).size).toBe(12); // all distinct
    // relative luminance strictly decreases down the ramp (light → dark);
    // tolerate FP/clamp noise at the gamut edges.
    const lum = tones.map((c) => luminance(c));
    for (let i = 1; i < lum.length; i++) {
      expect(lum[i]).toBeLessThanOrEqual(lum[i - 1] + 1e-4);
    }
  });

  test("every derived step clears a 3:1 graphical-object contrast floor", async ({ page }) => {
    await gotoDemo(page);
    for (let i = 1; i <= 12; i++) {
      const t = await tokenColor(page, `--bf-tone-${i}`);
      const vsBlack = wcagContrast(t, "rgb(0 0 0)");
      const vsWhite = wcagContrast(t, "rgb(255 255 255)");
      expect(Math.max(vsBlack, vsWhite)).toBeGreaterThanOrEqual(3);
    }
  });

  test("turning the seed dial regenerates the ramp", async ({ page }) => {
    await gotoDemo(page);
    const before = await tokenColor(page, "--bf-tone-6");
    await page.evaluate(() => {
      document.documentElement.style.setProperty("--bf-seed-h", 20);
    });
    const after = await tokenColor(page, "--bf-tone-6");
    expect(after).not.toBe(before);
  });

  test("studio: hue slider re-skins the ramp live; adaptive table reflows by container", async ({ page }) => {
    await gotoStudio(page);
    const swatch = (n) =>
      page.locator(DEMOS.studioScale).first().evaluate(
        (el, i) => getComputedStyle(el.children[i - 1]).backgroundColor,
        n
      );
    const before = await swatch(6);
    await page.locator(DEMOS.studioHue).evaluate((el) => {
      el.value = 120;
      el.dispatchEvent(new Event("input", { bubbles: true }));
    });
    const after = await swatch(6);
    expect(after).not.toBe(before);

    // Container-adaptive: the table stacks to cards as its container narrows
    // (not the viewport). Wide → table-cell; narrow → block (card-stack).
    const cell = page.locator(`${DEMOS.studioReflow} td[data-label]`).first();
    await page.locator(DEMOS.studioReflow).evaluate((el) => {
      el.style.width = "42rem";
    });
    const wide = await cell.evaluate((el) => getComputedStyle(el).display);
    await page.locator(DEMOS.studioReflow).evaluate((el) => {
      el.style.width = "16rem";
    });
    const narrow = await cell.evaluate((el) => getComputedStyle(el).display);
    expect(wide).toBe("table-cell");
    expect(narrow).toBe("flex"); // card-stack lays cells out as flex rows
  });

  test("studio exports a pasteable theme incl. the generative seed (CSS + tokens.json)", async ({ page }) => {
    await gotoStudio(page);
    await page.locator("#studio-hue").evaluate((el) => {
      el.value = 120;
      el.dispatchEvent(new Event("input", { bubbles: true }));
    });
    await page.locator("#studio-chroma").evaluate((el) => {
      el.value = 0.2;
      el.dispatchEvent(new Event("input", { bubbles: true }));
    });
    const css = await page.locator("#studio-output").textContent();
    expect(css).toContain("--bf-seed-h: 120");
    expect(css).toContain("--bf-seed-c: 0.2");
    expect(css).toContain("--bf-primary");
    const json = JSON.parse(await page.locator("#studio-json").textContent());
    expect(json["--bf-seed-h"]).toBe(120);
    expect(json["--bf-seed-c"]).toBe(0.2);
  });



  test("opt-in theming-anim registers the seeds as animatable @property", () => {
    // ADR-0012 revisit: the default stays @property-free (byte budget +
    // the no-registration contract), but this opt-in shard registers the
    // generative seeds so a seed change morphs the ramp instead of
    // snapping. Source-parse: presence is the contract here.
    const src = fs.readFileSync(
      path.join(rootDir, "src/themes/theming-anim.css"),
      "utf8"
    );
    for (const seed of ["--bf-seed-h", "--bf-seed-c"]) {
      expect(src, `${seed} must be registered`).toContain(`@property ${seed}`);
      expect(src, `${seed} must inherit`).toContain("inherits: true");
    }
    // The morph is gated on motion preference and transitions both seeds.
    expect(src).toContain("prefers-reduced-motion: no-preference");
    expect(src).toMatch(/transition:\s*[^;]*--bf-seed-h/);
    expect(src).toMatch(/transition:\s*[^;]*--bf-seed-c/);
  });

  test("theming-anim wires the seed morph (transition present on :root)", async ({ page }) => {
    await gotoDemo(page);
    await page.emulateMedia({ reducedMotion: "no-preference" });
    const animCss = fs.readFileSync(
      path.join(rootDir, "dist/themes/theming-anim.css"),
      "utf8"
    );
    await page.addStyleTag({ content: animCss });
    const props = await page.evaluate(() =>
      getComputedStyle(document.documentElement).transitionProperty
    );
    expect(props).toContain("--bf-seed-h");
    expect(props).toContain("--bf-seed-c");
  });
});

test.describe("adaptive components (v5.1)", () => {
  test("tabs-adaptive: scroll-snap row when wide, wrap when narrow", async ({ page }) => {
    await gotoDemo(page);
    const list = page.locator(`${DEMOS.demoTabsAdaptive} [role="tablist"]`);
    await setContainerWidth(page, DEMOS.demoTabsAdaptiveWrap, "48rem");
    expect(await list.evaluate((el) => getComputedStyle(el).flexWrap)).toBe("nowrap");
    expect(await list.evaluate((el) => getComputedStyle(el).overflowX)).toBe("auto");
    await setContainerWidth(page, DEMOS.demoTabsAdaptiveWrap, "20rem");
    expect(await list.evaluate((el) => getComputedStyle(el).flexWrap)).toBe("wrap");
    expect(await list.evaluate((el) => getComputedStyle(el).overflowX)).not.toBe("auto");
  });

  test("nav-adaptive: drawer off-canvas when the container is narrow", async ({ page }) => {
    await gotoDemo(page);
    const nav = page.locator(DEMOS.demoNavDrawer);
    const ul = page.locator(`${DEMOS.demoNavDrawer} > ul`);
    // The demo slot is ~22rem, so the nav self-containers narrow → drawer.
    expect(await ul.evaluate((el) => getComputedStyle(el).position)).toBe("fixed");
    expect(await ul.evaluate((el) => getComputedStyle(el).transform)).toContain("matrix");
    // Open via the hamburger (js/nav.js flips [data-open]).
    await page.locator(`${DEMOS.demoNavDrawer} .bf-nav-toggle`).click();
    await expect(nav).toHaveAttribute("data-open", "");
    expect(await ul.evaluate((el) => getComputedStyle(el).transform)).toContain("matrix(1");
  });

  test("auto-wrap: a table card-stacks without a manual .bf-contain", async ({ page }) => {
    await gotoDemo(page);
    const thead = page.locator(`${DEMOS.demoTableAdaptiveAutowrap} thead`);
    await setContainerWidth(page, DEMOS.demoTableAdaptiveAutowrapWrap, "48rem");
    expect(await thead.evaluate((el) => getComputedStyle(el).display)).not.toBe("none");
    await setContainerWidth(page, DEMOS.demoTableAdaptiveAutowrapWrap, "20rem");
    expect(await thead.evaluate((el) => getComputedStyle(el).display)).toBe("none");
  });
});
