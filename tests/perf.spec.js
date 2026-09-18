/* Barefoot — performance budget tests (v8.5, "DX Governance").
   The size budget has sizes.json; this is the same contract for what
   bytes DO. The gate runs as a script in `npm run check` (and in
   `npm run perf` alone); the suite pins it from the test side so it
   cannot quietly lose enforcement, and proves the DETECTOR works — a
   budget that has never seen a violation is an assumption, so the
   deep-`:has()` and chain detectors are fed synthetic CSS.

   npm run test:perf */
import { test, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import {
  BUDGETS,
  tokenize,
  hasNesting,
  countHas,
  combinatorDepth,
  analyzeFile,
} from "../build/perf-budget.mjs";

const rootDir = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

test.describe("perf budget: the script is the check", () => {
  test("npm run perf exits zero and reports every metric", () => {
    const res = spawnSync(process.execPath, ["build/perf-budget.mjs"], {
      cwd: rootDir,
      encoding: "utf8",
      shell: false,
    });
    expect(res.status, res.stderr).toBe(0);
    expect(res.stdout).toContain("perf budget");
    // The headline metrics are named, not just summed.
    for (const metric of [
      ":has() occurrences",
      ":has() DEEP",
      "@container blocks",
      "view()/scroll() timelines",
      "mask / mask-image declarations",
    ]) {
      expect(res.stdout).toContain(metric);
    }
    expect(res.stdout).toContain("PASS");
  });

  test("the zero-deep :has() stance is pinned in the budgets", () => {
    // A nested :has() is superlinear in recalc cost, so the budget is
    // zero — adding one must be a deliberate, reviewed event. This pin
    // makes a silent addition a test failure.
    expect(BUDGETS.hasDeep).toBe(0);
    // The other budgets carry headroom; each is a real number, not a
    // placeholder, so a breach is measurable.
    for (const [name, budget] of Object.entries(BUDGETS)) {
      expect(typeof budget, `${name} must be a number`).toBe("number");
      expect(budget, `${name} must be non-negative`).toBeGreaterThanOrEqual(0);
    }
  });
});

test.describe("perf budget: the detectors actually detect", () => {
  test("a nested :has() is deep; a flat one is not", () => {
    expect(hasNesting(".a:has(.b)")).toBe(1);
    expect(hasNesting(".a:has(.b:has(.c))")).toBe(2);
    expect(hasNesting(".a:has(:is(.b):has(.c))")).toBe(2);
    // A class or value containing the letters "has" must not fool it.
    expect(hasNesting(".has-list:has(.b)")).toBe(1);
    expect(hasNesting('[data-x=":has("]')).toBe(0);
  });

  test("counts and combinator depth", () => {
    expect(countHas(".a:has(.b) .c:has(.d)")).toBe(2);
    expect(combinatorDepth(".a > .b .c")).toBe(3);
    expect(combinatorDepth(".a, .b > .c")).toBe(2);
  });

  test("the tokenizer sees rules, at-rules, and nesting", () => {
    const rules = tokenize(".a { color: red } @media all { .b { c: 1 } }");
    expect(rules.map((r) => r.prelude)).toEqual([".a", "@media all", ".b"]);
  });

  test("analyzeFile: a synthetic file breaches deep/chain/mask budgets", () => {
    const tmp = path.join(rootDir, "tests", "fixtures", "perf-synthetic.css");
    fs.writeFileSync(
      tmp,
      `/* a synthetic file: nested :has(), a chain, a mask, a timeline */
      .deep:has(.x:has(.y)) { color: red }
      .chain:has(.a):has(.b) { color: blue }
      .scroll { animation-timeline: view(); }
      .sticky-mask { mask-image: linear-gradient(red, blue); }
      @container (width > 10rem) { .in { color: green } }`
    );
    try {
      const m = analyzeFile(tmp);
      // The deep selector is itself a chain (two :has() in one selector),
      // so it counts in both — the metrics are shapes, not disjoint sets.
      expect(m.hasDeep).toBe(1);
      expect(m.deepSelectors[0]).toContain(".deep:has(.x:has(.y))");
      expect(m.hasChain).toBe(2);
      expect(m.has).toBe(4);
      expect(m.viewTimelines).toBe(1);
      expect(m.masks).toBe(1);
      expect(m.containers).toBe(1);
    } finally {
      fs.rmSync(tmp, { force: true });
    }
  });

  test("the shipped CSS has zero deep :has() (the claim the budget makes)", () => {
    const dirs = ["", "components", "themes"].map((d) =>
      path.join(rootDir, "src", d)
    );
    let deep = 0;
    let chains = 0;
    for (const dir of dirs) {
      for (const f of fs.readdirSync(dir).filter((f) => f.endsWith(".css"))) {
        const m = analyzeFile(path.join(dir, f));
        deep += m.hasDeep;
        chains += m.hasChain;
      }
    }
    expect(deep, "a nested :has() landed in src/ — review it").toBe(0);
    expect(chains).toBeLessThanOrEqual(BUDGETS.hasChain);
  });
});

test.describe("perf budget: the gate is wired and documented", () => {
  test("package.json wires perf into check", () => {
    const pkg = JSON.parse(
      fs.readFileSync(path.join(rootDir, "package.json"), "utf8")
    );
    expect(pkg.scripts.perf).toBe("node build/perf-budget.mjs");
    expect(pkg.scripts.check).toContain("npm run perf");
  });

  test("docs/performance.md documents the budgets beyond bytes", () => {
    const docs = fs.readFileSync(
      path.join(rootDir, "docs/performance.md"),
      "utf8"
    );
    // The page must say the size story is not the whole story.
    expect(docs).toContain("npm run perf");
    expect(docs.toLowerCase()).toContain(":has()");
  });
});
