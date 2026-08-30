# Barefoot — Opt-in JavaScript

Barefoot's CSS is **zero-JS**. When native elements aren't quite enough,
nine small opt-in modules add the missing behavior. Each is a single
ES module, **zero dependencies**, and ships readable in `dist/js/`.

| Module | Adds |
|---|---|
| `js/tabs.js` | WAI-ARIA tabs: roving tabindex, arrow-key nav |
| `js/popover-menu.js` | Arrow-key nav + focus restore for popover menus |
| `js/carousel.js` | Carousel autoplay + prev/next controls |
| `js/alert-dismiss.js` | Dismisses `[data-alert]` notices on click |
| `js/chips.js` | Removes `[data-chip]` tags on × click |
| `js/nav.js` | Responsive header nav: hamburger toggle, Esc-close |
| `js/table-sort.js` | Sorts `table[data-bf-sort]` rows from header buttons |
| `js/toast.js` | Toast auto-dismiss: timed, pause-on-hover |
| `js/tooltip.js` | Hover tooltip fallback for engines without interest invokers |
| `js/barefoot.js` | All nine in one import |

Deprecated surfaces keep working through 3.x and warn once per page
when their markup is present; the full table with replacements lives
in [api.md → Deprecations](api.md#deprecations).

Sizes live in the README table (regenerated from every build) — never
here, so this page can't drift from the bytes.

## Loading

```html
<!-- all nine -->
<script type="module">
  import "barefoot-css/js/barefoot.js";
</script>

<!-- just carousel -->
<script type="module">
  import "barefoot-css/js/carousel.js";
</script>
```

Each module auto-initializes existing matching markup on load. Importing
the module is enough — no init call needed.

For dynamic content, import the named functions:

```js
import { initTabs } from "barefoot-css/js/tabs.js";
initTabs(document.getElementById("app"));
```

All nine share two internal primitives from `js/lifecycle.js`
(`onDomReady`, `bindOnce`) — not public API, just plumbing that makes
every `init*` call idempotent: re-running an init on markup that was
already wired changes nothing. The two removal behaviors (chips,
alert dismiss) additionally share one delegated click handler from
`js/remove-on-click.js`, and the keyboard behaviors share two more
seams: `js/roving-index.js` owns all Arrow/Home/End list math
(tabs and popover menus parameterize wrap vs clamp), and
`js/return-focus.js` owns "a disclosure closed → focus returns to its
opener, but only if focus never left" (header nav, details menus,
popover menus). See `docs/adr/0006`.

## 1. Tabs (`js/tabs.js`)

Styles live in `components/tabs.css`; the module drives behavior.

```html
<div data-bf-tabs>
  <div role="tablist" aria-label="Sections">
    <button id="tab-1" role="tab" aria-controls="panel-1" aria-selected="true">One</button>
    <button id="tab-2" role="tab" aria-controls="panel-2" aria-selected="false">Two</button>
  </div>
  <div id="panel-1" role="tabpanel" aria-labelledby="tab-1" tabindex="0">…</div>
  <div id="panel-2" role="tabpanel" aria-labelledby="tab-2" tabindex="0">…</div>
</div>
```

Behavior: automatic activation — `←`/`→` switch and select, `Home`/`End`
jump, `Tab` leaves the tablist into the active panel. `aria-selected` and
`tabindex` are managed for you.

**No-JS first:** without the module every panel stays visible — content
is never hidden from a user without JS, it just loses the tab chrome.
On init the module marks the group `data-bf-tabs-js` (a hook for CSS or
other code) and hides inactive panels synchronously. Load the module in
`<head>` (or before your content) so it runs before first paint and
there's no flash of all panels.

## 2. Details Esc-close (`js/details-close.js`)

> **Deprecated since 3.2, removed in 4.0** together with the
> `details[data-menu]` pattern it exists for — use a popover menu (see
> section 4). Still functional through 3.x; pages that arm it against
> details-menu markup get one console notice.

Fixes the browser-dependent Esc behavior of `<details>` (Chrome closes
only when focus is *inside* the panel). With this module, pressing `Esc`
anywhere inside an open `details[data-menu]` closes it and returns focus
to the summary.

```html
<details data-menu>
  <summary>Actions</summary>
  <div><a href="#">Edit</a><a href="#">Share</a></div>
</details>
```

Load the module; every `details[data-menu]` gets the behavior. No markup
changes.

## 3. Details tab order (`js/details-tabindex.js`)

> **Removal candidate for 4.0 (baseline-gated):** this shim exists only
> while engines skip open `<details>` panels in the tab order; it is
> deleted once the gap closes upstream (gate-checked at 3.5). Drop the
> import when your browser baseline includes the native fix.

