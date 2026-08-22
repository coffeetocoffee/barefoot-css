/* Barefoot — v2.x → v3.0 codemod. Renames the `fz` namespace to `bf`
   in consumer files: tokens (`--fz-*` → `--bf-*`), the theme
   attribute (`data-theme` → `data-bf-theme`), utility/component
   classes (`.fz-*` → `.bf-*`), and the tabs module's internal marker
   (`data-fz-tabs-js` → `data-bf-tabs-js`). The full mapping lives in
   docs/migration-3.md.

   Walks every path you pass (directories are recursed; node_modules,
   dist, .git, and dot-directories are skipped) and applies exactly
   four ordered rules — nothing else is touched.

   Usage:
     npm run migrate:v3 -- src app          dry run: prints per-file
                                            change counts, writes nothing
     npm run migrate:v3 -- --write src app  applies the renames */
import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join, extname } from "node:path";

const RULES = [
  [/data-fz-tabs-js/g, "data-bf-tabs-js", "data-fz-tabs-js → data-bf-tabs-js"],
  [/--fz-/g, "--bf-", "--fz- → --bf-"],
  [/data-theme/g, "data-bf-theme", "data-theme → data-bf-theme"],
  [/\bfz-/g, "bf-", ".fz-*/fz- → bf-*"],
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
    "usage: npm run migrate:v3 -- [--write] <file or directory...>\n" +
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
const totals = RULES.map(() => 0);

for (const file of files) {
  const before = readFileSync(file, "utf8");
  let after = before;
  const counts = RULES.map(([re]) => (after.match(re) ?? []).length);
  if (counts.every((n) => n === 0)) continue;
  RULES.forEach(([re, to], i) => {
    after = after.replace(re, to);
    totals[i] += counts[i];
  });
  touched++;
  const detail = RULES.map(([, , label], i) =>
    counts[i] ? `${label} ×${counts[i]}` : null,
  )
    .filter(Boolean)
    .join(", ");
  console.log(`${write ? "updated" : "would update"} ${file}\n    ${detail}`);
  if (write) writeFileSync(file, after);
}

console.log(
  `\n${touched} of ${files.length} file(s) ${write ? "updated" : "need changes"}` +
    (write ? "." : " (dry run — re-run with --write to apply).")
);
if (!write && touched > 0) process.exitCode = 1;
