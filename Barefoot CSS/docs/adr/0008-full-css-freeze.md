# ADR-0008: full.css freezes; per-component is the headline

**Status:** Accepted (2026-08-25)

## Context

The 10KB gzip budget is enforced on `dist/index.css`, but the advertised
convenience bundle `full.css` has been eating the headroom: it shipped
4.5 at 9.55KB gzip, ~0.45KB under its own informal ceiling. Every
release note celebrated a "budget PASS" while the margin shrank — one
more component arc would breach it. Meanwhile the framework's actual
value proposition ("pay for what you import") has always pointed at the
per-component path that `full.css` undermines as the headline number.

## Decision

Starting with 4.6:

1. **`full.css` stops gaining imports.** Its `@import` list is pinned
   verbatim by a source-parse test (`tests/css.spec.js`, "full.css
   stays frozen at its 4.5 import set"). New components land as opt-in
   files only and never join the bundle.
2. **Existing files keep evolving.** The freeze is on the *import set*,
   not the bytes: bug fixes and token-driven improvements to already-
   imported components still flow into `full.css`, guarded by the same
   `npm run size` check. The bundle stays correct; it just stops
   growing new surface.
3. **The headline numbers pivot** to `index.css` (2.31KB gzip) plus
   per-component imports — in README copy, docs/performance.md, and the
   api.md export table, which now marks `full.css` as frozen.
4. **Growth becomes structurally uncapped.** Future features are opt-in
   by construction; the core budget stays sacred without ever needing
   another "deliberate bump" argument for convenience-bundle growth.

## Rejected

- **Raising the budget to ~12KB:** spends the framework's only real
  number to postpone an architectural decision. The next arc would hit
  the wall again.
- **Byte-freezing `full.css`:** turns routine maintenance (token
  retargeting, minifier-safe rule reshapes) into bundle-breaking
  churn for zero consumer benefit.
- **Deleting `full.css` at 5.0:** it still serves quick demos and
  no-build `<link>` consumers; freezing keeps them working while the
  docs stop steering anyone there.
- **A build-time tree-shaker instead:** Lightning CSS does not
  tree-shake CSS meaningfully (the plan scoped this honestly in v1);
  per-component entry points remain the only real mechanism.
