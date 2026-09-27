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
   forces the question before the next bump breaches. */
const HEADROOM_WARN_THRESHOLD = 0.85;

const JS_BUDGETS = {
  // The registry is data-heavy by design: every rule quotes the docs
  // sentence that states its contract (ADR-0015). v7.0's state-conflict
  // and event-contract rules pushed the quoted prose past 4KB — bumped
  // deliberately in review, not silently. v7.2's aria-sort-wired and
  // selection-complete pushed it past 5KB — same reason, same review.
  // v7.8's roving-focus and reading-order-after-reflow pushed it past
  // 7KB — same reason, same review. v8.0's coexistence-clean adds the
  // unlayered-reset CSSOM walk plus its quote — past 8KB again.
  // Measured at 9.27KB gzip against 10KB (93% utilization) — at the ceiling.
  "js/verify-contracts.js": 10240,
  // The barrel is imports only — growth here means something regressed.
  "js/barefoot.js": 1024,
  // v8.5 splits the checker into two passes (contracts + deprecations,
  // ADR-0023): runDeprecations shares one sweep with runVerify, but the
  // second registry, its formatter, and its warnOnce loop are real code.
  // Bumped from the 2KB family default deliberately, in review — same
  // rule as the registry bumps above.
  "js/verify.js": 2560,
};

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

  return { ok: failures.length === 0, failures, warnings, entries };
}

export {
  GZIP_BUDGET,
  DEFAULT_JS_BUDGET,
  HEADROOM_WARN_THRESHOLD,
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
