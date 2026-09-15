# ADR-0019: the data story — density, sort, and selection contracts

**Status:** Accepted (2026-09-15)

## Context

v7.0 gave the framework a state machine and an event contract. The next
layer up is the view every dashboard actually ships: a filter bar, a
table that sorts and selects, an empty state, and pagination. Three
gaps showed up across the gap analyses:

1. **Density was a hard-coded remap.** `data-density="compact"` (v3.4)
   re-declares twelve spacing tokens by hand. It does not touch type, so
   a compact table keeps comfortable type and the rows stop fitting; and
   a *custom* density (a design system that wants 0.85, not 0.5) means
   re-declaring all twelve again.
2. **Sort state had no declarative path.** `js/table-sort.js` maintains
   `aria-sort` (correctly), but a page that sorted on the server — the
   common case — had no way to paint the arrow without lying about which
   column is sorted, or importing a sorting module it does not need.
3. **Selection had no contract.** `tr[data-selected]` paints (v4.7) but
   carries no semantics. A multi-select grid's real contract — every row
   states `aria-selected`, the select-all control is named — is exactly
   the kind of thing axe cannot see (checkboxes are exempt from its
   label rule) and Barefoot's own docs *did* not state.

## Decision

1. **Density becomes a scale.** Two additive tokens — `--bf-space-scale`
   (default `1`, compact `0.75`) and `--bf-type-scale` (default `1`,
   compact `0.9375`) — multiply the spacing and type tokens from the new
   opt-in `components/density.css`. `data-density` on any element sets
   both for its subtree and flips `--bf-density`, so the v5.0 style-query
   axis moves in lockstep. A custom density at `:root` is one number, not
   twelve. The v3.4 preset is untouched and wins the cascade under
   `compact` (it is unlayered); the scale is live for the `comfortable`
   value, for a page-wide custom number, and for the type axis.
2. **The inheritance limit is documented, not hidden.** A custom property
   substitutes its `var()` references at the element that declares it, so
   `--bf-space-3: calc(0.75rem * var(--bf-space-scale))` inherits with
   the dial already resolved. The `[data-density]` rules therefore
   re-declare the whole scaled token set (not just the dials), and the
   docs state the split: the attribute scales a subtree, the tokens at
   `:root` scale the page, and a custom number on a subtree does neither.
2. **Type scales with space, but gently.** The compact type step is
   `0.9375` (15px body), not `0.75`: packing information must not cost
   legibility. The readable floor is a contract, not a detail.
3. **`data-sort` is the declarative mirror of `aria-sort`.** A
   server-rendered sort writes `data-sort="asc|desc"` on the `<th>` and
   gets the identical arrow, with or without the module. The module
   keeps `aria-sort`; the attribute pair must agree when both are
   present. Painting an untruthful sort is now an audited contract, not
   a styling choice.
4. **Selection is ARIA-first, with an audited contract.** Opt-in
   `components/table-select.css` paints `aria-selected` (the semantic
   source of truth; the older `tr[data-selected]` still paints for
   backwards compatibility), keeps the select-all checkbox's own state
   **JS-owned** — CSS cannot check a box truthfully, and a painted check
   on an unchecked control is a WCAG 4.1.2 lie — and reveals a
   `.bf-bulk-bar` with `:has()` when the shell holds a selection (zero
   JS; server-rendered selections get their actions immediately).
   `aria-multiselectable` is deliberately absent: it is not valid on a
   `<table>`, and `role="grid"` would claim arrow-key navigation the
   platform does not provide — the row checkboxes carry the multi-select
   affordance instead.
5. **Two new Verify rules pin the contracts.** `aria-sort-wired`
   (WCAG 4.1.2): one sorted column, a valid direction, the sort button
   behind the arrow, and `data-sort`/`aria-sort` agreement.
   `selection-complete` (WCAG 4.1.2): a multi-select table with a
   select-all control names the control and states `aria-selected` on
   every row. Both stay silent where the surface is absent — no
   select-all control, no rule; no claimed sort, no rule. The registry
   budget moves 5120 → 6656 bytes gzip, deliberately in review (two
   rules, quoted docs prose).
6. **`js/table-sort.js` graduates.** It is no longer a footnote: an ADR
   (this one) records why row sorting is opt-in JS (no native element
   sorts rows), the docs carry the full contract (events, server-side
   mirror, the Verify rule), and it keeps its ~2KB family budget.
7. **Composed recipe, proven on its own page.** `demo/data-story.html`
   composes filter bar → sortable/selectable table → empty state →
   pagination → bulk bar, with the density dial live. Own page, so the
   conformance demo's visual baselines stay untouched (the v6.2/v7.0
   precedent). `docs/recipes.md` carries the recipe with the ownership
   table (app owns state, CSS paints, module sorts, platform does the
   rest).

## Consequences

- Five new opt-in surfaces (`density.css`, `table-select.css`, the
  `data-sort` attribute on `table.css`, two registry rules) and one new
  demo page; `full.css` stays frozen, `index.css` gains only two
  additive tokens (3.05KB gzip, budget untouched).
- Non-goals hold: no virtualization, no charting, no wrappers. The bulk
  bar is a class, not a component; the selection model stays the app's.
- Older engines degrade by omission: `:has()` reveal, `@container` card
  stacking, and the style-query density axis each drop their feature and
  leave a valid page.
- The density precedent is now written down: an opt-in layer may
  re-express tokens as multipliers, and an unlayered preset wins — a
  later release that wants one density system must reconcile the two
  deliberately, in a major.
