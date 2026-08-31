/* Barefoot — opt-in JS modules.
   Tests every enhancement shipped in dist/js/ (loaded by the demo):
   WAI-ARIA tabs, popover-menu keyboard, carousel autoplay + controls,
   chips, nav hamburger, theme persistence — plus the lifecycle seam
   itself and barrel completeness.

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
    const group = page.locator(DEMOS.demoTabs);
    await expect(group).toHaveAttribute("data-bf-tabs-js", "");
    await expect(group.locator('[role="tabpanel"]').nth(0)).toBeVisible();
    await expect(group.locator('[role="tabpanel"]').nth(1)).toBeHidden();
    await expect(group.locator('[role="tabpanel"]').nth(2)).toBeHidden();
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
    // no double state flips). Demo markup is complete — anything that
    // produces warnings means double-binding noise.
    await page.evaluate(async () => {
      for (const name of [
        "tabs",
        "popover-menu",
        "carousel",
        "alert-dismiss",
        "chips",
        "nav",
        "table-sort",
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
      "re-init must stay silent"
    ).toEqual([]);
  });
});

test.describe("opt-in JS: warnOnce seam", () => {
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
});

test.describe("opt-in JS: sortable tables", () => {
  const rows = (page) =>
    page.locator(`${DEMOS.demoSortTable} tbody tr`).evaluateAll((trs) =>
      trs.map((tr) => [...tr.cells].map((td) => td.textContent.trim()))
    );

  test("numeric column sorts by value, not lexicographically", async ({ page }) => {
    await gotoDemo(page);
    const pointsBtn = page.locator(`${DEMOS.demoSortTable} thead th button`).nth(2);

    // 3, 12, 5, 1 in source order — a string sort would put 12 after 1.
    await pointsBtn.click();
    expect(await rows(page)).toEqual([
      ["Regen visual baselines", "Radia", "1"],
      ["Ship segmented control", "Ada", "3"],
      ["Draft migration notes", "Lin", "5"],
      ["Audit contrast pairs", "Grace", "12"],
    ]);
    await expect(
      page.locator(`${DEMOS.demoSortTable} thead th`).nth(2)
    ).toHaveAttribute("aria-sort", "ascending");

    // Same header again → descending.
    await pointsBtn.click();
    expect((await rows(page)).map((r) => r[2])).toEqual(["12", "5", "3", "1"]);
    await expect(
      page.locator(`${DEMOS.demoSortTable} thead th`).nth(2)
    ).toHaveAttribute("aria-sort", "descending");
  });

  test("switching columns moves aria-sort, never two at once", async ({ page }) => {
    await gotoDemo(page);
    const heads = page.locator(`${DEMOS.demoSortTable} thead th`);
    await page.locator(`${DEMOS.demoSortTable} thead th button`).first().click();
    await expect(heads.nth(0)).toHaveAttribute("aria-sort", "ascending");
    await page.locator(`${DEMOS.demoSortTable} thead th button`).nth(1).click();
    await expect(heads.nth(0)).not.toHaveAttribute("aria-sort");
    await expect(heads.nth(1)).toHaveAttribute("aria-sort", "ascending");

    // Text comparison for a text column.
    const owners = await rows(page);
    expect(owners.map((r) => r[1])).toEqual([...owners.map((r) => r[1])].sort((a, b) => a.localeCompare(b)));
  });

  test("no-JS-first contract: without the module, nothing sorts", async ({ page }) => {
    // Minimal page on the dev-server origin with ONLY the table —
    // no barefoot.js import. Rows must stay put; nothing arms.
    await page.route("**/barefoot-sort-fixture.html", (route) =>
      route.fulfill({
        contentType: "text/html",
        body: `<!doctype html><html><head><link rel="stylesheet" href="/dist/full.css"></head><body>
          <table id="fx" data-bf-sort>
            <thead><tr><th><button type="button">Points</button></th></tr></thead>
            <tbody><tr><td>2</td></tr><tr><td>10</td></tr><tr><td>1</td></tr></tbody>
          </table></body></html>`,
      })
    );
    await page.goto("/barefoot-sort-fixture.html");
    await page.locator("#fx thead button").click();
    const order = await page
      .locator("#fx tbody tr")
      .evaluateAll((trs) => trs.map((tr) => tr.cells[0].textContent.trim()));
    expect(order).toEqual(["2", "10", "1"]); // untouched

    // Importing the module arms it retroactively — progressive enhancement.
    await page.evaluate(() => import("/dist/js/table-sort.js"));
    await page.locator("#fx thead button").click();
    const sorted = await page
      .locator("#fx tbody tr")
      .evaluateAll((trs) => trs.map((tr) => tr.cells[0].textContent.trim()));
    expect(sorted).toEqual(["1", "2", "10"]);
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
    for (const name of ["nav", "popover-menu"]) {
      const src = fs.readFileSync(path.join(rootDir, "src/js", `${name}.js`), "utf8");
      expect(src, `${name}.js delegates close-refocus`).toContain(
        'from "./return-focus.js"'
      );
    }
  });
});

