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
import { DEMOS, gotoDemo, gotoDataStory, gotoKeyboard, mountFixture } from "./helpers.js";

/* Subscribe on document before acting; the bf:* events bubble and report
   what the module did. Elements in detail are serialized in-page — a DOM
   node cannot cross the Playwright boundary. Shared by the v7.0 event
   contract block and the v7.2 composed fixture block. */
async function armEvents(page, types) {
  await page.evaluate((types) => {
    window.__bfEvents = [];
    const strip = (v) =>
      v instanceof Element
        ? { tag: v.tagName.toLowerCase(), text: v.textContent.trim().slice(0, 40) }
        : v;
    for (const t of types) {
      document.addEventListener(t, (e) => {
        window.__bfEvents.push({
          type: e.type,
          detail: Object.fromEntries(
            Object.entries(e.detail).map(([k, v]) => [k, strip(v)])
          ),
        });
      });
    }
  }, types);
}

const events = (page) => page.evaluate(() => window.__bfEvents);

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
          // lifecycle/remove-on-click/roving-index/return-focus are
          // internal plumbing (ADR-0002/0004/0006); verify.js +
          // verify-contracts.js are the Verify checker and its registry
          // (ADR-0015) — opt-in by import, never in the barrel.
          ![
            "lifecycle.js",
            "remove-on-click.js",
            "roving-index.js",
            "return-focus.js",
            "verify-contracts.js",
            "verify.js",
          ].includes(f)
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

test.describe("opt-in JS: the bf:* event contract (v7.0)", () => {
  const rootDir = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

  test("bf:themechange reports the new theme and the one it replaced", async ({ page }) => {
    await gotoDemo(page);
    await armEvents(page, ["bf:themechange"]);
    await page.getByRole("button", { name: "Dark" }).click();
    await expect.poll(() => events(page), { timeout: 4000 }).toEqual([
      { type: "bf:themechange", detail: { theme: "dark", from: "auto" } },
    ]);
    await page.getByRole("button", { name: "Contrast" }).click();
    await expect.poll(() => events(page), { timeout: 4000 }).toEqual([
      { type: "bf:themechange", detail: { theme: "dark", from: "auto" } },
      { type: "bf:themechange", detail: { theme: "contrast", from: "dark" } },
    ]);
  });

  test("bf:tabactivate reports the index plus the tab and panel ids", async ({ page }) => {
    await gotoDemo(page);
    await armEvents(page, ["bf:tabactivate"]);
    await page.locator('[data-bf-tabs] [role="tab"]').nth(1).click();
    await expect.poll(() => events(page), { timeout: 4000 }).toEqual([
      {
        type: "bf:tabactivate",
        detail: { index: 1, tab: "tab-details", panel: "panel-details" },
      },
    ]);
  });

  test("bf:sort reports the column index and direction on each click", async ({ page }) => {
    await gotoDemo(page);
    await armEvents(page, ["bf:sort"]);
    const points = page
      .locator(`${DEMOS.demoSortTable} thead th button`)
      .nth(2);
    await points.click();
    await points.click();
    await expect.poll(() => events(page), { timeout: 4000 }).toEqual([
      { type: "bf:sort", detail: { column: 2, direction: "asc" } },
      { type: "bf:sort", detail: { column: 2, direction: "desc" } },
    ]);
  });

  test("bf:chipremove fires on the chip while it is still in the tree", async ({ page }) => {
    await gotoDemo(page);
    await armEvents(page, ["bf:chipremove"]);
    await page
      .locator(`${DEMOS.demoChips} [data-chip-remove][aria-label="Remove css"]`)
      .click();
    const got = await events(page);
    expect(got).toHaveLength(1);
    expect(got[0].type).toBe("bf:chipremove");
    expect(got[0].detail.chip.tag).toBe("span");
    expect(got[0].detail.chip.text).toContain("css");
  });

  test("bf:alertdismiss fires when the notice is dismissed", async ({ page }) => {
    await gotoDemo(page);
    await armEvents(page, ["bf:alertdismiss"]);
    await page.locator("[data-alert-dismiss]").first().click();
    const got = await events(page);
    expect(got).toHaveLength(1);
    expect(got[0].type).toBe("bf:alertdismiss");
    expect(got[0].detail.alert.tag).toBe("div");
  });

  test("bf:toastdismiss fires when the timer expires (not on manual close)", async ({ page }) => {
    await gotoDemo(page);
    await armEvents(page, ["bf:toastdismiss"]);
    await page.locator(DEMOS.toastAutoTrigger).click();
    // The auto-dismiss toast has a 3s duration; the event fires before
    // the hide, so a listener still sees the open toast.
    await expect
      .poll(async () => (await events(page)).length, { timeout: 8000 })
      .toBeGreaterThanOrEqual(1);
    const got = await events(page);
    expect(got.every((e) => e.type === "bf:toastdismiss")).toBe(true);
    expect(got[0].detail.toast.tag).toBe("div");
  });

  test("events are observational: listeners cannot cancel a removal", async ({ page }) => {
    await gotoDemo(page);
    await page.evaluate(() => {
      document.addEventListener("bf:chipremove", (e) => e.preventDefault());
    });
    const chip = page.locator(`${DEMOS.demoChips} [data-chip]`).first();
    const before = await page.locator(`${DEMOS.demoChips} [data-chip]`).count();
    await chip.locator("[data-chip-remove]").click();
    await expect
      .poll(async () => page.locator(`${DEMOS.demoChips} [data-chip]`).count())
      .toBe(before - 1);
  });

  test("every emitted event name and payload is documented", () => {
    // Docs-from-source for the event contract: each name a module
    // dispatches must appear in docs/javascript.md.
    const docs = fs.readFileSync(
      path.join(rootDir, "docs/javascript.md"),
      "utf8"
    );
    for (const name of [
      "bf:themechange",
      "bf:tabactivate",
      "bf:sort",
      "bf:chipremove",
      "bf:alertdismiss",
      "bf:toastdismiss",
      "bf:filterclear",
    ]) {
      expect(docs, `${name} missing from docs/javascript.md`).toContain(name);
    }
  });

  test("modules dispatch through the shared emit seam, never ad-hoc CustomEvents", () => {
    for (const name of [
      "theme",
      "tabs",
      "table-sort",
      "toast",
      "filter-clear",
      "remove-on-click",
    ]) {
      const src = fs.readFileSync(path.join(rootDir, "src/js", `${name}.js`), "utf8");
      expect(src, `${name}.js dispatches through lifecycle emit`).toContain(
        'from "./lifecycle.js"'
      );
      expect(src, `${name}.js builds its own CustomEvent`).not.toContain(
        "new CustomEvent"
      );
    }
  });
});


