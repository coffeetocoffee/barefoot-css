/* Barefoot — opt-in JS modules.
   Tests the three enhancements shipped in dist/js/ (loaded by the demo):
   WAI-ARIA tabs, details Esc-close, and popover-menu keyboard support.

   npm run test:js */
import { test, expect } from "@playwright/test";

test.describe("opt-in JS: tabs", () => {
  test("click switches panels and aria-selected", async ({ page }) => {
    await page.goto("/demo/");
    const tabs = page.locator('[data-fz-tabs] [role="tab"]');
    const panels = page.locator('[data-fz-tabs] [role="tabpanel"]');

    await expect(tabs.nth(0)).toHaveAttribute("aria-selected", "true");
    await expect(panels.nth(0)).toBeVisible();
    await expect(panels.nth(1)).toBeHidden();

    await tabs.nth(1).click();
    await expect(tabs.nth(1)).toHaveAttribute("aria-selected", "true");
    await expect(tabs.nth(0)).toHaveAttribute("aria-selected", "false");
    await expect(panels.nth(1)).toBeVisible();
    await expect(panels.nth(0)).toBeHidden();
  });

  test("arrow keys rove focus and activate; Home/End jump", async ({ page }) => {
    await page.goto("/demo/");
    const tabs = page.locator('[data-fz-tabs] [role="tab"]');
    const panels = page.locator('[data-fz-tabs] [role="tabpanel"]');

    await tabs.nth(1).focus();
    await page.keyboard.press("ArrowRight");
    await expect(tabs.nth(2)).toBeFocused();
    await expect(panels.nth(2)).toBeVisible();

    await page.keyboard.press("ArrowLeft");
    await expect(tabs.nth(1)).toBeFocused();
    await expect(panels.nth(1)).toBeVisible();

    await page.keyboard.press("Home");
    await expect(tabs.nth(0)).toBeFocused();

    await page.keyboard.press("End");
    await expect(tabs.nth(2)).toBeFocused();
  });
});

test.describe("opt-in JS: tabs no-JS-first contract", () => {
  const markup = `
    <link rel="stylesheet" href="/dist/components/tabs.css">
    <div data-fz-tabs>
      <div role="tablist" aria-label="fixture">
        <button role="tab" aria-selected="true">One</button>
        <button role="tab" aria-selected="false">Two</button>
      </div>
      <div role="tabpanel">panel one</div>
      <div role="tabpanel">panel two</div>
    </div>`;

  test("without the module, every panel stays visible (content never lost)", async ({ page }) => {
    await page.setContent(markup);
    const panels = page.locator('[data-fz-tabs] [role="tabpanel"]');
    await expect(panels.nth(0)).toBeVisible();
    await expect(panels.nth(1)).toBeVisible();
    await expect(page.locator("[data-fz-tabs]")).not.toHaveAttribute("data-fz-tabs-js", /.*/);
  });

  test("with the module, the group is marked and inactive panels hide at init", async ({ page }) => {
    await page.goto("/demo/");
    const group = page.locator("[data-fz-tabs]");
    await expect(group).toHaveAttribute("data-fz-tabs-js", "");
    await expect(group.locator('[role="tabpanel"]').nth(0)).toBeVisible();
    await expect(group.locator('[role="tabpanel"]').nth(1)).toBeHidden();
    await expect(group.locator('[role="tabpanel"]').nth(2)).toBeHidden();
  });
});

test.describe("opt-in JS: details Esc-close", () => {
  test("Esc from inside a details menu closes it and returns focus to summary", async ({ page }) => {
    await page.goto("/demo/");
    const summary = page.locator('details[data-menu] summary');
    const panel = page.locator('details[data-menu] > :not(summary)');

    await summary.focus();
    await page.keyboard.press("Enter");
    await expect(panel).toBeVisible();

    await page.keyboard.press("Tab");
    await expect(page.locator('details[data-menu] a').first()).toBeFocused();

    await page.keyboard.press("Escape");
    await expect(panel).toBeHidden();
    await expect(summary).toBeFocused();
  });
});

