/* Barefoot — v3.x → v4.0 migration detector. The 3.2 deprecation wave
   announced three surfaces (docs/api.md → Deprecations):

     1. <details data-menu> dropdowns        → Popover-API menus
        (<button popovertarget> + <div popover data-kind="menu">,
        keyboard support via js/popover-menu.js). Removed in 4.0
        together with js/details-close.js.
     2. js/details-tabindex.js               → drop the import once your
        browser baseline includes WebKit's native tab order for open
        panels. Baseline-gated removal.
     3. js/popover-anchor.js                 → drop the import once
        engines implement position-visibility: anchors-visible.
        Baseline-gated removal.

   DETECTION PASS ONLY. It finds and reports usages; it writes nothing.
   --write lands with docs/migration-4.md at 3.5, once the exact v3→v4
   rewrites are rehearsed on a branch.

   Walks every path you pass (directories are recursed; node_modules,
   dist, .git, and dot-directories are skipped) and applies exactly
   four detection rules — nothing else is reported.

   Usage:
     npm run migrate:v4 -- src app   report deprecated-surface usage
     exit code 0 = clean, 1 = findings (CI-friendly) */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, extname } from "node:path";

const RULES = [
  [
    /<details\b[^>]*\bdata-menu\b/i,
    "<details data-menu>",
    "Popover-API menu: <button popovertarget=…> + <div popover data-kind=\"menu\"> (+ js/popover-menu.js)",
  ],
  [
    /\bdetails\[data-menu\b/,
    "details[data-menu] selector",
    'Popover-API menu selectors: [popover][data-kind="menu"]',
  ],
  [
    /["'][^"']*\/(js\/)?details-close(\.js)?["']/,
    "js/details-close.js import",
    "removed with details menus in 4.0 — popover menus close natively",
  ],
  [
    /["'][^"']*\/(js\/)?(details-tabindex|popover-anchor)(\.js)?["']/,
    "engine-gap shim import",
    "baseline-gated removal candidate — see api.md Deprecations",
  ],
];

const TEXT_EXTS = new Set([
  ".css", ".html", ".htm", ".js", ".mjs", ".cjs", ".jsx",
  ".ts", ".tsx", ".md", ".json", ".vue", ".svelte", ".astro",
]);
const SKIP_DIRS = new Set(["node_modules", "dist", ".git"]);

const args = process.argv.slice(2);
if (args.includes("--write")) {
  console.error(
    "codemod-4 is detection-only for now: --write lands with\n" +
      "docs/migration-4.md at v3.5. Nothing was changed."
  );
  process.exit(1);
}

function collect(path, out) {
  const stat = statSync(path);
  if (stat.isDirectory()) {
    for (const entry of readdirSync(path)) {
      if (SKIP_DIRS.has(entry) || entry.startsWith(".")) continue;
      out.push(...collect(join(path, entry), []));
    }
    return out;
  }
  if (TEXT_EXTS.has(extname(path).toLowerCase())) out.push(path);
  return out;
}

let files = [];
for (const target of args) {
  try {
    files.push(...collect(target, []));
  } catch {
    console.error(`skipped (not found): ${target}`);
  }
}

let flagged = 0;
const totals = RULES.map(() => 0);

for (const file of files) {
  const lines = readFileSync(file, "utf8").split("\n");
  const hits = [];

  lines.forEach((text, idx) => {
    RULES.forEach(([re, label], i) => {
      if (re.test(text)) hits.push({ line: idx + 1, rule: i, label });
    });
  });

  if (hits.length === 0) continue;
  flagged++;
  console.log(`\n${file}`);
  for (const h of hits) {
    totals[h.rule]++;
    console.log(
      `    L${h.line}  ${h.label}\n` +
        `      → ${RULES[h.rule][2]}`
    );
  }
}

console.log(
  `\n${flagged} of ${files.length} file(s) use a surface announced in 3.2.` +
    (flagged > 0
      ? "\nEverything keeps working through 3.x; migrate before 4.0." +
        "\nReplacement guidance: docs/api.md → Deprecations."
      : " All clear.")
);
if (flagged > 0) process.exitCode = 1;
