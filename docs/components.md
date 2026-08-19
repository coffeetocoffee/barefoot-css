# Barefoot — Components

Element-first. You write plain HTML; Barefoot styles it. No classes needed
except where there is no native element. Every component degrades to fully
functional semantics without CSS.

Import from `dist/components/*.css` (or get everything with `full.css`).

## Buttons

```html
<button>Save</button>                       <!-- neutral -->
<button data-variant="primary">Save</button>
<button data-variant="ghost">Ghost</button>
<button data-variant="danger">Delete</button>
<input type="submit" value="Submit">        <!-- submit = primary -->
<button data-size="sm">Small</button>
<button disabled>Disabled</button>
```

- `[type="submit"]` is the primary action — semantic, no class.
- **JS:** none.
- **A11y:** native button; `Tab` + `Enter`/`Space`; `:disabled` styling.

## Forms

```html
<label for="email">Email</label>
<input id="email" type="email">

<select id="country">…</select>
<textarea rows="3">…</textarea>

<input type="checkbox"> <input type="radio">
<input type="range"> <progress max="100" value="60">
```

- Checkboxes/radios use `accent-color` — native, themed, free. Range
  sliders get a full custom skin (track + thumb in the theme tokens, with
  a `:focus-visible` ring), and `<progress>` / `<meter>` are drawn as
  themed bars (accent fill, alternate track) instead of the browser's
  default widget.
- Invalid states style automatically via `:user-invalid` (browser-driven,
  no JS) or `[aria-invalid]`.
- **JS:** none.
- **A11y:** native controls + browser validation UX.

## Dialog (modal)

```html
<dialog aria-labelledby="title">
  <header>Title</header>
  <p>…</p>
  <footer><button>Cancel</button><button data-variant="danger">Delete</button></footer>
</dialog>
```

```js
// The one native line Barefoot requires anywhere:
document.querySelector("dialog").showModal();
```

- `::backdrop` blurred dim; entrance animation via `@starting-style`.
- `data-width="sm|lg"` for sizing.
- **JS:** `showModal()` to open — one native method, no library.
- **A11y:** focus trap and `Esc` come from `<dialog>`.
- **Entrance fallback:** engines without `allow-discrete`/`@starting-style`
  get a keyframe entrance (via `@supports not (transition-behavior:
  allow-discrete)`) instead of snapping in instantly; reduced-motion is
  respected.

## Popover (fully JS-free modal-like layer)

```html
<button style="anchor-name: --menu" popovertarget="menu">Actions</button>
<div popover id="menu" data-kind="menu" style="position-anchor: --menu">
  <a href="#">Rename</a>
</div>
```

- `data-kind="menu"` → panel with menu item styling.
- `data-kind="tooltip"` → small muted tooltip. Mark the trigger with
  `data-tooltip` for the affordance (dotted underline, `cursor: help`).
- **JS:** none — Popover API is declarative.
- **A11y:** light-dismiss + `Esc` native. Position with anchor positioning
  or your own CSS.
