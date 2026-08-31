# Barefoot — Adaptive components (v5.0)

"The component is the breakpoint." Adaptive components respond to the **size
of their container**, not the viewport — drop a data table into a narrow card
and it card-stacks; widen it and it returns to rows. No media queries, no
JS, no re-render. This is the headline feature of v5.0 (ADR-0009).

## Why container, not viewport

A sidebar, a card, a grid cell — none of them is the viewport. A component
that only knew the viewport would overflow or under-fill its real box.
Container queries answer "how wide am I *here*?", which is the question every
embedded component actually needs answered. v5.0 raises the floor
(Chrome 135 / Firefox 151 / Safari 26.2, ADR-0010) so container queries,
container *style* queries, and container *units* (`cqi`) are all guaranteed.

## The contract (ADR-0009)

Every adaptive component follows the same rules:

- Ships as an opt-in `src/components/<name>-adaptive.css` — **never** in the
  frozen `full.css` (ADR-0008). Import it only where you use the component.
- Breakpoints are the shared `--bf-adaptive-1/2/3` tokens
  (24 / 40 / 56rem), not magic numbers in `@container`.
- Density is a `@container style(--bf-density: compact)` query, so the existing
  `data-density="compact"` axis (v3.4) feeds the v5 adaptive behavior.
- A component **cannot style its own box** from inside its own container — a
  `<table>` or `.card` that morphs its *own* layout queries the nearest
  ancestor container. You used to hand-place a `.bf-contain` wrapper for
  that; v5.1 auto-establishes the container on the component's parent (see
  below), so `.bf-contain` is now optional — still supported for explicit
  control. Components whose own box doesn't morph (segmented, form rows,
  tabs) self-container with `container-name: bf-<name>`.
- Native semantics are untouched, so keyboard and screen-reader behavior is
  unchanged — accessibility is inherited, never re-implemented.

### The `.bf-contain` wrapper (now optional)

For components that morph their own box (table, card), the component queries
the nearest ancestor container. You can still wrap them by hand:

```html
<div class="bf-contain">
  <table data-table="adaptive">…</table>
</div>
```

But as of v5.1 you usually don't have to: importing `table-adaptive.css` /
`card-adaptive.css` auto-establishes the container on the component's direct
parent via a `:has()` rule, so dropping the table or card straight into a
`<div>` (or any block ancestor) adapts correctly with no `.bf-contain`.
`.bf-contain` remains for when you want explicit control of the container
boundary. Components that only restyle their *descendants* (segmented, form,
tabs) self-container, so they never needed the wrapper.

## The four adaptive components

### Table → card stack (`table-adaptive.css`)

```html
<div class="bf-contain">
  <table data-table="adaptive">
    <thead><tr><th>Name</th><th>Role</th></tr></thead>
    <tbody>
      <tr><td data-label="Name">Ada</td><td data-label="Role">Engineer</td></tr>
    </tbody>
  </table>
</div>
```

When the container is ≤ `--bf-adaptive-2` (40rem) the rows become cards; each
body cell shows its column header via `data-label`. Under
`data-density="compact"` the cards compress. Degrades to a plain table where
container queries are unavailable.

### Segmented control density (`segmented-adaptive.css`)

```html
<div data-segmented data-segmented-adaptive>
  <input type="radio" name="x" id="a"><label for="a">One</label>
  …
</div>
```

Self-contained (`container-name: bf-segmented`): when the control is narrow,
or under `data-density="compact"`, labels compress and the control tightens.
Type tracks the container via `--bf-type-cqi-*`.

### Form reflow (`form-adaptive.css`)

```html
<form data-form="adaptive">
  <div class="bf-row"><label>Name</label><input></div>
  …
</form>
```

`.bf-row` collapses to a single column when the form's container is narrow
(≤ `--bf-adaptive-1`, 24rem). `:has(:user-invalid)` reveals an error summary
with **zero JS** — invalid fields are summarized in a live region.

### Card morph (`card-adaptive.css`)

```html
<div class="bf-contain">
  <article class="card" data-card="adaptive">
    <img> <div class="bf-card-body">…</div>
  </article>
</div>
```

Horizontal (`40% 1fr`) when the container is ≥ 40rem, vertical otherwise. The
card header uses container-relative type.

### Tabs — scroll-snap ↔ wrap (`tabs-adaptive.css`)

```html
<div data-bf-tabs data-adaptive>
  <div role="tablist"> … </div>
  <div role="tabpanel"> … </div>
</div>
```

The tablist is a single scroll-snapping row when the container is wide and
wraps to multiple rows when narrow (≤ `--bf-adaptive-2`, 40rem). The group
self-containers (`container-name: bf-tabs`), so no `.bf-contain` is needed. The
markup is the standard WAI-ARIA tabs pattern; `js/tabs.js` still drives panel
switching. Degrades to a plain row where container queries are unavailable.

### Nav — drawer by container (`nav-adaptive.css`)

```html
<nav data-nav="drawer" data-nav-js aria-label="Primary">
  <a class="bf-brand" href="/">Acme</a>
  <button type="button" class="bf-nav-toggle"
          aria-expanded="false" aria-controls="site-menu">Menu</button>
  <ul id="site-menu"> … </ul>
</nav>
```

When the nav's container is narrow (≤ 40rem) the link list becomes an
off-canvas drawer, opened by the same `[data-nav-js]` hamburger that the header
collapse uses (`js/nav.js` flips `[data-open]`). In a wide container the list
stays an inline row — so the same nav dropped into a sidebar collapses to a
drawer, while the same nav in a topbar stays inline. The nav self-containers,
so no `.bf-contain` is needed. Keyboard/ARIA are unchanged.

## Container-relative type (`cqi`)

Adaptive components use `--bf-type-cqi-*` (a `clamp()` over `cqi`) instead of
the viewport-clamped `--bf-type-*`, so headings and labels scale with the
component's box, not the screen. Define your own at any step with
`font-size: var(--bf-type-cqi-md)`.

## Accessibility

Because every adaptive component keeps its native element and semantics:

- **Keyboard:** unchanged — a card-stacked table is still a `<table>` in the
  a11y tree; tabs, radios, and form controls keep their native interaction.
- **Contrast:** the adaptive variants use the same `--bf-*` tokens, so they
  inherit the AA-verified palette (see the demo's WCAG table).
- **`prefers-reduced-motion`:** layout changes are not motion; no animation is
  introduced by adapting.

## Browser support

All four components require the v5.0 floor (ADR-0010): container queries +
container units ship in Chrome 105+/Firefox 110+/Safari 16+, and container
*style* queries (density) in Chrome 111+/Firefox 128+/Safari 16.4+. The v5.0
floor guarantees them; engines below it get the static (non-adaptive) layout
via degrade-by-omission.
