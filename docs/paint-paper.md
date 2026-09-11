# Barefoot — Paint & Paper (v6.3)

Visible validation, sticky tables with a scroll hint, and an opt-in
print layer. Each ships as its own file, never in frozen `full.css`
(ADR-0008). Contract: [ADR-0017](adr/0017-paint-paper.md).

## Validation groups (`.bf-form-group` + `.bf-error-text`)

```html
<link rel="stylesheet" href="barefoot-css/components/forms-validation.css">

<div class="bf-form-group">
  <label for="email">Email</label>
  <input id="email" type="email" required aria-describedby="email-err">
  <small class="bf-error-text" id="email-err">Enter an address like you@example.com.</small>
</div>
```

- The group tints when any control inside is touched-and-invalid
  (`:has(:user-invalid)` → danger edge on `--bf-danger-subtle`);
  a fully valid group earns the success edge. Invalid wins when a
  group holds both states.
- `.bf-error-text` starts hidden and is revealed by the same `:has()`,
  with an `@starting-style` entrance (plus a keyframe fallback where
  `allow-discrete` is missing).
- Script-driven forms mirror the state with `aria-invalid="true"` /
  `"false"` — same painting, no interaction heuristic (the
  `forms-base.css` convention).
- New token: `--bf-danger-subtle` (also backfills the `form-adaptive.css`
  summary background, which referenced it before it existed).
- **A11y (bring-your-own until v6.5):** the browser announces native
  constraint validation itself; wire every control with
  `aria-describedby` to its message and keep the message text stable.
  Full validation wiring (error summary, focus-first-error) lands with
  Verify contracts in v6.5.

## Sticky tables (`.bf-table-sticky`)

```html
<link rel="stylesheet" href="barefoot-css/components/table-sticky.css">

<div class="bf-table-sticky" role="region" aria-label="Quarterly ledger, scrollable" tabindex="0">
  <table>
    <caption>…</caption>
    <thead><tr><th>…</th></tr></thead>
    <tbody>…</tbody>
  </table>
</div>
```

- The wrapper is the scroll container (`overflow: auto`,
  `max-height: 24rem` by default — override it), the header row pins
  to the top, the leading column pins to the logical `inline-start`
  edge (RTL mirrors free), and the corner cell sits one rung above
  both on the `--bf-z-sticky` ladder. Cells paint opaque `--bf-surface`
  so scrolled rows never show through.
- The "more data" fade is `mask-image` behind `@supports` — engines
  without it keep the pins and lose only the hint. Dropped entirely
  under `forced-colors: active`.
- Complements `data-table="sticky-head sticky-col"` (bare sticky cells
  on your own wrapper); reach for the class when you want the wrapper,
  the pins, and the affordance in one import.
- **A11y:** give the wrapper `tabindex="0"` and an accessible name —
  tables hold no focusable content, so keyboard users can't scroll
  without it (WCAG 2.1.1). Verify's `sticky-scroll-focusable` rule
  audits exactly this; no new rule was needed.

## Print layer (`print.css`)

```html
<link rel="stylesheet" href="barefoot-css/components/print.css">
```

Every rule lives inside `@media print`, so the cost on screen is zero
bytes of applied style. On paper it:

- flattens container-query layouts (`[data-grid]`, `.bf-switcher`,
  `.bf-sidebar`, `.bf-row`) to a single readable column and restores
  plain tables (adaptive card-stacks re-tabulate, sticky cells unstick,
  the scroll fade is removed);
- forces ink-on-paper (the print-palette stance from `base.css` —
  plain hex, print is always light);
- prints link destinations (`label (https://…)` for http(s) links),
  hides `.bf-no-print` screen-only chrome, and keeps cards, rows,
  groups, and code from splitting across pages.

## Degradation

Older engines ignore `:has()`, `@starting-style`, `allow-discrete`,
`mask-image`, and `@container` flattening. They keep a resting group
with a hidden message, a scrolling table with static cells, and the
base print core. No polyfill, JS, or fallback markup is required.

## Try it live

Open `demo/paint-paper.html`: break the email field and watch the group
tint, scroll the ledger, then open print preview — the grid stacks, the
link gains its destination, and the badge disappears.