test.describe("opt-in JS: the composed data fixture (v7.2)", () => {
  /* demo/data-story.html is the proof page: the app owns selection and
     filter state, js/table-sort.js sorts, and CSS paints. These pin the
     composition — the module side of the contract, plus the demo's
     select-all wiring. */
  test("sorting the composed table reports bf:sort", async ({ page }) => {
    await gotoDataStory(page);
    await armEvents(page, ["bf:sort"]);
    // The 4th button is "Deploys"; its th.cellIndex is 4 because the
    // select-all checkbox header counts too.
    await page.locator(`${DEMOS.dataStoryTable} thead th button`).nth(3).click();
    await expect.poll(() => events(page), { timeout: 4000 }).toEqual([
      { type: "bf:sort", detail: { column: 4, direction: "asc" } },
    ]);
    // The module keeps the semantic attribute truthful on the table.
    await expect(
      page.locator(`${DEMOS.dataStoryTable} thead th`).nth(4)
    ).toHaveAttribute("aria-sort", "ascending");
  });

  test("row selection toggles aria-selected, the count, and the bulk bar", async ({ page }) => {
    await gotoDataStory(page);
    const row = page.locator(`${DEMOS.dataStoryBody} tr`).first();
    const box = row.locator("input[type=checkbox]");
    const bar = page.locator(DEMOS.dataStoryBulkBar);

    await expect(bar).toHaveCSS("display", "none");
    await box.click();
    await expect(row).toHaveAttribute("aria-selected", "true");
    await expect(bar).toBeVisible();
    await expect(page.locator(DEMOS.dataStoryCount)).toHaveText("1 selected");

    await box.click();
    await expect(row).toHaveAttribute("aria-selected", "false");
    await expect(bar).toHaveCSS("display", "none");
  });

  test("select-all marks every row and reports indeterminate on partial clears", async ({ page }) => {
    await gotoDataStory(page);
    const all = page.locator(DEMOS.dataStorySelectAll);
    await all.click();
    await expect(all).toBeChecked();
    expect(await all.evaluate((el) => el.indeterminate)).toBe(false);
    await expect(page.locator(DEMOS.dataStoryCount)).toHaveText("6 selected");
    await expect(
      page.locator(`${DEMOS.dataStoryBody} tr[aria-selected="true"]`)
    ).toHaveCount(6);

    // Clear one row: the control becomes indeterminate — the app owns
    // the checkbox's own state because CSS cannot check it truthfully.
    await page.locator(`${DEMOS.dataStoryBody} tr`).first().locator("input").click();
    expect(await all.evaluate((el) => el.indeterminate)).toBe(true);
    await expect(page.locator(DEMOS.dataStoryCount)).toHaveText("5 selected");
  });

  test("a filter that matches nothing shows the empty state, and clearing restores the rows", async ({ page }) => {
    await gotoDataStory(page);
    const q = page.locator(DEMOS.dataStoryFilterInput);
    await q.fill("no-such-service");
    await expect(page.locator(DEMOS.dataStoryEmpty)).toBeVisible();
    await expect(page.locator(DEMOS.dataStoryBody)).toBeEmpty();

    await page.getByRole("button", { name: "Clear filters" }).click();
    await expect(page.locator(DEMOS.dataStoryEmpty)).toBeHidden();
    await expect(page.locator(`${DEMOS.dataStoryBody} tr`)).toHaveCount(6);
  });
});

