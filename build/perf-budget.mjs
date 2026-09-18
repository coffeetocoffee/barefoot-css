/* Barefoot — performance budget (v8.5, "DX Governance").
   The size budget polices bytes; this polices what bytes DO. A
   compressed selector costs nothing to ship and anything to match: a
   `:has()` recalculation can walk a subtree on every DOM mutation, a
   container query establishes a containment context, a `view()` timeline
   keeps a scroll-driven animation alive, and a `mask-image` on a sticky
   element composites on every frame of scroll. None of them show up in
   sizes.json.

   What it measures (static parse of the shipped source — the selectors
   are identical post-minification, and parsing src keeps `npm run perf`
   honest without a rebuild):

   - `:has()` — occurrences, and the two shapes that cost more than
     the rest: DEEP (a `:has()` whose argument contains another
     `:has()`) and CHAIN (two or more `:has()` in one selector). Both
     multiply the recalc work a single DOM mutation triggers.
   - `@container` — size/style queries, plus the `container-type` /
     `container-name` declarations that establish the contexts (each is
     a containment scope layout must maintain).
   - `view()` / `scroll()` — scroll-driven animation timelines.
   - `mask` — `mask-image` / `mask` declarations (composited layers;
     on a sticky element the mask repaints with every scroll frame).
   - selectors + complexity — total style rules, and the deepest
     compound chain (a proxy for match cost: the more combinators a
     selector has, the more backtracking a mismatch costs).

   Every metric has a budget. Budgets are set above the current
   measurement with headroom, and a breach exits non-zero — the same
   contract as the size budget. The `:has()` depth budget is ZERO by
   design: a nested `:has()` is the one shape whose recalc cost is
   superlinear, so the budget makes adding one a deliberate, reviewed
   event rather than a silent one. Runtime profiling (the actual
   milliseconds) stays bring-your-own — this is a static gate, and
   pretending to measure timing on a CI machine would be the shallow
   middle the rest of the framework avoids.

   Usage:  npm run perf   (also part of npm run check) */
