/* Barefoot — Verify: the contract registry (Phase 0), the checker
   engine (Phase 1), and the CI contract-packs (Phase 2) against
   ADR-0015.
   Gates, one file:
   1. The registry FORMAT is pinned — every rule carries the exact
      fields (id / select / check / fix / docs / quote, optional
      module + wcag), ids unique, modules real.
   2. Every rule is TRACEABLE to a sentence in docs/ — the API-audit
      pattern turned outward: each quote must appear verbatim in the
      named docs file (whitespace-normalized).
   3. The assertions RUN — a deliberately-broken fixture trips each
      rule, the corrected fixture stays silent, and demo/index.html
      (the dogfood page) produces zero violations with every module
      armed.
   4. The ENGINE (js/verify.js) reports the same truth through its own
      seams: warnOnce volume (once per rule per page), a thrown error
      under data-bf-verify="strict", silence on the demo and on the
      corrected fixture page — which is the dogfood proof the plan
      names as Phase 1's gate.
   5. The PACK (verify/pack.mjs) is the dogfood claim of Phase 2: this
      suite consumes it for every registry sweep (no local runner),
      and pack and engine agree rule-for-rule on the same page — two
      formats, one registry.

    npm run test:verify */
import { test, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { DEMOS, gotoDemo, gotoDataStory, gotoFormArchitecture, gotoKeyboard, gotoResilience, mountFixture } from "./helpers.js";
// The suite consumes the pack, not src/ directly — one registry, two
// formats, and the pack re-exports the registry it shares with the
// engine (ADR-0015).
import {
  VERIFY_RULES,
  VERIFY_DEPRECATIONS,
  ALL_MODULES,
  runPack,
  runRule,
  assertClean,
  runDeprecationPack,
} from "../verify/pack.mjs";

const rootDir = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

/* Static fixture pages (served by build/serve.mjs, which maps the repo
   root). Deliberately-broken.html violates every seed rule exactly once
   per class of offender; ?strict arms data-bf-verify="strict". */
const BROKEN_FIXTURE = "/tests/fixtures/verify-broken.html";
const BROKEN_STRICT = "/tests/fixtures/verify-broken.html?strict";
const CLEAN_FIXTURE = "/tests/fixtures/verify-clean.html";

const SEED_IDS = [
  "popover-target-exists",
  "sticky-scroll-focusable",
  "skip-link-first",
  "describedby-wired",
  "module-pairing",
  "nav-complete-contract",
  "native-button-contract",
  "page-structure-contract",
];

test.describe("Verify Phase 0: registry format is pinned (ADR-0015)", () => {
  const REQUIRED = ["check", "docs", "fix", "id", "quote", "select"];
  const ALLOWED = [...REQUIRED, "module", "wcag"];

  test("every rule carries exactly the pinned shape", () => {
    expect(VERIFY_RULES.length).toBeGreaterThanOrEqual(6);
    const seen = new Set();
    for (const rule of VERIFY_RULES) {
      const keys = Object.keys(rule).sort();
      expect(
        keys.filter((k) => !ALLOWED.includes(k)),
        `${rule.id || "(unid'd rule)"} has fields outside the pinned shape`
      ).toEqual([]);
      for (const field of REQUIRED) {
        expect(rule[field], `${rule.id} is missing "${field}"`).toBeDefined();
      }
      expect(rule.id).toMatch(/^[a-z][a-z0-9-]*$/);
      expect(seen.has(rule.id), `duplicate rule id ${rule.id}`).toBe(false);
      seen.add(rule.id);
      expect([].concat(rule.select).length).toBeGreaterThan(0);
      expect(typeof rule.check).toBe("function");
      expect(rule.fix.trim()).toBeTruthy();
      expect(rule.docs).toMatch(/^docs\/[\w-]+\.md$/);
      expect(Array.isArray(rule.quote)).toBe(true);
      expect(rule.quote.length).toBeGreaterThan(0);
      for (const q of rule.quote) expect(q.trim()).toBeTruthy();
      if (rule.module !== undefined) {
        expect(Array.isArray(rule.module)).toBe(true);
        for (const m of rule.module) expect(m).toMatch(/^js\/[\w-]+\.js$/);
      }
      if (rule.wcag !== undefined) expect(rule.wcag).toMatch(/^\d+\.\d+(\.\d+)?$/);
    }
  });

  test("the six seed rules from the plan are present", () => {
    const ids = new Set(VERIFY_RULES.map((r) => r.id));
    for (const seed of [
      "popover-target-exists",
      "sticky-scroll-focusable",
      "skip-link-first",
      "describedby-wired",
      "module-pairing",
      "nav-complete-contract",
    ]) {
      expect(ids.has(seed), `seed rule ${seed} missing from the registry`).toBe(true);
    }
  });

  test("every rule is traceable to a sentence in docs/", () => {
    for (const rule of VERIFY_RULES) {
      const file = path.join(rootDir, rule.docs);
      expect(fs.existsSync(file), `${rule.docs} does not exist`).toBe(true);
      const docs = fs.readFileSync(file, "utf8").replace(/\s+/g, " ");
      for (const quote of rule.quote) {
        expect(
          docs.includes(quote.replace(/\s+/g, " ")),
          `${rule.id}: quote not found in ${rule.docs} — the registry may only restate what docs state`
        ).toBe(true);
      }
    }
  });

  test("module-pairing names modules that ship", () => {
    const rule = VERIFY_RULES.find((r) => r.id === "module-pairing");
    for (const m of rule.module) {
      expect(
        fs.existsSync(path.join(rootDir, "src", m)),
        `${m} does not exist in src/`
      ).toBe(true);
    }
  });
});

test.describe("Verify Phase 0: registry assertions fire", () => {
  const CASES = [
    {
      id: "popover-target-exists",
      broken: [
        `<button type="button" popovertarget="ghost">Menu</button>`,
        `<button type="button" popovertarget="plain">Menu</button><div id="plain">not a popover</div>`,
      ],
      fixed: `<button type="button" popovertarget="menu">Menu</button><div popover id="menu"><a href="#">Edit</a></div>`,
    },
    {
      id: "sticky-scroll-focusable",
      broken: [
        `<div style="overflow: auto; height: 6rem"><table data-table="sticky-head"><thead><tr><th>A</th></tr></thead><tbody><tr><td>1</td></tr></tbody></table></div>`,
        `<div style="overflow: auto" tabindex="0"><table data-table="sticky-col"><thead><tr><th>A</th></tr></thead><tbody><tr><td>1</td></tr></tbody></table></div>`,
      ],
      fixed: `<div style="overflow: auto; height: 6rem" role="region" aria-label="Ledger" tabindex="0"><table data-table="sticky-head sticky-col"><thead><tr><th>A</th></tr></thead><tbody><tr><td>1</td></tr></tbody></table></div>`,
    },
    {
      id: "skip-link-first",
      broken: [
        `<main id="main"><p>Content</p></main><a class="bf-skip-link" href="#main">Skip to content</a>`,
        `<a class="bf-skip-link" href="#nowhere">Skip to content</a><main id="main"><p>Content</p></main>`,
      ],
      fixed: `<a class="bf-skip-link" href="#main">Skip to content</a><main id="main"><p>Content</p></main>`,
    },
    {
      id: "describedby-wired",
      broken: [
        `<input id="email" type="email"><small id="email-error" class="bf-field-error">Enter an email.</small>`,
        `<input id="user" type="text"><small class="bf-field-error">This message has no id.</small>`,
      ],
      fixed: `<input id="email" type="email" aria-describedby="email-error"><small id="email-error" class="bf-field-error">Enter an email.</small>`,
    },
    {
      id: "module-pairing",
      // Armed with nothing: every pairing surface is a dead control.
      brokenArmed: [],
      broken: [
        `<div data-alert="danger" role="alert"><p>Failed.</p><button type="button" data-alert-dismiss aria-label="Dismiss">×</button></div>`,
        `<span data-chip>css<button type="button" data-chip-remove aria-label="Remove css">×</button></span>`,
        `<div popover="manual" id="t" data-kind="toast" data-duration="3000" role="status"><p>Saved.</p></div>`,
      ],
      fixed: `<div data-alert="danger" role="alert"><p>Failed.</p><button type="button" data-alert-dismiss aria-label="Dismiss">×</button></div><span data-chip>css<button type="button" data-chip-remove aria-label="Remove css">×</button></span><div popover="manual" id="t" data-kind="toast" data-duration="3000" role="status"><p>Saved.</p></div>`,
    },
    {
      id: "nav-complete-contract",
      broken: [
        `<nav data-nav="header" aria-label="N"><button type="button" class="bf-nav-toggle" aria-expanded="false">Menu</button><ul><li><a href="#">Home</a></li></ul></nav>`,
        `<nav data-nav="header" aria-label="N"><button type="button" class="bf-nav-toggle" aria-expanded="false" aria-controls="menu">Menu</button><ul><li><a href="#">Home</a></li></ul></nav>`,
      ],
      fixed: `<nav data-nav="header" aria-label="N"><button type="button" class="bf-nav-toggle" aria-expanded="false" aria-controls="menu">Menu</button><ul id="menu"><li><a href="#">Home</a></li></ul></nav>`,
    },
    {
      id: "state-live-contract",
      broken: [
        `<section class="bf-state" data-state="loading">Loading…</section>`,
        `<section class="bf-state" data-state="error" role="status">Failed.</section>`,
        `<section class="bf-state" data-state="empty">Nothing here.</section>`,
      ],
      fixed: `<section class="bf-state" data-state="loading" role="status" aria-busy="true">Loading…</section><section class="bf-state" data-state="empty" role="status">Nothing here.</section><section class="bf-state" data-state="error" role="alert">Failed.</section>`,
    },
    {
      id: "validation-summary-contract",
      broken: [
        `<form><div class="bf-error-summary">Fix it.</div><input required></form>`,
        `<form><div class="bf-error-summary" role="alert">Fix it.</div><input required></form>`,
        `<div class="bf-error-summary" role="alert" tabindex="-1">Fix it.</div>`,
      ],
      fixed: `<form><div class="bf-error-summary" role="alert" tabindex="-1">Fix it.</div><input required></form>`,
    },
    {
      id: "native-button-contract",
      broken: [`<div role="button">Save</div>`],
      fixed: `<button type="button">Save</button>`,
    },
    {
      id: "page-structure-contract",
      broken: [`<main><h1>One</h1></main><main><h1>Two</h1></main>`],
      fixed: `<main><h1>One</h1></main>`,
    },
    {
      id: "state-conflict",
      broken: [
        // Two states in one attribute — the precedence table, not the
        // attribute, decides what shows.
        `<section class="bf-state" data-state="loading empty" role="status">Both</section>`,
        // A value outside the documented set (typo).
        `<section class="bf-state" data-state="loadng" role="status">Typo</section>`,
      ],
      fixed: `<section class="bf-state" data-state="loading" role="status" aria-busy="true">Loading</section>`,
    },
    {
      id: "event-contract",
      broken: [
        `<div data-bf-tabs><div role="tablist"><button role="tab" aria-controls="nope">One</button></div></div>`,
      ],
      fixed: `<div data-bf-tabs><div role="tablist"><button id="t1" role="tab" aria-controls="p1">One</button></div><div id="p1" role="tabpanel" aria-labelledby="t1">Panel</div></div>`,
    },
    {
      id: "aria-sort-wired",
      broken: [
        // Two columns claim the sort at once — sorting is single-column.
        `<table data-bf-sort><thead><tr><th aria-sort="ascending">A</th><th aria-sort="descending" data-sort="asc">B</th></tr></thead><tbody><tr><td>1</td><td>2</td></tr></tbody></table>`,
        // "asc" is not an ARIA value.
        `<table data-bf-sort><thead><tr><th aria-sort="asc"><button type="button">A</button></th></tr></thead><tbody><tr><td>1</td></tr></tbody></table>`,
        // The arrow with no control behind it — decoration, not a sort.
        `<table data-bf-sort><thead><tr><th aria-sort="ascending">A</th></tr></thead><tbody><tr><td>1</td></tr></tbody></table>`,
        // The declarative mirror disagrees with the semantic value.
        `<table data-bf-sort><thead><tr><th aria-sort="descending" data-sort="asc"><button type="button">A</button></th></tr></thead><tbody><tr><td>1</td></tr></tbody></table>`,
      ],
      fixed: `<table data-bf-sort><thead><tr><th aria-sort="ascending" data-sort="asc"><button type="button">A</button></th><th><button type="button">B</button></th></tr></thead><tbody><tr><td>1</td><td>2</td></tr></tbody></table>`,
    },
    {
      id: "selection-complete",
      broken: [
        // A select-all checkbox with no accessible name.
        `<table><thead><tr><th><input type="checkbox"></th><th>A</th></tr></thead><tbody><tr aria-selected="false"><td>1</td></tr></tbody></table>`,
        // A select-all grid with an unmarked row.
        `<table><thead><tr><th><input type="checkbox" aria-label="Select all rows"></th><th>A</th></tr></thead><tbody><tr aria-selected="true"><td>1</td></tr><tr><td>2</td></tr></tbody></table>`,
      ],
      fixed: `<table><thead><tr><th><input type="checkbox" aria-label="Select all rows"></th><th>A</th></tr></thead><tbody><tr aria-selected="true"><td><input type="checkbox" aria-label="Select a"></td><td>1</td></tr><tr aria-selected="false"><td><input type="checkbox" aria-label="Select b"></td><td>2</td></tr></tbody></table>`,
    },
    {
      id: "async-live",
      broken: [
        // The pending paint with no busy signal and no announcement.
        `<div class="bf-form-group" data-async-pending><input id="u" type="text"><small class="bf-async-text" role="status">Checking…</small></div>`,
        // Busy is declared, but nothing carries the outcome.
        `<div class="bf-form-group" data-async-pending aria-busy="true"><input id="u" type="text"></div>`,
      ],
      fixed: `<div class="bf-form-group" data-async-pending aria-busy="true"><input id="u" type="text" aria-describedby="u-async"><small class="bf-async-text" id="u-async" role="status">Checking…</small></div>`,
    },
    {
      id: "stepper-complete",
      broken: [
        // Two steps claim the current position at once.
        `<div data-stepper><ol><li aria-current="step">A</li><li aria-current="step">B</li></ol></div>`,
        // The current marker is not a step of the stepper's list.
        `<div data-stepper><ol><li>A</li></ol><p aria-current="step">You are on step 2</p></div>`,
        // A wizard with no list structure at all.
        `<div data-stepper><p aria-current="step">Step 2</p></div>`,
      ],
      fixed: `<div data-stepper><ol><li data-complete>A</li><li aria-current="step">B</li><li>C</li></ol></div>`,
    },
    {
      id: "roving-focus",
      broken: [
        // Every tab is removed from the Tab order — the list can never
        // be entered, with or without the module.
        `<div role="tablist"><button role="tab" tabindex="-1">A</button><button role="tab" tabindex="-1">B</button></div>`,
        // The tabs module is armed but every tab is still a stop —
        // drift from the roving contract the module owns.
        `<div role="tablist"><button role="tab" tabindex="0">A</button><button role="tab" tabindex="0">B</button></div>`,
        // A popover menu whose keyboard module is not loaded: it opens
        // natively, but nothing moves focus in or answers the arrows.
        `<button type="button" popovertarget="m">Menu</button><div popover id="m" data-kind="menu"><a href="#">Edit</a></div>`,
      ],
      // The tablist cases need tabs armed (or not — the zero-stop case
      // fires either way); the menu case needs popover-menu unloaded.
      brokenArmed: ["tabs"],
      fixed: `<div role="tablist"><button role="tab" tabindex="0">A</button><button role="tab" tabindex="-1">B</button></div><button type="button" popovertarget="m">Menu</button><div popover id="m" data-kind="menu"><a href="#">Edit</a></div>`,
    },
    {
      id: "reading-order-after-reflow",
      broken: [
        // A CSS order inside a reflowing container: the card view would
        // paint a sequence the DOM does not promise.
        `<form data-form="adaptive"><div class="bf-row" style="display:flex"><div style="order: 2">A</div><div>B</div></div></form>`,
        // A reversed flex direction is the other way reflow reorders.
        `<form data-form="adaptive"><div class="bf-row" style="display:flex; flex-direction: row-reverse"><div>A</div><div>B</div></div></form>`,
      ],
      fixed: `<form data-form="adaptive"><div class="bf-row" style="display:flex"><div>A</div><div>B</div></div></form>`,
    },
    {
      id: "coexistence-clean",
      broken: [
        // An unlayered global focus reset: it beats every layered style,
        // so Barefoot's base-layer ring disappears.
        `<style>*:focus { outline: none }</style>`,
        // The element list looks scoped, but every part is element-level.
        `<style>a:focus, button:focus { outline: none }</style>`,
        // Longhand forms of the same defeat, nested in a media query to
        // prove the walk descends through conditionals.
        `<style>@media all { :focus { outline-width: 0 } }</style>`,
      ],
      // The same reset, layered: cascade order puts it below base, the
      // ring survives, and the walk never descends into a layer.
      fixed: `<style>@layer reset { *:focus { outline: none } }</style>`,
    },
  ];

  for (const c of CASES) {
    test(`${c.id}: broken markup trips it, corrected markup is silent`, async ({ page }) => {
      const brokenArmed = c.brokenArmed ?? ALL_MODULES;
      for (const html of c.broken) {
        await mountFixture(page, html);
        const violations = await runPack(page, { armed: brokenArmed });
        const mine = violations.filter((v) => v.id === c.id);
        expect(
          mine.length,
          `${c.id} did not trip on: ${html} — got ${JSON.stringify(violations)}`
        ).toBeGreaterThanOrEqual(1);
      }
      await mountFixture(page, c.fixed);
      const remaining = await runPack(page);
      expect(
        remaining,
        `${c.id} corrected fixture still trips: ${JSON.stringify(remaining)}`
      ).toEqual([]);
    });
  }

  test("dogfood: demo/index.html produces zero violations with every module armed", async ({ page }) => {
    await gotoDemo(page);
    const violations = await runPack(page);
    expect(violations, JSON.stringify(violations, null, 2)).toEqual([]);
  });

  test("dogfood: the v7.2 composed fixture (demo/data-story.html) is clean with every module armed", async ({ page }) => {
    // The data-story page is the new rules' proof surface: a sortable
    // table (aria-sort-wired) and a multi-select grid (selection-complete)
    // that must hold the contracts the registry states.
    await gotoDataStory(page);
    const violations = await runPack(page);
    expect(violations, JSON.stringify(violations, null, 2)).toEqual([]);
  });

  test("dogfood: the v7.4 form-architecture page is clean, mid-async and mid-wizard", async ({ page }) => {
    // The form-architecture page is the two new rules' proof surface:
    // an async field in flight (async-live) and a wizard stepper
    // (stepper-complete). Sweep it resting, then mid-flight — the
    // pending state is exactly when aria-busy matters.
    await gotoFormArchitecture(page);
    await page.locator(DEMOS.faUsername).fill("ada");
    await expect(page.locator(DEMOS.faAsyncStatus)).toContainText("Checking");
    await expect(page.locator(DEMOS.faAsyncGroup)).toHaveAttribute("aria-busy", "true");
    expect(await runPack(page), JSON.stringify(await runPack(page))).toEqual([]);

    // Advance the wizard: the current step moves, and the contract
    // holds on step two.
    await page.locator(DEMOS.faUsername).fill("lovelace");
    await page.locator("#fa-email").fill("lovelace@example.com");
    await page.locator("#fa-password").fill("hunter2222");
    await page.getByRole("button", { name: "Next" }).click();
    await expect(page.locator(DEMOS.faStepProfile)).toBeVisible();
    expect(await runPack(page)).toEqual([]);
  });

  test("dogfood: the v7.8 keyboard page is clean with every module armed", async ({ page }) => {
    // The keyboard page is the two new rules' proof surface: a popover
    // menu (roving-focus, armed), a tablist the tabs module owns (one
    // tab stop), and no reordering inside any adaptive container.
    await gotoKeyboard(page);
    expect(await runPack(page), JSON.stringify(await runPack(page))).toEqual([]);
  });

  test("dogfood: the v8.0 resilience page is clean at rest", async ({ page }) => {
    // The resilience page is coexistence-clean's proof surface: it loads
    // verify.js itself and the coexistence stage, so its own stylesheets
    // must hold the contract — the hostile reset is injected only by a
    // stage button, never shipped on the page.
    await gotoResilience(page);
    expect(await runPack(page), JSON.stringify(await runPack(page))).toEqual([]);
  });

  test("dogfood: the coexistence stage flips and restores under the pack", async ({ page }) => {
    // The flagship moment, from the pack side: inject the unlayered
    // reset and the rule names it; layer the same line and it clears.
    await gotoResilience(page);
    await page.getByRole("button", { name: "Inject a hostile reset" }).click();
    const broken = await runPack(page);
    expect(broken.map((v) => v.id)).toContain("coexistence-clean");
    expect(broken[0].detail).toContain("outline:none");

    await page.getByRole("button", { name: "Layer it instead" }).click();
    expect(await runPack(page)).toEqual([]);
  });
});

test.describe("Verify Phase 1: the checker engine (js/verify.js)", () => {
  /* Collect [barefoot-css] console warnings so tests can assert on the
     engine's warnOnce output. */
  async function collectWarnings(page) {
    const warnings = [];
    page.on("console", (msg) => {
      if (msg.type() === "warning" && msg.text().includes("[barefoot-css]")) {
        warnings.push(msg.text());
      }
    });
    return warnings;
  }

  test("broken fixture page: every seed rule warns, each carries its fix hint", async ({ page }) => {
    const warnings = await collectWarnings(page);
    await page.goto(BROKEN_FIXTURE);
    await page.waitForTimeout(100); // engine's onDomReady verify pass
    const warnedIds = new Set(
      warnings
        .map((t) => t.match(/verify: ([a-z0-9-]+) —/)?.[1])
        .filter(Boolean)
    );
    for (const id of SEED_IDS) {
      expect(warnedIds.has(id), `engine never warned for ${id}`).toBe(true);
    }
    // Every warning carries the registry's fix hint.
    for (const text of warnings.filter((t) => t.includes("verify:"))) {
      expect(text).toContain("Fix:");
    }
  });

  test("warnOnce volume: each rule warns exactly once per page despite repeat offenders", async ({ page }) => {
    const warnings = await collectWarnings(page);
    await page.goto(BROKEN_FIXTURE);
    await page.waitForTimeout(100);
    const perRule = {};
    for (const text of warnings.filter((t) => t.includes("verify:"))) {
      const id = text.match(/verify: ([a-z0-9-]+) —/)[1];
      perRule[id] = (perRule[id] || 0) + 1;
    }
    // The fixture deliberately repeats offenders (2 dead popovertargets,
    // 3 unpaired modules) — one warning each, listing every offender.
    for (const [id, count] of Object.entries(perRule)) {
      expect(count, `${id} warned ${count}×; the volume law is once per rule`).toBe(1);
    }
  });

  test("engine's runVerify agrees with the registry sweep on the broken page", async ({ page }) => {
    await page.goto(BROKEN_FIXTURE);
    const violations = await page.evaluate(async () => {
      const { runVerify } = await import("/dist/js/verify.js");
      return runVerify();
    });
    expect(new Set(violations.map((v) => v.id))).toEqual(new Set(SEED_IDS));
    expect(violations.length).toBeGreaterThanOrEqual(SEED_IDS.length + 2);
    // Every violation carries selector + fix (the pack-ready shape).
    for (const v of violations) {
      expect(v.selector).toBeTruthy();
      expect(v.fix).toBeTruthy();
    }
  });

  test("strict mode: data-bf-verify=strict throws one aggregate error listing every rule", async ({ page }) => {
    const errors = [];
    page.on("pageerror", (err) => errors.push(err.message));
    await page.goto(BROKEN_STRICT);
    await page.waitForTimeout(100);
    expect(errors).toHaveLength(1);
    expect(errors[0]).toContain("verify (strict)");
    for (const id of SEED_IDS) {
      expect(errors[0]).toContain(id);
    }
  });

  test("clean fixture page (barefoot.js armed): the engine stays silent", async ({ page }) => {
    const warnings = await collectWarnings(page);
    await page.goto(CLEAN_FIXTURE);
    await page.waitForTimeout(150);
    expect(warnings.filter((t) => t.includes("verify:"))).toEqual([]);
  });

  test("dogfood: the engine's own pass on the demo finds zero violations", async ({ page }) => {
    const warnings = await collectWarnings(page);
    await gotoDemo(page);
    await page.waitForTimeout(150);
    // The demo does not import verify.js; run the engine's own function.
    const violations = await page.evaluate(async () => {
      const { runVerify } = await import("/dist/js/verify.js");
      return runVerify();
    });
    expect(violations, JSON.stringify(violations, null, 2)).toEqual([]);
    expect(warnings.filter((t) => t.includes("verify:"))).toEqual([]);
  });

  test("strict mode on a clean page never throws", async ({ page }) => {
    const errors = [];
    page.on("pageerror", (err) => errors.push(err.message));
    await gotoDemo(page);
    await page.evaluate(() =>
      document.documentElement.setAttribute("data-bf-verify", "strict")
    );
    const violations = await page.evaluate(async () => {
      const { verify } = await import("/dist/js/verify.js");
      return verify();
    });
    expect(violations).toEqual([]);
    expect(errors).toEqual([]);
  });

  test("the engine is never in the barefoot.js barrel", async () => {
    const barrel = fs.readFileSync(
      path.join(rootDir, "src/js/barefoot.js"),
      "utf8"
    );
    expect(barrel).not.toContain("verify.js");
    expect(barrel).not.toContain("verify-contracts.js");
  });
});

test.describe("Verify Phase 2: the CI contract-pack (verify/pack.mjs)", () => {
  const BROKEN_ARMED = []; // the broken fixture loads no barefoot.js

  test("the suite itself consumes the pack — no local sweep runner exists", async () => {
    const spec = fs.readFileSync(path.join(rootDir, "tests/verify.spec.js"), "utf8");
    expect(spec).toContain('from "../verify/pack.mjs"');
    // The Phase-0 in-page mini-runner must not quietly come back; the
    // pack is the one registry consumer (dogfooding is the claim).
    // (Assembled from parts so this assertion doesn't match itself.)
    expect(spec).not.toContain("page" + ".evaluate(async (moduleStems)");
  });

  test("runRule: one rule by id; unknown ids throw with the valid list", async ({ page }) => {
    await gotoDemo(page);
    expect(await runRule(page, "popover-target-exists")).toEqual([]);
    // runRule throws synchronously — catch it as a plain throw.
    let error = null;
    try {
      await runRule(page, "no-such-rule");
    } catch (e) {
      error = e;
    }
    expect(error).toBeInstanceOf(Error);
    expect(error.message).toContain('unknown rule "no-such-rule"');
    for (const id of SEED_IDS) {
      expect(error.message).toContain(id);
    }
  });

  test("armed: passing a subset audits the rest as dead controls (module-pairing)", async ({ page }) => {
    // The demo loads the barrel, so this passes only when the pack
    // honors the declared subset — the exact consumer scenario.
    await gotoDemo(page);
    const violations = await runRule(page, "module-pairing", { armed: ["chips"] });
    expect(
      violations.filter((v) => v.detail.includes("alert-dismiss")),
      JSON.stringify(violations)
    ).toHaveLength(1);
    expect(violations.filter((v) => v.detail.includes("toast"))).toHaveLength(1);
    expect(violations.filter((v) => v.detail.includes("chips"))).toHaveLength(0);
  });

  test("base: a wrong dist path fails with a fix-it message naming the base", async ({ page }) => {
    await gotoDemo(page);
    const error = await runPack(page, { base: "/nowhere/" }).catch((e) => e);
    expect(error).toBeInstanceOf(Error);
    expect(error.message).toContain("/nowhere/");
    expect(error.message).toContain("Pass base:");
  });

  test("assertClean: silent pass, one aggregate report on failure", async ({ page }) => {
    await page.goto(CLEAN_FIXTURE);
    expect(await assertClean(page)).toEqual([]);

    await page.goto(BROKEN_FIXTURE);
    const error = await assertClean(page, { armed: BROKEN_ARMED }).catch((e) => e);
    expect(error).toBeInstanceOf(Error);
    expect(error.message).toContain("verify pack");
    expect(error.message).toContain("contract violation");
    for (const id of SEED_IDS) {
      expect(error.message).toContain(id);
    }
  });

  test("two formats, one registry: pack and engine agree rule-for-rule on the same page", async ({ page }) => {
    await page.goto(BROKEN_FIXTURE);
    const fromPack = await runPack(page, { armed: BROKEN_ARMED });
    const fromEngine = await page.evaluate(async () => {
      const { runVerify } = await import("/dist/js/verify.js");
      return runVerify();
    });
    // Same rule ids, same per-rule finding counts, same fix hints.
    const tally = (list) => {
      const m = {};
      for (const v of list) m[v.id] = (m[v.id] || 0) + 1;
      return m;
    };
    expect(tally(fromPack)).toEqual(tally(fromEngine));
    expect(new Set(fromPack.map((v) => v.fix))).toEqual(
      new Set(fromEngine.map((v) => v.fix))
    );
  });
});

test.describe("Verify Phase 3: the visible layer (live badge + stage)", () => {
  /* The badge is a demo-page widget (demo/verify-badge.js) driven by
     the same engine — these tests pin the flagship moment: break the
     markup on stage, watch the framework tell you. */
  const BADGE = ".bf-verify-badge";

  test("badge exists on the demo, starts ok, and is a live region", async ({ page }) => {
    await gotoDemo(page);
    const badge = page.locator(BADGE);
    await expect(badge).toHaveAttribute("data-state", "ok");
    await expect(badge).toContainText("Barefoot contracts verified");
    await expect(badge).toHaveAttribute("role", "status");
  });

  test("the stage: break the popover contract → badge flips + rule warns; fix → green", async ({ page }) => {
    const warnings = [];
    page.on("console", (msg) => {
      if (msg.type() === "warning" && msg.text().includes("[barefoot-css]")) {
        warnings.push(msg.text());
      }
    });
    await gotoDemo(page);

    await page.getByRole("button", { name: "Break the popover contract" }).click();
    const badge = page.locator(BADGE);
    await expect(badge).toHaveAttribute("data-state", "broken", { timeout: 5000 });
    await expect(badge).toContainText("1 contract violation");
    await expect
      .poll(() => warnings.join("\n"), { timeout: 5000 })
      .toContain("popover-target-exists");
    await expect
      .poll(() => warnings.join("\n"), { timeout: 5000 })
      .toContain("Fix:");

    await page.getByRole("button", { name: "Fix it" }).click();
    await expect(badge).toHaveAttribute("data-state", "ok", { timeout: 5000 });
    await expect(badge).toContainText("Barefoot contracts verified");
  });

  test("the badge never rescans itself into a loop (mutation guardrail)", async ({ page }) => {
    await gotoDemo(page);
    await page.getByRole("button", { name: "Break the popover contract" }).click();
    await page.waitForTimeout(600); // let at least one debounced rescan settle
    // Paint with no state change must not write: dataset + innerHTML
    // stay stable across further observer ticks.
    const first = await page.locator(BADGE).evaluate((b) => b.dataset.state + b.innerHTML);
    await page.waitForTimeout(600);
    const second = await page.locator(BADGE).evaluate((b) => b.dataset.state + b.innerHTML);
    expect(second).toBe(first);
  });

  test("studio badge: green on the studio chrome, suppressed inside the preview iframe", async ({ page }) => {
    await page.goto("/demo/studio.html");
    await expect(page.locator("body > .bf-verify-badge")).toHaveAttribute("data-state", "ok");
    // The Studio embeds demo/index.html in a live-preview iframe. The
    // badge script refuses to run when it isn't the top document, so
    // the demo's own badge must NOT appear inside the frame — one
    // badge per visual stack.
    const frame = page
      .frames()
      .find((f) => f.url().includes("/demo/index.html"));
    expect(frame, "studio preview iframe found").toBeTruthy();
    const badgeInFrame = await frame.locator(".bf-verify-badge").count();
    expect(badgeInFrame, "iframe must not render a second badge").toBe(0);
  });

  test("broken fixture page does NOT carry a badge (fixtures test the engine, not the widget)", async ({ page }) => {
    await page.goto(BROKEN_FIXTURE);
    await page.waitForTimeout(150);
    await expect(page.locator(BADGE)).toHaveCount(0);
  });

  test("docs/verify.md documents every rule with before/after markup", () => {
    const docs = fs.readFileSync(path.join(rootDir, "docs/verify.md"), "utf8");
    for (const rule of VERIFY_RULES) {
      const heading = `### \`${rule.id}\``;
      const at = docs.indexOf(heading);
      expect(at, `${heading} missing from docs/verify.md`).toBeGreaterThanOrEqual(0);
      // Section slice: from this heading to the next ### (or EOF).
      const next = docs.indexOf("\n### ", at + 1);
      const section = docs.slice(at, next === -1 ? undefined : next);
      // One or more fenced html blocks carrying both a broken and a
      // fixed variant (✗ / ✓ commented).
      expect(
        (section.match(/```html/g) || []).length,
        `${rule.id} section needs its markup block(s)`
      ).toBeGreaterThanOrEqual(1);
      expect(section).toContain("broken");
      expect(section).toContain("fixed");
    }
  });
});

test.describe("Verify Phase 4: hardening (the size table is policed)", () => {
  /* Phase 4's own requirement: "new JS entry measured AND budgeted".
     build/size.mjs enforces this in npm run check; this test pins the
     policy from the test side so it cannot quietly lose enforcement. */
  function jsBudgets() {
    let sizes, sizeSrc;
    try {
      sizes = JSON.parse(
        fs.readFileSync(path.join(rootDir, "dist", "sizes.json"), "utf8")
      );
    } catch {
      throw new Error("dist/sizes.json not found — run npm run build first");
    }
    sizeSrc = fs.readFileSync(path.join(rootDir, "build", "size.mjs"), "utf8");
    const defaultBudget = Number(
      sizeSrc.match(/DEFAULT_JS_BUDGET = (\d+)/)?.[1]
    );
    const budgets = {};
    for (const [, file, limit] of sizeSrc.matchAll(/"(js\/[\w.-]+\.js)": (\d+)/g)) {
      budgets[file] = Number(limit);
    }
    expect(defaultBudget, "DEFAULT_JS_BUDGET parsed from size.mjs").toBeGreaterThan(0);
    return { sizes, sizeSrc, defaultBudget, budgets };
  }

  test("every shipped JS entry is within its budget", () => {
    const { sizes, defaultBudget, budgets } = jsBudgets();
    const jsEntries = Object.entries(sizes).filter(([f]) => f.startsWith("js/"));
    expect(jsEntries.length).toBeGreaterThanOrEqual(17);
    for (const [file, s] of jsEntries) {
      const limit = budgets[file] ?? defaultBudget;
      const measured = s.gzip > 0 ? s.gzip : s.raw;
      expect(
        measured,
        `${file} (${measured}B) over its ${limit}B budget — trim it or bump the limit deliberately in build/size.mjs`
      ).toBeLessThanOrEqual(limit);
    }
  });

  test("verify.js stays near the ~2KB module family (v8.5: two passes)", () => {
    const { sizes } = jsBudgets();
    const v = sizes["js/verify.js"];
    expect(v, "js/verify.js measured by the build").toBeTruthy();
    // 1.75KB through v8.0. v8.5 adds the deprecation pass (a second
    // registry sweep + formatter + warnOnce loop, ADR-0023): 2560, bumped
    // deliberately in review and pinned here, same rule as the registry.
    expect(v.gzip).toBeLessThanOrEqual(2560);
  });

  test("the budget map cannot silently drop the Verify entries", () => {
    // verify.js rode the 2KB default until v8.5's second pass gave it an
    // explicit budget; the registry's has been explicit since v7.0.
    // 5120 at v7.0, 6656 at v7.2, 8192 at v7.8 (two more quoted rules)
    // — bumps are deliberate, in review, and pinned here. v8.0's
    // coexistence-clean (the CSSOM walk plus its quote) moved it past
    // 8KB: 10240, same rule.
    const { budgets } = jsBudgets();
    expect(budgets["js/verify-contracts.js"]).toBe(10240);
    expect(budgets["js/barefoot.js"]).toBe(1024);
    expect(budgets["js/verify.js"]).toBe(2560);
  });
});

test.describe("Verify Phase 5: the deprecation registry and its pass (v8.5, ADR-0023)", () => {
  /* The machinery is proven with a synthetic entry driven through the
     engine's own seams — the same path a real entry takes. It must never
     ship to prove itself: a fabricated deprecation is a self-inflicted
     false positive, and trust is the entire product. */
  const SYNTHETIC = [
    {
      id: "synthetic-old-token",
      select: ".uses-old-token",
      check(el) {
        return `${el.tagName.toLowerCase()}.uses-old-token paints with --bf-old, removed in the next major`;
      },
      fix: "set color: var(--bf-new) instead (docs/api.md, Deprecations)",
      docs: "docs/api.md",
      quote: "Every deprecation ships a concrete replacement.",
      announced: "8.5",
      replacement: "--bf-new",
    },
  ];

  test("the registry's shape is pinned: lifecycle fields a contract never has", () => {
    const REQUIRED = ["check", "docs", "fix", "id", "quote", "select", "announced", "replacement"];
    const ALLOWED = [...REQUIRED, "removed"];
    const seen = new Set();
    for (const entry of VERIFY_DEPRECATIONS) {
      const keys = Object.keys(entry);
      expect(
        keys.filter((k) => !ALLOWED.includes(k)),
        `${entry.id || "(unid'd entry)"} has fields outside the pinned shape`
      ).toEqual([]);
      for (const field of REQUIRED) {
        expect(entry[field], `${entry.id} is missing "${field}"`).toBeDefined();
      }
      expect(entry.id).toMatch(/^[a-z][a-z0-9-]*$/);
      expect(seen.has(entry.id), `duplicate deprecation id ${entry.id}`).toBe(false);
      seen.add(entry.id);
      expect([].concat(entry.select).length).toBeGreaterThan(0);
      expect(typeof entry.check).toBe("function");
      expect(entry.fix.trim()).toBeTruthy();
      expect(entry.replacement.trim()).toBeTruthy();
      expect(Array.isArray(entry.quote)).toBe(true);
      if (entry.removed !== undefined) expect(typeof entry.removed).toBe("string");
    }
  });

  test("the registry ships empty — the honest state, not an untested one", () => {
    // Every surface announced since 3.x was removed in 4.0 (docs/api.md);
    // the pass is armed, not idle. This pin makes a fabricated entry
    // shipped "to prove the feature" a test failure instead of a false
    // positive on every consumer's console.
    expect(VERIFY_DEPRECATIONS).toEqual([]);
  });

  test("every shipped entry would be traceable to its announcement (the gate holds for an empty registry too)", () => {
    for (const entry of VERIFY_DEPRECATIONS) {
      const file = path.join(rootDir, entry.docs);
      expect(fs.existsSync(file), `${entry.docs} does not exist`).toBe(true);
      const docs = fs.readFileSync(file, "utf8").replace(/\s+/g, " ");
      for (const quote of entry.quote) {
        expect(
          docs.includes(quote.replace(/\s+/g, " ")),
          `${entry.id}: announcement quote not found in ${entry.docs}`
        ).toBe(true);
      }
    }
  });

  /* The synthetic entry is built IN THE PAGE: its `check` is a function,
     which cannot cross the Node→browser boundary, so the registry is
     constructed where it runs. The engine's seams (verify's registry
     argument, runDeprecations') are the same ones a real entry flows
     through. */
  const SYNTHETIC_SELECT = ".uses-old-token";
  const SYNTHETIC_ID = "synthetic-old-token";

  /* mode: "sweep" (pure read) or "verify" (warn/throw). */
  async function driveEngine(page, mode, markup) {
    await mountFixture(page, markup);
    return page.evaluate((mode) => {
      const SYNTHETIC = [
        {
          id: "synthetic-old-token",
          select: ".uses-old-token",
          check(el) {
            return `${el.tagName.toLowerCase()}.uses-old-token paints with --bf-old, removed in the next major`;
          },
          fix: "set color: var(--bf-new) instead (docs/api.md, Deprecations)",
          docs: "docs/api.md",
          quote: "Every deprecation ships a concrete replacement.",
          announced: "8.5",
          replacement: "--bf-new",
        },
      ];
      return import("/dist/js/verify.js").then(({ verify, runDeprecations }) =>
        mode === "sweep"
          ? runDeprecations(document, SYNTHETIC)
          : verify(document, SYNTHETIC)
      );
    }, mode);
  }

  test("the engine reports a deprecation through the same shape as a contract, plus the migration fields", async ({ page }) => {
    const found = await driveEngine(
      page,
      "sweep",
      `<p class="uses-old-token">one</p><p class="uses-old-token">two</p>`
    );
    expect(found).toHaveLength(2);
    for (const f of found) {
      expect(f.id).toBe(SYNTHETIC_ID);
      expect(f.selector).toBe(SYNTHETIC_SELECT);
      expect(f.fix).toContain("--bf-new");
      expect(f.announced).toBe("8.5");
      expect(f.replacement).toBe("--bf-new");
    }
  });

  test("warnOnce volume: a deprecation warns once per page, naming every use and the replacement", async ({ page }) => {
    const warnings = [];
    page.on("console", (msg) => {
      if (msg.type() === "warning" && msg.text().includes("[barefoot-css]")) {
        warnings.push(msg.text());
      }
    });
    await driveEngine(
      page,
      "verify",
      `<p class="uses-old-token">one</p><p class="uses-old-token">two</p>`
    );
    const dep = warnings.filter((t) => t.includes("deprecation:"));
    expect(dep, "one warning per deprecation per page, not per element").toHaveLength(1);
    expect(dep[0]).toContain(SYNTHETIC_ID);
    expect(dep[0]).toContain("2 uses");
    expect(dep[0]).toContain("--bf-new");
    expect(dep[0]).toContain("Fix:");
  });

  test("warn on use, not on import: markup the entry does not match stays silent", async ({ page }) => {
    const warnings = [];
    page.on("console", (msg) => {
      if (msg.type() === "warning" && msg.text().includes("[barefoot-css]")) {
        warnings.push(msg.text());
      }
    });
    await driveEngine(page, "verify", `<p>no deprecated surface here</p>`);
    expect(warnings.filter((t) => t.includes("deprecation:"))).toEqual([]);
  });

  test("strict mode throws for a deprecation, listing the migration", async ({ page }) => {
    await mountFixture(page, `<p class="uses-old-token">one</p>`);
    await page.evaluate(() =>
      document.documentElement.setAttribute("data-bf-verify", "strict")
    );
    const error = await page.evaluate(() => {
      const SYNTHETIC = [
        {
          id: "synthetic-old-token",
          select: ".uses-old-token",
          check(el) {
            return `${el.tagName.toLowerCase()}.uses-old-token paints with --bf-old, removed in the next major`;
          },
          fix: "set color: var(--bf-new) instead (docs/api.md, Deprecations)",
          docs: "docs/api.md",
          quote: "Every deprecation ships a concrete replacement.",
          announced: "8.5",
          replacement: "--bf-new",
        },
      ];
      return import("/dist/js/verify.js").then(({ verify }) => {
        try {
          verify(document, SYNTHETIC);
          return null;
        } catch (e) {
          return e.message;
        }
      });
    });
    expect(error).toContain("verify (strict)");
    expect(error).toContain(`deprecation: ${SYNTHETIC_ID}`);
    expect(error).toContain("--bf-new");
  });

  test("the pack and the engine share one deprecation registry (two formats, one source of truth)", async ({ page }) => {
    await gotoDemo(page);
    // The shipped registry is empty, so the honest result is empty — the
    // pack imports the page's own copy of js/deprecations.js, and the
    // engine reads the same module. An empty pass is a pass, not a no-op.
    expect(await runDeprecationPack(page)).toEqual([]);
    const engineSide = await page.evaluate(async () => {
      const { runDeprecations } = await import("/dist/js/verify.js");
      return runDeprecations();
    });
    expect(engineSide).toEqual([]);
    // The pack re-exports the registry object the engine imports.
    expect(VERIFY_DEPRECATIONS).toEqual([]);
  });

  test("the deprecation sweep reports a bad base with the same fix-it message", async ({ page }) => {
    await gotoDemo(page);
    const error = await runDeprecationPack(page, { base: "/nowhere/" }).catch((e) => e);
    expect(error).toBeInstanceOf(Error);
    expect(error.message).toContain("/nowhere/");
    expect(error.message).toContain("deprecation sweep failed");
  });

  test("deprecations.js is never in the barefoot.js barrel", async () => {
    const barrel = fs.readFileSync(
      path.join(rootDir, "src/js/barefoot.js"),
      "utf8"
    );
    expect(barrel).not.toContain("deprecations.js");
  });

  test("docs/api.md states the policy the pass implements", () => {
    const api = fs.readFileSync(path.join(rootDir, "docs/api.md"), "utf8");
    // The three policy promises the machinery enforces: announce in three
    // places at once, a grace period, and a concrete replacement.
    expect(api).toContain("no silent breaks");
    expect(api).toContain("Grace period");
    expect(api).toContain("concrete replacement");
  });
});
