/* Barefoot — dangling token references.

   A `var(--bf-typo)` with no fallback does not fail. It resolves to the
   guaranteed-invalid value, the whole declaration computes to `unset` at
   computed-value time, and the property inherits — silently. Nothing in
   the build looked for this: contrast.mjs checks token *pairs*, and
   token-docs.mjs / tokens-dtcg.mjs only ever read tokens.css for the
   export, so no gate ever crossed a use site against a definition.

   That is the "floating promises" hazard AGENTS.md records from
   form-adaptive.css, still unenforced. Worse, the visual gate cannot
   cover it: breaking --bf-primary-fg in buttons.css repaints 44K of
   31.3M pixels on the conformance demo — 0.14% against a 2% tolerance,
   14x under the gate. A total color failure passes. So this check is the
   only place this class of bug can die.

   The rule, deliberately narrower than "every --bf-* must exist":

     var(--bf-x, <fallback>)  always resolves, whatever x is.
     var(--bf-x)              resolves only if x is defined.

   So only the second form is a hazard, and the JS-set properties need
   no allowlist. Both in-tree cases already carry fallbacks —
   reveal.css uses var(--bf-reveal-index, 0) and popover.css uses
   var(--bf-toast-progress, 100%) — because degrade-by-omission means the
   no-JS render has to be correct on its own. An allowlist would have
   been a hand-kept list with nothing verifying it: the same shape that
   let form-adaptive.css ship in the first place. Dropping it also means
   a future JS-set property consumed WITHOUT a fallback gets caught,
   which is the case that actually breaks.

   Scope: definitions are collected across all of src/**, so this is not
   import-graph aware. A token defined only in a theme a component never
   imports would pass here. That is deliberate — full.css and the
   opt-in single-module path compose differently, and a graph-aware
   check false-positives on every legitimate combination.

   Exported pieces are pure so tests can pin the detector against
   synthetic CSS. A gate that has never failed is an assumption. */
import { readFileSync, readdirSync } from "node:fs";
import { join, dirname, relative } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

/* Match the custom-property namespaces the framework actually owns.
   Anchored to --bf- so an author's own --my-brand-color is never the
   build's business. */
const TOKEN = "--bf-[A-Za-z0-9_-]+";
const DEFINE = new RegExp(`(${TOKEN})\\s*:`, "g");
/* Group 2 is the separator: `,` means the var() carries a fallback and
   resolves unconditionally, so only a bare `)` is a hazard. Matching both
   forms here and filtering below keeps one regex honest about what it saw;
   a lookahead would match both and then quietly ignore the distinction. */
const USE = new RegExp(`var\\(\\s*(${TOKEN})\\s*([,)])`, "g");

/* Comments carry token names in prose ("set by js/reveal.js"), and a
   documented example would otherwise read as a use site. Blanking rather
   than deleting keeps every byte offset — and so every line number in
   the failure message — exactly where the author wrote it. */
function blankComments(css) {
  return css.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, " "));
}

function lineAt(css, index) {
  let line = 1;
  for (let i = 0; i < index; i++) {
    if (css.charCodeAt(i) === 10) line++;
  }
  return line;
}

/* Bounded Levenshtein. The failure mode being caught is a typo, so
   naming the token that was probably meant turns a confusing gate into
   a one-line fix. 147 tokens makes the quadratic pair scan free. */
function editDistance(a, b, max) {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const row = [i];
    let best = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      row[j] = Math.min(prev[j] + 1, row[j - 1] + 1, prev[j - 1] + cost);
      if (row[j] < best) best = row[j];
    }
    if (best > max) return max + 1;
    prev = row;
  }
  return prev[b.length];
}

function suggest(token, defined, max = 2) {
  let best = null;
  let bestDistance = max + 1;
  for (const candidate of defined) {
    const d = editDistance(token, candidate, max);
    if (d < bestDistance) {
      bestDistance = d;
      best = candidate;
    }
  }
  return best;
}

function collectDefined(sources) {
  const defined = new Set();
  for (const css of Object.values(sources)) {
    for (const m of blankComments(css).matchAll(DEFINE)) defined.add(m[1]);
  }
  return defined;
}

/* Pure. `sources` is a map of path -> CSS text; every path is treated as
   both a definition source and a use site, so callers can scope the
   check to a subtree without the gate needing to know about the fs. */
function findDanglingTokens(sources) {
  const defined = collectDefined(sources);

  const found = [];
  for (const [file, css] of Object.entries(sources)) {
    const text = blankComments(css);
    for (const m of text.matchAll(USE)) {
      if (m[2] === ",") continue; // has a fallback — always resolves
      const token = m[1];
      if (defined.has(token)) continue;
      found.push({
        file,
        line: lineAt(text, m.index),
        token,
        suggestion: suggest(token, defined),
      });
    }
  }

  return found.sort((a, b) =>
    a.file === b.file ? a.line - b.line : a.file < b.file ? -1 : 1
  );
}

function collectSources(dir, sources = {}) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) collectSources(full, sources);
    else if (entry.name.endsWith(".css")) {
      sources[relative(root, full).replace(/\\/g, "/")] = readFileSync(full, "utf8");
    }
  }
  return sources;
}

function checkTokens(sources) {
  const dangling = findDanglingTokens(sources);
  return {
    ok: dangling.length === 0,
    dangling,
    definedCount: collectDefined(sources).size,
  };
}

export { DEFINE, USE, blankComments, findDanglingTokens, checkTokens };

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}

function main() {
  const { ok, dangling, definedCount } = checkTokens(collectSources(join(root, "src")));

  if (!ok) {
    console.error(
      `\ntokens: ${dangling.length} dangling reference(s) — these resolve to unset and ` +
        `silently inherit:\n`
    );
    for (const d of dangling) {
      const hint = d.suggestion ? ` — did you mean ${d.suggestion}?` : "";
      console.error(`  ${d.file}:${d.line}  ${d.token}${hint}`);
    }
    console.error(
      `\nEither the token name is a typo, or it is declared where nothing can ` +
        `see it. If it is set at runtime by JS, give the var() a fallback ` +
        `instead — var(${dangling[0].token}, <default>) — so the no-JS ` +
        `render still holds.`
    );
    process.exit(1);
  }

  console.log(`tokens: ${definedCount} --bf-* defined, 0 dangling references → PASS`);
}