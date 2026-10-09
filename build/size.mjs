/* Barefoot — size check only. Reads dist/sizes.json and enforces the
   budgets. Fast, so it can run in CI on every PR without a rebuild.
   
   Exported pieces are pure so tests can verify the budget enforcement
   and ratchet detectors on synthetic reports. */
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { checkContrast } from "./contrast.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const GZIP_BUDGET = 10 * 1024;

/* JS budget policing (v6.1 Phase 4): every shipped JS entry is
   measured (sizes.json) AND budgeted here. Gzip is the contract, same
   as CSS. The default is the documented "~2KB module family"; a new
   js/ entry fails the check until it is given a deliberate budget —
   bump a limit only in review, like the CSS budget constant above. */
const DEFAULT_JS_BUDGET = 2048;

/* Ratchet ceiling detector (v8.6.1): when a module consumes >= 85% of
   its budget, size.mjs logs a visible notice. The registry budget
   grew 4KB → 5KB → 6.6KB → 8KB → 10KB across releases; the warning
   forces the question before the next bump breaches. v8.7 split that
   registry by domain, so the ceiling now has to hold across five
   separate entries rather than one. */
const HEADROOM_WARN_THRESHOLD = 0.85;

const JS_BUDGETS = {
  /* The registry is data-heavy by design: every rule quotes the docs
     sentence that states its contract (ADR-0015), so growth here is real
     authored content, not accidental bulk. It was one 9216-byte ratchet
     through v8.6 — history 4 → 5 → 6.6 → 8 → 10 → 9KB, seven releases,
     every new rule pushing the same ceiling — and v8.7 split it into
     three domain slices so each carries its own headroom. The three
     budgets below are the reviewed decision that split produced; the
     ~2.4KB of combined gzip growth over the old single file is the
     duplicated file scaffolding (three headers, three import/export
     pairs), paid back by the domain entry points no longer dragging the
     whole registry in (verify-domain.js imports slices directly). */
  "js/verify-contracts-core.js": 5120, // 4.69KB — 10 rules + the coexistence CSSOM walk
  "js/verify-contracts-forms.js": 3072, // 2.74KB — 7 rules, the densest slice
  "js/verify-contracts-tables.js": 2048, // 1.80KB — 2 rules
  // The aggregator: three imports, one frozen concatenation, the domain
  // map, and the documented rule shape. Imports + comments only —
  // growth here means a rule was added outside a slice.
  "js/verify-contracts.js": 2048, // 1.80KB
  // The barrel is imports only — growth here means something regressed.
  "js/barefoot.js": 1024,
  // v8.5 splits the checker into two passes (contracts + deprecations,
  // ADR-0023): runDeprecations shares one sweep with runVerify, but the
  // second registry, its formatter, and its warnOnce loop are real code.
  // Bumped from the 2KB family default deliberately, in review — same
  // rule as the registry bumps above.
  "js/verify.js": 2816, // 2.53KB — 92%
  /* carousel.js and table-sort.js sit at 96% and 92% of the 2KB family
     default. Reviewed as ceilings to keep, not to raise: both are
     behavior-complete surfaces whose remaining work is bugfixing, and
     neither should grow a feature without a deliberate bump here. */
  "js/carousel.js": 2048, // 1.92KB — 96%
  "js/table-sort.js": 2048, // 1.84KB — 92%
  // lifecycle.js is shared plumbing every module imports (ADR-0002/
  // 0004/0006), never barrel-exported. At 69% of the family default with
  // the widest blast radius in js/, so it gets an explicit budget before
  // it reaches a notice.
  "js/lifecycle.js": 2048, // 1.42KB — 69%
  // The per-domain entry factory (v8.7: imports the slices directly so a
  // scoped consumer doesn't pull the whole registry).
  "js/verify-domain.js": 2048,
  // Thin one-line entry points over createDomainEntry — imports only.
  "js/verify-core.js": 1024,
  "js/verify-forms.js": 1024,
  "js/verify-tables.js": 1024,
  "js/verify-all.js": 1024,
};

/* The registry split into per-domain slices (v8.7), and a split can quietly
   defeat a ratchet: three files at 60% each look calmer than one file at
   90%, while the family's total bytes are what a consumer of
   `barefoot-css/verify/all` actually pulls. So the slices carry individual
   budgets AND the family carries an aggregate ceiling, and the near-ceiling
   notice fires on either. Individual budgets say "is this slice
   disproportionate?"; the family says "has the registry as a whole grown?"
   — the question the pre-split single ratchet was actually asking. */
const REGISTRY_FAMILY = Object.freeze([
  "js/verify-contracts-core.js",
  "js/verify-contracts-forms.js",
  "js/verify-contracts-tables.js",
  "js/verify-contracts.js",
]);
/* Deliberately BELOW the sum of the four slice budgets (12.288KB): if it
   equalled that sum it could never fire before the per-file checks did,
   which would make it a notice with no teeth. At 11.5KB against 11.03KB
   measured it bites first — that is the point of keeping it after the
   split. Bump it in review, never to make a new rule's addition quiet. */
