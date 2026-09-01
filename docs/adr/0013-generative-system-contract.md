# ADR-0013: v5.2 generative system contract — "The Design System That Writes Itself"

**Status:** Accepted (2026-08-31)

## Context

v5.2 promotes generative theming from a 12-step *ramp* (v5.0) to a *full, derived
design system*: one generative seed (`--bf-seed-h` / `--bf-seed-c`) becomes the
framework's master accent, and that accent propagates through the Chroma engine to
every brand-derived token (hover / subtle / border / focus, the alpha ramps, the
surface tints) — plus a dark panel can live inside a light page via
container-scoped theming. The framework generates a *system*, not utilities.

Two design questions drove this ADR:

1. **Should the seed drive `--bf-primary` by default (in `tokens.css`)?**
   No. The default framework identity is a neutral ink accent (`#1a1a1a` /
   `#ececec`); a coloured default would change every existing consumer's look.
   The seed→accent derivation ships as the opt-in `themes/seed-system.css`.
2. **Should the derived set include type/spacing/radius/motion "from the seed"?**
   No, honestly. Hue/chroma is a *colour* knob; deriving a type scale or
   spacing rhythm from it would be fabrication. What the seed genuinely derives
   is the *colour system* — and because the Chroma engine already keys every
   brand token off `--bf-primary`, seeding the accent seeds the whole colour
   system in one move. Type/spacing/radius stay independent tokens (re-mappable
   with the existing density axis), not seed-derived.

## Decision

- **The seed is the master accent, opt-in.** `src/themes/seed-system.css` sets
  `--bf-primary: oklch(0.55 var(--bf-seed-c) var(--bf-seed-h))` inside
  `@supports (color: oklch(from red l c h))`. From there, the existing Chroma
  engine (relative-color derivations in `tokens.css`) computes
  `--bf-primary-hover/subtle/contrast/border/muted/strong`, the alpha ramps
  (`surface-2/3`, `*-muted`, `*-subtle`, `*-darken`), and the 12-step
  `--bf-tone-*` ramp (also seed-driven) — all without `@property` registration.
- **No `@property` in the default path.** ADR-0005 / 0012 stand: plain custom
  properties carry the seed; the morph stays the `theming-anim.css` opt-in.
- **`full.css` stays frozen (ADR-0008).** Both new files are opt-in by import;
  neither enters the barrel. `npm run size` must not move.
- **Container-scoped theming is opt-in (`themes/theming-scope.css`).** A
  `[data-bf-scope]` element becomes a container; it and its descendants resolve
  a local token layer (light / dark / contrast / auto) via `@container
  style()`. The scope follows the container, not the root or viewport.
- **Contrast is the contract.** The seed-driven accent and the derived ramp are
  asserted to clear WCAG floors by the `css.spec.js` "generative theming" gate
  (extended in v5.2); claims are never asserted.

## Consequences

- Consumers get "one colour in, a whole system out": import `seed-system.css`,
  turn `--bf-seed-h` / `--bf-seed-c`, and the entire colour system follows with
  AA contrast intact.
- The default `tokens.css` and the neutral default accent are unchanged; the
  opt-in is additive and zero-risk to existing users.
- `theming-scope.css` gives designers a dark card in a light page (or any scoped
  palette) with zero JS — the [data-bf-theme] subtree behaviour, made explicit
  and container-native.
- Build/size budgets are unaffected; the new files are not in `full.css`.

## Rejected

- **Seeding `--bf-primary` in `tokens.css` by default:** changes the framework's
  identity and every consumer's look; violates the no-surprise default contract.
- **Deriving non-colour tokens (type/spacing/radius/motion) from the seed:**
  fabrication — a hue does not determine a type scale; rejected as dishonest
  scoping (per AGENTS.md "honest scoping").
- **Container-scoped theming via class soup:** `@container style()` keeps it
  attribute-driven and degrade-by-omission, consistent with the rest of the
  framework.