test.describe("opt-in JS: details tab order (WebKit shim)", () => {
  test("open panel descendants get tabindex=0 and are reachable by Tab in every engine", async ({ page }) => {
    await page.goto("/demo/");
    const summary = page.locator('details[data-menu] summary');
    const link = page.locator('details[data-menu] a').first();

    await expect(link).not.toHaveAttribute("tabindex", /.*/);

    await summary.focus();
    await page.keyboard.press("Enter");
    await expect(link).toHaveAttribute("tabindex", "0");

    // Tab lands on the panel link — the WebKit-skipped case is the point.
    await summary.focus();
    await page.keyboard.press("Tab");
    await expect(link).toBeFocused();
  });

  test("already-open details are fixed at init; closed ones stay untouched", async ({ page }) => {
    const markup = `
      <details open>
        <summary>Open</summary>
        <a href="#">inside one</a>
      </details>
      <details>
        <summary>Closed</summary>
        <a href="#">inside two</a>
      </details>`;
    await page.setContent(markup);
    await page.addScriptTag({ path: "./dist/js/details-tabindex.js", type: "module" });

    await expect(page.locator('details[open] a')).toHaveAttribute("tabindex", "0");
    await expect(page.locator("details:not([open]) a")).not.toHaveAttribute("tabindex", /.*/);
  });

  test("deliberate tabindex=-1 is preserved", async ({ page }) => {
    const markup = `
      <details open>
        <summary>Open</summary>
        <a href="#">normal</a>
        <a href="#" tabindex="-1">removed</a>
      </details>`;
    await page.setContent(markup);
    await page.addScriptTag({ path: "./dist/js/details-tabindex.js", type: "module" });

    await expect(page.locator('a:has-text("normal")')).toHaveAttribute("tabindex", "0");
    await expect(page.locator('a:has-text("removed")')).toHaveAttribute("tabindex", "-1");
  });
});

test.describe("opt-in JS: popover menu keyboard support", () => {
  test("opens focus-first, arrows move, Esc closes and focus returns to trigger", async ({ page }) => {
    await page.goto("/demo/");
    const trigger = page.getByRole("button", { name: "Popover menu" });
    const pop = page.locator("#help-pop");
    const items = pop.locator("a");

    await trigger.click();
    await expect(pop).toBeVisible();
    await expect(items.nth(0)).toBeFocused();

    await page.keyboard.press("ArrowDown");
    await expect(items.nth(1)).toBeFocused();
    await page.keyboard.press("ArrowDown");
    await expect(items.nth(2)).toBeFocused();
    await page.keyboard.press("ArrowUp");
    await expect(items.nth(1)).toBeFocused();

    await page.keyboard.press("End");
    await expect(items.nth(2)).toBeFocused();
    await page.keyboard.press("Home");
    await expect(items.nth(0)).toBeFocused();

    await page.keyboard.press("Escape");
    await expect(pop).toBeHidden();
    await expect(trigger).toBeFocused();
  });
});

test.describe("opt-in JS: anchored popover off-screen guard", () => {
  test("script-open with the trigger off-screen closes the popover (no viewport-edge clamp)", async ({ page }) => {
    await page.goto("/demo/");
    const trigger = page.locator("#help-trigger");
    const pop = page.locator("#help-pop");

    // Scroll the trigger fully below the viewport (its top edge just past
    // the bottom). `behavior: "instant"` matters — the page scrolls smooth.
    await trigger.evaluate((el) => {
      const r = el.getBoundingClientRect();
      window.scrollTo({
        top: window.scrollY + r.top - (window.innerHeight + 100),
        behavior: "instant",
      });
    });

    await page.evaluate(() => document.querySelector("#help-pop").showPopover());

    // The guard closes it immediately, so it can't be clamped to the
    // viewport edge (Firefox 153) or pinned off-screen (Chromium/WebKit).
    await expect(pop).not.toBeVisible();
    await expect
      .poll(() =>
        page.evaluate(() => document.querySelector("#help-pop").matches(":popover-open"))
      )
      .toBe(false);
  });

  test("a trigger in view still opens its popover (guard doesn't over-hide)", async ({ page }) => {
    await page.goto("/demo/");
    const trigger = page.locator("#help-trigger");
    const pop = page.locator("#help-pop");

    // Normal click-to-open, trigger in view — untouched by the guard.
    await trigger.click();
    await expect(pop).toBeVisible();

    // Programmatic open with the trigger scrolled into view — also kept.
    await pop.evaluate((el) => el.hidePopover());
    await trigger.evaluate((el) => el.scrollIntoView({ block: "center" }));
    await page.evaluate(() => document.querySelector("#help-pop").showPopover());
    await expect(pop).toBeVisible();
  });
});