test.describe("opt-in JS: keyboard beyond the component (v7.8)", () => {
  /* demo/keyboard.html is the proof page — every surface below is a
     native element first, with the module finishing the keyboard
     sentence the platform left unfinished. */

  test("sort header buttons rove under arrow keys and clamp at the ends", async ({ page }) => {
    await gotoKeyboard(page);
    const buttons = page.locator(`${DEMOS.keyboardSort} thead th button`);

    await buttons.nth(0).focus();
    await page.keyboard.press("ArrowRight");
    await expect(buttons.nth(1)).toBeFocused();
    await page.keyboard.press("ArrowLeft");
    await expect(buttons.nth(0)).toBeFocused();

    await page.keyboard.press("End");
    await expect(buttons.nth(1)).toBeFocused();
    await page.keyboard.press("Home");
    await expect(buttons.nth(0)).toBeFocused();

    // Clamp, not wrap: a header row has ends (menus wrap; tablists and
    // header rows clamp).
    await page.keyboard.press("ArrowLeft");
    await expect(buttons.nth(0)).toBeFocused();

    // The rover moves focus only — Enter still sorts (real buttons).
    await page.keyboard.press("Enter");
    await expect(
      page.locator(`${DEMOS.keyboardSort} thead th`).first()
    ).toHaveAttribute("aria-sort", "ascending");
  });

  test("filter: Escape clears the input and reports bf:filterclear", async ({ page }) => {
    await gotoKeyboard(page);
    await armEvents(page, ["bf:filterclear"]);
    const filter = page.locator(DEMOS.keyboardFilter);
    // Hidden items stay in the DOM — count what's shown.
    const shown = page.locator(`${DEMOS.keyboardStack} li:not([hidden])`);

    // Typing filters through the page's own listener.
    await filter.fill("css");
    await expect(shown).toHaveCount(1);
    await expect(page.locator(DEMOS.keyboardFilterCount)).toHaveText("1 of 6 shown");

    // Escape resets the input and the list; the module reports it.
    await page.keyboard.press("Escape");
    await expect(filter).toHaveValue("");
    await expect(shown).toHaveCount(6);
    await expect(page.locator(DEMOS.keyboardFilterCount)).toHaveText("6 of 6 shown");
    await expect.poll(() => events(page), { timeout: 4000 }).toEqual([
      { type: "bf:filterclear", detail: { value: "" } },
    ]);
  });

  test("filter: Escape on an empty input is a no-op — nothing to report", async ({ page }) => {
    await gotoKeyboard(page);
    await armEvents(page, ["bf:filterclear"]);
    const filter = page.locator(DEMOS.keyboardFilter);

    await filter.focus();
    await page.keyboard.press("Escape");
    expect(await events(page)).toEqual([]);
  });

  test("nested dialogs: Esc closes the topmost dialog first", async ({ page }) => {
    // showModal() is the one native line; the close layering — Esc
    // dismisses only the topmost dialog — is the platform's, on every
    // engine. Focus return is asserted separately (WebKit gaps it).
    await gotoKeyboard(page);
    const outer = page.locator(DEMOS.keyboardOuterDialog);
    const inner = page.locator(DEMOS.keyboardInnerDialog);

    await page.getByRole("button", { name: "Open the deploy dialog" }).click();
    await expect(outer).toBeVisible();
    await page.getByRole("button", { name: "Read the policy" }).click();
    await expect(inner).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(inner).toBeHidden();
    await expect(outer).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(outer).toBeHidden();
  });

  test("nested dialogs: Esc-close returns focus to the opener", async ({ page, browserName }) => {
    // Engine-gated: WebKit moves focus to the outer <dialog> element
    // instead of the opener on inner close, and strands it on <body>
    // instead of the trigger on outer close. Close layering (above)
    // holds everywhere; focus return is Chromium/Firefox-only.
    test.skip(
      browserName === "webkit",
      "WebKit does not return focus to a nested dialog's opener on Esc"
    );
    await gotoKeyboard(page);
    const report = page.locator(DEMOS.keyboardFocusReport);

    await page.getByRole("button", { name: "Open the deploy dialog" }).click();
    await expect(page.getByRole("button", { name: "Read the policy" })).toBeFocused();

    await page.getByRole("button", { name: "Read the policy" }).click();
    await expect(page.getByRole("button", { name: "Got it" })).toBeFocused();

    // Esc closes only the topmost dialog; focus lands back on the
    // button that opened it (still inside the outer dialog).
    await page.keyboard.press("Escape");
    await expect(page.getByRole("button", { name: "Read the policy" })).toBeFocused();

    await page.keyboard.press("Escape");
    await expect(page.getByRole("button", { name: "Open the deploy dialog" })).toBeFocused();
    await expect(report).toContainText("#kb-outer-open");
  });
});