import fs from "node:fs";
import { readdirSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const SRC = join(root, "src");

/* Budgets. Bump only in review, like the size budget — and say why.
   Measured at v8.5: 40 :has() total / 10 chains / 0 deep / 24 @container
   blocks / 20 container contexts / 12 timelines / 6 masks / 700 rules /
   longest chain 6. Every budget carries headroom except `hasDeep`,
   which is zero on purpose. */
const BUDGETS = {
  hasDeep: 0, // nested :has() — superlinear recalc; zero is the stance
  hasChain: 16, // two-or-more :has() in one selector
  hasTotal: 80, // every :has() in the shipped CSS
  containers: 40, // @container blocks
  containerContexts: 40, // container-type / container-name declarations
  viewTimelines: 16, // view() / scroll() timelines
  masks: 16, // mask / mask-image declarations
  maxDepth: 8, // compound selectors in the longest chain
};

/* Walk the source as a brace tree. Every `{…}` block is a rule whose
   prelude is the text before the brace; a prelude starting with `@` is
   an at-rule (its block holds more rules), anything else is a style rule
   and its prelude is a selector list. Native nesting falls out for free:
   a nested rule is just another block inside a block. Comments are
   stripped first so prose can't be mistaken for a selector. */
function stripComments(src) {
  return src.replace(/\/\*[\s\S]*?\*\//g, "");
}

function tokenize(src) {
  const rules = [];
  const stack = [];
  let buf = "";
  let inString = null;
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (inString) {
      buf += c;
      if (c === inString && src[i - 1] !== "\\") inString = null;
      continue;
    }
    if (c === '"' || c === "'") {
      inString = c;
      buf += c;
      continue;
    }
    if (c === "{") {
      rules.push({ prelude: buf.trim(), depth: stack.length });
      stack.push(buf.trim());
      buf = "";
      continue;
    }
    if (c === "}") {
      stack.pop();
      buf = "";
      continue;
    }
    buf += c;
  }
  return rules;
}

/* The maximum nesting depth of `:has()` functional pseudo-classes: 0
   absent, 1 flat, 2+ nested. Walks a context stack — each `:has(` pushes
   a has-frame, every other `(` pushes a plain frame, `)` pops — so a
   nested pseudo-class (`:has(:is(.b):has(.c))`) counts and a sibling
   group does not. Brackets are tracked because a `:has(` appearing inside
   an attribute value (`[data-x=":has("]`) is a string, not a selector
   (approximation: a bracket inside a quoted value can fool it — no
   shipped selector is pathological enough to matter, and the detector
   stays conservative, never over-counting a real nesting). */
function hasNesting(sel) {
  const stack = [];
  let max = 0;
  let brackets = 0;
  let i = 0;
  while (i < sel.length) {
    if (brackets === 0 && sel.startsWith(":has(", i)) {
      stack.push(true);
      const depth = stack.filter(Boolean).length;
      if (depth > max) max = depth;
      i += 5;
      continue;
    }
    const c = sel[i];
    if (c === "[") brackets++;
    else if (c === "]") brackets = Math.max(0, brackets - 1);
    else if (c === "(") stack.push(false);
    else if (c === ")") stack.pop();
    i++;
  }
  return max;
}

function countHas(sel) {
  return (sel.match(/:has\(/g) || []).length;
}

/* Combinator depth: the number of compound pieces in the longest
   selector of the list (descendant, >, +, ~ all separate compounds). */
function combinatorDepth(sel) {
  return Math.max(
    ...sel
      .split(",")
      .map((part) =>
        part
          .trim()
          .split(/\s*[>+~]\s*|\s+/)
          .filter(Boolean).length
      )
  );
}

function analyzeFile(file) {
  const src = stripComments(readFileSync(file, "utf8"));
  const rules = tokenize(src);
  const m = {
    has: 0,
    hasDeep: 0,
    hasChain: 0,
    containers: 0,
    containerContexts: 0,
    viewTimelines: 0,
    masks: 0,
    selectors: 0,
    maxDepth: 0,
    deepSelectors: [],
  };
  for (const r of rules) {
    const prelude = r.prelude;
    if (!prelude) continue;
    if (prelude.startsWith("@")) {
      if (prelude.startsWith("@container")) m.containers++;
      continue;
    }
    // Style rule: the prelude is a selector list.
    m.selectors++;
    const depth = combinatorDepth(prelude);
    if (depth > m.maxDepth) m.maxDepth = depth;
    const has = countHas(prelude);
    if (has > 0) {
      m.has += has;
      if (hasNesting(prelude) >= 2) {
        m.hasDeep++;
        m.deepSelectors.push(prelude.trim().replace(/\s+/g, " "));
      }
      if (has >= 2) m.hasChain++;
    }
  }
  // Declarations live in the raw source (bodies were discarded by the
  // rule walker): count them as textual occurrences — they are
  // unambiguous property names.
  m.containerContexts =
    (src.match(/(^|[^\w-])(container-type|container-name)\s*:/g) || []).length;
  m.viewTimelines =
    (src.match(/animation-timeline\s*:[^;}]*\b(view|scroll)\(/g) || []).length;
  m.masks =
    (src.match(/(^|[^\w-])(mask|mask-image)\s*:/g) || []).length;
  return m;
}

function add(a, b) {
  for (const k of [
    "has", "hasDeep", "hasChain", "containers", "containerContexts",
    "viewTimelines", "masks", "selectors",
  ]) {
    a[k] += b[k];
  }
  a.maxDepth = Math.max(a.maxDepth, b.maxDepth);
  a.deepSelectors.push(...b.deepSelectors);
  return a;
}

export {
  BUDGETS,
  stripComments,
  tokenize,
  hasNesting,
  countHas,
  combinatorDepth,
  analyzeFile,
};

/* The pure pieces above are exported so the suite can prove the detector
   on synthetic CSS without touching src/ — the zero-deep budget is a
   claim about the shipped CSS, and a gate that has never seen a violation
   is an assumption. Run directly, this is the check. */
const { pathToFileURL } = await import("node:url");
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}

function main() {
  const dirs = ["", "components", "themes"].map((d) => join(SRC, d));
  const files = [];
  for (const dir of dirs) {
    for (const f of readdirSync(dir).filter((f) => f.endsWith(".css"))) {
      files.push(join(dir, f));
    }
  }
  const total = files.reduce(
    (acc, f) => add(acc, analyzeFile(f)),
    {
      has: 0, hasDeep: 0, hasChain: 0, containers: 0, containerContexts: 0,
      viewTimelines: 0, masks: 0, selectors: 0, maxDepth: 0, deepSelectors: [],
    }
  );

  const rows = [
    [":has() occurrences", total.has, BUDGETS.hasTotal],
    [":has() chains (2+ in one selector)", total.hasChain, BUDGETS.hasChain],
    [":has() DEEP (nested — recalc risk)", total.hasDeep, BUDGETS.hasDeep],
    ["@container blocks", total.containers, BUDGETS.containers],
    ["container-type/name declarations", total.containerContexts, BUDGETS.containerContexts],
    ["view()/scroll() timelines", total.viewTimelines, BUDGETS.viewTimelines],
    ["mask / mask-image declarations", total.masks, BUDGETS.masks],
    ["style rules (parse cost)", total.selectors, null],
    ["longest compound chain", total.maxDepth, BUDGETS.maxDepth],
  ];
  console.log("perf budget — static analysis of src/**\n");
  const failures = [];
  for (const [name, measured, budget] of rows) {
    const verdict =
      budget === null
        ? "reported"
        : measured <= budget
          ? "PASS"
          : "FAIL";
    if (verdict === "FAIL") failures.push({ name, measured, budget });
    console.log(
      `  ${name.padEnd(38)} ${String(measured).padStart(5)}` +
        (budget === null ? "" : ` / ${String(budget).padStart(4)}`) +
        `  ${verdict}`
    );
  }
  if (total.deepSelectors.length > 0) {
    console.log("\n  deep :has() selectors (each is a budget breach):");
    for (const s of total.deepSelectors) console.log(`    · ${s}`);
  }
  if (failures.length > 0) {
    console.error(
      `\nperf budget: ${failures.length} metric(s) over budget — ` +
        "trim the CSS or bump the budget deliberately in review, like the size budget."
    );
    for (const f of failures) {
      console.error(`  · ${f.name}: ${f.measured} > ${f.budget}`);
    }
    process.exit(1);
  }
  console.log("\nperf budget: all metrics within budget → PASS");
}

main();
