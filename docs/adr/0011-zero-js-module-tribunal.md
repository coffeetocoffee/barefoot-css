# ADR-0011: v5.0 Zero-JS module tribunal — verdicts

**Status:** Accepted (2026-08-31)

## Context

Phase 3 is the "breaking change" of v5.0: every opt-in JS module faces a
tribunal against the new floor (Chrome 135 / Firefox 151 / Safari 26.2, set
by ADR-0010). A module is deleted **only when its entire contract is
subsumed by a native primitive** — partial coverage is not enough (the
decision log has always held this line). The plan named `tooltip.js` as the
"clearest deletion candidate" and listed `popover-menu.js`, `theme.js`, and
`command`/`commandfor` wiring for review.

The Phase 0 engine matrix (verified 2026-08-31) changed one verdict: **interest
invokers are Chromium-only** (Firefox and Safari have no support as of Aug
2026). That alone keeps `tooltip.js` alive — the plan's assumption that
interest invokers would subsume it did not hold across the floor.

## Decision

**Zero modules are deleted in v5.0.** The headline "breaking change" of v5 is
the floor raise (ADR-0010) and the adaptive CSS (Phase 1–2), not JS removal.
Per-module verdicts:

- **`tooltip.js` — SURVIVES.** Interest invokers (`interestfor`/`interesttarget`)
  ship only in Chromium (142+). On Firefox and Safari the `popover="hint"`
  tooltip still needs the hover/focus fallback this module provides, so ~2/3 of
  the floor's engines require it. The plan's "clearest deletion candidate" is
  overturned by the matrix. (docs/javascript.md §11 documents the three-tier
  model: Chromium uses native interest invokers and skips the JS path; FF/Safari
  use this module.)
- **`popover-menu.js` — SURVIVES.** The *positioning* half is now native
  (anchor positioning shipped FF 147 / Chrome 125 / Safari 26, and
  `popover.css` already uses `@supports (anchor-name)`), but **roving focus and
  APG menu keyboard semantics cannot be expressed in CSS** (ADR-0006). The
  module keeps roving focus; positioning leans on native anchors. Deleting it
  would regress keyboard menu nav on every engine.
- **`theme.js` — SURVIVES.** Persistence (localStorage write + re-apply +
  `startViewTransition` crossfade) has no native primitive (it is the 4.9
  "smallest honest opt-in JS" by design).
- **`tabs.js`, `table-sort.js` — SURVIVE.** No native ARIA-tabs or row-sort
  primitive exists; semantics stay native, behavior stays JS (decision log).
- **`nav.js`, `carousel.js`, `chips.js`, `alert-dismiss.js`, `toast.js`,
  `reveal.js`, `return-focus.js`, `roving-index.js`, `lifecycle.js`,
  `remove-on-click.js`, `barefoot.js` — SURVIVE.** Each fills a gap no native
  primitive covers (responsive nav toggle, autoplay, delegated removal, toast
  lifetime, stagger orchestration, focus return, list-key math, init plumbing).
  None is subsumed; no deletion candidate exists among them.

**Addition, not deletion:** `command`/`commandfor` (Invoker Commands API) is
now green across the floor, so declarative dialog/popover wiring needs **no
module** — documented for consumers in docs/javascript.md §13. This is the only
"JS removed" in spirit: a behavior that once implied a script is now pure
markup.

## Consequences

- The `js/` surface is unchanged in v5.0 — same 16 modules ship. `full.css`
  stays frozen (ADR-0008); `barefoot.js` barrel is untouched.
- `tooltip.js` and `popover-menu.js` keep their "survives as a polyfill"
  status from the plan; Phase 3 shrinks nothing, it only confirms.
- The v5.0 breaking surface is purely the floor raise + adaptive CSS. Consumers
  on pre-floor engines keep working (degrade by omission); they simply don't
  get v5 density/style-query features.
- Cross-doc view transitions (`view-transition.css`) and base `<select>`
  remain engine-gated (Chromium-only / Firefox-flagged) and are **not** un-gated
  here — deferred to 5.1 per the plan; the pagereveal/pageswap test skips stay.
- **Test un-gating was only partially possible.** Implicit anchor positioning
  is exercised un-gated on all three floor engines (verified green on
  chromium/firefox/webkit) — a real Phase-3 win. But **scroll-driven animations
  and `popover=hint` could not be un-gated**: the *installed* test browsers
  (Firefox/WebKit builds CI actually runs) don't satisfy them at runtime — the
  aspirational v5 floor (FF 151 / Safari 26.2) is ahead of what's installed, and
  `popover=hint` correctly ignores `Escape` (so the Esc-close assertion is
  spec-wrong for hints). Their skips stay. Un-gating is explicitly conditional
  on "as floors land" — they haven't landed in the lab yet.

## Rejected

- **Deleting `tooltip.js`:** would break tooltips on Firefox + Safari (no
  interest invokers there as of Aug 2026). The engine matrix is the gate; it
  did not clear.
- **Deleting `popover-menu.js` because anchors shipped:** anchors solve
  positioning, not roving focus — CSS cannot express keyboard menu semantics.
- **Un-gating the pagereveal/cross-doc VT tests:** those primitives are still
  Chromium-only; the floor does not cover them, so the skips stay (degrade by
  omission holds).
