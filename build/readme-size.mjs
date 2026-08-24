/* Barefoot — regenerate the README size table from dist/sizes.json.
   Replaces the block between <!-- SIZES:START --> and <!-- SIZES:END -->
   in README.md. Idempotent — safe to run on every build.

   Usage: npm run docs:size  (after npm run build) */
import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const README = join(root, "README.md");
const START = "<!-- SIZES:START -->";
const END = "<!-- SIZES:END -->";

let report;
try {
  report = JSON.parse(readFileSync(join(root, "dist", "sizes.json"), "utf8"));
} catch {
  console.error("dist/sizes.json not found — run `npm run build` first.");
  process.exit(1);
}

const rows = Object.entries(report)
  .sort((a, b) => (b[1].gzip || b[1].raw) - (a[1].gzip || a[1].raw))
  .map(([file, s]) => {
    const gzip = (s.gzip / 1024).toFixed(2);
    const raw = (s.raw / 1024).toFixed(2);
    const brotli = (s.brotli / 1024).toFixed(2);
    if (s.gzip === 0) {
      return `| \`${file}\` | ${raw}KB | — | — |`;
    }
    return `| \`${file}\` | ${raw}KB | **${gzip}KB** | ${brotli}KB |`;
  })
  .join("\n");

const table = [
  "| Artifact | Raw | Gzip | Brotli |",
  "|---|---|---|---|",
  rows,
].join("\n");

const readme = readFileSync(README, "utf8");
const startIdx = readme.indexOf(START);
const endIdx = readme.indexOf(END);

if (startIdx === -1 || endIdx === -1) {
  console.error("README.md is missing the SIZES markers — add them:");
  console.error(`  ${START}\n  <table>\n  ${END}`);
  process.exit(1);
}

const next =
  readme.slice(0, startIdx) +
  START +
  "\n" +
  table +
  "\n" +
  readme.slice(endIdx);

writeFileSync(README, next);
console.log("README.md size table regenerated.");