WebKit/Safari skips the contents of an *open* `<details>` in the
sequential tab order (a long-standing WebKit quirk): panel links and
buttons stay clickable, but Tab never reaches them. This module walks the
panel of every open `details` and gives its focusable descendants an
explicit `tabindex="0"`, so keyboard users can Tab into the panel in every
engine.

```html
<details>
  <summary>Actions</summary>
  <div><a href="#">Edit</a><a href="#">Share</a></div>
</details>
```

- Watches the `open` attribute (a MutationObserver), so panels opened by
  click, keyboard, or script are all covered.
- Skips elements with a deliberate `tabindex="-1"`.
- Panels already open when the module loads are fixed at init.
- In Chromium/Firefox this is effectively a no-op — their native tab order
  already includes open `<details>` contents.

## 4. Popover menu keyboard support (`js/popover-menu.js`)

For `[popover][data-kind="menu"]`, the APG menu-button behaviors:

- Focus moves to the first item when the menu opens.
- `↓`/`↑`/`Home`/`End` navigate the items.
- `Esc` (native) or `Tab` closes it; focus returns to the trigger.

This is **roving focus, not a modal trap** — popovers stay non-modal by
design. Use a `<dialog>` for blocking actions.

## 5. Anchored popover off-screen guard (`js/popover-anchor.js`)

> **Removal candidate for 4.0 (baseline-gated):** this guard exists only
> while engines lack `position-visibility: anchors-visible`; it is
> deleted once they ship it (gate-checked at 3.5). Drop the import when
> your browser baseline includes the fix.

For `[popover]` elements that pin to a trigger via anchor positioning
(`position-anchor`), the guard closes a popover whose trigger is **fully
outside the viewport when it opens**:

- A script calls `showPopover()` while the trigger is scrolled away, and
  no engine hides the popover: Firefox 153+ clamps it to the viewport
  edge (visible at the wrong place), Chromium/WebKit pin it to the
  off-screen trigger. Both are wrong — the guard closes it instead,
  matching the spec intent of `position-visibility: anchors-visible`,
  which no engine implements yet.
- A trigger **in view** is untouched: click-to-open and programmatic
  opens behave exactly as native. Only the fully-off-screen case is
  closed.
- Runs once per popover open; the anchor is found via the popover's
  `anchorElement` when supported, else the documented inline
  `anchor-name` pattern (with a computed-style fallback).

Without the module, the CSS-only behavior (including the viewport-edge
flip in 1.3) is unchanged — the guard is purely additive.

## 6. Carousel controls + autoplay (`js/carousel.js`)

The base `[data-carousel]` is a pure scroll-snap scroller (CSS only,
zero JS). This module adds optional autoplay and prev/next buttons.

```html
<div data-carousel id="c" tabindex="0" aria-label="Slides" data-autoplay="3000">
  <div>Slide 1</div><div>Slide 2</div><div>Slide 3</div>
</div>
<button type="button" data-carousel-prev="#c" aria-label="Previous slide">←</button>
<button type="button" data-carousel-next="#c" aria-label="Next slide">→</button>
```

