# ADR-0005: No typed-property registrations

**Status:** Accepted (2026-08-22)

## Context

`src/tokens.css` carried ten `@property` blocks (one per core color
token), each registering `syntax: "<color>"; inherits: true` with an
`initial-value` that hand-copied the light half of the token's
`:root` declaration — about 50 lines, ~18% of the file. The header
sold them as progressive enhancement: registered variables "can
transition/animate and are validated."

The scan flagged the section as mechanical duplication with a silent
drift failure mode: change an accent in `:root`, forget the block's
`initial-value` mirror (then line 155). The ten blocks spanned 53 of
the file's 278 lines (~19%).

## Decision

Drop all ten registrations. Tokens ship as plain custom properties;
a source-parse test pins the decision so the block cannot quietly
grow back.

Evidence that nothing load-bearing was removed:

- **No internal consumer animates a custom property.** Every
  `transition:`/`animation:` in `src/` uses a `--fz-*` token only as a
  *duration*; zero rules transition or animate a `--fz-` variable
  itself.
- **Theme switching is snapshot-based.** The `startViewTransition`
  crossfade (`components/view-transition.css`) animates opacity of
  old/new snapshots — no token interpolation involved.
- **api.md already disclaimed them**: "presence or absence does not
  affect the API." Dropping is non-breaking by the framework's own
  contract.

## Consequences

- **Drift is impossible by construction** — there are no
  `initial-value` mirrors left to forget.
- **Consumers lose an undocumented capability**: transitioning a
  `--fz-*` variable directly now requires registering it yourself.
  `docs/theming.md` shows the one-liner; userland registration wins
  (last one applies), so this is an escape hatch, not a wall.
- **Validation story changes shape**: an invalid token override now
  behaves like any unregistered custom property (guaranteed-invalid →
  `var()` fallbacks) instead of silently falling back to a stale
  literal. Nothing documented depended on the old behavior.
- **JS readers see raw token streams** (found in verification, not in
  the scan): `getPropertyValue()` on a registered `<color>` returned a
  resolved `rgb()`; on a plain custom property it returns the literal
  `light-dark(...)` string. Code that reads tokens from JS must resolve
  them through a consumer property (computed style of an element using
  `var(--fz-x)`) — which is what the framework's own test helper
  `tokenColor()` always did. Three tests that had been pinning the
  registration-era serialization were rewritten to probe what tokens
  paint; their assertions are unchanged.

## Rejected

- **Keep + parity guard** (ADR-0001 pattern): kills drift but keeps
  fifty lines of duplication serving no internal purpose, plus guard
  maintenance for a feature nothing uses.
- **Build-time generation from the token table**: rejected for the
  same reasons as ADR-0001 rejected generating palette mirrors — it
  adds build machinery and indirection to preserve dead weight.
