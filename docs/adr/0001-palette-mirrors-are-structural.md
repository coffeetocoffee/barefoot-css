# ADR-0001: Contrast palette mirrors are structural, guarded — not generated

**Status:** Accepted (2026-08-22)

## Context

High-contrast values must apply on two triggers:

1. `[data-theme="contrast"]` — the user's explicit choice;
2. `@media (prefers-contrast: more)` — the OS setting, automatic.

Both blocks carry the identical 16-token set in `src/tokens.css`
(the canonical palette and its one mirror). CSS cannot express an OR
between a media query and an attribute selector, and custom properties
cannot be conditionally aliased, so one declaration site is not
expressible in plain CSS.

An architecture scan (2026-08-21) flagged this duplication and also
counted the `@media print` palette in `src/base.css` as a third copy.
Inspection corrected that: the print palette differs on purpose
(ink-first plain hex, three distinct values, `!important` to beat
themes) — it is not a mirror.

## Decision

Keep the mirror **hand-written**, exactly like the canonical block, and
enforce parity mechanically: a source-parse test in `tests/css.spec.js`
fails when the two blocks' token names or values diverge. It also pins
the *name set* of the print palette, so adding a semantic color forces
a conscious update everywhere.

Rejected alternative: generating the mirror at build time (`build.mjs`
emitting the media-query block from the canonical one). Rejected because
the machinery (codegen step in every dev loop, watch/regen wiring,
debugging generated output) outweighs sixteen saved lines in a framework
whose build philosophy is "LightningCSS bundles, nothing more." Future
architecture scans should not re-suggest generation.

## Consequences

- Adding a semantic color = edit canonical + mirror (the test walks you
  through it) + print palette when applicable. Silent drift impossible.
- `src/tokens.css` stays fully readable, hand-editable, and free of
  build markers.
- If a third trigger ever appears (e.g. forced-colors), revisit this ADR
  before adding another mirror — two guards scale worse than one
  generator past ~3 copies.
