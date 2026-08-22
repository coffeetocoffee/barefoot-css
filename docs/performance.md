# Barefoot — Performance budget

Barefoot's size story is a contract, not a slogan: the core must stay
under **10KB gzipped**, and CI fails if it doesn't. This page documents
the targets, how they are measured, and how to stay under them — both
for the framework itself and for your app.

## The budgets

| Artifact | Budget | Enforced by |
|---|---|---|
| `dist/index.css` (core) | ≤ 10KB gzipped | `npm run build` / `npm run size` — exits non-zero on breach |
| Everything else | reported, not capped | `dist/sizes.json` + the README table |

The 10KB line is a **floor that behaves like a ceiling**: it can be
raised only deliberately, in a release that says so. Per-component
entry points mean consumers who import selectively never pay for the
components they skip, so the cap on `index.css` is what protects
everyone.

Current numbers live in two places (never memorize them):

- `npm run build` prints raw/gzip/brotli for every artifact.
- The [README size table](../README.md#size-measured-current-build) is
  regenerated from `dist/sizes.json` on every `npm run check`
  (`npm run docs:size`).

## How sizes are measured

`build/build.mjs` bundles each entry point with Lightning CSS
(`minify: true`, **no `targets`** — modern CSS is never transpiled
away), then measures each minified artifact three ways with Node zlib:

- **gzip level 9** — the contract. Most CDNs serve gzip.
- **brotli quality 11** — reported for hosts that serve it.
- **raw bytes** — for debugging.

Budget checks read `dist/sizes.json`, so `npm run size` re-enforces
the cap on every run without rebuilding.

## Staying under it (framework side)

- **Every visual is a token.** A new color/size hard-coded in a
  component is a style bug *and* a size bug — tokens dedupe.
- **One recipe per pattern.** Shared files (`menu-items.css`) and JS
  seams exist so a behavior ships once (ADR-0004, -0006, -0007).
- **No vendored reset.** Ours is ~0.4KB; a borrowed one is 10× that.
- **Comments don't ship.** Minification strips them; document freely
  in `src/`.
- If a change pushes `index.css` past the cap, either trim something
  or argue for a deliberate budget bump in the release notes.

## Staying under it (consumer side)

1. **Import the core, then components à la carte:**

   ```css
   @import "barefoot-css";                      /* layers+reset+tokens+base */
   @import "barefoot-css/components/dialog.css"; /* only what you use */
   ```

   `full.css` (~8KB gzipped) exists for convenience, not obligation.

2. **Skip utilities you don't use.** `utilities.css` is opt-in layout
   help; element-first styling needs none of it to look right.

3. **JS is opt-in and tiny.** Each module is a readable single file;
   import one behavior or the `barefoot.js` barrel. Nothing loads
   unless you ask.

4. **Themes are overrides, not forks.** A starter theme changes a
   handful of variables in a few hundred bytes; your own theme should
   too ([theming.md](theming.md)).

5. **Purge-friendly structure.** Element-first CSS can't be purged by
   class — the mitigation is per-component entry points. Importing six
   component files gives a bundler six small leaves instead of one
   blob to reason about.

6. **Measure like we do.** Any build can fail loudly on growth:

   ```js
   import { gzipSync } from "node:zlib";
   const kb = (b) => b.length / 1024;
   // fail if dist/index.css grows past 10KB gzipped:
   if (kb(gzipSync(css, { level: 9 })) > 10) process.exit(1);
   ```
