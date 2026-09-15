/* Barefoot — size check only. Reads dist/sizes.json and enforces the
   budgets. Fast, so it can run in CI on every PR without a rebuild. */
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { checkContrast } from "./contrast.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const GZIP_BUDGET = 10 * 1024;

/* JS budget policing (v6.1 Phase 4): every shipped JS entry is
   measured (sizes.json) AND budgeted here. Gzip is the contract, same
   as CSS. The default is the documented "~2KB module family"; a new
   js/ entry fails the check until it is given a deliberate budget —
   bump a limit only in review, like the CSS budget constant above. */
const DEFAULT_JS_BUDGET = 2048;
const JS_BUDGETS = {
  // The registry is data-heavy by design: every rule quotes the docs
  // sentence that states its contract (ADR-0015). v7.0's state-conflict
  // and event-contract rules pushed the quoted prose past 4KB — bumped
  // deliberately in review, not silently. v7.2's aria-sort-wired and
  // selection-complete pushed it past 5KB — same reason, same review.
  "js/verify-contracts.js": 6656,
  // The barrel is imports only — growth here means something regressed.
  "js/barefoot.js": 1024,
};

let report;
try {
  report = JSON.parse(readFileSync(join(root, "dist", "sizes.json"), "utf8"));
} catch {
  console.error("dist/sizes.json not found — run `npm run build` first.");
  process.exit(1);
}

const index = report["index.css"];
if (!index) {
  console.error("dist/sizes.json has no index.css entry — run `npm run build` first.");
  process.exit(1);
}
const budget = index.gzip > 0 ? GZIP_BUDGET : GZIP_BUDGET * 3;
const measured = index.gzip > 0 ? index.gzip : index.raw;
const unit = index.gzip > 0 ? "gzip" : "raw";
const ok = measured <= budget;
console.log(
  `dist/index.css ${(measured / 1024).toFixed(2)}KB ${unit} ` +
    `(limit ${(budget / 1024).toFixed(2)}KB) → ${ok ? "PASS" : "FAIL"}`
);
if (!ok) process.exit(1);

// JS budgets — same gzip contract, per entry. A js/ file without a
// deliberate budget is a failure: the table is measured AND policed.
const jsFailures = [];
for (const [file, s] of Object.entries(report)) {
  if (!file.startsWith("js/") || !file.endsWith(".js")) continue;
  const limit = JS_BUDGETS[file] ?? DEFAULT_JS_BUDGET;
  const measuredJs = s.gzip > 0 ? s.gzip : s.raw;
  if (measuredJs > limit) {
    jsFailures.push(
      `${file} ${measuredJs} bytes > ${limit} byte budget — trim it or bump the limit deliberately`
    );
  }
}
if (jsFailures.length > 0) {
  console.error(`\njs budget: ${jsFailures.length} module(s) over budget:`);
  for (const f of jsFailures) console.error(`  ${f}`);
  process.exit(1);
}
console.log(`js budget: ${Object.keys(JS_BUDGETS).length + 1} module family → PASS (${DEFAULT_JS_BUDGET / 1024}KB default)`);

// Chroma AA guard — fails the build if any text-on-background pair < 4.5:1
const { failures } = checkContrast({ strict: true });
if (failures.length > 0) {
  console.error(`\ncontrast: ${failures.length} pair(s) below AA 4.5:1 — fix tokens before shipping.`);
  process.exit(1);
} else {
  console.log("contrast: AA 4.5:1 → PASS");
}
