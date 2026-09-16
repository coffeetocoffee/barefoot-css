/* Barefoot — Verify contract-packs for CI (Phase 2, ADR-0015).
   The same rules as the browser checker, exported as Playwright-
   composable assertions for the consumer's test suite. One registry,
   two formats: this pack writes no rule logic of its own — it drives
   the registry.

   import { runPack, runRule, assertClean, ALL_MODULES }
     from "barefoot-css/verify/pack.mjs";

   test("page honors Barefoot contracts", async ({ page }) => {
     await page.goto("/");
     await assertClean(page);                    // throws with a report
     // or, composable:
     expect(await runPack(page)).toEqual([]);
     expect(await runRule(page, "popover-target-exists")).toEqual([]);
   });

   Options (both runners):
   - base   where the framework's ESM files live on the page's origin.
            Default "/dist/" (npm, served as-is — the no-build story).
            CDN users pass their jsDelivr base; self-hosters their path.
   - armed  module stems the page under test loads. Default: all of
            them (the barefoot.js barrel case). If the page loads only
            some modules, pass the subset — module-pairing then audits
            the rest as dead controls. The BROWSER checker detects
            arming itself; CI cannot reach into the page's module
            registry, so here you declare it.

   How it runs: the sweep is evaluated in the page under test and
   imports js/verify-contracts.js from `base` — the byte-for-byte copy
   of src/js/ the page itself loads, so CI pins exactly what ships. It
   deliberately never imports js/verify.js: importing the checker would
   run its auto-scan and console-warn inside the page under test.

   Zero dependencies. Runs on any Playwright Page.
*/

import { VERIFY_RULES } from "../src/js/verify-contracts.js";

/* The registry itself, re-exported: docs, checker, and packs share one
   source of truth (pinned by tests/verify.spec.js). */
export { VERIFY_RULES };

/* Module stems, mirroring src/js/ file names. The browser modules arm
   themselves with these exact stems (lifecycle.js arm()); pass a
   subset as `armed` when the page loads less than the barrel. */
export const ALL_MODULES = Object.freeze([
  "tabs",
  "popover-menu",
  "carousel",
  "alert-dismiss",
  "chips",
  "nav",
  "table-sort",
  "toast",
  "tooltip",
  "reveal",
  "theme",
  "filter-clear",
]);

const DEFAULT_BASE = "/dist/";

/* Sweep the page: run each registry rule's check against every matched
   element, in-page. Returns [{ id, selector, detail, fix }] — the same
   shape js/verify.js's runVerify returns. */
function sweep(page, opts, ruleId) {
  const base = opts.base ?? DEFAULT_BASE;
  const armed = opts.armed ?? ALL_MODULES;
  return page
    .evaluate(async (arg) => {
      const url = new URL(
        arg.base + "js/verify-contracts.js",
        document.baseURI
      ).href;
      const { VERIFY_RULES } = await import(url);
      const armedSet = new Set(arg.armed);
      const ctx = {
        byId: (id) => document.getElementById(id),
        armed: (name) => armedSet.has(name),
      };
      const violations = [];
      for (const rule of VERIFY_RULES) {
        if (arg.ruleId && rule.id !== arg.ruleId) continue;
        for (const selector of [].concat(rule.select)) {
          for (const el of document.querySelectorAll(selector)) {
            const detail = rule.check(el, ctx);
            if (detail) violations.push({ id: rule.id, selector, detail, fix: rule.fix });
          }
        }
      }
      return violations;
    }, { base, armed: [...armed], ruleId })
    .catch((e) => {
      throw new Error(
        `[barefoot-css] verify pack: the sweep failed — ${e.message}\n` +
          `  Is ${base} reachable on the page's origin? Pass base: "/your/dist/path/" ` +
          `(or a full CDN URL) pointing at the framework's dist/ files.`
      );
    });
}

/* All rules against the current page. */
export function runPack(page, opts = {}) {
  return sweep(page, opts);
}

/* One rule by id. Unknown ids throw with the valid list — a renamed
   rule should fail loudly, not silently audit nothing. */
export function runRule(page, ruleId, opts = {}) {
  if (!VERIFY_RULES.some((r) => r.id === ruleId)) {
    throw new Error(
      `[barefoot-css] verify pack: unknown rule "${ruleId}". ` +
        `Valid rules: ${VERIFY_RULES.map((r) => r.id).join(", ")}`
    );
  }
  return sweep(page, opts, ruleId);
}

/* Convenience for any test runner: pass = quiet, fail = one report
   listing every violation and its fix. Returns the (empty) list on
   success so `await assertClean(page)` composes like the runners. */
export async function assertClean(page, opts = {}) {
  const violations = await runPack(page, opts);
  if (violations.length === 0) return violations;
  const byRule = new Map();
  for (const v of violations) {
    if (!byRule.has(v.id)) byRule.set(v.id, []);
    byRule.get(v.id).push(v);
  }
  const report = [...byRule]
    .map(([id, list]) => {
      const rule = VERIFY_RULES.find((r) => r.id === id);
      const lines = list.map((v) => `  · ${v.detail}`).join("\n");
      return `verify: ${id} — ${list.length} violation(s)\n${lines}\n  Fix: ${rule.fix}`;
    })
    .join("\n\n");
  throw new Error(
    `[barefoot-css] verify pack: ${violations.length} contract violation(s)\n\n${report}`
  );
}
