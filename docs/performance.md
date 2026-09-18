# Barefoot — Performance budget

Barefoot's size story is a contract, not a slogan: the core must stay
under **10KB gzipped**, and CI fails if it doesn't. This page documents
the targets, how they are measured, and how to stay under them — both
for the framework itself and for your app.

## The budgets

| Artifact | Budget | Enforced by |
|---|---|---|
| `dist/index.css` (core) | ≤ 10KB gzipped | `npm run build` / `npm run size` — exits non-zero on breach |
| Selector behavior | recalc/composite costs | `npm run perf` — exits non-zero on breach (v8.5) |
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

   `full.css` is a convenience, not obligation — and frozen since 4.6
   (ADR-0008): it stops gaining imports, so the à-la-carte path above is
   also the *only* path for anything new.

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

## Platform primitives are @supports-gated (3.1)

The scroll-driven primitives (carousel progress bar, `[data-reveal]`)
and the anchor-positioned popovers ship as bytes in every bundle that
imports their component file — but their **runtime cost is zero where
the platform lacks the feature**:

- The whole rule set lives inside `@supports (animation-timeline:
  …)` / `@supports (anchor-name: …)`. Engines without the feature skip
  parsing to the end of the block: no style recalc, no animation
  objects, no fallback rendering. Nothing renders that isn't real.
- No JS was added for any of them. `carousel.js` is byte-identical to
  3.0; the progress bar is the scroller's own timeline read by a
  pseudo-element.
- Gating is also how motion safety works here: base.css's kill-switch
  clamps *durations*, which a scroll-driven timeline ignores — so
  `[data-reveal]` is wrapped in `@media (prefers-reduced-motion:
  no-preference)` instead. The gate *is* the guard.

Cost model for reviewers: an `@supports`-gated primitive costs its
compressed bytes once and nothing per element; an ungated equivalent
(or a JS polyfill) costs layout work on every engine whether or not it
can honor it. Bytes are the budget; this section is why runtime never
becomes one.

## Selector budgets — `npm run perf` (v8.5)

Compressed selectors cost nothing to ship and anything to match. The
performance budget parses the shipped CSS and enforces the behaviors
that scale with the DOM rather than the file size:

| Metric | What it costs | Budget |
|---|---|---|
| `:has()` occurrences | a DOM mutation recalculates the relative subtree | 80 |
| `:has()` chains (2+ in one selector) | the recalc multiplies per `:has()` | 16 |
| `:has()` **deep** (nested) | superlinear recalc — the one shape to avoid | **0** |
| `@container` blocks | a containment context layout must maintain | 40 |
| `container-type` / `container-name` | each establishes a context | 40 |
| `view()` / `scroll()` timelines | a scroll-driven animation stays alive | 16 |
| `mask` / `mask-image` | a composited layer; on a sticky element it repaints per scroll frame | 16 |
| longest compound chain | match cost — more combinators, more backtracking | 8 |

Every metric is measured from `src/**` and printed with its budget;
`npm run check` runs the gate so a breach is a red build, not a
regression note. The deep-`:has()` budget is **zero on purpose**: a
nested `:has()` is the one selector shape whose recalc cost is
superlinear, so the budget makes adding one a deliberate, reviewed
event. (The shipped CSS has none. The suite proves the detector works by
feeding it synthetic CSS — a gate that has never seen a violation is an
assumption.)

This is a static gate, and says so: runtime profiling — the actual
milliseconds of a recalc on your DOM — stays bring-your-own. Measuring
timing on a CI machine would be the shallow middle the rest of the
framework avoids. The budgets bound the shapes that cost, your profiler
tells you whether they matter at your scale.
