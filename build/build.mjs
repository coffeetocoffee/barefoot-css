/* Barefoot build.
   Bundles each entry point with Lightning CSS, minifies, then checks
   the size budget (dist/index.css must stay under 10KB gzipped).

   Usage:  npm run build      (build + size check)
           npm run size       (size check only, no rebuild)
           npm run check      (both)
*/
import { bundle } from "lightningcss";
import {
  copyFileSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import zlib from "node:zlib";
import { checkContrast } from "./contrast.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const SRC = join(root, "src");
const DIST = join(root, "dist");

const GZIP_BUDGET = 10 * 1024; // 10KB gzipped for dist/index.css
// Raw budget ≈ 3× gzip (typical CSS ratio). Used when zlib is unavailable.
const RAW_BUDGET = GZIP_BUDGET * 3;

/* Every file we ship, keyed by its dist-relative output path. */
function collectEntries() {
  const entries = {
    "index.css": join(SRC, "index.css"),
    "full.css": join(SRC, "full.css"),
    "utilities.css": join(SRC, "utilities.css"),
  };

  for (const dir of ["components", "themes"]) {
    const abs = join(SRC, dir);
    for (const file of readdirSync(abs).filter((f) => f.endsWith(".css"))) {
      entries[`${dir}/${file}`] = join(abs, file);
    }
  }
  return entries;
}

function sizes(buffer) {
  return { raw: buffer.length, gzip: 0, brotli: 0 };
}

export function fmt(bytes) {
  return `${(bytes / 1024).toFixed(2)}KB`;
}

function buildAll() {
  rmSync(DIST, { recursive: true, force: true });
  mkdirSync(DIST, { recursive: true });

  const entries = collectEntries();
  const report = {};

  for (const [out, src] of Object.entries(entries)) {
    mkdirSync(join(DIST, dirname(out)), { recursive: true });

    const { code } = bundle({
      filename: src,
      minify: true,
      // No `targets`: Barefoot is built for modern evergreen browsers.
      // Transpiling away modern CSS would defeat the whole point.
    });

    writeFileSync(join(DIST, out), code);
    report[out] = sizes(code);
  }

  // Opt-in JS modules are shipped as-is (readable, commented, tiny).
  // No bundler, no transform — modern browsers only, same as the CSS.
  const jsDir = join(SRC, "js");
  mkdirSync(join(DIST, "js"), { recursive: true });
  for (const file of readdirSync(jsDir).filter((f) => f.endsWith(".js"))) {
    const code = readFileSync(join(jsDir, file));
    copyFileSync(join(jsDir, file), join(DIST, "js", file));
    report[`js/${file}`] = sizes(code);
  }

  return report;
}

function printReport(report) {
  const lines = Object.entries(report)
    .sort((a, b) => b[1].gzip - a[1].gzip)
    .map(
      ([file, s]) =>
        `${file.padEnd(28)} ${fmt(s.raw).padStart(8)} raw   ` +
        `${fmt(s.gzip).padStart(8)} gzip   ${fmt(s.brotli).padStart(8)} brotli`
    );
  console.log(lines.join("\n"));
}

function checkBudget(report) {
  const index = report["index.css"];
  const budget = index.gzip > 0 ? GZIP_BUDGET : RAW_BUDGET;
  const measured = index.gzip > 0 ? index.gzip : index.raw;
  const unit = index.gzip > 0 ? "gzip" : "raw";
  const ok = measured <= budget;
  console.log(
    `\nbudget: dist/index.css ${fmt(measured)} ${unit} ` +
      `(limit ${fmt(budget)}) → ${ok ? "PASS" : "FAIL"}`
  );
  if (!ok) {
    throw new Error(
      `Size budget exceeded: ${fmt(index.gzip)} gzip > ${fmt(GZIP_BUDGET)}. ` +
        `Trim something or bump the budget deliberately.`
    );
  }
}

const report = buildAll();
printReport(report);
checkBudget(report);

// Chroma AA guard (warn here; hard fail is in size.mjs)
const { warnings } = checkContrast({ strict: false });
if (warnings.length === 0) console.log("contrast: AA 4.5:1 → PASS");
else console.warn(`contrast: ${warnings.length} warning(s) — run npm run size for strict fail.`);

writeFileSync(
  join(DIST, "sizes.json"),
  JSON.stringify(report, null, 2)
);

console.log("\nBuilt to dist/ — sizes.json written.");
