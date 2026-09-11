# ADR-0017: paint & paper contract

**Status:** Accepted (2026-09-11)

## Context

v6.2 taught layouts to sense their container. What remains visibly
unfinished is small but high-touch: form errors paint per-control while
the group stays mute, sticky tables need hand-rolled wrappers with no
hint that more data waits off-screen, and printing an adaptive page
prints the cleverness (stacked cards, sticky offsets, dark surfaces)
instead of the content.

## Decision

1. **Validation paints at the group, still zero JS.** New opt-in
   `components/forms-validation.css`: `.bf-form-group:has(
   :user-invalid)` tints (danger edge on `--bf-danger-subtle`) and
   reveals `.bf-error-text` via the same `:has()`, with an
   `@starting-style` entrance and a keyframe fallback. `aria-invalid`
   mirrors the state for script-driven forms (the `forms-base.css`
   convention). Invalid beats valid when a group holds both.
2. **Sticky tables get an opinionated wrapper.** New opt-in
   `components/table-sticky.css`: `.bf-table-sticky` is the scroll
   container plus pinned header plus pinned leading column plus
   `mask-image` fade, on the `--bf-z-sticky` ladder (corner cell one
   rung up). The fade is `@supports`-gated decoration; forced-colors
   drops it. Complements `data-table="sticky-head sticky-col"`, which
   stays for hand-rolled wrappers.
3. **Print ships as a screen-zero layer.** New opt-in
   `components/print.css`: every rule sits inside `@media print`
   (nothing applies on screen), flattening container layouts,
   re-tabulating adaptive stacks, unsticking sticky cells, printing
   http(s) destinations, hiding `.bf-no-print`, and extending the
   `break-inside: avoid` set. Token reset mirrors the base print
   palette (plain hex, always light).
4. **Tokens may grow additively.** `--bf-danger-subtle` joins the
   subtle ramp (and backfills the `form-adaptive.css` reference, which
   predates it). Additive tokens are allowed in minors per api.md.
5. **No new `data-*` attributes, no new Verify rules.** All three
   surfaces are classes; the api.md audit stays green by construction.
   The sticky wrapper's scrollable-region contract is already audited
   by `sticky-scroll-focusable`; validation wiring (`aria-describedby`,
   error summary, focus-first-error) is explicitly deferred to v6.5
   with a bring-your-own statement in the docs.
6. **Proof lives on its own page.** `demo/paint-paper.html` carries the
   fixtures (the v6.2 precedent), so the conformance demo's visual
   baselines stay untouched.

## Consequences

- Three tiny opt-in files, each well under 1KB gzipped; `full.css`
  stays frozen and `index.css` is untouched.
- Unsupported engines degrade by omission at every step (resting group,
  scrolling-but-static table, base print core).
- v6.5 inherits a stated contract to audit: group wiring and error
  summaries.