const REGISTRY_FAMILY_BUDGET = 11776;

function checkSizeReport(report) {
  const failures = [];
  const warnings = [];
  const entries = [];

  const index = report["index.css"];
  if (!index) {
    failures.push("dist/sizes.json has no index.css entry");
    return { ok: false, failures, warnings, entries };
  }
  const budget = index.gzip > 0 ? GZIP_BUDGET : GZIP_BUDGET * 3;
  const measured = index.gzip > 0 ? index.gzip : index.raw;
  const unit = index.gzip > 0 ? "gzip" : "raw";
  const ok = measured <= budget;
  entries.push(
    `dist/index.css ${(measured / 1024).toFixed(2)}KB ${unit} ` +
      `(limit ${(budget / 1024).toFixed(2)}KB) → ${ok ? "PASS" : "FAIL"}`
  );
  if (!ok) {
    failures.push(`dist/index.css ${(measured / 1024).toFixed(2)}KB > ${(budget / 1024).toFixed(2)}KB budget`);
  }

  for (const [file, s] of Object.entries(report)) {
    if (!file.startsWith("js/") || !file.endsWith(".js")) continue;
    const limit = JS_BUDGETS[file] ?? DEFAULT_JS_BUDGET;
    const measuredJs = s.gzip > 0 ? s.gzip : s.raw;
    const ratio = measuredJs / limit;
    const pct = (ratio * 100).toFixed(0);

    if (measuredJs > limit) {
      failures.push(
        `${file} ${measuredJs} bytes > ${limit} byte budget (${pct}%) — trim it or bump the limit deliberately`
      );
    } else if (ratio >= HEADROOM_WARN_THRESHOLD) {
      warnings.push(
        `${file} ${(measuredJs / 1024).toFixed(2)}KB / ${(limit / 1024).toFixed(2)}KB gzip (${pct}%) — near budget ceiling (${(HEADROOM_WARN_THRESHOLD * 100).toFixed(0)}% threshold)`
      );
    }
  }

  /* Family aggregate, after the per-file loop so the individual results
     are already in `failures` — a slice over its own budget should not
     also be reported as an over-budget family. */
  let familyMeasured = 0;
  let familySeen = 0;
  for (const file of REGISTRY_FAMILY) {
    const s = report[file];
    if (!s) continue;
    familySeen++;
    familyMeasured += s.gzip > 0 ? s.gzip : s.raw;
  }
  if (familySeen === REGISTRY_FAMILY.length) {
    const ratio = familyMeasured / REGISTRY_FAMILY_BUDGET;
    const label = "verify registry family (4 slices)";
    if (ratio > 1) {
      failures.push(
        `${label} ${familyMeasured} bytes > ${REGISTRY_FAMILY_BUDGET} byte budget ` +
          `(${(ratio * 100).toFixed(0)}%) — a slice grew past what the split was meant to absorb`
      );
    } else if (ratio >= HEADROOM_WARN_THRESHOLD) {
      warnings.push(
        `${label} ${(familyMeasured / 1024).toFixed(2)}KB / ${(REGISTRY_FAMILY_BUDGET / 1024).toFixed(2)}KB gzip ` +
          `(${(ratio * 100).toFixed(0)}%) — near budget ceiling (${(HEADROOM_WARN_THRESHOLD * 100).toFixed(0)}% threshold)`
      );
    }
  }

  return { ok: failures.length === 0, failures, warnings, entries };
}

export {
  GZIP_BUDGET,
  DEFAULT_JS_BUDGET,
  HEADROOM_WARN_THRESHOLD,
  REGISTRY_FAMILY,
  REGISTRY_FAMILY_BUDGET,
  JS_BUDGETS,
  checkSizeReport,
};

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}

function main() {
  let report;
  try {
    report = JSON.parse(readFileSync(join(root, "dist", "sizes.json"), "utf8"));
  } catch {
    console.error("dist/sizes.json not found — run `npm run build` first.");
    process.exit(1);
  }

  const { ok, failures, warnings, entries } = checkSizeReport(report);
  for (const e of entries) console.log(e);

  if (warnings.length > 0) {
    for (const w of warnings) console.log(`notice: ${w}`);
  }

  if (!ok) {
    console.error(`\njs budget: ${failures.length} module(s) over budget:`);
    for (const f of failures) console.error(`  ${f}`);
    process.exit(1);
  }
  console.log(
    `js budget: ${Object.keys(JS_BUDGETS).length + 1} module family → PASS (${DEFAULT_JS_BUDGET / 1024}KB default)`
  );

  // Chroma AA guard — fails the build if any text-on-background pair < 4.5:1
  const { failures: contrastFailures } = checkContrast({ strict: true });
  if (contrastFailures.length > 0) {
    console.error(`\ncontrast: ${contrastFailures.length} pair(s) below AA 4.5:1 — fix tokens before shipping.`);
    process.exit(1);
  } else {
    console.log("contrast: AA 4.5:1 → PASS");
  }
}
