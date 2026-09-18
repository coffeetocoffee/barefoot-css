# Barefoot — Debug audit mode (`.bf-debug`)

*Makes the framework's own architecture visible on the page you're
already looking at.*

`.bf-debug` is a dev-only overlay (v8.5). Put the class on any element and
its subtree is audited: every element Barefoot paints gets an outline by
the layer that paints it, and orphan `data-state` attributes are flagged
in red. It is **opt-in by import** (`components/debug.css`), never in
`full.css`, and no shipped page uses it — a page that does not ask for it
is untouched.

## Quick start

```html
<link rel="stylesheet" href="barefoot-css/components/debug.css">
<!-- audit the whole page: -->
<body class="bf-debug">
```

Import the core first, as always (the overlay resolves `--bf-*` tokens).
To audit one region, put `.bf-debug` on it instead — a `<main>`, a card,
a component.

## What the outlines mean

| Outline | Layer / flag | What it marks |
|---|---|---|
| 1px dotted | base | native elements the core styles with no opt-in (from `src/base.css`) |
| 1px dashed | layout | container-aware primitives and utilities (`.bf-flow`, `.bf-stack`, `[data-grid]`, spacing utilities, …) |
| 2px solid | component | opt-in surfaces — component classes and every documented `data-*` contract attribute |
| 2px solid red + label | flag | `data-state` with no hook (see below) |

An element in several categories shows the most specific one: a `.card`
inside a `.bf-flow` reads as a component (the parent keeps the dashed
layout outline; the card gets the solid component outline). Precedence is
rule order at equal specificity — `:where()` keeps every rule at one
class — never `!important`.

The scope element opens with a legend (a `::before`), so the map has a key.

## The one real flag: orphan `data-state`

`data-state` is a framework attribute. It only paints on `.bf-state`
(states.css) or on a `<form>` (forms-state.css). An element carrying it
anywhere else is a promise to a hook that does not exist — the app
maintains state nothing renders. The overlay outlines it red and labels
it:

```
[data-state]   ← 2px solid red + "data-state: no hook (needs .bf-state or a <form>)"
```

The two real hooks stay silent by design.

## What CSS cannot see (and who reports it)

An overlay written in CSS cannot inspect its own selectors or the page's
style sheets. Two findings therefore live elsewhere, and the overlay says
so in its header rather than guessing:

- **Deep `:has()`** — a selector nesting `:has()` inside `:has()`
  (superlinear recalc cost) is reported by `npm run perf`
  ([performance.md](performance.md#selector-budgets--npm-run-perf-v85)),
  whose deep-`:has()` budget is zero.
- **An unlayered reset** defeating the layered focus ring is reported by
  Verify's `coexistence-clean` rule ([verify.md](verify.md#coexistence-clean)),
  which reads the CSSOM.

## Honesty and safety

- The overlay sets only `outline` and its own labels — no layout property,
  no color or background on real content. Removing the class removes the
  audit.
- Outlines carry **shape, not just color** (dotted / dashed / solid / red
  + label), so forced-colors users keep every distinction. Nothing
  animates, so reduced-motion is honored without a rule.
- The contract-attribute list is pinned against `docs/api.md` in both
  directions by a test: a new attribute is outlined the day it ships, and
  an undocumented one is a test failure.
- `.bf-debug` is unlayered on purpose — the audit must paint over every
  layer, including `@layer user` — and every selector is scoped to the
  subtree, so the overlay cannot leak. (The same "unlayered wins" rule the
  coexistence docs teach is why it must be a class, not an element rule.)
