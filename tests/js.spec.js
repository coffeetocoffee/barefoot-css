/* Barefoot — opt-in JS modules.
   Tests every enhancement shipped in dist/js/ (loaded by the demo):
   WAI-ARIA tabs, details Esc-close + tab order, popover-menu keyboard,
   carousel autoplay + controls, chips, nav hamburger — plus the
   lifecycle seam itself and barrel completeness.

   npm run test:js */
import { test, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { DEMOS, gotoDemo, mountFixture } from "./helpers.js";

test.describe("opt-in JS: tabs", () => {
  test("click switches panels and aria-selected", async ({ page }) => {
    await gotoDemo(page);
    const tabs = page.locator('[data-bf-tabs] [role="tab"]');
    const panels = page.locator('[data-bf-tabs] [role="tabpanel"]');

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
    await gotoDemo(page);
    const tabs = page.locator('[data-bf-tabs] [role="tab"]');
    const panels = page.locator('[data-bf-tabs] [role="tabpanel"]');

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
    <div data-bf-tabs>
      <div role="tablist" aria-label="fixture">
        <button role="tab" aria-selected="true">One</button>
        <button role="tab" aria-selected="false">Two</button>
      </div>
      <div role="tabpanel">panel one</div>
      <div role="tabpanel">panel two</div>
    </div>`;

  test("without the module, every panel stays visible (content never lost)", async ({ page }) => {
    await mountFixture(page, markup);
    const panels = page.locator('[data-bf-tabs] [role="tabpanel"]');
    await expect(panels.nth(0)).toBeVisible();
    await expect(panels.nth(1)).toBeVisible();
    await expect(page.locator("[data-bf-tabs]")).not.toHaveAttribute("data-bf-tabs-js", /.*/);
  });

  test("with the module, the group is marked and inactive panels hide at init", async ({ page }) => {
    await gotoDemo(page);
    const group = page.locator("[data-bf-tabs]");
    await expect(group).toHaveAttribute("data-bf-tabs-js", "");
    await expect(group.locator('[role="tabpanel"]').nth(0)).toBeVisible();
    await expect(group.locator('[role="tabpanel"]').nth(1)).toBeHidden();
    await expect(group.locator('[role="tabpanel"]').nth(2)).toBeHidden();
  });
});

test.describe("opt-in JS: details Esc-close", () => {
  test("Esc from inside a details menu closes it and returns focus to summary", async ({ page }) => {
    await gotoDemo(page);
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
    await gotoDemo(page);
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
    await mountFixture(page, markup);
    // The demo's autoload already cached the module — invoke the named
    // export to initialize this fresh fixture.
    await page.evaluate(async () => {
      const m = await import("/dist/js/details-tabindex.js");
      m.initDetailsTabIndex();
    });

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
    await mountFixture(page, markup);
    await page.evaluate(async () => {
      const m = await import("/dist/js/details-tabindex.js");
      m.initDetailsTabIndex();
    });

    await expect(page.locator('a:has-text("normal")')).toHaveAttribute("tabindex", "0");
    await expect(page.locator('a:has-text("removed")')).toHaveAttribute("tabindex", "-1");
  });
});

test.describe("opt-in JS: popover menu keyboard support", () => {
  test("opens focus-first, arrows move, Esc closes and focus returns to trigger", async ({ page }) => {
    await gotoDemo(page);
    const trigger = page.getByRole("button", { name: "Popover menu" });
    const pop = page.locator(DEMOS.helpPop);
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

  test("Tab closes even with an empty roster (declared in ADR-0006)", async ({
    page,
  }) => {
    // A menu whose only focusable content is not a roster item (a
    // filter input): the old inline math no-op'd Tab here as a side
    // effect of its empty-list guard; close-on-Tab is the contract.
    await mountFixture(
      page,
      `<button popovertarget="empty-pop">Menu</button>
       <div popover data-kind="menu" id="empty-pop">
         <input aria-label="Filter items">
       </div>`
    );
    await page.evaluate(async () => {
      const { initPopoverMenus } = await import("/dist/js/popover-menu.js");
      initPopoverMenus();
    });
    const pop = page.locator("#empty-pop");
    const trigger = page.getByRole("button", { name: "Menu" });

    await trigger.click();
    await expect(pop).toBeVisible();
    await page.locator("#empty-pop input").focus();

    await page.keyboard.press("Tab");
    await expect(pop).toBeHidden();
    await expect(trigger).toBeFocused();
  });
});

test.describe("opt-in JS: anchored popover off-screen guard", () => {
  test("script-open with the trigger off-screen closes the popover (no viewport-edge clamp)", async ({ page }) => {
    await gotoDemo(page);
    const trigger = page.locator(DEMOS.helpTrigger);
    const pop = page.locator(DEMOS.helpPop);

    // Scroll the trigger fully below the viewport (its top edge just past
    // the bottom). `behavior: "instant"` matters — the page scrolls smooth.
    await trigger.evaluate((el) => {
      const r = el.getBoundingClientRect();
      window.scrollTo({
        top: window.scrollY + r.top - (window.innerHeight + 100),
        behavior: "instant",
      });
    });

    await page.evaluate((pop) => document.querySelector(pop).showPopover(), DEMOS.helpPop);

    // The guard closes it immediately, so it can't be clamped to the
    // viewport edge (Firefox 153) or pinned off-screen (Chromium/WebKit).
    await expect(pop).not.toBeVisible();
    await expect
      .poll(() =>
        page.evaluate((pop) => document.querySelector(pop).matches(":popover-open"), DEMOS.helpPop)
      )
      .toBe(false);
  });

  test("a trigger in view still opens its popover (guard doesn't over-hide)", async ({ page }) => {
    await gotoDemo(page);
    const trigger = page.locator(DEMOS.helpTrigger);
    const pop = page.locator(DEMOS.helpPop);

    // Normal click-to-open, trigger in view — untouched by the guard.
    await trigger.click();
    await expect(pop).toBeVisible();

    // Programmatic open with the trigger scrolled into view — also kept.
    await pop.evaluate((el) => el.hidePopover());
    await trigger.evaluate((el) => el.scrollIntoView({ block: "center" }));
    await page.evaluate((pop) => document.querySelector(pop).showPopover(), DEMOS.helpPop);
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
    await gotoDemo(page);
    const carousel = page.locator(DEMOS.demoCarousel);
    await expect(carousel).toHaveAttribute("role", "group");
    await expect(carousel).toHaveAttribute("aria-roledescription", "carousel");
  });

  test("prev/next controls scroll and wrap (instant under reduced motion)", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await gotoDemo(page);
    const carousel = page.locator(DEMOS.demoCarousel);
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
    await gotoDemo(page);
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
    await gotoDemo(page);
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

test.describe("opt-in JS: removable chips", () => {
  test("clicking the remove button removes its chip", async ({ page }) => {
    await gotoDemo(page);
    const chips = page.locator(`${DEMOS.demoChips} [data-chip]`);
    await expect(chips).toHaveCount(4);

    await page.locator('[data-chip-remove][aria-label="Remove css"]').click();

    await expect(chips).toHaveCount(3);
    await expect(page.locator(`${DEMOS.demoChips} [data-chip]`, { hasText: "css" })).toHaveCount(0);
  });

  test("remove controls are real buttons with a name each", async ({ page }) => {
    await gotoDemo(page);
    const buttons = page.locator(`${DEMOS.demoChips} [data-chip-remove]`);
    for (const btn of await buttons.all()) {
      const label = await btn.getAttribute("aria-label");
      expect(label).toMatch(/^Remove .+/);
    }
  });
});

test.describe("opt-in JS: chips no-JS-first contract", () => {
  const markup = `
    <link rel="stylesheet" href="/dist/components/chip.css">
    <span data-chip>css<button type="button" data-chip-remove aria-label="Remove css">×</button></span>`;

  test("without the module the chip stays (nothing hides)", async ({ page }) => {
    await mountFixture(page, markup);
    await page.locator("[data-chip-remove]").click();
    await expect(page.locator("[data-chip]")).toBeVisible();
  });
});

test.describe("opt-in JS: header nav hamburger", () => {
  test("narrow: toggle opens and closes, aria-expanded tracks state", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await gotoDemo(page);
    const nav = page.locator(DEMOS.demoNavBurger);
    const toggle = nav.locator(".bf-nav-toggle");
    const list = nav.locator(DEMOS.demoNavMenu);

    await expect(nav).toHaveAttribute("data-nav-js", "");
    await expect(toggle).toBeVisible();
    await expect(list).toBeHidden();
    await expect(toggle).toHaveAttribute("aria-expanded", "false");

    await toggle.click();
    await expect(nav).toHaveAttribute("data-open", "");
    await expect(toggle).toHaveAttribute("aria-expanded", "true");
    await expect(list).toBeVisible();

    await toggle.click();
    await expect(nav).not.toHaveAttribute("data-open");
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
    await expect(list).toBeHidden();
  });

  test("narrow: Esc closes an open menu and restores focus to the toggle", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await gotoDemo(page);
    const nav = page.locator(DEMOS.demoNavBurger);
    const toggle = nav.locator(".bf-nav-toggle");

    await toggle.click();
    const link = nav.locator(`${DEMOS.demoNavMenu} a`).first();
    await link.focus();
    await page.keyboard.press("Escape");

    await expect(nav).not.toHaveAttribute("data-open");
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
    await expect(toggle).toBeFocused();
  });

  test("narrow: activating a link closes the menu", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await gotoDemo(page);
    const nav = page.locator(DEMOS.demoNavBurger);
    const toggle = nav.locator(".bf-nav-toggle");

    await toggle.click();
    await nav.locator(`${DEMOS.demoNavMenu} a[href="${DEMOS.typography}"]`).click();

    await expect(nav).not.toHaveAttribute("data-open");
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
  });

  test("wide: list always visible, toggle hidden", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await gotoDemo(page);
    const nav = page.locator(DEMOS.demoNavBurger);
    await expect(nav.locator(DEMOS.demoNavMenu)).toBeVisible();
    await expect(nav.locator(".bf-nav-toggle")).toBeHidden();
  });
});

test.describe("opt-in JS: nav no-JS-first contract", () => {
  const markup = `
    <link rel="stylesheet" href="/dist/components/nav.css">
    <nav data-nav="header" aria-label="fixture">
      <a class="bf-brand" href="/">Acme</a>
      <button type="button" class="bf-nav-toggle" aria-expanded="false" aria-controls="m">Menu</button>
      <ul id="m"><li><a href="/">Home</a></li></ul>
    </nav>`;

  test("without the module nothing hides even on a narrow container", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await mountFixture(page, markup);
    await expect(page.locator("nav ul")).toBeVisible();
    await expect(page.locator(".bf-nav-toggle")).toBeHidden(); // never rendered without JS
    await expect(page.locator("nav")).not.toHaveAttribute("data-nav-js", /.*/);
  });

  test("a plain header nav (no toggle) is never armed for collapse", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await gotoDemo(page);
    // #demo-nav has no .bf-nav-toggle — the module must leave it alone.
    await expect(page.locator(DEMOS.demoNav)).not.toHaveAttribute("data-nav-js", /.*/);
    await expect(page.locator(`${DEMOS.demoNav} > ul`)).toBeVisible();
  });
});

test.describe("opt-in JS: lifecycle seam", () => {
  test("bindOnce is a per element+name guard; onDomReady runs when ready", async ({ page }) => {
    await gotoDemo(page);
    const result = await page.evaluate(async () => {
      const m = await import("/dist/js/lifecycle.js");
      const el = document.createElement("div");
      return {
        first: m.bindOnce(el, "x"),
        second: m.bindOnce(el, "x"),
        otherName: m.bindOnce(el, "y"),
        ready: document.readyState !== "loading",
      };
    });
    expect(result).toEqual({ first: true, second: false, otherName: true, ready: true });
  });

  test("manual re-init after autoload changes nothing and breaks nothing", async ({ page }) => {
    await gotoDemo(page);
    const warnings = [];
    page.on("console", (msg) => {
      if (msg.type() === "warning") warnings.push(msg.text());
    });

    // Every behavior module re-inits itself against already-wired markup;
    // bindOnce guards must make each call a no-op (no stacked listeners,
    // no double state flips). Demo markup is complete, so the 3.2
    // deprecation notices fired once at autoload — they are the only
    // allowed warnings; anything else means double-binding noise.
    await page.evaluate(async () => {
      for (const name of [
        "tabs",
        "details-close",
        "details-tabindex",
        "popover-menu",
        "popover-anchor",
        "carousel",
        "alert-dismiss",
        "chips",
        "nav",
      ]) {
        const m = await import(`/dist/js/${name}.js`);
        for (const fn of Object.values(m)) {
          if (typeof fn === "function") fn();
        }
      }
    });

    // A wired tab still behaves exactly once.
    const tabs = page.locator('[data-bf-tabs] [role="tab"]');
    await tabs.nth(2).click();
    await expect(tabs.nth(2)).toHaveAttribute("aria-selected", "true");
    await expect(tabs.nth(0)).toHaveAttribute("aria-selected", "false");

    expect(
      warnings.filter((w) => !w.includes("[barefoot-css]")),
      "re-init must stay silent apart from the one-time deprecation notices"
    ).toEqual([]);
  });
});

test.describe("opt-in JS: deprecation notices (3.2 wave)", () => {
  const rootDir = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

  // A minimal page served from the dev-server origin so /dist/js/*
  // resolve, with exactly the deprecated markup under test (or none).
  function fixtureRoute(page, body) {
    return page.route("**/barefoot-deprecation-fixture.html", (route) =>
      route.fulfill({
        contentType: "text/html",
        body: `<!doctype html><html><head><script type="module">
            Promise.all([
              import("/dist/js/details-close.js"),
              import("/dist/js/details-tabindex.js"),
              import("/dist/js/popover-anchor.js"),
            ]).then(() => { window.__modulesReady = true; });
          </scr` + `ipt></head><body>${body}</body></html>`,
      })
    );
  }

  const DEPRECATED_MARKUP = `
    <details data-menu open>
      <summary>Actions</summary>
      <div><a href="#">Edit</a></div>
    </details>
    <button type="button" popovertarget="fixture-pop">Open</button>
    <div id="fixture-pop" popover>…</div>`;

  async function collectWarnings(page, body) {
    await fixtureRoute(page, body);
    const warnings = [];
    page.on("console", (msg) => {
      if (msg.type() === "warning") warnings.push(msg.text());
    });
    await page.goto("/barefoot-deprecation-fixture.html");
    await page.waitForFunction(() => window.__modulesReady === true);
    return warnings;
  }

  test("arming against every announced surface warns once per module", async ({ page }) => {
    const warnings = await collectWarnings(page, DEPRECATED_MARKUP);

    for (const module of [
      "js/details-close.js",
      "js/details-tabindex.js",
      "js/popover-anchor.js",
    ]) {
      expect(
        warnings.filter((w) => w.includes(module)),
        `exactly one notice from ${module}`
      ).toHaveLength(1);
    }
    expect(warnings.filter((w) => w.includes("[barefoot-css]"))).toHaveLength(3);
  });

  test("notices name the removal version and the replacement", async ({ page }) => {
    const warnings = await collectWarnings(page, DEPRECATED_MARKUP);

    const close = warnings.find((w) => w.includes("details-close"));
    expect(close).toContain("v4.0");
    expect(close).toContain("popover");

    for (const w of [warnings.find((x) => x.includes("tabindex")), warnings.find((x) => x.includes("popover-anchor"))]) {
      expect(w).toContain("Removal candidate");
      expect(w).toContain("v4.0");
    }
  });

  test("a fresh copy of a module stays silent — notices are once per page", async ({ page }) => {
    const warnings = await collectWarnings(page, DEPRECATED_MARKUP);

    // Cache-busted import runs the module again on the same document;
    // the shared lifecycle Set (relative ./lifecycle.js resolves without
    // the query) keeps every key at one warning per page.
    await page.evaluate(() => import("/dist/js/details-close.js?once-per-page"));

    expect(warnings.filter((w) => w.includes("[barefoot-css]"))).toHaveLength(3);
  });

  test("a page using none of the announced surfaces stays fully silent", async ({ page }) => {
    const warnings = await collectWarnings(page, "<p>nothing deprecated here</p>");
    expect(warnings).toEqual([]);
  });

  test("warnOnce fires at most once per page per key, prefixed", async ({ page }) => {
    await gotoDemo(page);
    const fired = await page.evaluate(async () => {
      const m = await import("/dist/js/lifecycle.js");
      const seen = [];
      const original = console.warn;
      console.warn = (msg) => seen.push(String(msg));
      try {
        m.warnOnce("spec-key-a", "first");
        m.warnOnce("spec-key-a", "second");
        m.warnOnce("spec-key-b", "other key");
      } finally {
        console.warn = original;
      }
      return seen;
    });
    expect(fired).toEqual(["[barefoot-css] first", "[barefoot-css] other key"]);
  });

  test("notices stay scoped to the three announced modules", () => {
    const affected = new Set(["details-close", "details-tabindex", "popover-anchor"]);
    const files = fs
      .readdirSync(path.join(rootDir, "src/js"))
      .filter((f) => f.endsWith(".js") && f !== "lifecycle.js" && f !== "barefoot.js");
    for (const f of files) {
      const src = fs.readFileSync(path.join(rootDir, "src/js", f), "utf8");
      const name = f.replace(/\.js$/, "");
      if (affected.has(name)) {
        expect(src, `${f} must announce its deprecation`).toContain("warnOnce(");
      } else {
        expect(src, `${f} is not part of the 3.2 wave — no notice`).not.toContain(
          "warnOnce("
        );
      }
    }
  });
});

test.describe("opt-in JS barrel completeness", () => {
  test("barefoot.js imports every shipped behavior module (and only those)", () => {
    const rootDir = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
    const files = fs
      .readdirSync(path.join(rootDir, "src/js"))
      .filter((f) => f.endsWith(".js"));
    const behaviors = files
      .filter(
        (f) =>
          f !== "barefoot.js" &&
          !["lifecycle.js", "remove-on-click.js", "roving-index.js", "return-focus.js"].includes(f)
      )
      .sort();
    const barrel = fs.readFileSync(path.join(rootDir, "src/js/barefoot.js"), "utf8");
    const imported = [...barrel.matchAll(/import\s+"\.\/([\w-]+\.js)";/g)]
      .map((m) => m[1])
      .sort();

    expect(imported.length).toBeGreaterThan(0);
    expect(imported).toEqual(behaviors);
  });
});

test.describe("opt-in JS: removal factory", () => {
  test("chips and alert-dismiss are thin adapters over one shared behavior", () => {
    const rootDir = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
    for (const name of ["chips", "alert-dismiss"]) {
      const src = fs.readFileSync(path.join(rootDir, "src/js", `${name}.js`), "utf8");
      expect(src, `${name}.js delegates to the shared factory`).toContain(
        'from "./remove-on-click.js"'
      );
      expect(src, `${name}.js binds nothing itself`).not.toContain("addEventListener");
    }
    // The factory stays the one place that binds: dropping its
    // delegated listener would strand both adapters as no-ops.
    const factory = fs.readFileSync(
      path.join(rootDir, "src/js/remove-on-click.js"),
      "utf8"
    );
    expect(factory).toContain("addEventListener");
  });
});

test.describe("opt-in JS: keyboard seams", () => {
  const rootDir = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

  test("Arrow/Home/End math lives only in roving-index.js (ADR-0006)", () => {
    const rover = fs.readFileSync(
      path.join(rootDir, "src/js/roving-index.js"),
      "utf8"
    );
    expect(rover).toContain("export function createRover");
    // The whole point of the seam: the wrap/clamp math cannot drift
    // apart again if the arrow-key names exist in exactly one file —
    // so every OTHER module is scanned, not just today's consumers.
    const files = fs
      .readdirSync(path.join(rootDir, "src/js"))
      .filter((f) => f.endsWith(".js") && f !== "roving-index.js");
    for (const f of files) {
      const src = fs.readFileSync(path.join(rootDir, "src/js", f), "utf8");
      expect(src, `${f} re-implements arrow-key math`).not.toMatch(
        /Arrow(Left|Right|Up|Down)/
      );
    }
    for (const name of ["tabs", "popover-menu"]) {
      const src = fs.readFileSync(path.join(rootDir, "src/js", `${name}.js`), "utf8");
      expect(src, `${name}.js delegates to the shared rover`).toContain(
        'from "./roving-index.js"'
      );
    }
  });

  test("close-and-refocus lives only in return-focus.js (ADR-0006)", () => {
    const rf = fs.readFileSync(
      path.join(rootDir, "src/js/return-focus.js"),
      "utf8"
    );
    expect(rf).toContain("export function refocusOpener");
    // The containment guard is the semantic core: never steal focus
    // from wherever the user went after closing.
    expect(rf).toContain("contains(document.activeElement)");
    for (const name of ["nav", "details-close", "popover-menu"]) {
      const src = fs.readFileSync(path.join(rootDir, "src/js", `${name}.js`), "utf8");
      expect(src, `${name}.js delegates close-refocus`).toContain(
        'from "./return-focus.js"'
      );
    }
  });
});
