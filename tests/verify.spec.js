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
import { gotoDemo, mountFixture } from "./helpers.js";
// The suite consumes the pack, not src/ directly — one registry, two
// formats, and the pack re-exports the registry it shares with the
// engine (ADR-0015).
import { VERIFY_RULES, ALL_MODULES, runPack, runRule, assertClean } from "../verify/pack.mjs";

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

  test("verify.js stays in the ~2KB module family", () => {
    const { sizes } = jsBudgets();
    const v = sizes["js/verify.js"];
    expect(v, "js/verify.js measured by the build").toBeTruthy();
    expect(v.gzip).toBeLessThanOrEqual(2048);
  });

  test("the budget map cannot silently drop the Verify entries", () => {
    // verify.js rides the 2KB default, but the registry's explicit
    // budget must exist — a refactor renaming files would otherwise
    // leave it policed only by the family default with less headroom.
    const { budgets } = jsBudgets();
    expect(budgets["js/verify-contracts.js"]).toBe(5120);
    expect(budgets["js/barefoot.js"]).toBe(1024);
  });
});
