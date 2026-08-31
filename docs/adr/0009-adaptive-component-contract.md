# ADR-0009: adaptive component contract

**Status:** Accepted (2026-08-31)

## Context

v5.0's thesis is "the component is the breakpoint": components sense their
**container**, not the viewport, and render several ways depending on where
they are dropped. The groundwork is already live — `bf-container`/`bf-stack`/
`[data-grid]` are container-driven, and the header nav collapses at its own
width. v5 generalizes this from a few hand-rolled cases into a contract every
adaptive component follows, so the mechanism is predictable for authors and
for the test suite (which must resize *containers*, not the viewport).

The engine matrix was verified on 2026-08-31 (ADR-0010): container **style
queries** shipped in Firefox 151 (Apr 2026), so the density-by-style-query
story is viable across all engines — the old "FF is the big unknown" risk is
closed. Interest invokers remain Chromium-only, so tooltip-style adaptation
stays a polyfill (ADR-0010 / Phase 3).

## Decision

1. **Adaptive behavior ships in a sibling file, opt-in by import.** A
   component's core file (`components/<name>.css`) keeps its static,
   viewport-independent styles. The container-driven variants live in
   `components/<name>-adaptive.css`, imported only where the consumer opts
   in. `full.css` stays frozen (ADR-0008) — adaptive files are per-component
   à-la-carte, never added to the bundle. This mirrors the existing
   per-component headline path and keeps the size budget structural.

2. **The component root establishes the query container.** The adaptive
   file sets `container-type: inline-size` (and `container-type: normal` is
   never used where queries are needed) on the component root so the
   component adapts wherever it is dropped — no mandatory `.bf-contain`
   wrapper. For elements where self-containerization is unsafe (the
   `<table>` box model), the file sets `container-type` on a wrapping
   selector the author already owns (e.g. `:where(table):not([data-static])
   > ...` is avoided in favor of documenting a required `.bf-contain` or a
   `display: block` shim) — the table showpiece (Phase 2) settles the exact
   shape and the decision is recorded here by reference to that PR.

3. **Containers are named and namespaced.** Every adaptive component uses a
   `container-name` of the form `bf-<component>` (e.g. `bf-table`,
   `bf-segmented`, `bf-card`), so a nested component can target its own
   container with `@container bf-table (...)` and never accidentally inherit
   an ancestor's query. Unnamed containers remain available for the simple
   "fill my parent" cases already in `grid.css`/`nav.css`.

4. **Breakpoints are tokens, not literals.** Adaptive queries reference
   `--bf-adaptive-*` tokens defined in `tokens.css`, not inline `rem`
   values:
   - `--bf-adaptive-1: 24rem;`  (single-column / stacked floor)
   - `--bf-adaptive-2: 40rem;`  (two-up / compressed density)
   - `--bf-adaptive-3: 56rem;`  (full desktop density)
   These are the three "where it is dropped" thresholds every adaptive
   component shares, so a theme can retune the whole adaptive grid from
   three variables. Numeric suffixes keep the scale open-ended
   (`--bf-adaptive-4` if a component needs it).

5. **Density is a style query, with a size-query floor.** When a component
   supports compression (`segmented`, `table`, `card`, `form`), it sets a
   `--bf-density` custom property on its root and responds via
   `@container bf-<component> style(--bf-density: compact)`. Because style
   queries are now green in all engines (FF 151+), the density story is
   first-class, not a fallback. The size-query thresholds (rule 4) remain
   the floor for layout morphs (card-stack, single-column reflow) so the
   component still rearranges on engines that somehow lack style queries —
   degrade by omission, never by broken layout.

6. **Fluid type uses `cqi`.** Adaptive components express their type scale
   against the container with `cqi` units (e.g. `--bf-type-sm:
   clamp(0.8rem, 0.5rem + 1cqi, 0.9rem)`), so headings and labels scale
   with the component's box, not the screen. The `cqi` tokens are added in
   `tokens.css` during Phase 1 and consumed by the Phase 2 components.

7. **Variants stay `data-*` and low-specificity.** All adaptive selectors
   are `:where()`-wrapped base selectors with bare state/container rules,
   exactly like the existing component files. No utility classes for
   adaptive states (per AGENTS.md anti-patterns).

8. **Tests resize containers.** `tests/css.spec.js` gains helpers that set a
   container's width (not the viewport) and assert the resulting computed
   style — the mechanism the Phase 2 component PRs must use, so the suite
   verifies "dropped in a narrow slot" rather than "narrow window."

## Consequences

- Authors get one predictable model: wrap nothing, import `<name>-adaptive`,
  and the component reflows by where it lands. The `container-name` rule
  stops accidental cross-component query leaks.
- The `--bf-adaptive-*` / `--bf-density` / `cqi` tokens become first-class
  token categories (carried into Phase 4 generative theming).
- `full.css` grows by zero bytes of adaptive surface — ADR-0008 holds.
- The only open shape question is the `<table>` container root (rule 2);
  the table showpiece PR resolves it and back-references this ADR.
- Risk retired: Firefox style-query support was the plan's headline risk;
  it shipped (FF 151), so the density story needs no degradation gymnastics.
- **Tooling constraint (discovered in Phase 2):** the build bundler
  (Lightning CSS 1.33, no `targets`) cannot parse `var()` inside a
  `@container` *condition* — `@container bf-x (max-width: var(--bf-adaptive-2))`
  fails to build. Named container queries and `@container style()` are fine;
  only `var()` in the size-query condition is rejected. So the
  `--bf-adaptive-*` tokens stay the *documented* breakpoints, but the literal
  `rem` values are what the `@container` rules actually use — exactly the
  convention `grid.css` already follows with its `30rem`/`48rem` literals.
  Components still query the same thresholds; the token remains the single
  source of truth for authors retuning the scale, and could replace the
  literals the day the bundler supports query-time `var()`.

## Rejected

- **One mega `adaptive.css` for all components:** breaks the per-component
  import path and the `full.css` freeze; authors would pay for every
  component's adaptation at once.
- **Viewport media queries for adaptation:** defeats the thesis and breaks
  inside sidebars/grid cells — the exact bug the header-nav container query
  already fixed.
- **Unnamed containers for adaptive components:** a nested `table` inside a
  `card` would inherit the card's query; namespacing is the cheap guard.
- **Density on size queries only (the old hedge):** now that FF supports
  style queries, confining density to size queries needlessly weakens the
  headline feature; style-query density is the default with size-query
  layout morphs as the floor.