test.describe("opt-in JS: theme persistence", () => {
  test("click applies the theme, stores it, and reload restores the choice", async ({ page }) => {
    await gotoDemo(page);
    await page.getByRole("button", { name: "Dark" }).click();
    await expect(page.locator("html")).toHaveAttribute("data-bf-theme", "dark");
    const stored = await page.evaluate(() =>
      localStorage.getItem("barefoot-theme")
    );
    expect(stored).toBe("dark");
    await page.reload();
    await expect(page.locator("html")).toHaveAttribute("data-bf-theme", "dark");
  });

  test("auto hands control back to the OS and the reset survives reload", async ({ page }) => {
    await gotoDemo(page);
    await page.getByRole("button", { name: "Forest" }).click();
    await expect(page.locator("html")).toHaveAttribute("data-bf-theme", "forest");
    await page.getByRole("button", { name: "Auto", exact: true }).click();
    await expect(page.locator("html")).toHaveAttribute("data-bf-theme", "auto");
    await page.reload();
    await expect(page.locator("html")).toHaveAttribute("data-bf-theme", "auto");
  });

  test("re-init on armed markup changes nothing (bindOnce)", async ({ page }) => {
    await gotoDemo(page);
    await page.evaluate(async () => {
      const { initTheme } = await import("/dist/js/theme.js");
      initTheme();
      initTheme();
    });
    await page.getByRole("button", { name: "Contrast" }).click();
    await expect(page.locator("html")).toHaveAttribute("data-bf-theme", "contrast");
  });

  test("setTheme warns on and ignores invalid names", async ({ page }) => {
    await gotoDemo(page);
    const warnings = [];
    page.on("console", (msg) => {
      if (msg.type() === "warning") warnings.push(msg.text());
    });
    await page.evaluate(async () => {
      const { setTheme } = await import("/dist/js/theme.js");
      setTheme("not a theme!");
    });
    await expect(page.locator("html")).toHaveAttribute("data-bf-theme", "auto");
    expect(warnings.some((text) => text.includes("[barefoot-css]"))).toBe(true);
  });

  test("a corrupted stored value is ignored; the markup default stands", async ({ page }) => {
    await gotoDemo(page);
    await page.evaluate(() =>
      localStorage.setItem("barefoot-theme", "dark; alert(1)")
    );
    await page.reload();
    await expect(page.locator("html")).toHaveAttribute("data-bf-theme", "auto");
  });

  test("no-JS first: fixture buttons stay inert without the module", async ({ page }) => {
    await mountFixture(
      page,
      `<button type="button" data-bf-theme-btn="dark">Go dark</button>`
    );
    await page.getByRole("button", { name: "Go dark" }).click();
    // The fixture document has no data-bf-theme attribute of its own —
    // the contract is that clicking stays inert, so none appears.
    await expect(page.locator("html")).not.toHaveAttribute("data-bf-theme", /.+/);
    const stored = await page.evaluate(() =>
      localStorage.getItem("barefoot-theme")
    );
    expect(stored).toBeNull();
  });
});
