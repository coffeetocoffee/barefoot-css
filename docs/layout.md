# Barefoot — Container-aware layout (v6.2)

"The layout is the breakpoint." These opt-in primitives respond to their
container's width, not the viewport. They extend the v5.0 adaptive
contract rather than replacing the viewport-independent utilities that
already work. Contract: [ADR-0016](adr/0016-container-aware-layout.md).

## The three primitives

### Vertical rhythm (`.bf-flow`)

```html
<div class="bf-flow">
  <p>…</p>
  <p>…</p>
</div>
```

- Import `components/layout-flow.css`.
- A vertical stack whose gap tightens below `--bf-adaptive-1` (24rem)
  and opens up in wider boxes through a container-unit clamp.
- Override `--bf-flow-space` for a fixed rhythm.
- The parent becomes an inline-size container automatically; an explicit
  `.bf-contain` wrapper still works.

### Switcher (`.bf-switcher`)

```html
<div class="bf-switcher">
  <article class="card">…</article>
  <article class="card">…</article>
</div>
```

- Import `components/layout-switcher.css`.
- Children share a row while the container is wide; each takes a full
  row below `--bf-adaptive-1` (24rem).
- Tune the shared size with `--bf-switcher-min` and the gap with
  `--bf-switcher-gap`.
- The wrapper is its own query container; no `.bf-contain` is required.

### Deterministic sidebar (`.bf-sidebar` upgrade)

```html
<div class="bf-sidebar">
  <aside>…</aside>
  <main>…</main>
</div>
```

- Import `components/layout-sidebar.css` **after** `full.css` or
  `utilities.css`.
- This file does not replace the existing flex-wrap `.bf-sidebar`; it
  pins the split/stack threshold to the container width at or below
  `--bf-adaptive-2` (40rem).
- The existing `--bf-sidebar-width` token still controls the first
  column's preferred size.

## Degradation

Older engines ignore the unknown units, `@container` blocks, and
`@supports (width: 1cqi)` enhancement. They keep the base vertical
stack, the wrapping flex row, and the original sidebar heuristic. No
polyfill, JS, or fallback markup is required.

## Try it live

Open `demo/playground.html` and drag a resize handle—or use the width
slider, which is keyboard-operable with arrow keys. The readout reports
the box width while the layout reflows around it.
