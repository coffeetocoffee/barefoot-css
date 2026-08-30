/* Barefoot — size check only. Reads dist/sizes.json and enforces the
   budget. Fast, so it can run in CI on every PR without a rebuild. */
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { checkContrast } from "./contrast.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const GZIP_BUDGET = 10 * 1024;

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

// Chroma AA guard — fails the build if any text-on-background pair < 4.5:1
const { failures } = checkContrast({ strict: true });
if (failures.length > 0) {
  console.error(`\ncontrast: ${failures.length} pair(s) below AA 4.5:1 — fix tokens before shipping.`);
  process.exit(1);
} else {
  console.log("contrast: AA 4.5:1 → PASS");
}
