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
import crypto from "node:crypto";
import { checkContrast } from "./contrast.mjs";
import { buildDTCG } from "./tokens-dtcg.mjs";
import { VERIFY_RULES } from "../src/js/verify-contracts.js";
import { withProse } from "../verify/prose.mjs";

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

function buildVerifyManifest() {
  /* withProse joins each runtime rule to its docs/quote entry in
     verify/prose.mjs. The registry carries no prose at runtime, so there
     is nothing to strip out of the shipped copy — the slices simply never
     import the prose module (v8.7.8). */
  const rules = withProse(VERIFY_RULES).map(({ id, domain, docs, quote, fix }) => ({
    id, domain, docs, hint: fix,
    proseHash: crypto.createHash("sha256").update(quote.join("\\n")).digest("hex"),
  }));
  return { version: 1, domains: ["core", "forms", "tables"], rules };
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
  //
  // The registry slices ship byte-for-byte. Their docs/quote prose lives
  // in verify/prose.mjs, which nothing under src/js/ imports, so it is
  // never copied here — a file boundary does what a text transform used
  // to (v8.7.8). See buildVerifyManifest above.
  const jsDir = join(SRC, "js");
  mkdirSync(join(DIST, "js"), { recursive: true });
  for (const file of readdirSync(jsDir).filter((f) => f.endsWith(".js"))) {
    const code = readFileSync(join(jsDir, file));
    writeFileSync(join(DIST, "js", file), code);
    report[`js/${file}`] = sizes(code);
  }

  assertRegistrySplit();

  return report;
}

/* The registry's prose must never reach dist/ (v8.7.8). Before the split
   this held because a text transform cut `quote:`/`docs:` out of the
   shipped copy; that transform had no notion of JS syntax, and a rule
   whose fix string quoted the registry's own format silently deleted 13KB
   of real rule code — while the size gate, which only knows bytes,
   reported the corruption as an improvement.

   Now the guarantee is a file boundary: nothing under src/js/ may import
   verify/prose.mjs, and the shipped slices must carry no prose. Both are
   asserted here, at build time, so a reintroduced import fails the build
   instead of quietly shipping (and growing) the registry. The
   complementary half — every rule HAS prose — is enforced by withProse()
   and pinned by tests/verify.spec.js. */
function assertRegistrySplit() {
  const offenders = [];
  for (const file of readdirSync(join(SRC, "js")).filter((f) => f.endsWith(".js"))) {
    const source = readFileSync(join(SRC, "js", file), "utf8");
    if (/from\s+["'][^"']*prose\.mjs["']/.test(source)) offenders.push(`src/js/${file}`);
  }
  if (offenders.length > 0) {
    throw new Error(
      `The registry prose module is imported by ${offenders.join(", ")} — ` +
        `it would ship in dist/js and defeat the split (ADR-0015). ` +
        `Import verify/prose.mjs from build/, verify/pack.mjs, or tests/ instead.`
    );
  }

  for (const file of readdirSync(join(DIST, "js"))) {
    if (!file.startsWith("verify-contracts")) continue;
    const shipped = readFileSync(join(DIST, "js", file), "utf8");
    // Match the property, not the word: rule `fix`/`check` strings may
    // legitimately mention the field by name (that is exactly the text
    // the old scanner tripped over).
    if (/(^|[\s{,])(docs|quote):\s/.test(shipped)) {
      throw new Error(
        `dist/js/${file} carries docs/quote prose — the shipped registry ` +
          `must hold runtime fields only (ADR-0015, v8.7.8).`
      );
    }
  }
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
writeFileSync(join(DIST, "verify-manifest.json"), JSON.stringify(buildVerifyManifest(), null, 2));

console.log("\nBuilt to dist/ — sizes.json + tokens.json written.");