- **Autoplay** — `data-autoplay="ms"` (3000ms default, floored at 1000ms).
  It pauses on hover, keyboard focus, and when the tab is hidden, and
  never starts under `prefers-reduced-motion: reduce`. An autoplaying
  carousel is marked `aria-live="off"` unless the author already set it —
  the prev/next controls (and the scroller's own keyboard use) are the way
  in.
- **Controls** — `data-carousel-prev` / `data-carousel-next` take a
  selector for the scroller (it's a sibling, never a child — children
  become slides). Clicking steps exactly one slide and wraps at both ends.
  Controls work with or without autoplay.
- **Semantics** — the module sets `role="group"` +
  `aria-roledescription="carousel"` on scrollers that don't already have a
  role; it never invents a name.
- **No-JS first** — without this module the scroller is still
  keyboard-scrollable and keyboard users never lose the slides. Nothing
  is hidden from a JS-less user; they just don't get auto-advance or
  buttons.

## 7. Removal behaviors (`js/chips.js`, `js/alert-dismiss.js`)

Two components share one removal behavior — clicking a small × button
removes its closest container:

```html
<span data-chip>
  css
  <button type="button" data-chip-remove aria-label="Remove css">×</button>
</span>

<div data-alert="danger" role="alert">
  <p>Deploy failed.</p>
  <button data-alert-dismiss aria-label="Dismiss">×</button>
</div>
```

- `[data-chip-remove]` removes its closest `[data-chip]`; styles live
  in `components/chip.css`.
- `[data-alert-dismiss]` removes its closest `[data-alert]`; styles
  live in `components/alert.css`.
- Both controls are real `<button>`s — give each an `aria-label`
  naming what it removes. Removal is delegated at the root, so chips
  and alerts injected after load are covered too.
- **No-JS first:** without the module nothing hides; the × just does
  nothing.

## 8. Responsive header nav (`js/nav.js`)

Styles live in `components/nav.css`; the module drives the collapse.

```html
<nav data-nav="header" aria-label="Primary">
  <a class="bf-brand" href="/">Acme</a>
  <button type="button" class="bf-nav-toggle"
          aria-expanded="false" aria-controls="site-menu">Menu</button>
  <ul id="site-menu">
    <li><a href="/" aria-current="page">Home</a></li>
    …
  </ul>
</nav>
```

- When the nav is narrower than 40rem (container query, not a viewport
  media query), the list collapses behind `.bf-nav-toggle` and opens as
  a full-width column.
- The toggle is author markup with `aria-expanded`/`aria-controls`; the
  module flips states, marks the nav `data-nav-js`, and mirrors the open
  state to `[data-open]`.
- `Esc` closes an open menu and restores focus to the toggle; activating
  a link closes it too.
- **No-JS first:** without the module nothing ever hides — the button
  never renders and the list wraps like the plain topbar. A header nav
  without a complete contract (toggle + id'd list) is never armed.

## 9. Sortable tables (`js/table-sort.js`)

No native element sorts rows — that puts this in the tabs tier of
opt-in JS. The semantics stay yours: triggers are real `<button>`s you
author inside header cells; the module only reorders `<tbody>` rows and
maintains `aria-sort` on the active column's `th`.

```html
<table data-bf-sort>
  <thead><tr>
    <th><button type="button">Task</button></th>
    <th><button type="button">Points</button></th>
  </tr></thead>
  <tbody>…</tbody>
</table>
```

- Click a header button once for ascending, again for descending; the
  active column's `th` gets `aria-sort="ascending|descending"` and the
  others are cleared.
- Comparison is numeric-aware: if every non-empty cell in the column
  parses as a number (whitespace and thousands commas tolerated), rows
  compare numerically — `12` sorts after `3`, not after `1`. Otherwise
  text compares case-insensitively with `localeCompare`.
- Rows move by re-appending existing nodes — no innerHTML round-trip,
  so listeners inside cells survive.
- **No-JS first:** without the module nothing sorts; the table is plain
  but valid, buttons inert. Header-button styles (muted voice, ↕/↑/↓
  indicator) live in `components/table.css`.
- For dynamic content: `import { initTableSort } from "barefoot-css/js/table-sort.js"`.

## 10. Toast auto-dismiss (`js/toast.js`)

Adds timed auto-dismiss to `[popover][data-kind="toast"]` elements with
configurable duration, pause-on-hover, and visible progress indicator.

```html
<div popover="manual" id="toast" data-kind="toast" data-duration="3000" role="status">
  <p>Saved successfully.</p>
  <button type="button" popovertarget="toast">Close</button>
</div>
```

- `data-duration="ms"` (default 3000ms) sets the auto-dismiss timer.
- Pauses on hover and keyboard focus; resumes when the pointer leaves or
  focus moves away.
- Respects `prefers-reduced-motion` — under reduced motion, the toast
  stays open until manually closed.
- **No-JS first:** without the module toasts stay open until manually
  closed via `popovertarget` or `Esc`.

## 11. Hover tooltip fallback (`js/tooltip.js`)

`pointerenter` / `pointerleave` hover-to-show for `popover="hint"` in
engines without interest invokers (Firefox, Safari). Chromium 139+ uses
native `interestinvoker` and skips the JS path entirely.

```html
<button data-tooltip interestfor="tip" popovertarget="tip" popovertargetaction="show">?</button>
<div popover="hint" id="tip" data-kind="tooltip">Help text</div>
```

- The module adds hover and focus gestures to `[data-tooltip]` triggers
  that have a `popovertarget` pointing at a `popover="hint"` element.
- Shows on `pointerenter` / `focus`, hides on `pointerleave` / `blur`.
- **No-JS first:** without the module tooltips show only on click (via
  `popovertarget`) in engines without interest invokers — the three-tier
  model still works.

## Why no bundle

These are opt-in by design. Importing them is a deliberate choice the
user makes — matching the "you only pay for what you import" rule of the
framework. No builder, no framework, no polyfills; modern browsers only.
