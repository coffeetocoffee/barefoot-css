# Barefoot — Container-aware layout (v6.4)

"The layout is the breakpoint." These opt-in primitives respond to their
container's width, not the viewport. They extend the v5.0 adaptive
contract rather than replacing the viewport-independent utilities that
already work. Contract: [ADR-0016](adr/0016-container-aware-layout.md).

## The primitives

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

### Enhanced rhythm (`.bf-rhythm`) — v6.4

```html
<div class="bf-rhythm">
  <p>…</p>
  <p>…</p>
</div>
```

- Import `components/layout-rhythm.css`.
- Extends `.bf-flow`: gap **and** line-height scale with container width.
- Uses container queries at `--bf-adaptive-1` (24rem), `--bf-adaptive-2` (40rem), `--bf-adaptive-3` (56rem).
- Override `--bf-rhythm-gap` and `--bf-rhythm-line-height` for fixed values.
- Container-unit clamp provides fluid scaling between thresholds.
- The parent becomes an inline-size container automatically.

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

### Stagger (`.bf-stagger`) — v6.4

```html
<div class="bf-stagger" data-bf-stagger>
  <article style="--bf-stagger-index: 0">First</article>
  <article style="--bf-stagger-index: 1">Second</article>
  <article style="--bf-stagger-index: 2">Third</article>
</div>
```

- Import `components/layout-stagger.css`.
- Children animate in sequence with delay = `index * var(--bf-stagger-step, 50ms)`.
- Pure CSS via `@starting-style` and `view()` timeline (scroll-triggered).
- Falls back to `@starting-style` + transition for engines without `view()`.
- **Respects `prefers-reduced-motion: reduce`** — all motion killed instantly.
- Works with any layout (flex, grid, flow). No layout opinion.
- Author sets `--bf-stagger-index` on each child (or use a tiny JS module).

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

Stagger degrades by omission: without `view()` timeline support, it uses
`@starting-style` + transition. Without `@starting-style`, no animation
occurs — content is simply visible. Reduced motion is always respected.

## Try it live

Open `demo/playground.html` for flow/switcher/sidebar, and
`demo/rhythm-motion.html` for rhythm/stagger/combined. Drag a resize
handle—or use the width slider, which is keyboard-operable with arrow
keys. The readout reports the box width while the layout reflows around
it.