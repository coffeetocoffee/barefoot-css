# ADR-0014: v5.3 generative morphology — "the seed is the designer"

**Status:** Accepted (2026-09-01)

## Context

v5.2 ("The Design System That Writes Itself") derived the *colour* system
from one seed (`--bf-seed-h` / `--bf-seed-c`): the accent, the Chroma-engine
derivations, and the 12-step ramp. ADR-0013 explicitly rejected deriving
*non-colour* tokens (type/spacing/radius/motion) from the seed as
"fabrication — a hue does not determine a type scale."

v5.3 revisits that rejection. The honest, defensible reading is narrower than
ADR-0013 assumed: the hue does not set a type scale, but the *chroma* (the
seed's saturation) is a legitimate **mood** lever. A saturated seed reads as
expressive; a near-grey seed reads as minimal. Deriving the visual *temperament*
— radius, spacing rhythm, a nudge on the container type scale, and motion
intensity — from chroma is not fabricated; it is a coherent design stance, and
it is the natural next step that turns Barefoot's moat (generative, not
compositional) from a colour trick into a category.

## Decision

- **The seed's chroma drives the visual temperament, opt-in.** `src/themes/
  seed-system.css` adds a generative-morphology block inside the existing
  `@supports (color: oklch(from red l c h))` `:root` rule. Every term is a
  `calc()` over `--bf-seed-c`:
  - `--bf-radius` / `--bf-radius-sm` / `--bf-radius-lg`
  - `--bf-space-1 … --bf-space-8` (spacing rhythm)
  - `--bf-type-cqi-*` (container-relative type, nudged by chroma inside the
    existing clamp bounds)
  - `--bf-transition` / `--bf-transition-slow` / `--bf-vt-duration` /
    `--bf-reveal-duration` (motion)
- **Honest scoping is preserved.** The derivation is keyed on *chroma*, not
  hue — we never assert "this hue means trustworthy." We assert relationships
  (chroma ↑ → radius/spacing/motion ↑) plus the existing 1.4.11 / AA contrast
  floors. ADR-0013's *spirit* holds; only its "no non-colour derivation" clause
  is overturned, and only for a chroma-driven mood axis.
- **No `@property`, no JS.** ADR-0005 / 0012 stand: plain custom properties
  carry the seed; interpolation stays the `theming-anim.css` opt-in. The
  morphology is pure CSS.
- **Density still wins.** `[data-density="compact"]` is a higher-specificity
  attribute rule, so it overrides the seed-derived radius/spacing — the two
  axes compose, they do not fight.
- **`full.css` stays frozen (ADR-0008).** The morphology ships only inside
  `seed-system.css`, which is opt-in by import and never enters the barrel.
- **Contrast remains the contract.** The v5.0/v5.2 `css.spec.js` gate is
  extended in v5.3 to assert chroma moves radius/spacing/motion monotonically
  (and the derived tones still clear WCAG floors). Claims are never asserted.

## Consequences

- A single seed now expresses an entire *visual language*, not just a palette —
  "one colour in, a whole system out" becomes literal for the whole look.
- The default framework identity (neutral ink accent, fixed radius/spacing) is
  unchanged: the morphology only appears when a consumer opts into
  `seed-system.css`.
- Tailwind (compositional utilities) has no equivalent primitive; this is a
  defensible, on-brand moat.

## Rejected

- **Deriving a type scale from hue:** fabrication (original ADR-0013 concern) —
  still rejected. Morphology uses chroma (mood), not hue (identity).
- **Registering the temperament tokens with `@property`:** violates ADR-0005 /
  0012; interpolation stays opt-in in `theming-anim.css`.
- **Putting morphology in `tokens.css` by default:** would change the default
  look of every consumer; kept opt-in in `seed-system.css` (ADR-0008 / 0013).
