/* Barefoot — size check only. Reads dist/sizes.json and enforces the
   budget. Fast, so it can run in CI on every PR without a rebuild. */
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

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
const ok = index.gzip <= GZIP_BUDGET;
console.log(
  `dist/index.css ${(index.gzip / 1024).toFixed(2)}KB gzip ` +
    `(limit ${(GZIP_BUDGET / 1024).toFixed(2)}KB) → ${ok ? "PASS" : "FAIL"}`
);
process.exit(ok ? 0 : 1);