- **Anchoring:** in browsers with anchor positioning (Chromium 125+,
  Firefox 147+, Safari 18.2+), give the trigger `anchor-name: --x` and the
  popover `position-anchor: --x` (use the popover's id as `--x`) and it
  pins to that trigger — the menu below, left-aligned; the tooltip above,
  centered. One inline style on each element, unique per popover, so any
  number of anchored popovers can coexist. (A named anchor is used rather
  than the `anchor` attribute because Chromium doesn't support that
  attribute yet.) Without anchor positioning the popover falls back to the
  default placement. `position-try-fallbacks: flip-block` flips the
  popover to the opposite side when the trigger sits near a viewport edge
  (e.g. a menu anchored below a button at the bottom of the screen opens
  above it instead).
- **Cross-browser:** `position-area` anchoring is verified in Chromium,
  Firefox, and WebKit (Safari) by the CI behavior suite, including the
  viewport-edge flip. One Firefox limitation: if the trigger is *off-screen*
  when the popover opens, the anchor resolves to the viewport edge —
  triggers are clicked in view, so this only matters if a script opens a
  popover programmatically. The opt-in `js/popover-anchor.js` module
  closes such popovers (matching the spec intent of `position-visibility:
  anchors-visible`); without it the popover may appear clipped at the
  viewport edge in Firefox, or pinned off-screen in Chromium/WebKit.
- **Difference from dialog:** popover is non-modal (no focus trap) — right
  for menus/tooltips, not for blocking actions.

## Dropdown (details/summary)

```html
<details data-menu>
  <summary>Actions</summary>
  <div><a href="#">Edit</a><a href="#">Share</a></div>
</details>
```

- Custom chevron marker; panel floats below the summary.
- **JS:** none.
- **A11y:** native disclosure; `Enter` toggles, `Tab` moves.
- **Esc caveat:** closing on `Esc` is browser-dependent for `<details>`
  (Chrome closes only when focus is inside the panel). If guaranteed
  Esc + click-away dismiss matters, use the **popover menu** below
  (`[popover][data-kind="menu"]`) — same look, reliable platform behavior.
- **Safari tab-order quirk:** WebKit does not include the contents of an
  open `<details>` in the sequential tab order (a long-standing Safari
  behavior), so Tab skips past its links there. Items stay clickable and
  focusable; keyboard users on Safari can reach them via the "next form
  control" key or by closing the panel first.

## Accordion / tabs (details, one-at-a-time)

```html
<details data-accordion name="faq" open><summary>Q</summary><p>A</p></details>
<details data-accordion name="faq"><summary>Q</summary><p>A</p></details>
```

- A shared `name` makes the browser allow only one open — the
  one-at-a-time disclosure pattern, zero JS.
- **JS:** none.
- **A11y:** native disclosure semantics; `Tab` between summaries,
  `Enter` toggles.

## Tabs (opt-in JS)

```html
<div data-fz-tabs>
  <div role="tablist" aria-label="Sections">
    <button role="tab" aria-controls="panel-1" aria-selected="true">One</button>
    <button role="tab" aria-controls="panel-2" aria-selected="false">Two</button>
  </div>
  <div role="tabpanel" aria-labelledby="tab-1" tabindex="0">…</div>
  <div role="tabpanel" aria-labelledby="tab-2" tabindex="0">…</div>
</div>
```

```html
<script type="module">
  import "barefoot-css/js/tabs.js";
</script>
```

- **JS:** opt-in `js/tabs.js` (~2.7KB, zero deps) — WAI-ARIA tabs with
  arrow-key navigation, `Home`/`End`, automatic activation. On init the
  module marks the group `data-fz-tabs-js` (a CSS hook) and hides inactive
  panels.
- **A11y:** full APG tabs pattern (roving tabindex, `aria-selected`,
  `aria-controls`). **No-JS first:** without the module every panel stays
  visible — content is never lost; with it, inactive panels hide
  synchronously at init (load the module in `<head>` so it runs before
  first paint and there's no flash).
- Styling ships in `components/tabs.css`.

## Popover menus, Esc-close & friends

See [docs/javascript.md](javascript.md) for the opt-in JS modules
(tabs, details Esc-close, details tab-order shim, popover-menu keyboard
support, carousel controls + autoplay) and their markup.


## Carousel (scroll-snap)

```html
<div data-carousel tabindex="0" aria-label="Slides">
  <div>Slide</div><div>Slide</div>
</div>
```

- `scroll-snap-type: x mandatory`; scrollbar hidden but scrolling works
  (touch, wheel, and — with the `tabindex` — keyboard).
- **JS:** none for the base scroller. Opt-in `js/carousel.js` adds
  prev/next buttons (`data-carousel-prev` / `data-carousel-next` pointing
  at the scroller's id) and autoplay (`data-autoplay="3000"`). Without it
  nothing changes.
- **A11y:** keep the `tabindex` and `aria-label`; that's what makes it
  keyboard reachable.

## Breadcrumbs

```html
<nav aria-label="Breadcrumb" data-breadcrumbs>
  <ol>
    <li><a href="/">Home</a></li>
    <li><a href="/docs/">Docs</a></li>
    <li><span aria-current="page">Theming</span></li>
  </ol>
</nav>
```

- Slash separators between items; the current page is muted text. Mark the
  last item `aria-current="page"` (a `<span>`, not a link).
- **JS:** none.
- **A11y:** `<nav aria-label>` + `<ol>` give screen readers the landmark
  and list semantics.

## Pagination

```html
<nav aria-label="Pagination" data-pagination>
  <ol>
    <li><span aria-disabled="true" aria-hidden="true">←</span></li>
    <li><span aria-current="page">1</span></li>
    <li><a href="#pagination">2</a></li>
    <li><a href="#pagination" aria-label="Next page">→</a></li>
  </ol>
</nav>
```

- The current page is a **filled `<span aria-current="page">`, never a
  link** — the page you're on isn't clickable. Disabled controls are
  `<span aria-disabled="true" aria-hidden="true">`, not dead links.
- **JS:** none.
- **A11y:** `<nav aria-label>` + `<ol>`; labelled prev/next arrows.

## Table

```html
<table data-striped>
  <caption>…</caption>
  <thead><tr><th>…</th></tr></thead>
  <tbody>…</tbody>
</table>
```

- `data-striped` opts into zebra rows; hover highlight on by default.
- **A11y:** `<th>`/`<caption>` do the work for screen readers.

## Code

```html
<code>inline</code> <kbd>Ctrl</kbd> <pre><code>block</code></pre>
```

- Monospace stack, tinted background, kbd gets a keycap border.

## Card & badge

```html
<article class="card" data-lifted> <header>…</header> <p>…</p> </article>
<span class="badge" data-variant="primary">New</span>
```

- Classes, because there is no native `<card>`/`<badge>`. Neutral by
  default; `data-lifted` opts into a shadow.

## Utilities

`.fz-container`, `.fz-stack`, `.fz-row`, `.fz-gap-1…5`, `.fz-mt-4`,
`.fz-mb-4`, `.fz-muted`, `.fz-center`, `.fz-overline`,
`.fz-visually-hidden`. Layout-only; kept intentionally tiny.
