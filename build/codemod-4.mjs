/* Barefoot — v3.x → v4.0 migration codemod. The 3.2 deprecation wave
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

   Walks every path you pass (directories are recursed; node_modules,
   dist, .git, and dot-directories are skipped).

   --write mode:
     - Removes import lines for deprecated JS modules (details-close,
       details-tabindex, popover-anchor).
     - Flags <details data-menu> and details[data-menu] for manual
       migration (HTML/CSS rewrites need human judgment).

   Usage:
     npm run migrate:v4 -- src app          dry run: prints per-file
                                            change counts, writes nothing
     npm run migrate:v4 -- --write src app  removes deprecated imports,
                                            flags HTML/CSS for review
     exit code 0 = clean, 1 = findings (CI-friendly) */
import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join, extname } from "node:path";

/* Detection rules. Each entry:
     [regex, label, replacement, guidance]
   replacement = ""  → remove the line (--write mode)
   replacement = null → flag only (manual migration needed)
   guidance = human-readable text for flag-only hits */
const RULES = [
  [
    /["'][^"']*\/(js\/)?details-close(\.js)?["']/,
    "js/details-close.js import",
    "",
    "removed — popover menus close natively",
  ],
  [
    /["'][^"']*\/(js\/)?details-tabindex(\.js)?["']/,
    "js/details-tabindex.js import",
    "",
    "removed — WebKit tab-order fixed in Safari 17.4+",
  ],
  [
    /["'][^"']*\/(js\/)?popover-anchor(\.js)?["']/,
    "js/popover-anchor.js import",
    "",
    "removed — position-visibility: anchors-visible is Baseline 2026",
  ],
  [
    /<details\b[^>]*\bdata-menu\b/i,
    "<details data-menu>",
    null,
    "Popover-API menu: <button popovertarget=…> + <div popover data-kind=\"menu\">",
  ],
  [
    /\bdetails\[data-menu\b/,
    "details[data-menu] selector",
    null,
    'Popover-API menu selectors: [popover][data-kind="menu"]',
  ],
];

const TEXT_EXTS = new Set([
  ".css", ".html", ".htm", ".js", ".mjs", ".cjs", ".jsx",
  ".ts", ".tsx", ".md", ".json", ".vue", ".svelte", ".astro",
]);
const SKIP_DIRS = new Set(["node_modules", "dist", ".git"]);

const args = process.argv.slice(2);
const write = args.includes("--write");
const targets = args.filter((a) => a !== "--write");
if (targets.length === 0) {
  console.error(
    "usage: npm run migrate:v4 -- [--write] <file or directory...>\n" +
      "       (dry run by default — add --write to apply)"
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
for (const target of targets) {
  try {
    files.push(...collect(target, []));
  } catch {
    console.error(`skipped (not found): ${target}`);
  }
}

let touched = 0;
let flagged = 0;
const totals = RULES.map(() => 0);

for (const file of files) {
  const before = readFileSync(file, "utf8");
  const lines = before.split("\n");
  const hits = [];

  lines.forEach((text, idx) => {
    RULES.forEach(([re], i) => {
      if (re.test(text)) hits.push({ line: idx + 1, rule: i });
    });
  });

  if (hits.length === 0) continue;

  const removable = hits.filter((h) => RULES[h.rule][2] !== null);
  const flagOnly = hits.filter((h) => RULES[h.rule][2] === null);

  if (removable.length > 0) {
    touched++;
    const filtered = lines.filter((text) => {
      for (const [re, , replacement] of RULES) {
        if (replacement === "" && re.test(text)) return false;
      }
      return true;
    });
    const after = filtered.join("\n");
    if (write) writeFileSync(file, after);
  }

  if (flagOnly.length > 0) flagged++;

  const detail = RULES.map(([, label, replacement, guidance], i) => {
    const count = hits.filter((h) => h.rule === i).length;
    if (count === 0) return null;
    if (replacement === "") return `${label} ×${count} (removed)`;
    return `${label} ×${count} — ${guidance}`;
  })
    .filter(Boolean)
    .join("; ");
  console.log(
    `${write && removable.length > 0 ? "updated" : "found"} ${file}\n    ${detail}`
  );
  for (const h of hits) {
    totals[h.rule]++;
  }
}

console.log(
  `\n${touched + flagged} of ${files.length} file(s) affected.` +
    (touched > 0
      ? `\n${touched} file(s) had imports removed` +
        (write ? "." : " (dry run — re-run with --write to apply).")
      : "") +
    (flagged > 0
      ? `\n${flagged} file(s) have <details data-menu> or details[data-menu]` +
        " selectors — migrate manually (see docs/migration-4.md)."
      : "") +
    (touched + flagged === 0 ? " All clear." : "")
);
if (!write && (touched + flagged) > 0) process.exitCode = 1;
