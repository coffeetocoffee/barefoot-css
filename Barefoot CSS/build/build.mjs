/* Barefoot build.
   Bundles each entry point with Lightning CSS, minifies, measures
   raw/gzip/brotli (gzip level 9 — the contract), then checks the size
   budget (dist/index.css must stay under 10KB gzipped). Also emits
   dist/tokens.json, the W3C DTCG export of the --bf-* tokens.

   Usage:  npm run build      (build + size check)
           npm run size       (size check only, no rebuild)
           npm run check      (both)
*/
import { bundle } from "lightningcss";
import { spawnSync } from "node:child_process";
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
import { buildDTCG } from "./tokens-dtcg.mjs";

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

/* Compress in a fresh child process. Some Node builds (observed on
   Node 26/Windows) fail their in-process sync zlib calls; a child
   process runs the same engine with clean zlib state. stdin carries
   the buffer in, stdout carries the compressed bytes out as base64. */
function compressInChild(buffer, algorithm) {
  const compress =
    algorithm === "gzip"
      ? "zlib.gzipSync(b, { level: 9 })"
      : "zlib.brotliCompressSync(b)";
  const script =
    `const zlib=require("node:zlib");const c=[];` +
    `process.stdin.on("data",d=>c.push(d));` +
    `process.stdin.on("end",()=>{` +
    `try{const b=Buffer.concat(c);` +
    `process.stdout.write(${compress}.toString("base64"));}` +
    `catch{process.exit(1)}});`;
  const res = spawnSync(process.execPath, ["-e", script], {
    input: buffer,
    maxBuffer: 64 * 1024 * 1024,
  });
  if (res.status !== 0 || !res.stdout || res.stdout.length === 0) return 0;
  const out = Buffer.from(res.stdout.toString("utf8"), "base64");
  return out.length > 0 ? out.length : 0;
}

function measure(buffer, algorithm) {
  // 1) In-process — the fast path, used by default.
  try {
    const out =
      algorithm === "gzip"
        ? zlib.gzipSync(buffer, { level: 9 })
        : zlib.brotliCompressSync(buffer);
    if (out.length > 0) return out.length;
  } catch {
    // fall through to the child process
  }
  // 2) Child process — for engines where in-process zlib is broken.
  return compressInChild(buffer, algorithm);
}

function sizes(buffer) {
  return {
    raw: buffer.length,
    gzip: measure(buffer, "gzip"),
    brotli: measure(buffer, "brotli"),
  };
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

// W3C Design Tokens (DTCG) export — dist/tokens.json mirrors the
// --bf-* tokens as light/dark/core groups for Figma/iOS/Android sync.
const dtcg = buildDTCG();
writeFileSync(join(DIST, "tokens.json"), JSON.stringify(dtcg, null, 2));

console.log("\nBuilt to dist/ — sizes.json + tokens.json written.");
