# ADR-0012: v5.0 typed `@property` decision — revisit of ADR-0005

**Status:** Accepted (2026-08-31)

## Context

Phase 4 (Generative theming 2.0) raised a decision point: introduce **typed
`@property` registrations** in a v5 layer so themes *interpolate* between states
(smooth color/scale transitions) instead of snapping. The v5 floor (Chrome 135 /
Firefox 151 / Safari 26.2) ships `@property`, so the capability is now
available where ADR-0005 (written pre-floor) assumed it wasn't. This ADR
revisits that assumption.

Generative theming (the 12-step OKLCH ramp in Phase 4) is built entirely on
relative-color syntax (`oklch(from var(--bf-primary) …)` and
`oklch(L var(--bf-seed-c) var(--bf-seed-h))`), which needs **no** `@property`
registration — plain custom properties carry the seed knobs.

## Decision

**Do NOT introduce typed `@property` in v5.0. ADR-0005 stands, reaffirmed.**

- The generative scale works without it (relative color only).
- Theme state changes already animate via `startViewTransition` crossfade
  (theme.js) — the framework's "degrade by omission" policy means a snapping
  fallback is correct on engines without view transitions. Smooth *color*
  interpolation is a nice-to-have, not a v5 requirement.
- `@property` adds real risk for little v5 gain: a single invalid registration
  aborts the whole registered block in some engines; typed custom properties
  must round-trip through Lightning CSS minification and `@layer` ordering
  (registrations are not yet guaranteed to survive the build untouched); and a
  typed token layer would split "plain" vs "registered" tokens, complicating
  the token contract that consumers override by hand.
- The token layer stays framework-agnostic: every value remains a plain
  `--bf-*` custom property a user can override in one line.

## Consequences

- `src/tokens.css` carries no `@property` block in v5.0; ADR-0005's reasoning is
  updated from "engines don't ship it" to "floor ships it, but we still opt out
  for simplicity + build safety."
- Theme animation between states remains the `startViewTransition` crossfade
  (snap in color, crossfade in geometry/opacity) — documented in
  docs/javascript.md §12.
- **Revisit in 5.1** only if interpolation becomes a stated requirement (e.g. a
  "theme morphs smoothly" acceptance criterion); at that point a *scoped*
  `@property` layer for the color tokens is the候选 implementation, gated behind
  its own ADR.

## Rejected

- **Adopting typed `@property` for the color/scale tokens in v5.0:** capability
  is present in the floor, but the complexity (build round-trip, block-abort
  failure mode, split token model) outweighs the visual win, which is already
  covered by view-transition crossfades.