test.describe("opt-in JS: carousel controls + autoplay", () => {
  // A synthetic scroller so the test never depends on the demo's layout
  // or the demo carousel's lack of autoplay. Re-imports the already-loaded
  // module and inits only this element.
  const buildCarousel = (opts = "") => `
    <div data-carousel data-autoplay="200" ${opts} style="display:flex;overflow-x:auto;width:600px">
      <div style="flex:0 0 60%;height:2rem">a</div>
      <div style="flex:0 0 60%;height:2rem">b</div>
      <div style="flex:0 0 60%;height:2rem">c</div>
      <div style="flex:0 0 60%;height:2rem">d</div>
    </div>`;

  const initCarousel = (page) =>
    page.evaluate(async () => {
      const el = document.getElementById("auto-c");
      const m = await import("/dist/js/carousel.js");
      m.initCarousels(el);
    });

  test("module marks the scroller role=group + aria-roledescription", async ({ page }) => {
    await page.goto("/demo/");
    const carousel = page.locator("#demo-carousel");
    await expect(carousel).toHaveAttribute("role", "group");
    await expect(carousel).toHaveAttribute("aria-roledescription", "carousel");
  });

  test("prev/next controls scroll and wrap (instant under reduced motion)", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/demo/");
    const carousel = page.locator("#demo-carousel");
    const left = () => carousel.evaluate((el) => el.scrollLeft);

    await expect.poll(left).toBe(0);
    await page.getByRole("button", { name: "Next slide" }).click();
    await expect.poll(left).toBeGreaterThan(0);
    await page.getByRole("button", { name: "Previous slide" }).click();
    await expect.poll(left).toBeLessThan(5);

    // 4 slides → 4 forwards wraps back to the start.
    for (let i = 0; i < 4; i++) {
      await page.getByRole("button", { name: "Next slide" }).click();
    }
    await expect.poll(left).toBeLessThan(5);
  });

  test("autoplay advances the scroller", async ({ page }) => {
    await page.goto("/demo/");
    await page.evaluate((markup) => {
      const wrap = document.createElement("div");
      wrap.innerHTML = markup;
      const el = wrap.firstElementChild;
      el.id = "auto-c";
      document.body.appendChild(el);
      // Record the module's scrollTo calls: headless Firefox does not run
      // smooth-scroll animations, so assert the contract (it initiates a
      // forward scroll) instead of the animated scrollLeft.
      window.__scrolls = [];
      const native = el.scrollTo.bind(el);
      el.scrollTo = (opts) => {
        window.__scrolls.push(opts.left);
        native(opts);
      };
    }, buildCarousel());
    await initCarousel(page);

    // data-autoplay="200" is clamped to a 1000ms floor; wait past the first fire.
    await page.waitForTimeout(1600);
    const calls = await page.evaluate(() => window.__scrolls);
    expect(calls.length).toBeGreaterThan(0);
    expect(calls[0]).toBeGreaterThan(0);
  });

  test("autoplay stays off under prefers-reduced-motion", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/demo/");
    await page.evaluate((markup) => {
      const wrap = document.createElement("div");
      wrap.innerHTML = markup;
      wrap.firstElementChild.id = "auto-c";
      document.body.appendChild(wrap.firstElementChild);
    }, buildCarousel());
    await initCarousel(page);

    // Must outlast the 1000ms autoplay floor to prove no timer ever starts.
    await page.waitForTimeout(1600);
    await expect.poll(() => page.$eval("#auto-c", (el) => el.scrollLeft)).toBe(0);
  });
});
